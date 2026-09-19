// ===========================================================================
// DEADLIGHT SERVER: authoritative simulation over WebSocket.
// Run: node server/server.js   (PORT env var, default 8080)
// Rooms persist between matches: seats stay, host picks the deck, both ready up.
// ===========================================================================
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import * as core from './core.mjs';

const PORT = Number(process.env.PORT ?? 8080);
const SNAPSHOT_EVERY_TICKS = 4;
const DISCONNECT_GRACE_MS = 45000;
const EMPTY_ROOM_TTL_MS = 10 * 60 * 1000;
const ROOM_CODE_LENGTH = 4;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_NAME_LENGTH = 16;
const DECK_RANDOM = 'random';

const maps = new Map(core.DECK_ORDER.map((deckKey) => [deckKey, new core.StationMap(core.DECKS[deckKey].layout)]));
const rooms = new Map();
const quickQueue = [];

function send(socket, message) {
  if (socket && socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
}

function makeRoomCode() {
  let code = '';
  do {
    code = Array.from({ length: ROOM_CODE_LENGTH }, () => ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function sanitizeName(name) {
  const trimmed = String(name ?? '').trim().slice(0, MAX_NAME_LENGTH);
  return trimmed.length === 0 ? 'Salvager' : trimmed;
}

function sanitizeDeckChoice(deckKey) {
  return core.DECKS[deckKey] ? deckKey : DECK_RANDOM;
}

function resolveDeck(deckChoice) {
  if (deckChoice !== DECK_RANDOM) return deckChoice;
  return core.DECK_ORDER[Math.floor(Math.random() * core.DECK_ORDER.length)];
}

class Match {
  constructor(room, deckKey) {
    this.room = room;
    this.deckKey = deckKey;
    this.sim = new core.Simulation(maps.get(deckKey), [
      { scrapIncomePct: 1, biomassRegenPct: 1 },
      { scrapIncomePct: 1, biomassRegenPct: 1 },
    ]);
    this.pendingCommands = [];
    this.tick = 0;
    this.lastStepMs = Date.now();
    this.accumulatorS = 0;
    this.timer = setInterval(() => this.pump(), 1000 / 60);
  }

  queueCommand(side, command) {
    if (!command || typeof command !== 'object' || command.side !== side) return;
    this.pendingCommands.push(command);
  }

  pump() {
    const nowMs = Date.now();
    this.accumulatorS += Math.min((nowMs - this.lastStepMs) / 1000, core.MATCH_RULES.tickS * core.MATCH_RULES.maxStepsPerFrame);
    this.lastStepMs = nowMs;
    while (this.accumulatorS >= core.MATCH_RULES.tickS) {
      this.accumulatorS -= core.MATCH_RULES.tickS;
      const commands = this.pendingCommands;
      this.pendingCommands = [];
      try {
        this.sim.step(core.MATCH_RULES.tickS, commands);
      } catch (error) {
        console.error(`Rejected command batch in room ${this.room.code}:`, error.message);
      }
      this.tick += 1;
      if (this.tick % SNAPSHOT_EVERY_TICKS === 0) this.room.broadcast({ type: 'snapshot', snapshot: core.serializeSimulation(this.sim) });
      if (this.sim.isOver) {
        this.room.finishMatch(this.sim.winnerSide, this.sim.winnerSide === null ? 'Both reactors went dark.' : 'Reactor breached.');
        return;
      }
    }
  }

  stop() {
    clearInterval(this.timer);
  }
}

class Room {
  constructor(code) {
    this.code = code;
    this.deckChoice = DECK_RANDOM;
    this.seats = [null, null];
    this.match = null;
    this.graceTimers = [null, null];
    this.emptyTimer = null;
  }

  get hostSide() {
    return this.seats[0] !== null ? core.SIDE_PORT : core.SIDE_STARBOARD;
  }

  get isFull() {
    return this.seats[0] !== null && this.seats[1] !== null;
  }

  describe() {
    return {
      type: 'room',
      code: this.code,
      deckChoice: this.deckChoice,
      hostSide: this.hostSide,
      isMatchRunning: this.match !== null,
      players: this.seats.map((seat) => (seat === null ? null : { name: seat.name, isReady: seat.isReady, isConnected: seat.socket !== null })),
    };
  }

  broadcast(message) {
    this.seats.forEach((seat) => {
      if (seat !== null) send(seat.socket, message);
    });
  }

  broadcastState() {
    this.broadcast(this.describe());
  }

  freeSeatIndex() {
    return this.seats.findIndex((seat) => seat === null);
  }

  seat(socket, name) {
    const side = this.freeSeatIndex();
    if (side === -1) throw new Error('Room is full');
    this.seats[side] = { socket, name, isReady: false };
    socket.deadlight = { room: this, side };
    this.cancelEmptyTimer();
    this.broadcastState();
  }

  // A player who dropped mid-match can take their old seat back.
  reseat(socket, side) {
    const seat = this.seats[side];
    seat.socket = socket;
    socket.deadlight = { room: this, side };
    if (this.graceTimers[side] !== null) {
      clearTimeout(this.graceTimers[side]);
      this.graceTimers[side] = null;
    }
    this.broadcastState();
    if (this.match !== null) {
      send(socket, { type: 'start', side, deckKey: this.match.deckKey, opponentName: this.seats[side === 0 ? 1 : 0].name, isResume: true });
    }
  }

  disconnectedSeatIndex() {
    return this.seats.findIndex((seat) => seat !== null && seat.socket === null);
  }

  setDeck(side, deckChoice) {
    if (side !== this.hostSide || this.match !== null) return;
    this.deckChoice = sanitizeDeckChoice(deckChoice);
    this.broadcastState();
  }

  setReady(side, isReady) {
    if (this.match !== null || this.seats[side] === null) return;
    this.seats[side].isReady = Boolean(isReady);
    this.broadcastState();
    if (this.isFull && this.seats.every((seat) => seat.isReady)) this.startMatch();
  }

  startMatch() {
    const deckKey = resolveDeck(this.deckChoice);
    this.match = new Match(this, deckKey);
    this.seats.forEach((seat, side) => {
      seat.isReady = false;
      send(seat.socket, { type: 'start', side, deckKey, opponentName: this.seats[side === 0 ? 1 : 0].name, isResume: false });
    });
    this.broadcastState();
    console.log(`Room ${this.code}: ${this.seats.map((seat) => seat.name).join(' vs ')} on ${deckKey}`);
  }

  finishMatch(winnerSide, reason) {
    if (this.match === null) return;
    this.match.stop();
    this.match = null;
    this.graceTimers.forEach((timer, side) => {
      if (timer !== null) clearTimeout(timer);
      this.graceTimers[side] = null;
    });
    this.broadcast({ type: 'over', winnerSide, reason });
    // Seats whose sockets are gone leave now that the match is settled.
    this.seats.forEach((seat, side) => {
      if (seat !== null && seat.socket === null) this.seats[side] = null;
    });
    this.broadcastState();
    this.scheduleCleanupIfEmpty();
    console.log(`Room ${this.code} finished: ${reason}`);
  }

  handleDisconnect(side) {
    const seat = this.seats[side];
    if (seat === null) return;
    seat.socket = null;
    seat.isReady = false;
    if (this.match === null) {
      this.seats[side] = null;
      this.broadcastState();
      this.scheduleCleanupIfEmpty();
      return;
    }
    this.broadcastState();
    this.graceTimers[side] = setTimeout(() => {
      this.finishMatch(side === 0 ? core.SIDE_STARBOARD : core.SIDE_PORT, `${seat.name} left the ship.`);
    }, DISCONNECT_GRACE_MS);
  }

  leave(side) {
    const seat = this.seats[side];
    if (seat === null) return;
    if (this.match !== null) {
      this.finishMatch(side === 0 ? core.SIDE_STARBOARD : core.SIDE_PORT, `${seat.name} left the ship.`);
    }
    this.seats[side] = null;
    this.broadcastState();
    this.scheduleCleanupIfEmpty();
  }

  scheduleCleanupIfEmpty() {
    if (this.seats.some((seat) => seat !== null)) return;
    this.cancelEmptyTimer();
    this.emptyTimer = setTimeout(() => rooms.delete(this.code), EMPTY_ROOM_TTL_MS);
  }

  cancelEmptyTimer() {
    if (this.emptyTimer !== null) clearTimeout(this.emptyTimer);
    this.emptyTimer = null;
  }
}

function leaveCurrent(socket, isExplicit) {
  const queueIndex = quickQueue.findIndex((entry) => entry.socket === socket);
  if (queueIndex !== -1) quickQueue.splice(queueIndex, 1);
  const context = socket.deadlight;
  if (!context) return;
  socket.deadlight = null;
  if (isExplicit) context.room.leave(context.side);
  else context.room.handleDisconnect(context.side);
}

function joinRoom(socket, name, code) {
  const room = rooms.get(String(code ?? '').toUpperCase());
  if (!room) {
    send(socket, { type: 'error', message: 'No room with that code.' });
    return;
  }
  const droppedSide = room.disconnectedSeatIndex();
  if (droppedSide !== -1 && room.seats[droppedSide].name === name) {
    room.reseat(socket, droppedSide);
    return;
  }
  if (room.isFull) {
    send(socket, { type: 'error', message: 'That room is full.' });
    return;
  }
  room.seat(socket, name);
}

function handleMessage(socket, message) {
  if (message.type === 'hello') {
    socket.callsign = sanitizeName(message.name);
    send(socket, { type: 'welcome' });
    return;
  }
  const name = socket.callsign ?? 'Salvager';
  const context = socket.deadlight;
  if (message.type === 'create') {
    leaveCurrent(socket, true);
    const room = new Room(makeRoomCode());
    room.deckChoice = sanitizeDeckChoice(message.deckChoice);
    rooms.set(room.code, room);
    room.seat(socket, name);
    return;
  }
  if (message.type === 'join') {
    leaveCurrent(socket, true);
    joinRoom(socket, name, message.code);
    return;
  }
  if (message.type === 'quick') {
    leaveCurrent(socket, true);
    const partner = quickQueue.shift();
    if (partner) {
      const room = new Room(makeRoomCode());
      rooms.set(room.code, room);
      room.seat(partner.socket, partner.name);
      room.seat(socket, name);
      room.setReady(core.SIDE_PORT, true);
      room.setReady(core.SIDE_STARBOARD, true);
      return;
    }
    quickQueue.push({ socket, name });
    send(socket, { type: 'queued' });
    return;
  }
  if (!context) return;
  if (message.type === 'setDeck') context.room.setDeck(context.side, message.deckChoice);
  else if (message.type === 'ready') context.room.setReady(context.side, message.isReady);
  else if (message.type === 'command' && context.room.match !== null) context.room.match.queueCommand(context.side, message.command);
  else if (message.type === 'leave') leaveCurrent(socket, true);
}

const httpServer = createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end(`Deadlight server: ${rooms.size} rooms, ${quickQueue.length} queued.`);
});
const socketServer = new WebSocketServer({ server: httpServer });
socketServer.on('connection', (socket) => {
  socket.on('message', (raw) => {
    let message = null;
    try {
      message = JSON.parse(raw.toString());
    } catch (error) {
      send(socket, { type: 'error', message: 'Malformed message.' });
      return;
    }
    handleMessage(socket, message);
  });
  socket.on('close', () => leaveCurrent(socket, false));
});
httpServer.listen(PORT, () => console.log(`Deadlight server listening on ${PORT}`));

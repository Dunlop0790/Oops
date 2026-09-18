// ===========================================================================
// DEADLIGHT SERVER: authoritative simulation over WebSocket.
// Run: node server/server.js   (PORT env var, default 8080)
// ===========================================================================
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import * as core from './core.mjs';

const PORT = Number(process.env.PORT ?? 8080);
const SNAPSHOT_EVERY_TICKS = 4;
const DISCONNECT_GRACE_MS = 30000;
const ROOM_CODE_LENGTH = 4;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_NAME_LENGTH = 16;

const maps = new Map(core.DECK_ORDER.map((deckKey) => [deckKey, new core.StationMap(core.DECKS[deckKey].layout)]));
const rooms = new Map();
const quickQueue = [];

function send(socket, message) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
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

function sanitizeDeckKey(deckKey) {
  return core.DECKS[deckKey] ? deckKey : core.DECK_ORDER[Math.floor(Math.random() * core.DECK_ORDER.length)];
}

class Match {
  constructor(room) {
    this.room = room;
    this.sim = new core.Simulation(maps.get(room.deckKey), [
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
        this.room.finish(this.sim.winnerSide, this.sim.winnerSide === null ? 'Both reactors went dark.' : 'Reactor breached.');
        return;
      }
    }
  }

  stop() {
    clearInterval(this.timer);
  }
}

class Room {
  constructor(code, deckKey) {
    this.code = code;
    this.deckKey = deckKey;
    this.seats = [null, null];
    this.match = null;
    this.graceTimers = [null, null];
  }

  get players() {
    return this.seats.filter((seat) => seat !== null).map((seat) => seat.name);
  }

  broadcast(message) {
    this.seats.forEach((seat) => {
      if (seat !== null) send(seat.socket, message);
    });
  }

  seat(socket, name) {
    const side = this.seats[0] === null ? core.SIDE_PORT : core.SIDE_STARBOARD;
    this.seats[side] = { socket, name };
    socket.deadlight = { room: this, side };
    this.broadcast({ type: 'room', code: this.code, players: this.players });
    if (this.seats[0] !== null && this.seats[1] !== null) this.start();
  }

  start() {
    this.match = new Match(this);
    this.seats.forEach((seat, side) => {
      send(seat.socket, { type: 'start', side, deckKey: this.deckKey, opponentName: this.seats[side === 0 ? 1 : 0].name });
    });
    console.log(`Room ${this.code}: ${this.players.join(' vs ')} on ${this.deckKey}`);
  }

  handleDisconnect(side) {
    const seat = this.seats[side];
    if (seat === null) return;
    if (this.match === null) {
      this.seats[side] = null;
      this.broadcast({ type: 'room', code: this.code, players: this.players });
      if (this.players.length === 0) rooms.delete(this.code);
      return;
    }
    this.graceTimers[side] = setTimeout(() => {
      this.finish(side === 0 ? core.SIDE_STARBOARD : core.SIDE_PORT, `${seat.name} left the ship.`);
    }, DISCONNECT_GRACE_MS);
  }

  finish(winnerSide, reason) {
    if (this.match !== null) this.match.stop();
    this.match = null;
    this.graceTimers.forEach((timer) => { if (timer !== null) clearTimeout(timer); });
    this.broadcast({ type: 'over', winnerSide, reason });
    this.seats.forEach((seat) => { if (seat !== null) seat.socket.deadlight = null; });
    rooms.delete(this.code);
    console.log(`Room ${this.code} finished: ${reason}`);
  }
}

function leaveCurrent(socket) {
  const context = socket.deadlight;
  const queueIndex = quickQueue.findIndex((entry) => entry.socket === socket);
  if (queueIndex !== -1) quickQueue.splice(queueIndex, 1);
  if (!context) return;
  context.room.handleDisconnect(context.side);
  socket.deadlight = null;
}

function handleMessage(socket, message) {
  if (message.type === 'hello') {
    socket.callsign = sanitizeName(message.name);
    send(socket, { type: 'welcome' });
    return;
  }
  const name = socket.callsign ?? 'Salvager';
  if (message.type === 'create') {
    leaveCurrent(socket);
    const room = new Room(makeRoomCode(), sanitizeDeckKey(message.deckKey));
    rooms.set(room.code, room);
    room.seat(socket, name);
    return;
  }
  if (message.type === 'join') {
    leaveCurrent(socket);
    const room = rooms.get(String(message.code ?? '').toUpperCase());
    if (!room || room.match !== null || room.players.length >= 2) {
      send(socket, { type: 'error', message: 'That room is not open.' });
      return;
    }
    room.seat(socket, name);
    return;
  }
  if (message.type === 'quick') {
    leaveCurrent(socket);
    const partner = quickQueue.shift();
    if (partner) {
      const room = new Room(makeRoomCode(), sanitizeDeckKey(partner.deckKey));
      rooms.set(room.code, room);
      room.seat(partner.socket, partner.name);
      room.seat(socket, name);
      return;
    }
    quickQueue.push({ socket, name, deckKey: sanitizeDeckKey(message.deckKey) });
    send(socket, { type: 'queued' });
    return;
  }
  if (message.type === 'command') {
    const context = socket.deadlight;
    if (!context || context.room.match === null) return;
    context.room.match.queueCommand(context.side, message.command);
    return;
  }
  if (message.type === 'leave') {
    leaveCurrent(socket);
  }
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
  socket.on('close', () => leaveCurrent(socket));
});
httpServer.listen(PORT, () => console.log(`Deadlight server listening on ${PORT}`));

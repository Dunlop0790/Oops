// Spins up the server, connects two bot clients driven by commander profiles,
// and checks that snapshots flow and the match reaches a verdict.
import { spawn } from 'node:child_process';
import WebSocket from 'ws';
import * as core from '../server/core.mjs';

const PORT = 8099;
const server = spawn(process.execPath, ['server/server.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve) => server.stdout.on('data', (chunk) => { if (String(chunk).includes('listening')) resolve(); }));

function createBot(name, commanderKey, action) {
  const socket = new WebSocket(`ws://127.0.0.1:${PORT}`);
  const bot = { name, socket, side: null, sim: null, ai: null, snapshots: 0, result: null, roomCode: null };
  socket.on('open', () => {
    socket.send(JSON.stringify({ type: 'hello', name }));
    socket.send(JSON.stringify(action));
  });
  socket.on('message', (raw) => {
    const message = JSON.parse(raw.toString());
    if (message.type === 'start') {
      bot.side = message.side;
      bot.sim = new core.Simulation(new core.StationMap(core.DECKS[message.deckKey].layout), [{ scrapIncomePct: 1, biomassRegenPct: 1 }, { scrapIncomePct: 1, biomassRegenPct: 1 }]);
      bot.ai = new core.CommanderAi(bot.side, core.buildAiProfile(core.COMMANDERS.find((c) => c.key === commanderKey), core.AI_DIFFICULTIES.normal), bot.sim);
    } else if (message.type === 'snapshot') {
      bot.snapshots += 1;
      core.hydrateSimulation(bot.sim, message.snapshot);
      const commands = bot.ai.think(core.MATCH_RULES.tickS * 4, bot.sim);
      commands.forEach((command) => socket.send(JSON.stringify({ type: 'command', command })));
    } else if (message.type === 'room') {
      bot.roomCode = message.code;
      const mine = message.players.find((player) => player !== null && player.name === name);
      if (mine && !mine.isReady && !message.isMatchRunning && message.players.every((player) => player !== null)) socket.send(JSON.stringify({ type: 'ready', isReady: true }));
    } else if (message.type === 'over') {
      bot.result = message;
    } else if (message.type === 'error') {
      console.error(name, 'error', message.message);
    }
  });
  return bot;
}

const host = createBot('Voss-bot', 'voss', { type: 'create', deckChoice: 'hydroponics' });
while (host.roomCode === null) await new Promise((resolve) => setTimeout(resolve, 50));
const guest = createBot('Kell-bot', 'kell', { type: 'join', code: host.roomCode });

const deadline = Date.now() + 90000;
while (Date.now() < deadline && (host.result === null || guest.result === null)) {
  await new Promise((resolve) => setTimeout(resolve, 250));
}
const hostState = host.sim.sides.map((side) => `${side.coreHp}hp/${side.towers.length}t/${side.creeps.length}c`).join(' | ');
console.log(`snapshots host=${host.snapshots} guest=${guest.snapshots}; clock ${Math.round(host.sim.clockS)}s; sides ${hostState}`);
console.log('host result:', host.result, 'guest result:', guest.result);
const passed = host.snapshots > 100 && guest.snapshots > 100 && host.sim.clockS > 20 && host.sim.sides.some((side) => side.towers.length > 3);
console.log(passed ? 'PASS' : 'FAIL');
host.socket.close();
guest.socket.close();
server.kill();
process.exit(passed ? 0 : 1);

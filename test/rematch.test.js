// Room persistence: a match ends (guest leaves), the host stays seated, the guest
// rejoins by code, both ready up, and a second match starts in the same room.
import { spawn } from 'node:child_process';
import WebSocket from 'ws';

const PORT = 8097;
const server = spawn(process.execPath, ['server/server.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve) => server.stdout.on('data', (chunk) => { if (String(chunk).includes('listening')) resolve(); }));
function connect(name) {
  const socket = new WebSocket(`ws://127.0.0.1:${PORT}`);
  const client = { name, socket, inbox: [], code: null };
  socket.on('message', (raw) => {
    const message = JSON.parse(raw.toString());
    if (message.type === 'room') client.code = message.code;
    client.inbox.push(message);
  });
  return new Promise((resolve) => socket.on('open', () => { socket.send(JSON.stringify({ type: 'hello', name })); resolve(client); }));
}
const send = (client, message) => client.socket.send(JSON.stringify(message));
const waitFor = async (client, predicate, label) => {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    const found = client.inbox.find(predicate);
    if (found) return found;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for ${label} (${client.name})`);
};

const host = await connect('Host');
send(host, { type: 'create', deckChoice: 'cryo' });
await waitFor(host, (m) => m.type === 'room', 'room');
const guest = await connect('Guest');
send(guest, { type: 'join', code: host.code });
await waitFor(guest, (m) => m.type === 'room' && m.players.every((p) => p !== null), 'both seated');
send(host, { type: 'ready', isReady: true });
send(guest, { type: 'ready', isReady: true });
const start1 = await waitFor(host, (m) => m.type === 'start', 'first start');
console.log('match 1 started on', start1.deckKey, 'host side', start1.side);
await waitFor(host, (m) => m.type === 'snapshot', 'snapshot');
send(guest, { type: 'leave' });
const over = await waitFor(host, (m) => m.type === 'over', 'over');
console.log('match 1 over:', over.reason, 'winner', over.winnerSide);
const afterOver = await waitFor(host, (m) => m.type === 'room' && !m.isMatchRunning && m.players[0] !== null && m.players[1] === null, 'room after over');
console.log('room persists for host:', afterOver.code === host.code);
host.inbox = [];
send(guest, { type: 'join', code: host.code });
await waitFor(host, (m) => m.type === 'room' && m.players.every((p) => p !== null), 'guest rejoined');
send(host, { type: 'setDeck', deckChoice: 'random' });
send(host, { type: 'ready', isReady: true });
send(guest, { type: 'ready', isReady: true });
const start2 = await waitFor(host, (m) => m.type === 'start', 'second start');
console.log('match 2 started on', start2.deckKey, '(random pick) in room', host.code);
console.log('PASS');
host.socket.close();
guest.socket.close();
server.kill();
process.exit(0);

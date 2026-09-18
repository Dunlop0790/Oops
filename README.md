# Deadlight: Hull Breach

PvP tower defense on a dead ship. Two salvage crews, one reanimation lattice. Hold your reactor, drop the swarm on theirs.

```
src/shared/   config, simulation, commander AI   (pure: no DOM, no Math.random, fixed 60 Hz tick)
src/client/   renderer, menus, input, network client
server/       authoritative WebSocket server (Node)
docs/         built static client, served by GitHub Pages
test/         headless bot match through the server
```

The simulation is the same code in the browser and on the server. Offline, the browser runs it against a commander AI. Online, the server runs it as the referee, clients send commands and receive 15 Hz snapshots, and each client steps the simulation locally between snapshots for smooth motion.

## Run locally

```
npm install
npm run build          # writes docs/app.js, docs/index.html, server/core.mjs
node server/server.js  # ws://localhost:8080
npm run serve-client   # static client at http://localhost:3000
npm test               # two bot clients play through the server
```

Open the client, Online tab, enter `ws://localhost:8080`, Create room in one browser, Join room in another.

## Deploy

**Client on GitHub Pages.** Commit the repo, then in the repository settings set Pages to deploy from the `main` branch, `/docs` folder. Every `npm run build` refreshes `docs/`.

**Server anywhere that runs Node.** GitHub Pages is static, so the WebSocket server needs its own host (Fly.io, Railway, Render, a VPS, the same box Nightfall runs on). The included `Dockerfile` and `fly.toml` work as-is:

```
fly launch --copy-config --now
```

Use `wss://` for the server address when the client is served over HTTPS (GitHub Pages is), because browsers refuse insecure sockets from secure pages. Hosts like Fly and Railway terminate TLS for you.

## Protocol

Client to server: `hello {name}`, `quick {deckKey}`, `create {deckKey}`, `join {code}`, `command {command}`, `leave`.
Server to client: `welcome`, `queued`, `room {code, players}`, `start {side, deckKey, opponentName}`, `snapshot {snapshot}`, `over {winnerSide, reason}`, `error {message}`.

Commands are validated against the socket's seat, so a client can only act for its own side. A disconnected player gets 30 seconds to return before the match is forfeited.

## Editing the game

- Balance and content live in `src/shared/config.js`: `MATCH_RULES`, `CREEP_TYPES`, `SEND_CARDS`, `TOWER_TYPES`, `DECKS`, `COMMANDERS`.
- A deck is a 13-row, 10-column port half; starboard is mirrored. `W` wall, `M` machinery (blocks sight), `.` deck plating (buildable), `#` corridor, `B` breach, `L` late breach (opens at 2:00), `C` reactor, `1`/`2`/`3` duct mouths (matching digits are linked).
- Commander personalities are data: send tempo, burst size, bulkhead habit, counter strength, breach strategy, and build and send weights.

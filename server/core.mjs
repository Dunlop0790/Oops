

// ===========================================================================
// CONFIGURATION
// ===========================================================================

const GRID_COLUMNS = 20;
const GRID_ROWS = 13;
const HALF_COLUMNS = GRID_COLUMNS / 2;
const TILE_SIZE_PX = 48;
const HALF_TILE_PX = TILE_SIZE_PX / 2;
const CANVAS_WIDTH_PX = GRID_COLUMNS * TILE_SIZE_PX;
const CANVAS_HEIGHT_PX = GRID_ROWS * TILE_SIZE_PX;

const TILE_DECK = '.';
const TILE_CORRIDOR = '#';
const TILE_WALL = 'W';
const TILE_MACHINE = 'M';
const TILE_BREACH = 'B';
const TILE_LATE_BREACH = 'L';
const TILE_CORE = 'C';
// Digits mark duct mouths; matching digits on a side are linked.
const DUCT_TILES = new Set(['1', '2', '3']);

// Port half only; starboard is always the mirror image.
// 1/2/3 = duct mouths (matching digits are linked, hidden travel). L = hatch that opens late.
const DECOR_GARDEN = 'garden';
const DECOR_CARGO = 'cargo';
const DECOR_CLINIC = 'clinic';
const DECOR_STARS = 'stars';
const DECOR_FURNACE = 'furnace';
const DECOR_FROST = 'frost';

const DECKS = Object.freeze({
  hydroponics: {
    key: 'hydroponics', name: 'Hydroponics Ring', blurb: 'An overgrown growing ring. A duct links the far corner of the loop to the reactor room. Seal it or it will be used.',
    layout: [
      'WWWWWBWWWW',
      '..W..#...W',
      '.....#.M.W',
      '..######..',
      '..#..W.#..',
      '.M#....1..',
      'C##.M..##B',
      '.1#....#..',
      '..#..W.#..',
      '..######..',
      '.....#.M.W',
      '..W..#...W',
      'WWWWWBWWWW',
    ],
    theme: {
      decorStyle: DECOR_GARDEN, deckLight: '#3d4d42', deckDark: '#27312b', corridorFloor: '#1b2320', edgeLight: '#8ee06b', edgeLightDim: 'rgba(142, 224, 107, 0.3)',
      wall: '#4d6052', wallTop: '#617766', wallShade: '#2c3a31', machine: '#4f6238', machineShade: '#2f3c22', grime: 'rgba(70, 110, 50, 0.22)', splatter: 'rgba(142, 224, 107, 0.4)',
      lamp: 'rgba(142, 224, 107, 0.12)', detail: '#6fae5a', swatch: 'linear-gradient(135deg, #3d4d42, #8ee06b)',
    },
  },
  cargo: {
    key: 'cargo', name: 'Cargo Spine', blurb: 'Rust and crates. Top and bottom hatches open straight onto the spine; the seam hatch is sealed until 2:00, then it is the short road.',
    layout: [
      'WWWBWWWWWW',
      '...#.....W',
      '.M.#..M..W',
      '...####...',
      '...#..#.M.',
      '.W.#..#...',
      'C###.M###L',
      '.W.#..#...',
      '...#..#.M.',
      '...####...',
      '.M.#..M..W',
      '...#.....W',
      'WWWBWWWWWW',
    ],
    theme: {
      decorStyle: DECOR_CARGO, deckLight: '#4c4238', deckDark: '#312923', corridorFloor: '#211c18', edgeLight: '#f2a93b', edgeLightDim: 'rgba(242, 169, 59, 0.3)',
      wall: '#5c4c3d', wallTop: '#6f5c4a', wallShade: '#3a2f27', machine: '#8a4a2a', machineShade: '#4d2a18', grime: 'rgba(0, 0, 0, 0.16)', splatter: 'rgba(181, 101, 29, 0.45)',
      lamp: 'rgba(242, 169, 59, 0.14)', detail: '#c97a3a', swatch: 'linear-gradient(135deg, #4c4238, #f2a93b)',
    },
  },
  medbay: {
    key: 'medbay', name: 'Medbay Cross', blurb: 'White tile and old blood. Four ways in, and a duct from the upper corridor drops out beside the reactor.',
    layout: [
      'WWWWWWBWWW',
      '..M...#...',
      '......1..W',
      '.########L',
      '.#..W.#...',
      '.#....#...',
      'C#.M..###B',
      '.1....#...',
      '.#..W.#...',
      '.######.M.',
      '......#..W',
      '..M...#...',
      'WWWWWWBWWW',
    ],
    theme: {
      decorStyle: DECOR_CLINIC, deckLight: '#c4ccd1', deckDark: '#a4aeb5', corridorFloor: '#6a747c', edgeLight: '#57d3ff', edgeLightDim: 'rgba(87, 211, 255, 0.3)',
      wall: '#8d979f', wallTop: '#b3bcc3', wallShade: '#5b656d', machine: '#d9dfe4', machineShade: '#8f9aa3', grime: 'rgba(0, 0, 0, 0.1)', splatter: 'rgba(150, 25, 25, 0.55)',
      lamp: 'rgba(255, 255, 255, 0.12)', detail: '#e2513f', swatch: 'linear-gradient(135deg, #c4ccd1, #57d3ff)',
    },
  },
  observation: {
    key: 'observation', name: 'Observation Deck', blurb: 'Starlight through the hull. The reactor sits in the top corner behind a long march, unless the duct is open or the top hatch opens at 2:00.',
    layout: [
      'WWWWWWWLWW',
      'C#.....#..',
      '.1..M..#..',
      '.#######..',
      '....#.....',
      '.M..#..M..',
      '....#...#B',
      '....#...1.',
      '.M..#.M.#.',
      '....#####.',
      '.......W#.',
      '.......M#.',
      'WWWWWWWWBW',
    ],
    theme: {
      decorStyle: DECOR_STARS, deckLight: '#262a40', deckDark: '#181b2d', corridorFloor: '#10121f', edgeLight: '#b48cff', edgeLightDim: 'rgba(180, 140, 255, 0.3)',
      wall: '#2f3556', wallTop: '#4b5286', wallShade: '#1a1d34', machine: '#3c426e', machineShade: '#242849', grime: 'rgba(0, 0, 0, 0.25)', splatter: 'rgba(142, 224, 107, 0.4)',
      lamp: 'rgba(180, 140, 255, 0.12)', detail: '#f4f0ff', swatch: 'linear-gradient(135deg, #262a40, #b48cff)',
    },
  },
  engineering: {
    key: 'engineering', name: 'Engineering Core', blurb: 'The reactor sits in the middle of the loop with machinery on both flanks. The seam hatch opens at 2:00, five tiles from the core.',
    layout: [
      'WWWWBWWWWW',
      '....#..M..',
      '.M..#....W',
      '..#####...',
      '..#...#.M.',
      '..#.M.#...',
      '..##C####L',
      '..#.M.#...',
      '..#...#.M.',
      '..#####...',
      '.M..#....W',
      '....#..M..',
      'WWWWBWWWWW',
    ],
    theme: {
      decorStyle: DECOR_FURNACE, deckLight: '#4b3b36', deckDark: '#31241f', corridorFloor: '#1f1412', edgeLight: '#ff6a3a', edgeLightDim: 'rgba(255, 106, 58, 0.3)',
      wall: '#5c4239', wallTop: '#7b584a', wallShade: '#36241e', machine: '#6d3b2a', machineShade: '#3f2118', grime: 'rgba(0, 0, 0, 0.2)', splatter: 'rgba(255, 140, 58, 0.4)',
      lamp: 'rgba(255, 106, 58, 0.16)', detail: '#ff8c3a', swatch: 'linear-gradient(135deg, #4b3b36, #ff6a3a)',
    },
  },
  cryo: {
    key: 'cryo', name: 'Cryo Bay', blurb: 'Frost on every surface. Two long hull lanes meet at the reactor. The seam hatch opens at 2:00 straight into a duct that ends four tiles from the core.',
    layout: [
      'WWWWWWWBWW',
      '.......#..',
      '.M.....#..',
      '.#######..',
      '.#..M.....',
      '.#....W...',
      'C#1..M.M1L',
      '.#....W...',
      '.#..M.....',
      '.#######..',
      '.M.....#..',
      '.......#..',
      'WWWWWWWBWW',
    ],
    theme: {
      decorStyle: DECOR_FROST, deckLight: '#6d8799', deckDark: '#4d6474', corridorFloor: '#2a3944', edgeLight: '#9fdcff', edgeLightDim: 'rgba(159, 220, 255, 0.3)',
      wall: '#7b94a7', wallTop: '#abc3d3', wallShade: '#4a5f6f', machine: '#607e95', machineShade: '#3b4f5f', grime: 'rgba(255, 255, 255, 0.14)', splatter: 'rgba(191, 230, 255, 0.5)',
      lamp: 'rgba(159, 220, 255, 0.14)', detail: '#e6f6ff', swatch: 'linear-gradient(135deg, #6d8799, #9fdcff)',
    },
  },
});
const DECK_ORDER = Object.freeze(['hydroponics', 'cargo', 'medbay', 'observation', 'cryo', 'engineering']);

const SIGHT_BLOCKING_TILES = new Set([TILE_WALL, TILE_MACHINE, ...DUCT_TILES]);
const WALKABLE_TILES = new Set([TILE_CORRIDOR, TILE_BREACH, TILE_LATE_BREACH, TILE_CORE, ...DUCT_TILES]);
const BREACH_TILES = new Set([TILE_BREACH, TILE_LATE_BREACH]);
const SEALABLE_TILES = new Set([TILE_CORRIDOR, ...DUCT_TILES]);
const DUCT_EDGE_COST = 4;
const DUCT_CRAWL_SPEED_PX_PER_S = 90;
const SEND_TARGET_BREACH = 'breach';
const SEND_TARGET_POINT = 'point';
const RAYCAST_MAX_STEPS = GRID_COLUMNS + GRID_ROWS + 2;

const SIDE_PORT = 0;
const SIDE_STARBOARD = 1;
const SIDE_NAMES = Object.freeze({ [SIDE_PORT]: 'Port', [SIDE_STARBOARD]: 'Starboard' });

const DAMAGE_KINETIC = 'kinetic';
const DAMAGE_ENERGY = 'energy';

const MATCH_RULES = Object.freeze({
  tickS: 1 / 60,
  maxStepsPerFrame: 8,
  coreHp: 30,
  startingScrap: 300,
  scrapIncome: 18,
  scrapIncomeIntervalS: 5,
  startingBiomass: 30,
  biomassCap: 100,
  biomassRegenPerS: 1.4,
  bulkheadCap: 6,
  bulkheadLifetimeS: 90,
  reactorPowerCap: 24,
  towerPowerByLevel: [1, 2, 3],
  lateBreachOpenS: 120,
  escalationRegenPctPerMin: 0.25,
  escalationHpPctPerMin: 0.1,
  biomassCapPerMin: 8,
  ecoRegenPerSendPerS: 0.05,
  empDurationS: 4,
  empRadiusPx: 84,
  sellRefundPct: 0.6,
  podFlightS: 2.5,
  podImpactRadiusPx: 40,
  suddenDeathAtS: 300,
  suddenDeathDamageIntervalS: 2,
  suddenDeathDamage: 1,
  fastForwardTimeScale: 2,
  despawnMarginPx: TILE_SIZE_PX * 2,
  projectileRadiusPx: 4,
  burnTickS: 0.5,
  offscreenSpawnPx: TILE_SIZE_PX,
});

const CREEP_TYPES = Object.freeze({
  shambler: {
    name: 'Shambler', shape: 'shambler', hp: 70, speedPxPerS: 55, kineticResistPct: 0, energyResistPct: 0.15, regenHpPerS: 0,
    isSlowImmune: false, radiusPx: 11, coreDamage: 1, scrapBounty: 6, deathSpawn: null,
    bodyColor: '#7b8a6e', trimColor: '#3f4a38', accentColor: '#8ee06b',
  },
  lurcher: {
    name: 'Lurcher', shape: 'lurcher', hp: 45, speedPxPerS: 130, kineticResistPct: 0, energyResistPct: 0, regenHpPerS: 0,
    isSlowImmune: false, radiusPx: 10, coreDamage: 1, scrapBounty: 7, deathSpawn: null,
    bodyColor: '#a58a7a', trimColor: '#4e3d33', accentColor: '#ff6a4a',
  },
  carapace: {
    name: 'Carapace', shape: 'carapace', hp: 220, speedPxPerS: 50, kineticResistPct: 0.55, energyResistPct: 0, regenHpPerS: 0,
    isSlowImmune: false, radiusPx: 14, coreDamage: 2, scrapBounty: 14, deathSpawn: null,
    bodyColor: '#5b6673', trimColor: '#2d343c', accentColor: '#8ee06b',
  },
  wispform: {
    name: 'Wispform', shape: 'wispform', hp: 90, speedPxPerS: 95, kineticResistPct: 0, energyResistPct: 0.7, regenHpPerS: 1,
    isSlowImmune: true, radiusPx: 10, coreDamage: 1, scrapBounty: 10, deathSpawn: null,
    bodyColor: '#9fe8d6', trimColor: '#3a8f7f', accentColor: '#ffffff',
  },
  bloater: {
    name: 'Bloater', shape: 'bloater', hp: 160, speedPxPerS: 45, kineticResistPct: 0.2, energyResistPct: 0.2, regenHpPerS: 0,
    isSlowImmune: false, radiusPx: 15, coreDamage: 2, scrapBounty: 12, deathSpawn: { typeKey: 'shambler', count: 2 },
    bodyColor: '#8f9a5e', trimColor: '#4a4f2a', accentColor: '#c8f07a',
  },
  reclaimer: {
    name: 'Reclaimer', shape: 'reclaimer', hp: 650, speedPxPerS: 38, kineticResistPct: 0.65, energyResistPct: 0.1, regenHpPerS: 3,
    isSlowImmune: false, radiusPx: 18, coreDamage: 4, scrapBounty: 35, deathSpawn: null,
    bodyColor: '#6b5a48', trimColor: '#33291f', accentColor: '#f2a93b',
  },
});

const CARD_KIND_CREEPS = 'creeps';
const CARD_KIND_EMP = 'emp';
const CARD_KIND_BREACHER = 'breacher';

const SEND_CARDS = Object.freeze([
  { key: 'shamblers', kind: CARD_KIND_CREEPS, name: 'Shambler pack', creepTypeKey: 'shambler', count: 5, spacingS: 0.5, biomassCost: 20, cooldownS: 5, hotkey: 'q', role: 'Cheap bodies. Soaks fire.' },
  { key: 'lurchers', kind: CARD_KIND_CREEPS, name: 'Lurcher trio', creepTypeKey: 'lurcher', count: 3, spacingS: 0.35, biomassCost: 25, cooldownS: 7, hotkey: 'w', role: 'Fast. Slips past slow guns.' },
  { key: 'carapace', kind: CARD_KIND_CREEPS, name: 'Carapace', creepTypeKey: 'carapace', count: 1, spacingS: 0, biomassCost: 30, cooldownS: 8, hotkey: 'e', role: 'Plated. Laughs at sentries.' },
  { key: 'wispforms', kind: CARD_KIND_CREEPS, name: 'Wispform pair', creepTypeKey: 'wispform', count: 2, spacingS: 0.4, biomassCost: 30, cooldownS: 8, hotkey: 'r', role: 'Phased. Ignores coils and cryo.' },
  { key: 'bloater', kind: CARD_KIND_CREEPS, name: 'Bloater', creepTypeKey: 'bloater', count: 1, spacingS: 0, biomassCost: 35, cooldownS: 10, hotkey: 't', role: 'Splits into shamblers on death.' },
  { key: 'reclaimer', kind: CARD_KIND_CREEPS, name: 'Reclaimer', creepTypeKey: 'reclaimer', count: 1, spacingS: 0, biomassCost: 70, cooldownS: 20, hotkey: 'y', role: 'Dead loader mech. Needs coils.' },
  { key: 'emp', kind: CARD_KIND_EMP, name: 'EMP charge', creepTypeKey: null, count: 0, spacingS: 0, biomassCost: 55, cooldownS: 25, hotkey: 'u', role: 'Blacks out turrets within two tiles of the landing for 4 s. Drop it, then send.' },
  { key: 'breacher', kind: CARD_KIND_BREACHER, name: 'Cutter drone', creepTypeKey: null, count: 0, spacingS: 0, biomassCost: 30, cooldownS: 12, hotkey: 'i', role: 'Burns through the rival bulkhead nearest the landing.' },
]);

const PROJECTILE_ROUND = 'round';
const PROJECTILE_ARC = 'arc';
const PROJECTILE_SHELL = 'shell';
const PROJECTILE_SHARD = 'shard';
const PROJECTILE_FLAME = 'flame';

const TOWER_TYPES = Object.freeze({
  sentry: {
    name: 'Sentry', hotkey: '1', role: 'Kinetic autogun. Fast, long reach.', damageType: DAMAGE_KINETIC, projectileKind: PROJECTILE_ROUND,
    projectileSpeedPxPerS: 480, splashRadiusPx: 0, slowDurationS: 0, burnDurationS: 0, isBulkhead: false, color: '#b8bec8', accent: '#f2a93b',
    levels: [
      { cost: 60, damage: 11, attacksPerS: 1.5, rangeTiles: 3.1, slowPct: 0, burnPerS: 0 },
      { cost: 95, damage: 20, attacksPerS: 1.7, rangeTiles: 3.4, slowPct: 0, burnPerS: 0 },
      { cost: 140, damage: 36, attacksPerS: 1.9, rangeTiles: 3.7, slowPct: 0, burnPerS: 0 },
    ],
  },
  arc: {
    name: 'Arc coil', hotkey: '2', role: 'Energy discharge. Cuts through plating.', damageType: DAMAGE_ENERGY, projectileKind: PROJECTILE_ARC,
    projectileSpeedPxPerS: 340, splashRadiusPx: 0, slowDurationS: 0, burnDurationS: 0, isBulkhead: false, color: '#57d3ff', accent: '#e6f8ff',
    levels: [
      { cost: 90, damage: 30, attacksPerS: 0.8, rangeTiles: 2.9, slowPct: 0, burnPerS: 0 },
      { cost: 135, damage: 55, attacksPerS: 0.9, rangeTiles: 3.1, slowPct: 0, burnPerS: 0 },
      { cost: 200, damage: 95, attacksPerS: 1.0, rangeTiles: 3.3, slowPct: 0, burnPerS: 0 },
    ],
  },
  mortar: {
    name: 'Mortar pod', hotkey: '3', role: 'Kinetic splash. Wrecks packs.', damageType: DAMAGE_KINETIC, projectileKind: PROJECTILE_SHELL,
    projectileSpeedPxPerS: 230, splashRadiusPx: 60, slowDurationS: 0, burnDurationS: 0, isBulkhead: false, color: '#6b6f78', accent: '#f2a93b',
    levels: [
      { cost: 110, damage: 40, attacksPerS: 0.45, rangeTiles: 2.8, slowPct: 0, burnPerS: 0 },
      { cost: 165, damage: 70, attacksPerS: 0.5, rangeTiles: 3.0, slowPct: 0, burnPerS: 0 },
      { cost: 240, damage: 115, attacksPerS: 0.55, rangeTiles: 3.2, slowPct: 0, burnPerS: 0 },
    ],
  },
  cryo: {
    name: 'Cryo vent', hotkey: '4', role: 'Chills the swarm. Wisps ignore it.', damageType: DAMAGE_ENERGY, projectileKind: PROJECTILE_SHARD,
    projectileSpeedPxPerS: 360, splashRadiusPx: 0, slowDurationS: 2, burnDurationS: 0, isBulkhead: false, color: '#9fdcff', accent: '#ffffff',
    levels: [
      { cost: 80, damage: 6, attacksPerS: 1.0, rangeTiles: 2.5, slowPct: 0.4, burnPerS: 0 },
      { cost: 120, damage: 10, attacksPerS: 1.1, rangeTiles: 2.7, slowPct: 0.5, burnPerS: 0 },
      { cost: 170, damage: 16, attacksPerS: 1.2, rangeTiles: 2.9, slowPct: 0.6, burnPerS: 0 },
    ],
  },
  flamer: {
    name: 'Flamer', hotkey: '5', role: 'Short reach. Burn stops regeneration.', damageType: DAMAGE_ENERGY, projectileKind: PROJECTILE_FLAME,
    projectileSpeedPxPerS: 260, splashRadiusPx: 0, slowDurationS: 0, burnDurationS: 3, isBulkhead: false, color: '#ff8c3a', accent: '#ffd36b',
    levels: [
      { cost: 100, damage: 8, attacksPerS: 2.0, rangeTiles: 2.0, slowPct: 0, burnPerS: 5 },
      { cost: 150, damage: 14, attacksPerS: 2.2, rangeTiles: 2.2, slowPct: 0, burnPerS: 9 },
      { cost: 220, damage: 22, attacksPerS: 2.4, rangeTiles: 2.4, slowPct: 0, burnPerS: 14 },
    ],
  },
  bulkhead: {
    name: 'Bulkhead', hotkey: '', role: 'Seals a corridor and blocks sight.', damageType: DAMAGE_KINETIC, projectileKind: PROJECTILE_ROUND,
    projectileSpeedPxPerS: 0, splashRadiusPx: 0, slowDurationS: 0, burnDurationS: 0, isBulkhead: true, color: '#3a4149', accent: '#f2a93b',
    levels: [
      { cost: 40, damage: 0, attacksPerS: 0, rangeTiles: 0, slowPct: 0, burnPerS: 0 },
    ],
  },
});
const WEAPON_TYPE_ORDER = Object.freeze(['sentry', 'arc', 'mortar', 'cryo', 'flamer']);
const TOWER_MAX_LEVEL = 3;

const TARGET_FIRST = 'first';
const TARGET_STRONGEST = 'strongest';
const TARGET_LAST = 'last';
const TARGET_MODE_ORDER = Object.freeze([TARGET_FIRST, TARGET_STRONGEST, TARGET_LAST]);

const COMMAND_BUILD = 'build';
const COMMAND_UPGRADE = 'upgrade';
const COMMAND_SELL = 'sell';
const COMMAND_TARGET = 'target';
const COMMAND_SEND = 'send';

const EVENT_HIT = 'hit';
const EVENT_DEATH = 'death';
const EVENT_CORE_HIT = 'coreHit';
const EVENT_POD_LANDED = 'podLanded';
const EVENT_TOWER_FIRED = 'towerFired';
const EVENT_BULKHEAD_FAILED = 'bulkheadFailed';
const EVENT_BULKHEAD_CUT = 'bulkheadCut';
const EVENT_EMP = 'emp';

// Skirmish difficulty scales a commander's economy and tempo; campaign uses 1.0.
const AI_DIFFICULTIES = Object.freeze({
  easy: { label: 'Easy', economyPct: 0.75, tempoPct: 1.5, seed: 11 },
  normal: { label: 'Normal', economyPct: 1.0, tempoPct: 1.0, seed: 23 },
  hard: { label: 'Hard', economyPct: 1.25, tempoPct: 0.75, seed: 37 },
});
const AI_RULES = Object.freeze({
  thinkIntervalS: 1,
  coverageRangeTiles: 3,
  counterThresholdPct: 0.55,
  maxTowers: 22,
  bulkheadAfterTowers: 4,
  sealVentAfterTowers: 2,
  upgradeFocusPowerFraction: 0.6,
  empWorthTowers: 6,
});

const BREACH_STRATEGY_WEAKEST = 'weakest';
const BREACH_STRATEGY_RANDOM = 'random';
const BREACH_STRATEGY_FOCUS = 'focus';

// Personalities drive the same AI; the ladder order is the campaign.
const COMMANDERS = Object.freeze([
  {
    key: 'voss', name: 'Quartermaster Voss', title: 'The Wall', deckKey: 'hydroponics',
    blurb: 'Builds first, asks questions never. Slow to send, quick to seal corridors. Beat her by out-pressuring a fortress.',
    taunt: 'Every hatch on this deck answers to me. Knock all you like.',
    winLine: 'Your reactor was never the point. Your patience was.',
    loseLine: 'Fine. The deck is yours. Mind the bulkheads on your way in.',
    economy: { scrapIncomePct: 1.0, biomassRegenPct: 0.8 },
    personality: {
      sendIntervalS: 12, sendBurst: 1, buildIntervalS: 3, upgradeReserve: 150, bulkheadChancePct: 0.15, counterStrength: 1.5,
      breachStrategy: BREACH_STRATEGY_WEAKEST, pressureCoreFraction: 0.3,
      buildWeights: { sentry: 3, arc: 2, mortar: 1, cryo: 2, flamer: 1 },
      sendWeights: { shamblers: 3, lurchers: 1, carapace: 2, wispforms: 1, bloater: 1, reclaimer: 1, emp: 0.5, breacher: 0.5 },
    },
  },
  {
    key: 'rook', name: 'Rook', title: 'The Rush', deckKey: 'cargo',
    blurb: 'Drops pods in pairs before you have a second turret. Thin on defense. Survive the opening and he folds.',
    taunt: 'Hope you built fast. I did not build at all.',
    winLine: 'Told you. Fast beats ready.',
    loseLine: 'Alright. You held. Nobody holds twice.',
    economy: { scrapIncomePct: 0.9, biomassRegenPct: 1.3 },
    personality: {
      sendIntervalS: 5, sendBurst: 2, buildIntervalS: 6, upgradeReserve: 320, bulkheadChancePct: 0.03, counterStrength: 1,
      breachStrategy: BREACH_STRATEGY_RANDOM, pressureCoreFraction: 0.5,
      buildWeights: { sentry: 4, arc: 1, mortar: 2, cryo: 1, flamer: 1 },
      sendWeights: { shamblers: 3, lurchers: 4, carapace: 1, wispforms: 2, bloater: 1, reclaimer: 0.5, emp: 1, breacher: 0.5 },
    },
  },
  {
    key: 'marrow', name: 'Dr. Ilse Marrow', title: 'The Mirror', deckKey: 'medbay',
    blurb: 'Reads your deck and sends exactly what it cannot kill. Mix kinetic and energy or she will find the gap.',
    taunt: 'I have catalogued every gun you own. None of them are the right one.',
    winLine: 'A predictable defense is a diagnosis, not a plan.',
    loseLine: 'Interesting. You changed. Most do not.',
    economy: { scrapIncomePct: 1.05, biomassRegenPct: 1.05 },
    personality: {
      sendIntervalS: 8, sendBurst: 1, buildIntervalS: 4, upgradeReserve: 200, bulkheadChancePct: 0.08, counterStrength: 5,
      breachStrategy: BREACH_STRATEGY_WEAKEST, pressureCoreFraction: 0.4,
      buildWeights: { sentry: 2, arc: 2, mortar: 2, cryo: 2, flamer: 2 },
      sendWeights: { shamblers: 2, lurchers: 2, carapace: 2, wispforms: 2, bloater: 2, reclaimer: 1, emp: 1.5, breacher: 1 },
    },
  },
  {
    key: 'choir', name: 'The Choir', title: 'The Flood', deckKey: 'cryo',
    blurb: 'A lattice that speaks with many mouths. Endless shamblers and bloaters. Splash damage or drown.',
    taunt: 'We are not many. We are one, repeated.',
    winLine: 'Join the verse.',
    loseLine: 'A silence. We will learn its shape.',
    economy: { scrapIncomePct: 1.0, biomassRegenPct: 1.5 },
    personality: {
      sendIntervalS: 6, sendBurst: 2, buildIntervalS: 4, upgradeReserve: 220, bulkheadChancePct: 0.1, counterStrength: 1,
      breachStrategy: BREACH_STRATEGY_FOCUS, pressureCoreFraction: 0.5,
      buildWeights: { sentry: 2, arc: 1, mortar: 3, cryo: 1, flamer: 3 },
      sendWeights: { shamblers: 6, lurchers: 1, carapace: 0.5, wispforms: 0.5, bloater: 4, reclaimer: 0.5, emp: 0.5, breacher: 1 },
    },
  },
  {
    key: 'kell', name: 'Warden Kell', title: 'The Salvage King', deckKey: 'engineering',
    blurb: 'The crew that found the lattice first. Full economy, full roster, reclaimers on a timer, and he never stops leaning on one breach.',
    taunt: 'This ship was mine before it died. It is still mine.',
    winLine: 'Salvage rights, enforced.',
    loseLine: 'Take it. The lattice was always going to outlive us both.',
    economy: { scrapIncomePct: 1.3, biomassRegenPct: 1.4 },
    personality: {
      sendIntervalS: 6, sendBurst: 2, buildIntervalS: 3, upgradeReserve: 140, bulkheadChancePct: 0.12, counterStrength: 3,
      breachStrategy: BREACH_STRATEGY_FOCUS, pressureCoreFraction: 0.5,
      buildWeights: { sentry: 3, arc: 3, mortar: 2, cryo: 2, flamer: 2 },
      sendWeights: { shamblers: 2, lurchers: 2, carapace: 2, wispforms: 2, bloater: 2, reclaimer: 3, emp: 2, breacher: 1.5 },
    },
  },
]);
const CAMPAIGN_STORAGE_KEY = 'deadlight.campaign';
const FOCUS_REEVALUATE_S = 60;
const BANNER_TTL_S = 4.5;

const PHASE_MENU = 'menu';
const PHASE_PLAYING = 'playing';
const PHASE_PAUSED = 'paused';
const PHASE_ENDED = 'ended';

const MENU_KIND_BUILD = 'build';
const MENU_KIND_TOWER = 'tower';
const MENU_ACTION_BUILD = 'build';
const MENU_ACTION_UPGRADE = 'upgrade';
const MENU_ACTION_SELL = 'sell';
const MENU_ACTION_TARGET = 'target';
const MENU_LAYOUT = Object.freeze({
  ringRadiusPx: 56,
  buildButtonHalfPx: 21,
  pillHalfWidthPx: 58,
  pillHalfHeightPx: 14,
  pillOffsetPx: 46,
  pillSideOffsetPx: 96,
  chamferPx: 5,
  iconScale: 0.7,
  labelFontPx: 12,
  edgeMarginPx: 4,
});
const BUILD_MENU_ANGLES = Object.freeze([-Math.PI / 2, -Math.PI / 2 + (Math.PI * 2) / 5, -Math.PI / 2 + (Math.PI * 4) / 5, -Math.PI / 2 + (Math.PI * 6) / 5, -Math.PI / 2 + (Math.PI * 8) / 5]);

const PALETTE = Object.freeze({
  outline: '#0b0d10',
  deckLight: '#3a4149',
  deckDark: '#262b31',
  deckPanelLine: 'rgba(0, 0, 0, 0.25)',
  deckRivet: 'rgba(255, 255, 255, 0.12)',
  corridorFloor: '#1b1f24',
  corridorGrate: 'rgba(255, 255, 255, 0.06)',
  corridorEdgeLight: '#f2a93b',
  corridorEdgeLightDim: 'rgba(242, 169, 59, 0.35)',
  wall: '#4a525c',
  wallShade: '#2a3038',
  wallTop: '#5c656f',
  machine: '#5a4636',
  machineShade: '#3a2c22',
  machineLight: '#57d3ff',
  breachHatch: '#2f353c',
  breachStripe: '#f2a93b',
  breachStripeDark: '#1b1f24',
  breachMarker: 'rgba(142, 224, 107, 0.85)',
  breachMarkerHover: '#8ee06b',
  sabotageMarker: 'rgba(87, 211, 255, 0.9)',
  cutterMarker: 'rgba(255, 140, 58, 0.9)',
  ductGlow: 'rgba(142, 224, 107, 0.25)',
  star: '#f4f0ff',
  bannerFill: 'rgba(8, 24, 32, 0.9)',
  bannerText: '#3fd8ff',
  bannerSub: '#cfe9f3',
  coreRing: '#57d3ff',
  coreGlow: 'rgba(87, 211, 255, 0.35)',
  coreHousing: '#3a4149',
  coreDanger: '#e2513f',
  seam: 'rgba(87, 211, 255, 0.18)',
  rivalTint: 'rgba(226, 81, 63, 0.05)',
  lampGlow: 'rgba(242, 169, 59, 0.14)',
  shadow: 'rgba(0, 0, 0, 0.45)',
  highlight: 'rgba(255, 255, 255, 0.18)',
  towerBase: '#5b636d',
  towerBaseLight: '#7a838e',
  towerBaseDark: '#343a41',
  towerPlate: '#2c3239',
  hpBarBack: '#101317',
  hpBarFront: '#8ee06b',
  hpBarSlow: '#9fdcff',
  hpBarBurn: '#ff8c3a',
  hoverValid: 'rgba(87, 211, 255, 0.35)',
  hoverInvalid: 'rgba(226, 81, 63, 0.35)',
  rangeRing: 'rgba(215, 221, 229, 0.4)',
  losVisible: 'rgba(142, 224, 107, 0.7)',
  losBlocked: 'rgba(226, 81, 63, 0.85)',
  round: '#ffd36b',
  arcBolt: '#57d3ff',
  arcCore: '#ffffff',
  shell: '#1b1f24',
  shellShine: '#6b6f78',
  shard: '#d9f2ff',
  flame: '#ff8c3a',
  flameCore: '#ffd36b',
  muzzleFlash: '#ffd36b',
  slowTint: 'rgba(159, 220, 255, 0.5)',
  burnTint: 'rgba(255, 140, 58, 0.45)',
  biomassGlow: 'rgba(142, 224, 107, 0.3)',
  eye: '#e8f3ff',
  eyeGlow: '#8ee06b',
  pod: '#3a4149',
  podFin: '#f2a93b',
  podFlame: '#ff8c3a',
  podMarker: 'rgba(226, 81, 63, 0.8)',
  floatingScrap: '#f2a93b',
  floatingDamage: '#e2513f',
  menuFill: 'rgba(8, 24, 32, 0.92)',
  menuEdge: '#3fd8ff',
  menuEdgeDisabled: '#25404c',
  menuText: '#cfe9f3',
  menuTextDisabled: '#4f6a76',
  menuHighlight: '#ffffff',
  menuSell: '#e2513f',
  cursorFrameShadow: 'rgba(0, 0, 0, 0.5)',
  playerColor: '#3fd8ff',
  grime: 'rgba(0, 0, 0, 0.12)',
  splatter: 'rgba(120, 190, 80, 0.35)',
  splatterDark: 'rgba(60, 110, 40, 0.4)',
  rimLight: 'rgba(255, 255, 255, 0.28)',
  pipe: '#5a6470',
  pipeDark: '#343b43',
  ventCover: '#20252b',
  ventSlat: '#0f1216',
  ventFrame: '#4a525c',
  hatchSealed: '#3a2226',
  hatchSealedLight: '#e2513f',
  bone: '#e6dcc8',
  flesh: '#9b4a46',
  fleshDark: '#5e2a28',
  empArc: '#57d3ff',
  disabledTint: 'rgba(10, 12, 16, 0.55)',
  integrityBar: '#f2a93b',
  tooltipFill: 'rgba(8, 24, 32, 0.95)',
  tooltipEdge: '#3fd8ff',
  tooltipTitle: '#3fd8ff',
  tooltipText: '#cfe9f3',
  tooltipDim: '#6f8f9c',
  powerBar: '#57d3ff',
});

const DRAW_SIZES = Object.freeze({
  outlineWidthPx: 2.2,
  corridorInsetPx: 4,
  corridorLightLengthPx: 10,
  wallHeightPx: 8,
  machineHeightPx: 10,
  coreRadiusPx: 18,
  breachMarkerRadiusPx: 14,
  towerBaseHalfPx: 17,
  towerHeightPx: 6,
  towerTurretRadiusPx: 11,
  towerLevelPipPx: 4,
  hpBarWidthPx: 24,
  hpBarHeightPx: 4,
  hpBarOffsetPx: 6,
  eyeSizePx: 3,
  creepBobAmplitudePx: 1.2,
  creepBobRateHz: 4,
  roundLengthPx: 10,
  shellRadiusPx: 6,
  shardRadiusPx: 5,
  flameRadiusPx: 7,
  sparkSizePx: 3,
  floatingTextFontPx: 14,
  floatingTextRiseSpeedPxPerS: 30,
  floatingTextTtlS: 0.9,
  hitEffectTtlS: 0.3,
  deathEffectTtlS: 0.45,
  sparkTtlS: 0.35,
  sparkSpeedPxPerS: 90,
  sparksPerHit: 4,
  podShadowMaxRadiusPx: 22,
  podDropHeightPx: 260,
  podSizePx: 14,
  losLineWidthPx: 1.5,
  cursorLineWidthPx: 3,
  lampRadiusPx: 70,
  seamWidthPx: 3,
  tooltipWidthPx: 220,
  tooltipLineHeightPx: 16,
  tooltipPaddingPx: 10,
  tooltipFontPx: 12,
  tooltipTitleFontPx: 14,
  grimePerMap: 60,
  splatterPerBreach: 7,
  ventSlatSpacingPx: 6,
  bannerHalfWidthPx: 300,
  bannerHalfHeightPx: 40,
  bannerTitleFontPx: 22,
  bannerSubFontPx: 15,
  orbitRadiusPx: 15,
  orbitRateHz: 0.9,
  lavaPulseRateHz: 0.5,
});


// ===========================================================================
// SIMULATION (pure: no DOM, no canvas, no Math.random; fixed tick; commands in,
// state and events out). This module is what a Node server would run as well.
// ===========================================================================

function isInsideGrid(col, row) {
  return col >= 0 && row >= 0 && col < GRID_COLUMNS && row < GRID_ROWS;
}

function tileCenterX(col) {
  return col * TILE_SIZE_PX + HALF_TILE_PX;
}

function tileCenterY(row) {
  return row * TILE_SIZE_PX + HALF_TILE_PX;
}

function distanceBetween(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

function tileKey(col, row) {
  return row * GRID_COLUMNS + col;
}

function sideOfColumn(col) {
  return col < HALF_COLUMNS ? SIDE_PORT : SIDE_STARBOARD;
}

const NEIGHBOR_OFFSETS = Object.freeze([
  { col: 1, row: 0 }, { col: -1, row: 0 }, { col: 0, row: 1 }, { col: 0, row: -1 },
]);

class StationMap {
  constructor(halfLayout) {
    if (halfLayout.length !== GRID_ROWS) throw new Error(`Station layout must have ${GRID_ROWS} rows`);
    this.layout = halfLayout.map((rowText) => {
      if (rowText.length !== HALF_COLUMNS) throw new Error(`Station layout rows must have ${HALF_COLUMNS} columns`);
      return rowText + [...rowText].reverse().join('');
    });
    this.coresBySide = [this.findTilesOnSide(TILE_CORE, SIDE_PORT)[0], this.findTilesOnSide(TILE_CORE, SIDE_STARBOARD)[0]];
    if (!this.coresBySide[0] || !this.coresBySide[1]) throw new Error('Station layout needs a core on each side');
    this.breachesBySide = [this.findBreachesOnSide(SIDE_PORT), this.findBreachesOnSide(SIDE_STARBOARD)];
    if (this.breachesBySide[0].length === 0) throw new Error('Station layout needs at least one breach per side');
    this.ductPartnerByKey = this.linkDucts();
  }

  linkDucts() {
    const partners = new Map();
    [SIDE_PORT, SIDE_STARBOARD].forEach((side) => {
      DUCT_TILES.forEach((digit) => {
        const mouths = this.findTilesOnSide(digit, side);
        if (mouths.length === 0) return;
        if (mouths.length !== 2) throw new Error(`Duct ${digit} needs exactly two mouths per side, found ${mouths.length}`);
        partners.set(tileKey(mouths[0].col, mouths[0].row), mouths[1]);
        partners.set(tileKey(mouths[1].col, mouths[1].row), mouths[0]);
      });
    });
    return partners;
  }

  ductPartnerOf(col, row) {
    return this.ductPartnerByKey.get(tileKey(col, row)) ?? null;
  }

  findBreachesOnSide(side) {
    return [...this.findTilesOnSide(TILE_BREACH, side).map((tile) => ({ ...tile, openAtS: 0 })),
      ...this.findTilesOnSide(TILE_LATE_BREACH, side).map((tile) => ({ ...tile, openAtS: MATCH_RULES.lateBreachOpenS }))];
  }

  tileAt(col, row) {
    if (!isInsideGrid(col, row)) return null;
    return this.layout[row][col];
  }

  findTilesOnSide(tileKind, side) {
    const found = [];
    this.layout.forEach((rowText, row) => {
      [...rowText].forEach((tile, col) => {
        if (tile === tileKind && sideOfColumn(col) === side) found.push({ col, row });
      });
    });
    return found;
  }

  spawnPointForBreach(breach) {
    const center = { x: tileCenterX(breach.col), y: tileCenterY(breach.row) };
    if (breach.row === 0) return { x: center.x, y: center.y - MATCH_RULES.offscreenSpawnPx };
    if (breach.row === GRID_ROWS - 1) return { x: center.x, y: center.y + MATCH_RULES.offscreenSpawnPx };
    return center;
  }
}

// Cost-to-core field over walkable tiles, excluding sealed tiles. Duct mouths
// are linked with a fixed cost so an open duct reads as a shortcut.
function buildFlowField(map, core, sealedKeys) {
  const field = new Int32Array(GRID_COLUMNS * GRID_ROWS).fill(-1);
  const coreKey = tileKey(core.col, core.row);
  field[coreKey] = 0;
  const frontier = [{ col: core.col, row: core.row, cost: 0 }];
  const settled = new Set();
  while (frontier.length > 0) {
    frontier.sort((left, right) => left.cost - right.cost);
    const current = frontier.shift();
    const currentKey = tileKey(current.col, current.row);
    if (settled.has(currentKey)) continue;
    settled.add(currentKey);
    const relax = (col, row, stepCost) => {
      if (!WALKABLE_TILES.has(map.tileAt(col, row)) || sideOfColumn(col) !== sideOfColumn(core.col)) return;
      const key = tileKey(col, row);
      if (sealedKeys.has(key)) return;
      const cost = current.cost + stepCost;
      if (field[key] !== -1 && field[key] <= cost) return;
      field[key] = cost;
      frontier.push({ col, row, cost });
    };
    NEIGHBOR_OFFSETS.forEach((offset) => relax(current.col + offset.col, current.row + offset.row, 1));
    const partner = map.ductPartnerOf(current.col, current.row);
    if (partner !== null && !sealedKeys.has(currentKey)) relax(partner.col, partner.row, DUCT_EDGE_COST);
  }
  return field;
}

let nextEntityId = 1;

function takeEntityId() {
  const id = nextEntityId;
  nextEntityId += 1;
  return id;
}

class Creep {
  constructor(typeKey, side, spawnPoint, startTile, hpMultiplier) {
    const type = CREEP_TYPES[typeKey];
    if (!type) throw new Error(`Unknown creep type ${typeKey}`);
    this.id = takeEntityId();
    this.typeKey = typeKey;
    this.type = type;
    this.side = side;
    this.maxHp = Math.round(type.hp * hpMultiplier);
    this.hp = this.maxHp;
    this.x = spawnPoint.x;
    this.y = spawnPoint.y;
    this.angle = 0;
    this.currentTile = { col: startTile.col, row: startTile.row };
    this.nextTile = null;
    this.isInDuct = false;
    this.hasEnteredStation = false;
    this.slowPct = 0;
    this.slowRemainingS = 0;
    this.burnPerS = 0;
    this.burnRemainingS = 0;
    this.burnTickS = 0;
    this.isAlive = true;
    this.hasReachedCore = false;
  }

  get radiusPx() {
    return this.type.radiusPx;
  }

  isHidden(map) {
    return this.isInDuct || DUCT_TILES.has(map.tileAt(Math.floor(this.x / TILE_SIZE_PX), Math.floor(this.y / TILE_SIZE_PX)));
  }

  remainingDistancePx(field) {
    const goal = this.nextTile ?? this.currentTile;
    const tileDistance = field[tileKey(goal.col, goal.row)];
    if (tileDistance < 0) return Infinity;
    return tileDistance * TILE_SIZE_PX + distanceBetween(this.x, this.y, tileCenterX(goal.col), tileCenterY(goal.row));
  }

  chooseNextTile(map, field) {
    const here = this.currentTile;
    const hereDistance = field[tileKey(here.col, here.row)];
    let best = null;
    let bestDistance = hereDistance < 0 ? Infinity : hereDistance;
    const consider = (col, row) => {
      if (!isInsideGrid(col, row)) return;
      const candidateDistance = field[tileKey(col, row)];
      if (candidateDistance < 0 || candidateDistance >= bestDistance) return;
      bestDistance = candidateDistance;
      best = { col, row };
    };
    NEIGHBOR_OFFSETS.forEach((offset) => consider(here.col + offset.col, here.row + offset.row));
    const partner = map.ductPartnerOf(here.col, here.row);
    if (partner !== null && field[tileKey(here.col, here.row)] >= 0) consider(partner.col, partner.row);
    return best;
  }

  update(deltaS, map, field) {
    this.updateStatusEffects(deltaS);
    if (!this.hasEnteredStation) {
      const entryX = tileCenterX(this.currentTile.col);
      const entryY = tileCenterY(this.currentTile.row);
      this.hasEnteredStation = this.moveToward(entryX, entryY, deltaS);
      return;
    }
    if (this.nextTile === null) {
      this.nextTile = this.chooseNextTile(map, field);
      if (this.nextTile === null) return;
      const isAdjacent = Math.abs(this.nextTile.col - this.currentTile.col) + Math.abs(this.nextTile.row - this.currentTile.row) === 1;
      this.isInDuct = !isAdjacent;
    }
    const arrived = this.moveToward(tileCenterX(this.nextTile.col), tileCenterY(this.nextTile.row), deltaS);
    if (!arrived) return;
    this.currentTile = this.nextTile;
    this.nextTile = null;
    this.isInDuct = false;
    if (map.tileAt(this.currentTile.col, this.currentTile.row) === TILE_CORE) this.hasReachedCore = true;
  }

  moveToward(targetX, targetY, deltaS) {
    const speedPxPerS = this.isInDuct ? DUCT_CRAWL_SPEED_PX_PER_S : this.type.speedPxPerS * (1 - this.slowPct);
    const stepPx = speedPxPerS * deltaS;
    const remaining = distanceBetween(this.x, this.y, targetX, targetY);
    this.angle = Math.atan2(targetY - this.y, targetX - this.x);
    if (remaining <= stepPx) {
      this.x = targetX;
      this.y = targetY;
      return true;
    }
    this.x += Math.cos(this.angle) * stepPx;
    this.y += Math.sin(this.angle) * stepPx;
    return false;
  }

  updateStatusEffects(deltaS) {
    if (this.slowRemainingS > 0) {
      this.slowRemainingS -= deltaS;
      if (this.slowRemainingS <= 0) this.slowPct = 0;
    }
    if (this.burnRemainingS > 0) {
      this.burnRemainingS -= deltaS;
      this.burnTickS += deltaS;
      if (this.burnTickS >= MATCH_RULES.burnTickS) {
        this.burnTickS -= MATCH_RULES.burnTickS;
        this.takeDamage(this.burnPerS * MATCH_RULES.burnTickS, DAMAGE_ENERGY);
      }
      if (this.burnRemainingS <= 0) this.burnPerS = 0;
      return;
    }
    if (this.type.regenHpPerS > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.type.regenHpPerS * deltaS);
    }
  }

  takeDamage(amount, damageType) {
    const resistPct = damageType === DAMAGE_KINETIC ? this.type.kineticResistPct : this.type.energyResistPct;
    const dealt = amount * (1 - resistPct);
    this.hp -= dealt;
    if (this.hp <= 0) this.isAlive = false;
    return dealt;
  }

  applySlow(slowPct, durationS) {
    if (slowPct <= 0 || this.type.isSlowImmune) return;
    this.slowPct = Math.max(this.slowPct, slowPct);
    this.slowRemainingS = Math.max(this.slowRemainingS, durationS);
  }

  applyBurn(burnPerS, durationS) {
    if (burnPerS <= 0) return;
    this.burnPerS = Math.max(this.burnPerS, burnPerS);
    this.burnRemainingS = Math.max(this.burnRemainingS, durationS);
  }
}

class Tower {
  constructor(typeKey, col, row, side) {
    const type = TOWER_TYPES[typeKey];
    if (!type) throw new Error(`Unknown tower type ${typeKey}`);
    this.id = takeEntityId();
    this.typeKey = typeKey;
    this.type = type;
    this.col = col;
    this.row = row;
    this.x = tileCenterX(col);
    this.y = tileCenterY(row);
    this.side = side;
    this.level = 1;
    this.investedScrap = type.levels[0].cost;
    this.cooldownS = 0;
    this.flashS = 0;
    this.aimAngle = side === SIDE_PORT ? 0 : Math.PI;
    this.target = null;
    this.targetMode = TARGET_FIRST;
    this.disabledS = 0;
    this.integrityS = type.isBulkhead ? MATCH_RULES.bulkheadLifetimeS : 0;
  }

  get stats() {
    return this.type.levels[this.level - 1];
  }

  get powerDraw() {
    return this.type.isBulkhead ? 0 : MATCH_RULES.towerPowerByLevel[this.level - 1];
  }

  get upgradePowerIncrease() {
    if (!this.canUpgrade) return 0;
    return MATCH_RULES.towerPowerByLevel[this.level] - MATCH_RULES.towerPowerByLevel[this.level - 1];
  }

  get isDisabled() {
    return this.disabledS > 0;
  }

  get rangePx() {
    return this.stats.rangeTiles * TILE_SIZE_PX;
  }

  get canUpgrade() {
    return !this.type.isBulkhead && this.level < TOWER_MAX_LEVEL;
  }

  get upgradeCost() {
    if (!this.canUpgrade) return 0;
    return this.type.levels[this.level].cost;
  }

  get sellValue() {
    return Math.floor(this.investedScrap * MATCH_RULES.sellRefundPct);
  }

  upgrade() {
    if (!this.canUpgrade) throw new Error('Tower cannot be upgraded');
    this.investedScrap += this.upgradeCost;
    this.level += 1;
  }

  cycleTargetMode() {
    const index = TARGET_MODE_ORDER.indexOf(this.targetMode);
    this.targetMode = TARGET_MODE_ORDER[(index + 1) % TARGET_MODE_ORDER.length];
  }

  isBetterTarget(candidate, best, field) {
    if (this.targetMode === TARGET_STRONGEST) return candidate.hp > best.hp;
    if (this.targetMode === TARGET_LAST) return candidate.remainingDistancePx(field) > best.remainingDistancePx(field);
    return candidate.remainingDistancePx(field) < best.remainingDistancePx(field);
  }

  findTarget(creeps, field, hasLineOfSight, map) {
    let best = null;
    creeps.forEach((creep) => {
      if (!creep.isAlive || !creep.hasEnteredStation || creep.isHidden(map)) return;
      if (distanceBetween(this.x, this.y, creep.x, creep.y) > this.rangePx) return;
      if (!hasLineOfSight(this.x, this.y, creep.x, creep.y)) return;
      if (best === null || this.isBetterTarget(creep, best, field)) best = creep;
    });
    return best;
  }

  update(deltaS, creeps, field, hasLineOfSight, map) {
    if (this.type.isBulkhead) {
      this.integrityS = Math.max(0, this.integrityS - deltaS);
      return null;
    }
    this.cooldownS = Math.max(0, this.cooldownS - deltaS);
    this.flashS = Math.max(0, this.flashS - deltaS);
    if (this.disabledS > 0) {
      this.disabledS = Math.max(0, this.disabledS - deltaS);
      this.target = null;
      return null;
    }
    this.target = this.findTarget(creeps, field, hasLineOfSight, map);
    if (this.target === null) return null;
    this.aimAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
    if (this.cooldownS > 0) return null;
    this.cooldownS = 1 / this.stats.attacksPerS;
    this.flashS = 0.12;
    return new Projectile(this, this.target);
  }
}

class Projectile {
  constructor(tower, target) {
    const stats = tower.stats;
    this.id = takeEntityId();
    this.kind = tower.type.projectileKind;
    this.damage = stats.damage;
    this.damageType = tower.type.damageType;
    this.splashRadiusPx = tower.type.splashRadiusPx;
    this.slowPct = stats.slowPct;
    this.slowDurationS = tower.type.slowDurationS;
    this.burnPerS = stats.burnPerS;
    this.burnDurationS = tower.type.burnDurationS;
    this.side = tower.side;
    this.speedPxPerS = tower.type.projectileSpeedPxPerS;
    this.maxTravelPx = tower.rangePx + TILE_SIZE_PX;
    this.traveledPx = 0;
    this.x = tower.x;
    this.y = tower.y;
    this.angle = tower.aimAngle;
    this.target = target;
    this.isSpent = false;
  }

  update(deltaS) {
    if (this.target !== null && this.target.isAlive) {
      this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
    }
    const stepPx = this.speedPxPerS * deltaS;
    this.x += Math.cos(this.angle) * stepPx;
    this.y += Math.sin(this.angle) * stepPx;
    this.traveledPx += stepPx;
    const margin = MATCH_RULES.despawnMarginPx;
    if (this.traveledPx > this.maxTravelPx || this.x < -margin || this.y < -margin || this.x > CANVAS_WIDTH_PX + margin || this.y > CANVAS_HEIGHT_PX + margin) {
      this.isSpent = true;
    }
  }

  findCollision(creeps) {
    return creeps.find((creep) => creep.isAlive
      && distanceBetween(this.x, this.y, creep.x, creep.y) <= creep.radiusPx + MATCH_RULES.projectileRadiusPx) ?? null;
  }
}

class Pod {
  constructor(card, targetSide, breachIndex, landingX, landingY, launchedBySide) {
    this.id = takeEntityId();
    this.card = card;
    this.targetSide = targetSide;
    this.breachIndex = breachIndex;
    this.x = landingX;
    this.y = landingY;
    this.launchedBySide = launchedBySide;
    this.remainingS = MATCH_RULES.podFlightS;
  }
}

function createSideState(map, side, scrapIncomePct, biomassRegenPct) {
  return {
    side,
    coreHp: MATCH_RULES.coreHp,
    scrap: MATCH_RULES.startingScrap,
    biomass: MATCH_RULES.startingBiomass,
    scrapIncomePct,
    biomassRegenPct,
    incomeTimerS: 0,
    towers: [],
    creeps: [],
    projectiles: [],
    incomingPods: [],
    spawnQueue: [],
    cardCooldowns: {},
    sealedKeys: new Set(),
    field: buildFlowField(map, map.coresBySide[side], new Set()),
    sentHistory: {},
    ecoRegenPerS: 0,
  };
}

class Simulation {
  constructor(map, sideOptions) {
    this.map = map;
    this.sides = [
      createSideState(map, SIDE_PORT, sideOptions[SIDE_PORT].scrapIncomePct, sideOptions[SIDE_PORT].biomassRegenPct),
      createSideState(map, SIDE_STARBOARD, sideOptions[SIDE_STARBOARD].scrapIncomePct, sideOptions[SIDE_STARBOARD].biomassRegenPct),
    ];
    this.clockS = 0;
    this.suddenDeathTimerS = 0;
    this.isOver = false;
    this.winnerSide = null;
    this.events = [];
  }

  get isSuddenDeath() {
    return this.clockS >= MATCH_RULES.suddenDeathAtS;
  }

  opponentOf(side) {
    return side === SIDE_PORT ? SIDE_STARBOARD : SIDE_PORT;
  }

  get elapsedMinutes() {
    return this.clockS / 60;
  }

  get creepHpMultiplier() {
    return 1 + MATCH_RULES.escalationHpPctPerMin * this.elapsedMinutes;
  }

  get biomassCap() {
    return MATCH_RULES.biomassCap + MATCH_RULES.biomassCapPerMin * this.elapsedMinutes;
  }

  biomassRegenFor(state) {
    return MATCH_RULES.biomassRegenPerS * state.biomassRegenPct * (1 + MATCH_RULES.escalationRegenPctPerMin * this.elapsedMinutes) + state.ecoRegenPerS;
  }

  powerUsed(state) {
    return state.towers.reduce((sum, tower) => sum + tower.powerDraw, 0);
  }

  isBreachOpen(side, breachIndex) {
    const breach = this.map.breachesBySide[side][breachIndex];
    if (!breach) return false;
    return this.clockS >= breach.openAtS;
  }

  towerAt(col, row) {
    const side = sideOfColumn(col);
    return this.sides[side].towers.find((tower) => tower.col === col && tower.row === row) ?? null;
  }

  tileBlocksSight(col, row) {
    if (SIGHT_BLOCKING_TILES.has(this.map.tileAt(col, row))) return true;
    if (!isInsideGrid(col, row)) return false;
    return this.sides[sideOfColumn(col)].sealedKeys.has(tileKey(col, row));
  }

  // Amanatides-Woo traversal against static walls and player-sealed corridors.
  hasLineOfSight(fromX, fromY, toX, toY) {
    const endCol = Math.floor(toX / TILE_SIZE_PX);
    const endRow = Math.floor(toY / TILE_SIZE_PX);
    let col = Math.floor(fromX / TILE_SIZE_PX);
    let row = Math.floor(fromY / TILE_SIZE_PX);
    const deltaX = toX - fromX;
    const deltaY = toY - fromY;
    const stepCol = deltaX > 0 ? 1 : -1;
    const stepRow = deltaY > 0 ? 1 : -1;
    const travelPerColumn = deltaX === 0 ? Infinity : Math.abs(TILE_SIZE_PX / deltaX);
    const travelPerRow = deltaY === 0 ? Infinity : Math.abs(TILE_SIZE_PX / deltaY);
    const distanceToColumnEdge = deltaX > 0 ? (col + 1) * TILE_SIZE_PX - fromX : fromX - col * TILE_SIZE_PX;
    const distanceToRowEdge = deltaY > 0 ? (row + 1) * TILE_SIZE_PX - fromY : fromY - row * TILE_SIZE_PX;
    let nextColumnCrossing = deltaX === 0 ? Infinity : distanceToColumnEdge / Math.abs(deltaX);
    let nextRowCrossing = deltaY === 0 ? Infinity : distanceToRowEdge / Math.abs(deltaY);
    for (let step = 0; step < RAYCAST_MAX_STEPS; step += 1) {
      if (col === endCol && row === endRow) return true;
      if (nextColumnCrossing < nextRowCrossing) {
        col += stepCol;
        nextColumnCrossing += travelPerColumn;
      } else {
        row += stepRow;
        nextRowCrossing += travelPerRow;
      }
      if (this.tileBlocksSight(col, row)) return false;
    }
    return true;
  }

  // ---- placement rules -----------------------------------------------------

  canBuildAt(side, col, row, typeKey) {
    const type = TOWER_TYPES[typeKey];
    if (!type) throw new Error(`Unknown tower type ${typeKey}`);
    if (!isInsideGrid(col, row) || sideOfColumn(col) !== side) return false;
    if (this.towerAt(col, row) !== null) return false;
    const tile = this.map.tileAt(col, row);
    if (type.isBulkhead) {
      if (!SEALABLE_TILES.has(tile)) return false;
      if (this.sides[side].towers.filter((tower) => tower.type.isBulkhead).length >= MATCH_RULES.bulkheadCap) return false;
      return this.wouldKeepBreachesConnected(side, col, row);
    }
    if (tile !== TILE_DECK) return false;
    return this.powerUsed(this.sides[side]) + MATCH_RULES.towerPowerByLevel[0] <= MATCH_RULES.reactorPowerCap;
  }

  canUpgradeTower(state, tower) {
    if (!tower.canUpgrade) return false;
    return this.powerUsed(state) + tower.upgradePowerIncrease <= MATCH_RULES.reactorPowerCap;
  }

  wouldKeepBreachesConnected(side, col, row) {
    const sealed = new Set(this.sides[side].sealedKeys);
    sealed.add(tileKey(col, row));
    const field = buildFlowField(this.map, this.map.coresBySide[side], sealed);
    const breachesOpen = this.map.breachesBySide[side].every((breach) => field[tileKey(breach.col, breach.row)] >= 0);
    const creepsStranded = this.sides[side].creeps.some((creep) => creep.hasEnteredStation && field[tileKey(creep.currentTile.col, creep.currentTile.row)] < 0);
    return breachesOpen && !creepsStranded;
  }

  isSealableTile(col, row) {
    return SEALABLE_TILES.has(this.map.tileAt(col, row));
  }

  // ---- commands --------------------------------------------------------------

  applyCommand(command) {
    const state = this.sides[command.side];
    if (!state) throw new Error(`Unknown side ${command.side}`);
    if (command.type === COMMAND_BUILD) return this.build(state, command.col, command.row, command.typeKey);
    if (command.type === COMMAND_UPGRADE) return this.upgrade(state, command.col, command.row);
    if (command.type === COMMAND_SELL) return this.sell(state, command.col, command.row);
    if (command.type === COMMAND_TARGET) return this.cycleTarget(state, command.col, command.row);
    if (command.type === COMMAND_SEND) return this.send(state, command.cardKey, command.target);
    throw new Error(`Unknown command ${command.type}`);
  }

  build(state, col, row, typeKey) {
    if (!this.canBuildAt(state.side, col, row, typeKey)) return false;
    const cost = TOWER_TYPES[typeKey].levels[0].cost;
    if (state.scrap < cost) return false;
    state.scrap -= cost;
    const tower = new Tower(typeKey, col, row, state.side);
    state.towers.push(tower);
    if (tower.type.isBulkhead) {
      state.sealedKeys.add(tileKey(col, row));
      this.rebuildField(state);
    }
    return true;
  }

  ownTowerAt(state, col, row) {
    const tower = this.towerAt(col, row);
    if (tower === null || tower.side !== state.side) return null;
    return tower;
  }

  upgrade(state, col, row) {
    const tower = this.ownTowerAt(state, col, row);
    if (tower === null || !this.canUpgradeTower(state, tower) || state.scrap < tower.upgradeCost) return false;
    state.scrap -= tower.upgradeCost;
    tower.upgrade();
    return true;
  }

  sell(state, col, row) {
    const tower = this.ownTowerAt(state, col, row);
    if (tower === null) return false;
    state.scrap += tower.sellValue;
    state.towers = state.towers.filter((candidate) => candidate !== tower);
    if (tower.type.isBulkhead) {
      state.sealedKeys.delete(tileKey(col, row));
      this.rebuildField(state);
    }
    return true;
  }

  cycleTarget(state, col, row) {
    const tower = this.ownTowerAt(state, col, row);
    if (tower === null || tower.type.isBulkhead) return false;
    tower.cycleTargetMode();
    return true;
  }

  // target is { kind: SEND_TARGET_BREACH, breachIndex } for creep pods or
  // { kind: SEND_TARGET_POINT, col, row } for sabotage pods.
  send(state, cardKey, target) {
    const card = SEND_CARDS.find((candidate) => candidate.key === cardKey);
    if (!card) throw new Error(`Unknown card ${cardKey}`);
    const targetSide = this.opponentOf(state.side);
    let breachIndex = null;
    let landingX = 0;
    let landingY = 0;
    if (card.kind === CARD_KIND_CREEPS) {
      if (!target || target.kind !== SEND_TARGET_BREACH || !this.isBreachOpen(targetSide, target.breachIndex)) return false;
      breachIndex = target.breachIndex;
      const breach = this.map.breachesBySide[targetSide][breachIndex];
      landingX = tileCenterX(breach.col);
      landingY = tileCenterY(breach.row);
    } else {
      if (!target || target.kind !== SEND_TARGET_POINT || !this.isSabotageTargetable(targetSide, target.col, target.row)) return false;
      landingX = tileCenterX(target.col);
      landingY = tileCenterY(target.row);
    }
    if ((state.cardCooldowns[cardKey] ?? 0) > 0 || state.biomass < card.biomassCost) return false;
    state.biomass -= card.biomassCost;
    state.cardCooldowns[cardKey] = card.cooldownS;
    state.sentHistory[cardKey] = (state.sentHistory[cardKey] ?? 0) + 1;
    state.ecoRegenPerS += MATCH_RULES.ecoRegenPerSendPerS;
    this.sides[targetSide].incomingPods.push(new Pod(card, targetSide, breachIndex, landingX, landingY, state.side));
    return true;
  }

  isSabotageTargetable(targetSide, col, row) {
    if (!isInsideGrid(col, row) || sideOfColumn(col) !== targetSide) return false;
    return this.map.tileAt(col, row) !== TILE_WALL;
  }

  rebuildField(state) {
    state.field = buildFlowField(this.map, this.map.coresBySide[state.side], state.sealedKeys);
    state.creeps.forEach((creep) => {
      if (creep.nextTile !== null && state.field[tileKey(creep.nextTile.col, creep.nextTile.row)] < 0) creep.nextTile = null;
    });
  }

  // ---- stepping --------------------------------------------------------------

  step(deltaS, commands) {
    this.events = [];
    if (this.isOver) return this.events;
    commands.forEach((command) => this.applyCommand(command));
    this.clockS += deltaS;
    this.sides.forEach((state) => this.stepSide(state, deltaS));
    this.stepSuddenDeath(deltaS);
    this.checkVictory();
    return this.events;
  }

  stepSide(state, deltaS) {
    this.stepEconomy(state, deltaS);
    this.stepPods(state, deltaS);
    this.stepSpawnQueue(state, deltaS);
    this.stepTowers(state, deltaS);
    this.stepProjectiles(state, deltaS);
    this.stepCreeps(state, deltaS);
  }

  stepEconomy(state, deltaS) {
    state.biomass = Math.min(this.biomassCap, state.biomass + this.biomassRegenFor(state) * deltaS);
    state.incomeTimerS += deltaS;
    if (state.incomeTimerS >= MATCH_RULES.scrapIncomeIntervalS) {
      state.incomeTimerS -= MATCH_RULES.scrapIncomeIntervalS;
      state.scrap += Math.round(MATCH_RULES.scrapIncome * state.scrapIncomePct);
    }
    Object.keys(state.cardCooldowns).forEach((cardKey) => {
      state.cardCooldowns[cardKey] = Math.max(0, state.cardCooldowns[cardKey] - deltaS);
    });
  }

  stepPods(state, deltaS) {
    state.incomingPods.forEach((pod) => {
      pod.remainingS -= deltaS;
      if (pod.remainingS > 0) return;
      this.events.push({ type: EVENT_POD_LANDED, x: pod.x, y: pod.y, side: state.side });
      if (pod.card.kind === CARD_KIND_EMP) this.detonateEmp(state, pod.x, pod.y);
      else if (pod.card.kind === CARD_KIND_BREACHER) this.cutNearestBulkhead(state, pod.x, pod.y);
      else {
        const breach = this.map.breachesBySide[state.side][pod.breachIndex];
        for (let index = 0; index < pod.card.count; index += 1) {
          state.spawnQueue.push({ typeKey: pod.card.creepTypeKey, breach, delayS: index * pod.card.spacingS });
        }
      }
    });
    state.incomingPods = state.incomingPods.filter((pod) => pod.remainingS > 0);
  }

  detonateEmp(state, x, y) {
    state.towers.forEach((tower) => {
      if (tower.type.isBulkhead || distanceBetween(x, y, tower.x, tower.y) > MATCH_RULES.empRadiusPx) return;
      tower.disabledS = MATCH_RULES.empDurationS;
    });
    this.events.push({ type: EVENT_EMP, x, y, radiusPx: MATCH_RULES.empRadiusPx });
  }

  cutNearestBulkhead(state, x, y) {
    const bulkheads = state.towers.filter((tower) => tower.type.isBulkhead);
    if (bulkheads.length === 0) return;
    const nearest = bulkheads.sort((left, right) => distanceBetween(x, y, left.x, left.y) - distanceBetween(x, y, right.x, right.y))[0];
    this.removeBulkhead(state, nearest);
    this.events.push({ type: EVENT_BULKHEAD_CUT, x: nearest.x, y: nearest.y });
  }

  removeBulkhead(state, bulkhead) {
    state.towers = state.towers.filter((candidate) => candidate !== bulkhead);
    state.sealedKeys.delete(tileKey(bulkhead.col, bulkhead.row));
    this.rebuildField(state);
  }

  stepSpawnQueue(state, deltaS) {
    state.spawnQueue.forEach((entry) => { entry.delayS -= deltaS; });
    state.spawnQueue.filter((entry) => entry.delayS <= 0).forEach((entry) => {
      state.creeps.push(new Creep(entry.typeKey, state.side, this.map.spawnPointForBreach(entry.breach), entry.breach, this.creepHpMultiplier));
    });
    state.spawnQueue = state.spawnQueue.filter((entry) => entry.delayS > 0);
  }

  stepTowers(state, deltaS) {
    const hasLineOfSight = (fromX, fromY, toX, toY) => this.hasLineOfSight(fromX, fromY, toX, toY);
    state.towers.forEach((tower) => {
      const projectile = tower.update(deltaS, state.creeps, state.field, hasLineOfSight, this.map);
      if (projectile === null) return;
      state.projectiles.push(projectile);
      this.events.push({ type: EVENT_TOWER_FIRED, x: tower.x, y: tower.y, towerTypeKey: tower.typeKey });
    });
    state.towers.filter((tower) => tower.type.isBulkhead && tower.integrityS <= 0).forEach((bulkhead) => {
      this.removeBulkhead(state, bulkhead);
      this.events.push({ type: EVENT_BULKHEAD_FAILED, x: bulkhead.x, y: bulkhead.y });
    });
  }

  stepProjectiles(state, deltaS) {
    state.projectiles.forEach((projectile) => {
      projectile.update(deltaS);
      if (projectile.isSpent) return;
      const struck = projectile.findCollision(state.creeps);
      if (struck === null) return;
      projectile.isSpent = true;
      this.resolveHit(state, projectile, struck);
    });
    state.projectiles = state.projectiles.filter((projectile) => !projectile.isSpent);
  }

  resolveHit(state, projectile, struck) {
    const victims = projectile.splashRadiusPx > 0
      ? state.creeps.filter((creep) => creep.isAlive && distanceBetween(projectile.x, projectile.y, creep.x, creep.y) <= projectile.splashRadiusPx + creep.radiusPx)
      : [struck];
    this.events.push({ type: EVENT_HIT, x: projectile.x, y: projectile.y, kind: projectile.kind, splashRadiusPx: projectile.splashRadiusPx });
    victims.forEach((creep) => {
      creep.takeDamage(projectile.damage, projectile.damageType);
      creep.applySlow(projectile.slowPct, projectile.slowDurationS);
      creep.applyBurn(projectile.burnPerS, projectile.burnDurationS);
    });
  }

  stepCreeps(state, deltaS) {
    const born = [];
    state.creeps.forEach((creep) => {
      if (!creep.isAlive) {
        this.rewardKill(state, creep, born);
        return;
      }
      creep.update(deltaS, this.map, state.field);
      if (!creep.hasReachedCore) return;
      creep.isAlive = false;
      state.coreHp = Math.max(0, state.coreHp - creep.type.coreDamage);
      this.events.push({ type: EVENT_CORE_HIT, x: creep.x, y: creep.y, damage: creep.type.coreDamage, side: state.side });
    });
    state.creeps = state.creeps.filter((creep) => creep.isAlive).concat(born);
  }

  rewardKill(state, creep, born) {
    state.scrap += creep.type.scrapBounty;
    this.events.push({ type: EVENT_DEATH, x: creep.x, y: creep.y, side: state.side, bounty: creep.type.scrapBounty, color: creep.type.bodyColor, radiusPx: creep.radiusPx });
    if (creep.type.deathSpawn === null) return;
    for (let index = 0; index < creep.type.deathSpawn.count; index += 1) {
      const child = new Creep(creep.type.deathSpawn.typeKey, state.side, { x: creep.x, y: creep.y }, creep.currentTile, this.creepHpMultiplier);
      child.hasEnteredStation = true;
      born.push(child);
    }
  }

  stepSuddenDeath(deltaS) {
    if (!this.isSuddenDeath) return;
    this.suddenDeathTimerS += deltaS;
    if (this.suddenDeathTimerS < MATCH_RULES.suddenDeathDamageIntervalS) return;
    this.suddenDeathTimerS -= MATCH_RULES.suddenDeathDamageIntervalS;
    this.sides.forEach((state) => { state.coreHp = Math.max(0, state.coreHp - MATCH_RULES.suddenDeathDamage); });
  }

  checkVictory() {
    const portDown = this.sides[SIDE_PORT].coreHp <= 0;
    const starboardDown = this.sides[SIDE_STARBOARD].coreHp <= 0;
    if (!portDown && !starboardDown) return;
    this.isOver = true;
    if (portDown && starboardDown) this.winnerSide = null;
    else this.winnerSide = portDown ? SIDE_STARBOARD : SIDE_PORT;
  }
}


// ===========================================================================
// SNAPSHOTS (server -> client). hydrate reuses entity instances by id so the
// renderer keeps animation phase and the menus keep their selections.
// ===========================================================================

function serializeSimulation(sim) {
  return {
    clockS: sim.clockS,
    suddenDeathTimerS: sim.suddenDeathTimerS,
    isOver: sim.isOver,
    winnerSide: sim.winnerSide,
    sides: sim.sides.map((state) => ({
      coreHp: state.coreHp,
      scrap: state.scrap,
      biomass: state.biomass,
      incomeTimerS: state.incomeTimerS,
      ecoRegenPerS: state.ecoRegenPerS,
      cardCooldowns: state.cardCooldowns,
      sentHistory: state.sentHistory,
      sealedKeys: [...state.sealedKeys],
      towers: state.towers.map((tower) => ({
        id: tower.id, typeKey: tower.typeKey, col: tower.col, row: tower.row, level: tower.level, targetMode: tower.targetMode,
        cooldownS: tower.cooldownS, flashS: tower.flashS, aimAngle: tower.aimAngle, disabledS: tower.disabledS, integrityS: tower.integrityS, investedScrap: tower.investedScrap,
      })),
      creeps: state.creeps.map((creep) => ({
        id: creep.id, typeKey: creep.typeKey, x: creep.x, y: creep.y, angle: creep.angle, hp: creep.hp, maxHp: creep.maxHp,
        currentTile: creep.currentTile, nextTile: creep.nextTile, isInDuct: creep.isInDuct, hasEnteredStation: creep.hasEnteredStation,
        slowPct: creep.slowPct, slowRemainingS: creep.slowRemainingS, burnPerS: creep.burnPerS, burnRemainingS: creep.burnRemainingS, burnTickS: creep.burnTickS,
      })),
      projectiles: state.projectiles.map((projectile) => ({
        id: projectile.id, kind: projectile.kind, damage: projectile.damage, damageType: projectile.damageType, splashRadiusPx: projectile.splashRadiusPx,
        slowPct: projectile.slowPct, slowDurationS: projectile.slowDurationS, burnPerS: projectile.burnPerS, burnDurationS: projectile.burnDurationS,
        speedPxPerS: projectile.speedPxPerS, maxTravelPx: projectile.maxTravelPx, traveledPx: projectile.traveledPx,
        x: projectile.x, y: projectile.y, angle: projectile.angle, targetId: projectile.target === null ? null : projectile.target.id,
      })),
      incomingPods: state.incomingPods.map((pod) => ({
        id: pod.id, cardKey: pod.card.key, breachIndex: pod.breachIndex, x: pod.x, y: pod.y, launchedBySide: pod.launchedBySide, remainingS: pod.remainingS,
      })),
      spawnQueue: state.spawnQueue.map((entry) => ({ typeKey: entry.typeKey, breach: { col: entry.breach.col, row: entry.breach.row }, delayS: entry.delayS })),
    })),
  };
}

function hydrateSimulation(sim, snapshot) {
  sim.clockS = snapshot.clockS;
  sim.suddenDeathTimerS = snapshot.suddenDeathTimerS;
  sim.isOver = snapshot.isOver;
  sim.winnerSide = snapshot.winnerSide;
  snapshot.sides.forEach((data, side) => {
    const state = sim.sides[side];
    state.coreHp = data.coreHp;
    state.scrap = data.scrap;
    state.biomass = data.biomass;
    state.incomeTimerS = data.incomeTimerS;
    state.ecoRegenPerS = data.ecoRegenPerS;
    state.cardCooldowns = { ...data.cardCooldowns };
    state.sentHistory = { ...data.sentHistory };
    const previousTowers = new Map(state.towers.map((tower) => [tower.id, tower]));
    state.towers = data.towers.map((entry) => {
      const tower = previousTowers.get(entry.id) ?? new Tower(entry.typeKey, entry.col, entry.row, side);
      tower.id = entry.id;
      tower.level = entry.level;
      tower.targetMode = entry.targetMode;
      tower.cooldownS = entry.cooldownS;
      tower.flashS = entry.flashS;
      tower.aimAngle = entry.aimAngle;
      tower.disabledS = entry.disabledS;
      tower.integrityS = entry.integrityS;
      tower.investedScrap = entry.investedScrap;
      return tower;
    });
    const previousCreeps = new Map(state.creeps.map((creep) => [creep.id, creep]));
    state.creeps = data.creeps.map((entry) => {
      const creep = previousCreeps.get(entry.id) ?? new Creep(entry.typeKey, side, { x: entry.x, y: entry.y }, entry.currentTile, 1);
      creep.id = entry.id;
      creep.x = entry.x;
      creep.y = entry.y;
      creep.angle = entry.angle;
      creep.hp = entry.hp;
      creep.maxHp = entry.maxHp;
      creep.currentTile = { ...entry.currentTile };
      creep.nextTile = entry.nextTile === null ? null : { ...entry.nextTile };
      creep.isInDuct = entry.isInDuct;
      creep.hasEnteredStation = entry.hasEnteredStation;
      creep.slowPct = entry.slowPct;
      creep.slowRemainingS = entry.slowRemainingS;
      creep.burnPerS = entry.burnPerS;
      creep.burnRemainingS = entry.burnRemainingS;
      creep.burnTickS = entry.burnTickS;
      creep.isAlive = true;
      creep.hasReachedCore = false;
      return creep;
    });
    const creepById = new Map(state.creeps.map((creep) => [creep.id, creep]));
    state.projectiles = data.projectiles.map((entry) => {
      const projectile = Object.create(Projectile.prototype);
      Object.assign(projectile, entry, { side, isSpent: false, target: entry.targetId === null ? null : (creepById.get(entry.targetId) ?? null) });
      delete projectile.targetId;
      return projectile;
    });
    state.incomingPods = data.incomingPods.map((entry) => {
      const card = SEND_CARDS.find((candidate) => candidate.key === entry.cardKey);
      const pod = new Pod(card, side, entry.breachIndex, entry.x, entry.y, entry.launchedBySide);
      pod.id = entry.id;
      pod.remainingS = entry.remainingS;
      return pod;
    });
    state.spawnQueue = data.spawnQueue.map((entry) => ({ typeKey: entry.typeKey, breach: sim.map.breachesBySide[side].find((breach) => breach.col === entry.breach.col && breach.row === entry.breach.row), delayS: entry.delayS }));
    state.sealedKeys = new Set(data.sealedKeys);
    state.field = buildFlowField(sim.map, sim.map.coresBySide[side], state.sealedKeys);
  });
}

// ===========================================================================
// COMMANDER AI (command generator; sits outside the simulation like a player)
// ===========================================================================

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted(random, entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) return null;
  let roll = random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.value;
  }
  return entries[entries.length - 1].value;
}

function buildAiProfile(commander, difficulty) {
  const personality = commander.personality;
  return {
    sendIntervalS: personality.sendIntervalS * difficulty.tempoPct,
    sendBurst: personality.sendBurst,
    buildIntervalS: personality.buildIntervalS * difficulty.tempoPct,
    upgradeReserve: personality.upgradeReserve,
    bulkheadChancePct: personality.bulkheadChancePct,
    counterStrength: personality.counterStrength,
    breachStrategy: personality.breachStrategy,
    pressureCoreFraction: personality.pressureCoreFraction,
    buildWeights: personality.buildWeights,
    sendWeights: personality.sendWeights,
    seed: difficulty.seed + commander.key.length,
  };
}

class CommanderAi {
  constructor(side, profile, sim) {
    this.side = side;
    this.profile = profile;
    this.random = createSeededRandom(profile.seed);
    this.thinkTimerS = 0;
    this.sendTimerS = 0;
    this.buildTimerS = 0;
    this.focusBreachIndex = null;
    this.focusAgeS = 0;
    this.rankedDeckTiles = this.rankDeckTiles(sim);
  }

  rankDeckTiles(sim) {
    const corridorTiles = [];
    const deckTiles = [];
    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let col = 0; col < GRID_COLUMNS; col += 1) {
        if (sideOfColumn(col) !== this.side) continue;
        const tile = sim.map.tileAt(col, row);
        if (WALKABLE_TILES.has(tile)) corridorTiles.push({ col, row });
        if (tile === TILE_DECK) deckTiles.push({ col, row });
      }
    }
    const rangePx = AI_RULES.coverageRangeTiles * TILE_SIZE_PX;
    return deckTiles
      .map((tile) => {
        const x = tileCenterX(tile.col);
        const y = tileCenterY(tile.row);
        const coverage = corridorTiles.filter((corridor) => distanceBetween(x, y, tileCenterX(corridor.col), tileCenterY(corridor.row)) <= rangePx
          && sim.hasLineOfSight(x, y, tileCenterX(corridor.col), tileCenterY(corridor.row))).length;
        return { ...tile, coverage };
      })
      .sort((left, right) => right.coverage - left.coverage);
  }

  think(deltaS, sim) {
    this.thinkTimerS += deltaS;
    this.sendTimerS += deltaS;
    this.buildTimerS += deltaS;
    this.focusAgeS += deltaS;
    if (this.thinkTimerS < AI_RULES.thinkIntervalS) return [];
    this.thinkTimerS -= AI_RULES.thinkIntervalS;
    const commands = [];
    commands.push(...this.planSends(sim));
    const buildCommand = this.planBuild(sim);
    if (buildCommand !== null) commands.push(buildCommand);
    return commands;
  }

  effectiveSendIntervalS(sim) {
    const opponent = sim.sides[sim.opponentOf(this.side)];
    const isPressing = opponent.coreHp <= MATCH_RULES.coreHp * this.profile.pressureCoreFraction;
    return isPressing ? this.profile.sendIntervalS / 2 : this.profile.sendIntervalS;
  }

  planSends(sim) {
    if (this.sendTimerS < this.effectiveSendIntervalS(sim)) return [];
    const state = sim.sides[this.side];
    const opponent = sim.sides[sim.opponentOf(this.side)];
    const commands = [];
    let biomassLeft = state.biomass;
    const usedKeys = new Set();
    for (let burst = 0; burst < this.profile.sendBurst; burst += 1) {
      const card = this.chooseCard(state, opponent, biomassLeft, usedKeys);
      if (card === null) break;
      biomassLeft -= card.biomassCost;
      usedKeys.add(card.key);
      commands.push({ side: this.side, type: COMMAND_SEND, cardKey: card.key, target: this.chooseTarget(sim, opponent, card) });
    }
    if (commands.length > 0) this.sendTimerS = 0;
    return commands;
  }

  chooseCard(state, opponent, biomassLeft, usedKeys) {
    const affordable = SEND_CARDS.filter((card) => biomassLeft >= card.biomassCost && (state.cardCooldowns[card.key] ?? 0) <= 0 && !usedKeys.has(card.key));
    if (affordable.length === 0) return null;
    const kineticShare = this.damageShare(opponent.towers, DAMAGE_KINETIC);
    const counter = this.profile.counterStrength;
    const bulkheadCount = opponent.towers.filter((tower) => tower.type.isBulkhead).length;
    const weaponCount = opponent.towers.length - bulkheadCount;
    const weights = affordable.map((card) => {
      let weight = this.profile.sendWeights[card.key] ?? 1;
      if (kineticShare > AI_RULES.counterThresholdPct && (card.key === 'carapace' || card.key === 'reclaimer')) weight *= counter;
      if (kineticShare < 1 - AI_RULES.counterThresholdPct && card.key === 'wispforms') weight *= counter;
      if (card.kind === CARD_KIND_BREACHER) weight *= bulkheadCount === 0 ? 0 : bulkheadCount;
      if (card.kind === CARD_KIND_EMP) weight *= weaponCount >= AI_RULES.empWorthTowers ? 2 : 0.2;
      return { value: card, weight };
    });
    return pickWeighted(this.random, weights);
  }

  damageShare(towers, damageType) {
    const weapons = towers.filter((tower) => !tower.type.isBulkhead);
    if (weapons.length === 0) return 0.5;
    const total = weapons.reduce((sum, tower) => sum + tower.stats.damage * tower.stats.attacksPerS, 0);
    const matching = weapons.filter((tower) => tower.type.damageType === damageType).reduce((sum, tower) => sum + tower.stats.damage * tower.stats.attacksPerS, 0);
    return total === 0 ? 0.5 : matching / total;
  }

  chooseTarget(sim, opponent, card) {
    if (card.kind === CARD_KIND_CREEPS) return { kind: SEND_TARGET_BREACH, breachIndex: this.chooseBreach(sim, opponent) };
    if (card.kind === CARD_KIND_BREACHER) {
      const bulkheads = opponent.towers.filter((tower) => tower.type.isBulkhead);
      const pick = bulkheads[Math.floor(this.random() * bulkheads.length)];
      return { kind: SEND_TARGET_POINT, col: pick.col, row: pick.row };
    }
    const weapons = opponent.towers.filter((tower) => !tower.type.isBulkhead);
    const densest = weapons
      .map((tower) => ({ tower, neighbors: weapons.filter((other) => distanceBetween(tower.x, tower.y, other.x, other.y) <= MATCH_RULES.empRadiusPx).length }))
      .sort((left, right) => right.neighbors - left.neighbors)[0];
    return { kind: SEND_TARGET_POINT, col: densest.tower.col, row: densest.tower.row };
  }

  openBreachIndices(sim, opponent) {
    return sim.map.breachesBySide[opponent.side].map((breach, index) => index).filter((index) => sim.isBreachOpen(opponent.side, index));
  }

  chooseBreach(sim, opponent) {
    const open = this.openBreachIndices(sim, opponent);
    if (this.profile.breachStrategy === BREACH_STRATEGY_RANDOM) return open[Math.floor(this.random() * open.length)];
    if (this.profile.breachStrategy === BREACH_STRATEGY_FOCUS) {
      if (this.focusBreachIndex === null || this.focusAgeS >= FOCUS_REEVALUATE_S || !open.includes(this.focusBreachIndex)) {
        this.focusBreachIndex = this.weakestBreach(sim, opponent);
        this.focusAgeS = 0;
      }
      return this.focusBreachIndex;
    }
    return this.weakestBreach(sim, opponent);
  }

  weakestBreach(sim, opponent) {
    const breaches = sim.map.breachesBySide[opponent.side];
    const guardRangePx = TILE_SIZE_PX * 4;
    const scored = breaches.map((breach, index) => ({
      index,
      guards: opponent.towers.filter((tower) => !tower.type.isBulkhead && distanceBetween(tower.x, tower.y, tileCenterX(breach.col), tileCenterY(breach.row)) <= guardRangePx).length,
    })).filter((entry) => sim.isBreachOpen(opponent.side, entry.index));
    const fewest = Math.min(...scored.map((entry) => entry.guards));
    const candidates = scored.filter((entry) => entry.guards === fewest);
    return candidates[Math.floor(this.random() * candidates.length)].index;
  }

  planBuild(sim) {
    const state = sim.sides[this.side];
    if (this.buildTimerS < this.profile.buildIntervalS) return null;
    const powerFraction = sim.powerUsed(state) / MATCH_RULES.reactorPowerCap;
    const isPowerTight = powerFraction >= AI_RULES.upgradeFocusPowerFraction;
    const upgradeCommand = this.planUpgrade(sim, state, isPowerTight);
    if (upgradeCommand !== null) {
      this.buildTimerS = 0;
      return upgradeCommand;
    }
    const hasUpgradeLeft = state.towers.some((tower) => sim.canUpgradeTower(state, tower));
    if (isPowerTight && hasUpgradeLeft) {
      const bulkheadCommand = this.planBulkhead(sim, state);
      if (bulkheadCommand !== null) this.buildTimerS = 0;
      return bulkheadCommand;
    }
    if (state.towers.length >= AI_RULES.maxTowers) return null;
    const bulkheadCommand = this.planBulkhead(sim, state);
    if (bulkheadCommand !== null) {
      this.buildTimerS = 0;
      return bulkheadCommand;
    }
    const typeKey = this.chooseTowerType(sim, state);
    if (typeKey === null) return null;
    const tile = this.rankedDeckTiles.find((candidate) => sim.canBuildAt(this.side, candidate.col, candidate.row, typeKey));
    if (!tile) return null;
    this.buildTimerS = 0;
    return { side: this.side, type: COMMAND_BUILD, col: tile.col, row: tile.row, typeKey };
  }

  planUpgrade(sim, state, isPowerTight) {
    if (!isPowerTight && state.scrap < this.profile.upgradeReserve) return null;
    const candidate = state.towers.filter((tower) => sim.canUpgradeTower(state, tower) && state.scrap >= tower.upgradeCost)
      .sort((left, right) => left.upgradeCost - right.upgradeCost)[0];
    if (!candidate) return null;
    return { side: this.side, type: COMMAND_UPGRADE, col: candidate.col, row: candidate.row };
  }

  planBulkhead(sim, state) {
    if (state.scrap < TOWER_TYPES.bulkhead.levels[0].cost) return null;
    const sealable = [];
    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let col = 0; col < GRID_COLUMNS; col += 1) {
        if (sideOfColumn(col) === this.side && sim.canBuildAt(this.side, col, row, 'bulkhead')) sealable.push({ col, row, isVent: DUCT_TILES.has(sim.map.tileAt(col, row)) });
      }
    }
    const vents = sealable.filter((tile) => tile.isVent);
    const hasSealedVent = state.towers.some((tower) => tower.type.isBulkhead && DUCT_TILES.has(sim.map.tileAt(tower.col, tower.row)));
    if (vents.length > 0 && !hasSealedVent && state.towers.length >= AI_RULES.sealVentAfterTowers) {
      const pick = vents[Math.floor(this.random() * vents.length)];
      return { side: this.side, type: COMMAND_BUILD, col: pick.col, row: pick.row, typeKey: 'bulkhead' };
    }
    if (state.towers.length < AI_RULES.bulkheadAfterTowers) return null;
    if (this.random() > this.profile.bulkheadChancePct) return null;
    const corridors = sealable.filter((tile) => !tile.isVent);
    if (corridors.length === 0) return null;
    const pick = corridors[Math.floor(this.random() * corridors.length)];
    return { side: this.side, type: COMMAND_BUILD, col: pick.col, row: pick.row, typeKey: 'bulkhead' };
  }

  chooseTowerType(sim, state) {
    const opponent = sim.sides[sim.opponentOf(this.side)];
    const platedSends = (opponent.sentHistory.carapace ?? 0) + (opponent.sentHistory.reclaimer ?? 0);
    const phasedSends = opponent.sentHistory.wispforms ?? 0;
    const affordable = WEAPON_TYPE_ORDER.filter((typeKey) => state.scrap >= TOWER_TYPES[typeKey].levels[0].cost);
    if (affordable.length === 0) return null;
    const counter = this.profile.counterStrength;
    const weights = affordable.map((typeKey) => {
      let weight = this.profile.buildWeights[typeKey] ?? 1;
      if (platedSends > phasedSends && typeKey === 'arc') weight *= counter;
      if (phasedSends > platedSends && (typeKey === 'sentry' || typeKey === 'mortar')) weight *= counter;
      return { value: typeKey, weight };
    });
    return pickWeighted(this.random, weights);
  }
}


export { GRID_COLUMNS, GRID_ROWS, HALF_COLUMNS, TILE_SIZE_PX, HALF_TILE_PX, CANVAS_WIDTH_PX, CANVAS_HEIGHT_PX, TILE_DECK, TILE_CORRIDOR, TILE_WALL, TILE_MACHINE, TILE_BREACH, TILE_LATE_BREACH, TILE_CORE, DUCT_TILES, DECOR_GARDEN, DECOR_CARGO, DECOR_CLINIC, DECOR_STARS, DECOR_FURNACE, DECOR_FROST, DECKS, DECK_ORDER, SIGHT_BLOCKING_TILES, WALKABLE_TILES, BREACH_TILES, SEALABLE_TILES, DUCT_EDGE_COST, DUCT_CRAWL_SPEED_PX_PER_S, SEND_TARGET_BREACH, SEND_TARGET_POINT, RAYCAST_MAX_STEPS, SIDE_PORT, SIDE_STARBOARD, SIDE_NAMES, DAMAGE_KINETIC, DAMAGE_ENERGY, MATCH_RULES, CREEP_TYPES, CARD_KIND_CREEPS, CARD_KIND_EMP, CARD_KIND_BREACHER, SEND_CARDS, PROJECTILE_ROUND, PROJECTILE_ARC, PROJECTILE_SHELL, PROJECTILE_SHARD, PROJECTILE_FLAME, TOWER_TYPES, WEAPON_TYPE_ORDER, TOWER_MAX_LEVEL, TARGET_FIRST, TARGET_STRONGEST, TARGET_LAST, TARGET_MODE_ORDER, COMMAND_BUILD, COMMAND_UPGRADE, COMMAND_SELL, COMMAND_TARGET, COMMAND_SEND, EVENT_HIT, EVENT_DEATH, EVENT_CORE_HIT, EVENT_POD_LANDED, EVENT_TOWER_FIRED, EVENT_BULKHEAD_FAILED, EVENT_BULKHEAD_CUT, EVENT_EMP, AI_DIFFICULTIES, AI_RULES, BREACH_STRATEGY_WEAKEST, BREACH_STRATEGY_RANDOM, BREACH_STRATEGY_FOCUS, COMMANDERS, CAMPAIGN_STORAGE_KEY, FOCUS_REEVALUATE_S, BANNER_TTL_S, PHASE_MENU, PHASE_PLAYING, PHASE_PAUSED, PHASE_ENDED, MENU_KIND_BUILD, MENU_KIND_TOWER, MENU_ACTION_BUILD, MENU_ACTION_UPGRADE, MENU_ACTION_SELL, MENU_ACTION_TARGET, MENU_LAYOUT, BUILD_MENU_ANGLES, PALETTE, DRAW_SIZES, isInsideGrid, tileCenterX, tileCenterY, distanceBetween, tileKey, sideOfColumn, NEIGHBOR_OFFSETS, StationMap, buildFlowField, nextEntityId, takeEntityId, Creep, Tower, Projectile, Pod, createSideState, Simulation, serializeSimulation, hydrateSimulation, createSeededRandom, pickWeighted, buildAiProfile, CommanderAi };

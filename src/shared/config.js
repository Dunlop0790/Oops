

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


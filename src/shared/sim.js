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

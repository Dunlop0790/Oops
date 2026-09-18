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


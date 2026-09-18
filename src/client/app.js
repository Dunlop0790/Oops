// ===========================================================================
// CLIENT: menus, HUD, input, main loop
// ===========================================================================

function elementById(id) {
  const element = document.getElementById(id);
  if (element === null) throw new Error(`Missing element #${id}`);
  return element;
}

function formatClock(seconds) {
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const remainder = whole % 60;
  return `${minutes}:${remainder < 10 ? '0' : ''}${remainder}`;
}

function loadCampaign() {
  try {
    const raw = window.localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    if (raw === null) return { beaten: [] };
    const parsed = JSON.parse(raw);
    return { beaten: Array.isArray(parsed.beaten) ? parsed.beaten.filter((key) => COMMANDERS.some((commander) => commander.key === key)) : [] };
  } catch (error) {
    return { beaten: [] };
  }
}

function saveCampaign(campaign) {
  try {
    window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(campaign));
  } catch (error) {
    // Storage can be unavailable; the ladder simply resets next visit.
  }
}

function commanderByKey(key) {
  const commander = COMMANDERS.find((candidate) => candidate.key === key);
  if (!commander) throw new Error(`Unknown commander ${key}`);
  return commander;
}

const MENU_TABS = Object.freeze(['campaign', 'skirmish', 'online', 'briefing']);
const MODE_OFFLINE = 'offline';
const MODE_ONLINE = 'online';
const ONLINE_URL_STORAGE_KEY = 'deadlight.serverUrl';
const ONLINE_NAME_STORAGE_KEY = 'deadlight.callsign';

class RadialMenus {
  constructor(sim, side) {
    this.sim = sim;
    this.side = side;
    this.menu = null;
    this.selectedTower = null;
  }

  openBuild(col, row) {
    this.selectedTower = null;
    this.menu = { kind: MENU_KIND_BUILD, col, row };
  }

  openTower(tower) {
    this.selectedTower = tower;
    this.menu = { kind: MENU_KIND_TOWER, col: tower.col, row: tower.row };
  }

  close() {
    this.menu = null;
    this.selectedTower = null;
  }

  anchor() {
    const reachX = MENU_LAYOUT.pillSideOffsetPx + MENU_LAYOUT.pillHalfWidthPx + MENU_LAYOUT.edgeMarginPx;
    const reachY = MENU_LAYOUT.ringRadiusPx + MENU_LAYOUT.buildButtonHalfPx + MENU_LAYOUT.edgeMarginPx;
    return {
      x: Math.min(Math.max(tileCenterX(this.menu.col), reachX), CANVAS_WIDTH_PX - reachX),
      y: Math.min(Math.max(tileCenterY(this.menu.row), reachY), CANVAS_HEIGHT_PX - reachY),
    };
  }

  options() {
    const menu = this.menu;
    if (menu === null) return [];
    const state = this.sim.sides[this.side];
    const anchor = this.anchor();
    const pill = { halfWidthPx: MENU_LAYOUT.pillHalfWidthPx, halfHeightPx: MENU_LAYOUT.pillHalfHeightPx };
    if (menu.kind === MENU_KIND_BUILD) {
      if (this.sim.isSealableTile(menu.col, menu.row)) {
        const cost = TOWER_TYPES.bulkhead.levels[0].cost;
        return [{
          action: MENU_ACTION_BUILD, typeKey: 'bulkhead', label: `Bulkhead ${cost} scrap`,
          isEnabled: state.scrap >= cost && this.sim.canBuildAt(this.side, menu.col, menu.row, 'bulkhead'),
          x: anchor.x, y: anchor.y - MENU_LAYOUT.pillOffsetPx, ...pill,
        }];
      }
      return WEAPON_TYPE_ORDER.map((typeKey, index) => {
        const cost = TOWER_TYPES[typeKey].levels[0].cost;
        return {
          action: MENU_ACTION_BUILD, typeKey, label: `${cost}`,
          isEnabled: state.scrap >= cost && this.sim.canBuildAt(this.side, menu.col, menu.row, typeKey),
          x: anchor.x + Math.cos(BUILD_MENU_ANGLES[index]) * MENU_LAYOUT.ringRadiusPx,
          y: anchor.y + Math.sin(BUILD_MENU_ANGLES[index]) * MENU_LAYOUT.ringRadiusPx,
          halfWidthPx: MENU_LAYOUT.buildButtonHalfPx, halfHeightPx: MENU_LAYOUT.buildButtonHalfPx,
        };
      });
    }
    const tower = this.sim.towerAt(menu.col, menu.row);
    if (tower === null || tower.side !== this.side) return [];
    const sellOption = { action: MENU_ACTION_SELL, label: `Sell +${tower.sellValue} scrap`, isEnabled: true, x: anchor.x, y: anchor.y + MENU_LAYOUT.pillOffsetPx, ...pill };
    if (tower.type.isBulkhead) return [sellOption];
    return [
      { action: MENU_ACTION_UPGRADE, label: tower.canUpgrade ? `Upgrade ${tower.upgradeCost} scrap` : 'Max level', isEnabled: this.sim.canUpgradeTower(state, tower) && state.scrap >= tower.upgradeCost, x: anchor.x, y: anchor.y - MENU_LAYOUT.pillOffsetPx, ...pill },
      { action: MENU_ACTION_TARGET, label: `Target: ${tower.targetMode}`, isEnabled: true, x: anchor.x + MENU_LAYOUT.pillSideOffsetPx, y: anchor.y, ...pill },
      sellOption,
    ];
  }

  optionAt(x, y) {
    return this.options().find((option) => Math.abs(x - option.x) <= option.halfWidthPx && Math.abs(y - option.y) <= option.halfHeightPx) ?? null;
  }

  // Returns the command an option produces, or null. The caller applies it.
  commandFor(option) {
    if (option === null || !option.isEnabled) return null;
    const { col, row } = this.menu;
    if (option.action === MENU_ACTION_BUILD) return { side: this.side, type: COMMAND_BUILD, col, row, typeKey: option.typeKey };
    if (option.action === MENU_ACTION_UPGRADE) return { side: this.side, type: COMMAND_UPGRADE, col, row };
    if (option.action === MENU_ACTION_TARGET) return { side: this.side, type: COMMAND_TARGET, col, row };
    return { side: this.side, type: COMMAND_SELL, col, row };
  }

  draw(context, hoverPoint) {
    if (this.menu === null) return;
    const options = this.options();
    if (options.length === 0) return;
    const highlighted = hoverPoint === null ? null : this.optionAt(hoverPoint.x, hoverPoint.y);
    if (this.menu.kind === MENU_KIND_BUILD && !this.sim.isSealableTile(this.menu.col, this.menu.row)) drawBuildMenu(context, this.menu, options, highlighted);
    else {
      drawCursorFrame(context, this.menu.col, this.menu.row, PALETTE.playerColor);
      drawPillMenu(context, options, highlighted);
    }
    if (highlighted !== null) this.drawOptionTooltip(context, highlighted);
  }

  drawOptionTooltip(context, option) {
    const anchor = this.anchor();
    const tooltipX = anchor.x + MENU_LAYOUT.ringRadiusPx + MENU_LAYOUT.buildButtonHalfPx + 12;
    const tooltipY = anchor.y - MENU_LAYOUT.ringRadiusPx;
    if (option.action === MENU_ACTION_BUILD) {
      const type = TOWER_TYPES[option.typeKey];
      drawTooltip(context, tooltipX, tooltipY, `${type.name}, ${type.levels[0].cost} scrap`, type.role, describeTowerLevel(type, 1));
      return;
    }
    if (option.action !== MENU_ACTION_UPGRADE) return;
    const tower = this.sim.towerAt(this.menu.col, this.menu.row);
    if (tower === null || !tower.canUpgrade) return;
    const nextLevel = tower.level + 1;
    drawTooltip(context, tooltipX, tooltipY, `${tower.type.name} level ${nextLevel}`, `Upgrade cost ${tower.upgradeCost} scrap, +${tower.upgradePowerIncrease} power`, describeTowerLevel(tower.type, nextLevel));
  }
}

function describeCard(card) {
  if (card.kind !== CARD_KIND_CREEPS) return card.role;
  const type = CREEP_TYPES[card.creepTypeKey];
  const resist = [];
  if (type.kineticResistPct > 0) resist.push(`${Math.round(type.kineticResistPct * 100)}% kinetic resist`);
  if (type.energyResistPct > 0) resist.push(`${Math.round(type.energyResistPct * 100)}% energy resist`);
  if (type.isSlowImmune) resist.push('immune to cryo');
  if (type.regenHpPerS > 0) resist.push('regenerates');
  return `${card.role} ${card.count} x ${type.name}: ${type.hp} hp, speed ${type.speedPxPerS}, ${type.coreDamage} core damage${resist.length > 0 ? `, ${resist.join(', ')}` : ''}.`;
}

class Interface {
  constructor() {
    this.coreYou = elementById('hud-core-you');
    this.coreRival = elementById('hud-core-rival');
    this.scrap = elementById('hud-scrap');
    this.biomass = elementById('hud-biomass');
    this.power = elementById('hud-power');
    this.codex = elementById('codex');
    this.clock = elementById('hud-clock');
    this.fastForwardButton = elementById('fast-forward-button');
    this.pauseButton = elementById('pause-button');
    this.menuOverlay = elementById('menu-overlay');
    this.pauseOverlay = elementById('pause-overlay');
    this.endOverlay = elementById('end-overlay');
    this.endTitle = elementById('end-title');
    this.endSummary = elementById('end-summary');
    this.nextCommanderButton = elementById('next-commander-button');
    this.rivalLabel = elementById('hud-rival-label');
    this.sendCards = elementById('send-cards');
    this.sendHint = elementById('send-hint');
    this.commanderList = elementById('commander-list');
    this.skirmishCommanders = elementById('skirmish-commanders');
    this.skirmishDecks = elementById('skirmish-decks');
    this.difficultyButtons = [...document.querySelectorAll('[data-difficulty]')];
    this.tabButtons = [...document.querySelectorAll('.tab-button')];
    this.onlineName = elementById('online-name');
    this.onlineUrl = elementById('online-url');
    this.onlineCode = elementById('online-code');
    this.onlineStatus = elementById('online-status');
    this.onlineDecks = elementById('online-decks');
    this.onlineQuickButton = elementById('online-quick-button');
    this.onlineCreateButton = elementById('online-create-button');
    this.onlineJoinButton = elementById('online-join-button');
    this.cardButtons = new Map();
    this.buildSendCards();
    this.buildCodex();
    this.tabButtons.forEach((button) => button.addEventListener('click', () => this.showTab(button.dataset.tab)));
  }

  buildCodex() {
    const entries = [];
    WEAPON_TYPE_ORDER.concat(['bulkhead']).forEach((typeKey) => {
      const type = TOWER_TYPES[typeKey];
      entries.push(`<li><strong>${type.name}</strong> (${type.levels[0].cost} scrap): ${type.role} ${describeTowerLevel(type, 1).join('. ')}.</li>`);
    });
    SEND_CARDS.forEach((card) => {
      entries.push(`<li><strong>${card.name}</strong> (${card.biomassCost} bio, ${card.cooldownS} s): ${describeCard(card)}</li>`);
    });
    this.codex.innerHTML = entries.join('');
  }

  showTab(tabKey) {
    if (!MENU_TABS.includes(tabKey)) throw new Error(`Unknown tab ${tabKey}`);
    this.tabButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.tab === tabKey));
    MENU_TABS.forEach((key) => elementById(`tab-${key}`).classList.toggle('is-hidden', key !== tabKey));
  }

  renderCampaign(campaign, onFight) {
    this.commanderList.replaceChildren(...COMMANDERS.map((commander, index) => {
      const isBeaten = campaign.beaten.includes(commander.key);
      const isUnlocked = index <= campaign.beaten.length;
      const card = document.createElement('div');
      card.className = `commander-card${isBeaten ? ' is-beaten' : ''}${isUnlocked ? '' : ' is-locked'}`;
      const rank = document.createElement('div');
      rank.className = 'commander-rank';
      rank.textContent = String(index + 1);
      const text = document.createElement('div');
      text.className = 'commander-text';
      const name = document.createElement('div');
      name.className = 'commander-name';
      name.innerHTML = `${commander.name} <span>${commander.title}</span>`;
      const meta = document.createElement('div');
      meta.className = 'commander-meta';
      meta.textContent = isUnlocked ? `${DECKS[commander.deckKey].name}. ${commander.blurb}${isBeaten ? ' Breached.' : ''}` : 'Locked. Breach the previous commander first.';
      text.append(name, meta);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'game-button is-small';
      button.textContent = isBeaten ? 'Replay' : 'Fight';
      button.disabled = !isUnlocked;
      button.addEventListener('click', () => onFight(commander.key));
      card.append(rank, text, button);
      return card;
    }));
  }

  renderOnlineDecks(selection) {
    this.onlineDecks.replaceChildren(...DECK_ORDER.map((deckKey) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `game-button is-secondary is-small${selection.deckKey === deckKey ? ' is-active' : ''}`;
      button.textContent = DECKS[deckKey].name;
      button.style.borderLeft = `6px solid ${DECKS[deckKey].theme.edgeLight}`;
      button.addEventListener('click', () => {
        selection.deckKey = deckKey;
        this.renderOnlineDecks(selection);
      });
      return button;
    }));
  }

  setOnlineStatus(text) {
    this.onlineStatus.textContent = text;
  }

  renderSkirmish(selection) {
    this.skirmishCommanders.replaceChildren(...COMMANDERS.map((commander) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `game-button is-secondary is-small${selection.commanderKey === commander.key ? ' is-active' : ''}`;
      button.textContent = commander.name;
      button.addEventListener('click', () => {
        selection.commanderKey = commander.key;
        this.renderSkirmish(selection);
      });
      return button;
    }));
    this.skirmishDecks.replaceChildren(...DECK_ORDER.map((deckKey) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `game-button is-secondary is-small${selection.deckKey === deckKey ? ' is-active' : ''}`;
      button.textContent = DECKS[deckKey].name;
      button.style.borderLeft = `6px solid ${DECKS[deckKey].theme.edgeLight}`;
      button.addEventListener('click', () => {
        selection.deckKey = deckKey;
        this.renderSkirmish(selection);
      });
      return button;
    }));
    this.renderDifficulty(selection.difficultyKey);
  }

  buildSendCards() {
    SEND_CARDS.forEach((card) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'send-card';
      button.dataset.cardKey = card.key;
      button.innerHTML = `<span class="send-card-name">${card.name}</span><span class="send-card-cost">${card.biomassCost} bio</span><span class="send-card-key">key ${card.hotkey.toUpperCase()}</span><span class="send-card-cooldown"></span>`;
      button.title = describeCard(card);
      this.sendCards.appendChild(button);
      this.cardButtons.set(card.key, button);
    });
  }

  showOverlay(overlay) {
    [this.menuOverlay, this.pauseOverlay, this.endOverlay].forEach((candidate) => candidate.classList.toggle('is-hidden', candidate !== overlay));
  }

  renderDifficulty(difficultyKey) {
    this.difficultyButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.difficulty === difficultyKey));
  }

  renderHud(client) {
    const sim = client.sim;
    if (sim === null) return;
    const you = sim.sides[client.side];
    const rival = sim.sides[sim.opponentOf(client.side)];
    this.coreYou.textContent = String(you.coreHp);
    this.coreRival.textContent = String(rival.coreHp);
    this.rivalLabel.textContent = `${client.commander.name} core`;
    this.pauseButton.disabled = client.mode === MODE_ONLINE;
    this.scrap.textContent = String(Math.floor(you.scrap));
    this.biomass.textContent = `${Math.floor(you.biomass)} / ${Math.floor(sim.biomassCap)} (+${sim.biomassRegenFor(you).toFixed(1)}/s)`;
    this.power.textContent = `${sim.powerUsed(you)} / ${MATCH_RULES.reactorPowerCap}`;
    this.clock.textContent = sim.isSuddenDeath ? `${formatClock(sim.clockS)} bleed` : formatClock(sim.clockS);
    this.fastForwardButton.textContent = client.isFastForward ? `Speed ${MATCH_RULES.fastForwardTimeScale}x` : 'Speed 1x';
    this.fastForwardButton.classList.toggle('is-active', client.isFastForward);
    this.pauseButton.textContent = client.phase === PHASE_PAUSED ? 'Resume' : 'Pause';
    SEND_CARDS.forEach((card) => {
      const button = this.cardButtons.get(card.key);
      const cooldown = you.cardCooldowns[card.key] ?? 0;
      button.classList.toggle('is-active', client.selectedCardKey === card.key);
      button.classList.toggle('is-unaffordable', you.biomass < card.biomassCost || cooldown > 0);
      button.querySelector('.send-card-cooldown').style.width = `${(cooldown / card.cooldownS) * 100}%`;
    });
    this.renderHint(client, you, sim);
  }

  renderHint(client, you, sim) {
    if (client.hoveredCreep !== null) {
      const type = client.hoveredCreep.type;
      this.sendHint.textContent = `${type.name}: ${Math.ceil(client.hoveredCreep.hp)} hp, ${Math.round(type.kineticResistPct * 100)}% kinetic resist, ${Math.round(type.energyResistPct * 100)}% energy resist${type.isSlowImmune ? ', immune to cryo' : ''}${type.regenHpPerS > 0 ? ', regenerates' : ''}.`;
      return;
    }
    if (client.selectedCardKey !== null) {
      const card = SEND_CARDS.find((candidate) => candidate.key === client.selectedCardKey);
      this.sendHint.textContent = card.kind === CARD_KIND_CREEPS
        ? `${card.name}: ${card.role} Click a breach marker on the rival hull to drop it.`
        : `${card.name}: ${card.role} Click anywhere on the rival deck to drop it.`;
      return;
    }
    const tower = client.menus.selectedTower;
    if (tower !== null && !tower.type.isBulkhead) {
      const stats = tower.stats;
      this.sendHint.textContent = `${tower.type.name} level ${tower.level}: ${stats.damage} ${tower.type.damageType}, ${stats.attacksPerS.toFixed(1)} shots/s, range ${stats.rangeTiles.toFixed(1)} tiles, targeting ${tower.targetMode}.`;
      return;
    }
    const bulkheads = you.towers.filter((candidate) => candidate.type.isBulkhead).length;
    this.sendHint.textContent = `Open ducts (D1, D2) are shortcuts: seal a mouth to close one. Bulkheads ${bulkheads} of ${MATCH_RULES.bulkheadCap}. Swarm HP x${sim.creepHpMultiplier.toFixed(2)}.`;
  }

  showEnd(client, hasNextCommander) {
    const sim = client.sim;
    const won = sim.winnerSide === client.side;
    const drew = sim.winnerSide === null;
    const commander = client.commander;
    this.endTitle.textContent = drew ? 'Both reactors dark' : (won ? `${commander.name} breached` : 'Reactor lost');
    const line = drew ? '' : ` ${commander.name}: "${won ? commander.loseLine : commander.winLine}"`;
    this.endSummary.textContent = `Match lasted ${formatClock(sim.clockS)}. You destroyed ${client.stats.kills} of the swarm and dropped ${client.stats.sends} pods; ${client.stats.coreHitsTaken} bodies reached your core. Rival core ended at ${sim.sides[sim.opponentOf(client.side)].coreHp}, yours at ${sim.sides[client.side].coreHp}.${line}`;
    this.nextCommanderButton.classList.toggle('is-hidden', !hasNextCommander);
    elementById('play-again-button').classList.toggle('is-hidden', client.mode === MODE_ONLINE);
    this.showOverlay(this.endOverlay);
  }
}

function spawnEffectsFromEvents(client, events) {
  const effects = client.effects;
  const random = client.effectRandom;
  events.forEach((event) => {
    if (event.type === EVENT_HIT) {
      const color = event.kind === PROJECTILE_ARC ? PALETTE.arcBolt : (event.kind === PROJECTILE_FLAME ? PALETTE.flame : PALETTE.round);
      for (let index = 0; index < DRAW_SIZES.sparksPerHit; index += 1) {
        const angle = random() * Math.PI * 2;
        effects.push({ kind: 'spark', x: event.x, y: event.y, ttlS: DRAW_SIZES.sparkTtlS, maxTtlS: DRAW_SIZES.sparkTtlS, color, velocityX: Math.cos(angle) * DRAW_SIZES.sparkSpeedPxPerS, velocityY: Math.sin(angle) * DRAW_SIZES.sparkSpeedPxPerS });
      }
      if (event.splashRadiusPx > 0) effects.push({ kind: 'burst', x: event.x, y: event.y, radiusPx: event.splashRadiusPx * 0.6, ttlS: DRAW_SIZES.hitEffectTtlS, maxTtlS: DRAW_SIZES.hitEffectTtlS, color: PALETTE.muzzleFlash });
      return;
    }
    if (event.type === EVENT_EMP) {
      effects.push({ kind: 'ring', x: event.x, y: event.y, radiusPx: event.radiusPx, ttlS: DRAW_SIZES.deathEffectTtlS, maxTtlS: DRAW_SIZES.deathEffectTtlS, color: PALETTE.empArc });
      effects.push({ kind: 'burst', x: event.x, y: event.y, radiusPx: event.radiusPx * 0.5, ttlS: DRAW_SIZES.hitEffectTtlS, maxTtlS: DRAW_SIZES.hitEffectTtlS, color: PALETTE.empArc });
      return;
    }
    if (event.type === EVENT_BULKHEAD_FAILED || event.type === EVENT_BULKHEAD_CUT) {
      effects.push({ kind: 'burst', x: event.x, y: event.y, radiusPx: TILE_SIZE_PX * 0.6, ttlS: DRAW_SIZES.deathEffectTtlS, maxTtlS: DRAW_SIZES.deathEffectTtlS, color: PALETTE.flame });
      for (let index = 0; index < DRAW_SIZES.sparksPerHit * 2; index += 1) {
        const angle = random() * Math.PI * 2;
        effects.push({ kind: 'spark', x: event.x, y: event.y, ttlS: DRAW_SIZES.sparkTtlS, maxTtlS: DRAW_SIZES.sparkTtlS, color: PALETTE.flameCore, velocityX: Math.cos(angle) * DRAW_SIZES.sparkSpeedPxPerS, velocityY: Math.sin(angle) * DRAW_SIZES.sparkSpeedPxPerS });
      }
      return;
    }
    if (event.type === EVENT_DEATH) {
      effects.push({ kind: 'puff', x: event.x, y: event.y, radiusPx: event.radiusPx, ttlS: DRAW_SIZES.deathEffectTtlS, maxTtlS: DRAW_SIZES.deathEffectTtlS, color: event.color });
      if (event.side === client.side) {
        client.stats.kills += 1;
        effects.push({ kind: 'text', x: event.x, y: event.y - event.radiusPx, text: `+${event.bounty}`, ttlS: DRAW_SIZES.floatingTextTtlS, maxTtlS: DRAW_SIZES.floatingTextTtlS, color: PALETTE.floatingScrap });
      }
      return;
    }
    if (event.type === EVENT_CORE_HIT) {
      if (event.side === client.side) client.stats.coreHitsTaken += 1;
      effects.push({ kind: 'text', x: event.x, y: event.y - TILE_SIZE_PX * 0.5, text: `-${event.damage}`, ttlS: DRAW_SIZES.floatingTextTtlS, maxTtlS: DRAW_SIZES.floatingTextTtlS, color: PALETTE.floatingDamage });
      effects.push({ kind: 'ring', x: event.x, y: event.y, radiusPx: DRAW_SIZES.coreRadiusPx * 1.5, ttlS: DRAW_SIZES.hitEffectTtlS, maxTtlS: DRAW_SIZES.hitEffectTtlS, color: PALETTE.coreDanger });
      return;
    }
    if (event.type === EVENT_POD_LANDED) {
      effects.push({ kind: 'ring', x: event.x, y: event.y, radiusPx: MATCH_RULES.podImpactRadiusPx, ttlS: DRAW_SIZES.deathEffectTtlS, maxTtlS: DRAW_SIZES.deathEffectTtlS, color: PALETTE.podFlame });
    }
  });
}

function updateEffects(effects, deltaS) {
  effects.forEach((effect) => {
    effect.ttlS -= deltaS;
    if (effect.kind === 'text') effect.y -= DRAW_SIZES.floatingTextRiseSpeedPxPerS * deltaS;
    if (effect.kind === 'spark') {
      effect.x += effect.velocityX * deltaS;
      effect.y += effect.velocityY * deltaS;
    }
  });
  return effects.filter((effect) => effect.ttlS > 0);
}

function renderFrame(context, client) {
  context.save();
  if (VIEW.isFlipped) {
    context.translate(CANVAS_WIDTH_PX, 0);
    context.scale(-1, 1);
  }
  renderWorld(context, client);
  context.restore();
}

function renderWorld(context, client) {
  context.drawImage(client.backgroundCanvas, 0, 0);
  const sim = client.sim;
  if (sim === null) return;
  const timeS = client.timeS;
  context.fillStyle = PALETTE.rivalTint;
  context.fillRect(sim.opponentOf(client.side) * HALF_COLUMNS * TILE_SIZE_PX, 0, HALF_COLUMNS * TILE_SIZE_PX, CANVAS_HEIGHT_PX);
  drawOpenDucts(context, sim, timeS);
  sim.sides.forEach((state) => drawCore(context, sim.map.coresBySide[state.side], state.coreHp, timeS));

  const hover = client.hoverTile;
  if (hover !== null && client.menus.menu === null && client.selectedCardKey === null && sideOfColumn(hover.col) === client.side) {
    const existing = sim.towerAt(hover.col, hover.row);
    if (existing !== null && !existing.type.isBulkhead) drawRangeRing(context, existing.x, existing.y, existing.rangePx);
    else if (existing === null) {
      const isSealable = sim.isSealableTile(hover.col, hover.row);
      drawTileHighlight(context, hover.col, hover.row, isSealable ? sim.canBuildAt(client.side, hover.col, hover.row, 'bulkhead') : sim.canBuildAt(client.side, hover.col, hover.row, WEAPON_TYPE_ORDER[0]));
    }
  }
  const selected = client.menus.selectedTower;
  if (selected !== null && !selected.type.isBulkhead) {
    drawRangeRing(context, selected.x, selected.y, selected.rangePx);
    drawSightLines(context, sim, selected, sim.sides[client.side].creeps);
  }

  drawSealedHatches(context, sim, timeS);
  sim.sides.forEach((state) => state.towers.forEach((tower) => drawTower(context, tower, timeS)));
  sim.sides.forEach((state) => state.creeps.forEach((creep) => drawCreep(context, creep, timeS, creep.isHidden(sim.map))));
  sim.sides.forEach((state) => state.projectiles.forEach((projectile) => drawProjectile(context, projectile)));
  client.effects.forEach((effect) => drawEffect(context, effect));
  sim.sides.forEach((state) => state.incomingPods.forEach((pod) => drawPod(context, pod, timeS)));
  const selectedCard = client.selectedCardKey === null ? null : SEND_CARDS.find((card) => card.key === client.selectedCardKey);
  if (selectedCard !== null && selectedCard.kind === CARD_KIND_CREEPS) drawBreachMarkers(context, sim, sim.opponentOf(client.side), client.hoverBreachIndex, timeS);
  if (selectedCard !== null && selectedCard.kind !== CARD_KIND_CREEPS && hover !== null && sim.isSabotageTargetable(sim.opponentOf(client.side), hover.col, hover.row)) {
    drawSabotageMarker(context, selectedCard, hover.col, hover.row, timeS);
  }
  client.menus.draw(context, client.hoverPoint);
  if (client.bannerTtlS > 0) drawBanner(context, client.commander, client.bannerTtlS);
}

function drawBanner(context, commander, ttlS) {
  const fade = Math.min(1, ttlS / 0.6);
  const centerX = CANVAS_WIDTH_PX / 2;
  const centerY = CANVAS_HEIGHT_PX * 0.18;
  context.globalAlpha = fade;
  traceChamferedRect(context, centerX, centerY, DRAW_SIZES.bannerHalfWidthPx, DRAW_SIZES.bannerHalfHeightPx, 10);
  context.fillStyle = PALETTE.bannerFill;
  context.fill();
  context.strokeStyle = PALETTE.menuEdge;
  context.lineWidth = 2;
  context.stroke();
  context.textAlign = 'center';
  context.fillStyle = PALETTE.bannerText;
  context.font = `700 ${DRAW_SIZES.bannerTitleFontPx}px 'Chakra Petch', sans-serif`;
  drawLabel(context, `${commander.name}, ${commander.title}`, centerX, centerY - 6);
  context.fillStyle = PALETTE.bannerSub;
  context.font = `600 ${DRAW_SIZES.bannerSubFontPx}px 'Rajdhani', sans-serif`;
  drawLabel(context, `"${commander.taunt}"`, centerX, centerY + 18);
  context.globalAlpha = 1;
}

// ---- input helpers -----------------------------------------------------------

function breachIndexNear(sim, targetSide, point) {
  const reach = DRAW_SIZES.breachMarkerRadiusPx * 1.8;
  const index = sim.map.breachesBySide[targetSide].findIndex((breach, candidateIndex) => sim.isBreachOpen(targetSide, candidateIndex)
    && distanceBetween(point.x, point.y, tileCenterX(breach.col), tileCenterY(breach.row)) <= reach);
  return index === -1 ? null : index;
}

function handleCanvasClick(client, point) {
  const sim = client.sim;
  const menus = client.menus;
  if (client.selectedCardKey !== null) {
    const card = SEND_CARDS.find((candidate) => candidate.key === client.selectedCardKey);
    const targetSide = sim.opponentOf(client.side);
    if (card.kind === CARD_KIND_CREEPS) {
      const breachIndex = breachIndexNear(sim, targetSide, point);
      if (breachIndex !== null) {
        client.pendingCommands.push({ side: client.side, type: COMMAND_SEND, cardKey: card.key, target: { kind: SEND_TARGET_BREACH, breachIndex } });
        client.stats.sends += 1;
        client.selectedCardKey = null;
        return;
      }
    } else {
      const col = Math.floor(point.x / TILE_SIZE_PX);
      const row = Math.floor(point.y / TILE_SIZE_PX);
      if (sim.isSabotageTargetable(targetSide, col, row)) {
        client.pendingCommands.push({ side: client.side, type: COMMAND_SEND, cardKey: card.key, target: { kind: SEND_TARGET_POINT, col, row } });
        client.stats.sends += 1;
        client.selectedCardKey = null;
        return;
      }
    }
    client.selectedCardKey = null;
  }
  const option = menus.optionAt(point.x, point.y);
  if (option !== null) {
    const command = menus.commandFor(option);
    if (command === null) return;
    client.pendingCommands.push(command);
    if (command.type === COMMAND_BUILD || command.type === COMMAND_SELL) menus.close();
    return;
  }
  const col = Math.floor(point.x / TILE_SIZE_PX);
  const row = Math.floor(point.y / TILE_SIZE_PX);
  if (!isInsideGrid(col, row) || sideOfColumn(col) !== client.side) {
    menus.close();
    return;
  }
  const existing = sim.towerAt(col, row);
  if (existing !== null) {
    menus.openTower(existing);
    return;
  }
  const tile = sim.map.tileAt(col, row);
  if (tile === TILE_DECK || (SEALABLE_TILES.has(tile) && sim.canBuildAt(client.side, col, row, 'bulkhead'))) {
    menus.openBuild(col, row);
    return;
  }
  menus.close();
}

function handleKey(client, key) {
  const menus = client.menus;
  const card = SEND_CARDS.find((candidate) => candidate.hotkey === key);
  if (card) {
    client.selectedCardKey = client.selectedCardKey === card.key ? null : card.key;
    return true;
  }
  const weaponType = WEAPON_TYPE_ORDER.find((typeKey) => TOWER_TYPES[typeKey].hotkey === key);
  if (weaponType) {
    const target = menus.menu !== null && menus.menu.kind === MENU_KIND_BUILD ? menus.menu : client.hoverTile;
    if (target === null) return false;
    client.pendingCommands.push({ side: client.side, type: COMMAND_BUILD, col: target.col, row: target.row, typeKey: weaponType });
    menus.close();
    return true;
  }
  const selected = menus.selectedTower;
  if (key === 'u' && selected !== null) {
    client.pendingCommands.push({ side: client.side, type: COMMAND_UPGRADE, col: selected.col, row: selected.row });
    return true;
  }
  if (key === 'x' && selected !== null) {
    client.pendingCommands.push({ side: client.side, type: COMMAND_SELL, col: selected.col, row: selected.row });
    menus.close();
    return true;
  }
  if (key === 'Escape') {
    menus.close();
    client.selectedCardKey = null;
    return true;
  }
  if (key === 'f') {
    client.isFastForward = !client.isFastForward;
    return true;
  }
  return false;
}

// ---- bootstrap -------------------------------------------------------------------

function main() {
  const ui = new Interface();
  const canvas = elementById('game-canvas');
  const context = canvas.getContext('2d');
  const maps = new Map();
  const backgrounds = new Map();
  DECK_ORDER.forEach((deckKey) => {
    const map = new StationMap(DECKS[deckKey].layout);
    maps.set(deckKey, map);
    backgrounds.set(deckKey, renderBackground(map, DECKS[deckKey].theme));
  });
  const campaign = loadCampaign();
  const skirmish = { commanderKey: COMMANDERS[0].key, deckKey: DECK_ORDER[0], difficultyKey: 'normal' };
  const online = { deckKey: DECK_ORDER[0], net: null, pendingSnapshot: null, opponentName: '' };
  const client = {
    side: SIDE_PORT,
    mode: MODE_OFFLINE,
    phase: PHASE_MENU,
    sim: null,
    ai: null,
    menus: null,
    commander: COMMANDERS[0],
    deckKey: DECK_ORDER[0],
    isCampaignMatch: false,
    bannerTtlS: 0,
    selectedCardKey: null,
    hoverTile: null,
    hoverPoint: null,
    hoverBreachIndex: null,
    hoveredCreep: null,
    effects: [],
    effectRandom: createSeededRandom(99),
    pendingCommands: [],
    isFastForward: false,
    timeS: 0,
    accumulatorS: 0,
    stats: { kills: 0, sends: 0, coreHitsTaken: 0 },
    backgroundCanvas: backgrounds.get(DECK_ORDER[0]),
  };
  let lastFrameMs = performance.now();

  function canvasPointFromEvent(event) {
    const bounds = canvas.getBoundingClientRect();
    const screenX = (event.clientX - bounds.left) * (CANVAS_WIDTH_PX / bounds.width);
    return { x: VIEW.isFlipped ? CANVAS_WIDTH_PX - screenX : screenX, y: (event.clientY - bounds.top) * (CANVAS_HEIGHT_PX / bounds.height) };
  }

  function tileFromPoint(point) {
    const col = Math.floor(point.x / TILE_SIZE_PX);
    const row = Math.floor(point.y / TILE_SIZE_PX);
    return isInsideGrid(col, row) ? { col, row } : null;
  }

  function resetMatchState() {
    client.menus = new RadialMenus(client.sim, client.side);
    client.bannerTtlS = BANNER_TTL_S;
    client.phase = PHASE_PLAYING;
    client.selectedCardKey = null;
    client.effects = [];
    client.pendingCommands = [];
    client.isFastForward = false;
    client.timeS = 0;
    client.accumulatorS = 0;
    client.stats = { kills: 0, sends: 0, coreHitsTaken: 0 };
    ui.showOverlay(null);
    canvas.focus();
  }

  function startMatch(commanderKey, deckKey, difficultyKey, isCampaignMatch) {
    const commander = commanderByKey(commanderKey);
    const difficulty = AI_DIFFICULTIES[difficultyKey];
    const map = maps.get(deckKey);
    client.mode = MODE_OFFLINE;
    client.side = SIDE_PORT;
    VIEW.isFlipped = false;
    client.commander = commander;
    client.deckKey = deckKey;
    client.isCampaignMatch = isCampaignMatch;
    client.backgroundCanvas = backgrounds.get(deckKey);
    client.sim = new Simulation(map, [
      { scrapIncomePct: 1, biomassRegenPct: 1 },
      { scrapIncomePct: commander.economy.scrapIncomePct * difficulty.economyPct, biomassRegenPct: commander.economy.biomassRegenPct * difficulty.economyPct },
    ]);
    client.ai = new CommanderAi(SIDE_STARBOARD, buildAiProfile(commander, difficulty), client.sim);
    resetMatchState();
  }

  function startOnlineMatch(side, deckKey, opponentName) {
    client.mode = MODE_ONLINE;
    client.side = side;
    VIEW.isFlipped = side === SIDE_STARBOARD;
    client.commander = {
      key: 'online', name: opponentName, title: 'Rival crew', taunt: 'Salvage rights are decided at the reactor.',
      winLine: 'Better luck on the next derelict.', loseLine: 'Good hold. The ship is yours.', deckKey,
    };
    client.deckKey = deckKey;
    client.isCampaignMatch = false;
    client.backgroundCanvas = backgrounds.get(deckKey);
    client.sim = new Simulation(maps.get(deckKey), [{ scrapIncomePct: 1, biomassRegenPct: 1 }, { scrapIncomePct: 1, biomassRegenPct: 1 }]);
    client.ai = null;
    online.pendingSnapshot = null;
    resetMatchState();
    ui.showTab('campaign');
  }

  function connectOnline(afterOpen) {
    const url = ui.onlineUrl.value.trim();
    const name = ui.onlineName.value.trim().slice(0, 16) || 'Salvager';
    if (url.length === 0) {
      ui.setOnlineStatus('Enter the server address first.');
      return;
    }
    try {
      window.localStorage.setItem(ONLINE_URL_STORAGE_KEY, url);
      window.localStorage.setItem(ONLINE_NAME_STORAGE_KEY, name);
    } catch (error) {
      // Preferences simply will not persist.
    }
    if (online.net !== null) online.net.close();
    ui.setOnlineStatus(`Connecting to ${url}`);
    online.net = new NetClient(url, {
      onOpen: () => {
        online.net.send({ type: 'hello', name });
        afterOpen();
      },
      onClose: () => {
        ui.setOnlineStatus('Disconnected from server.');
        if (client.mode === MODE_ONLINE && client.phase === PHASE_PLAYING) {
          client.sim.isOver = true;
          client.sim.winnerSide = null;
          finishMatch();
        }
        online.net = null;
      },
      onError: () => ui.setOnlineStatus('Could not reach the server. Check the address (wss:// for hosted servers).'),
      onMessage: handleServerMessage,
    });
  }

  function handleServerMessage(message) {
    if (message.type === 'queued') ui.setOnlineStatus('In the queue. Waiting for another crew.');
    else if (message.type === 'room') ui.setOnlineStatus(`Room ${message.code}: ${message.players.join(' vs ')}. ${message.players.length < 2 ? 'Share the code.' : 'Starting.'}`);
    else if (message.type === 'start') {
      ui.setOnlineStatus(`Match started against ${message.opponentName}.`);
      online.opponentName = message.opponentName;
      startOnlineMatch(message.side, message.deckKey, message.opponentName);
    } else if (message.type === 'snapshot') online.pendingSnapshot = message.snapshot;
    else if (message.type === 'over') {
      if (client.mode !== MODE_ONLINE || client.sim === null) return;
      client.sim.isOver = true;
      client.sim.winnerSide = message.winnerSide;
      ui.setOnlineStatus(message.reason);
      finishMatch();
    } else if (message.type === 'error') ui.setOnlineStatus(message.message);
  }

  function startCampaignMatch(commanderKey) {
    const commander = commanderByKey(commanderKey);
    startMatch(commanderKey, commander.deckKey, 'normal', true);
  }

  function nextCommanderKey() {
    const index = COMMANDERS.findIndex((candidate) => candidate.key === client.commander.key);
    return index >= 0 && index < COMMANDERS.length - 1 ? COMMANDERS[index + 1].key : null;
  }

  function openMenu() {
    if (client.mode === MODE_ONLINE && online.net !== null && online.net.isOpen) online.net.send({ type: 'leave' });
    client.phase = PHASE_MENU;
    client.sim = null;
    VIEW.isFlipped = false;
    ui.renderOnlineDecks(online);
    ui.renderCampaign(campaign, startCampaignMatch);
    ui.renderSkirmish(skirmish);
    ui.showOverlay(ui.menuOverlay);
  }

  function finishMatch() {
    if (client.phase === PHASE_ENDED) return;
    client.phase = PHASE_ENDED;
    const won = client.sim.winnerSide === client.side;
    if (client.isCampaignMatch && won && !campaign.beaten.includes(client.commander.key)) {
      campaign.beaten.push(client.commander.key);
      saveCampaign(campaign);
    }
    ui.showEnd(client, client.isCampaignMatch && won && nextCommanderKey() !== null);
  }

  function setPaused(isPaused) {
    if (client.mode === MODE_ONLINE) return;
    if (client.phase !== PHASE_PLAYING && client.phase !== PHASE_PAUSED) return;
    client.phase = isPaused ? PHASE_PAUSED : PHASE_PLAYING;
    ui.showOverlay(isPaused ? ui.pauseOverlay : null);
  }

  function stepSimulation(frameDeltaS) {
    const timeScale = client.isFastForward ? MATCH_RULES.fastForwardTimeScale : 1;
    client.accumulatorS += Math.min(frameDeltaS, MATCH_RULES.tickS * MATCH_RULES.maxStepsPerFrame) * timeScale;
    let steps = 0;
    if (client.mode === MODE_ONLINE && online.pendingSnapshot !== null) {
      hydrateSimulation(client.sim, online.pendingSnapshot);
      online.pendingSnapshot = null;
    }
    while (client.accumulatorS >= MATCH_RULES.tickS && steps < MATCH_RULES.maxStepsPerFrame) {
      client.accumulatorS -= MATCH_RULES.tickS;
      steps += 1;
      let commands = [];
      if (client.mode === MODE_ONLINE) {
        client.pendingCommands.forEach((command) => online.net.send({ type: 'command', command }));
      } else {
        commands = [...client.pendingCommands, ...client.ai.think(MATCH_RULES.tickS, client.sim)];
      }
      client.pendingCommands = [];
      const events = client.sim.step(MATCH_RULES.tickS, commands);
      spawnEffectsFromEvents(client, events);
      client.effects = updateEffects(client.effects, MATCH_RULES.tickS);
      client.timeS += MATCH_RULES.tickS;
      client.bannerTtlS = Math.max(0, client.bannerTtlS - MATCH_RULES.tickS);
    }
    if (client.menus.selectedTower !== null && !client.sim.sides[client.side].towers.includes(client.menus.selectedTower)) client.menus.close();
  }

  function frame(nowMs) {
    const frameDeltaS = (nowMs - lastFrameMs) / 1000;
    lastFrameMs = nowMs;
    if (client.phase === PHASE_PLAYING) {
      stepSimulation(frameDeltaS);
      if (client.sim.isOver && client.mode === MODE_OFFLINE) finishMatch();
    }
    if (client.sim !== null) {
      const you = client.sim.sides[client.side];
      client.hoveredCreep = client.hoverPoint === null ? null : (you.creeps.find((creep) => distanceBetween(client.hoverPoint.x, client.hoverPoint.y, creep.x, creep.y) <= creep.radiusPx + 4) ?? null);
      client.hoverBreachIndex = client.hoverPoint === null ? null : breachIndexNear(client.sim, client.sim.opponentOf(client.side), client.hoverPoint);
    }
    renderFrame(context, client);
    ui.renderHud(client);
    window.requestAnimationFrame(frame);
  }

  canvas.addEventListener('mousemove', (event) => {
    client.hoverPoint = canvasPointFromEvent(event);
    client.hoverTile = tileFromPoint(client.hoverPoint);
  });
  canvas.addEventListener('mouseleave', () => {
    client.hoverPoint = null;
    client.hoverTile = null;
  });
  canvas.addEventListener('click', (event) => {
    if (client.phase !== PHASE_PLAYING) return;
    handleCanvasClick(client, canvasPointFromEvent(event));
  });
  canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    if (client.phase !== PHASE_PLAYING) return;
    client.menus.close();
    client.selectedCardKey = null;
  });
  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement) return;
    if (client.phase !== PHASE_PLAYING && client.phase !== PHASE_PAUSED) return;
    if (event.key === ' ') event.preventDefault();
    if (event.repeat) return;
    if (event.key === 'p') {
      setPaused(client.phase === PHASE_PLAYING);
      return;
    }
    if (client.phase !== PHASE_PLAYING) return;
    handleKey(client, event.key);
  });
  ui.sendCards.addEventListener('click', (event) => {
    const button = event.target.closest('.send-card');
    if (button === null || client.phase !== PHASE_PLAYING) return;
    client.selectedCardKey = client.selectedCardKey === button.dataset.cardKey ? null : button.dataset.cardKey;
    client.menus.close();
  });
  ui.fastForwardButton.addEventListener('click', () => {
    client.isFastForward = !client.isFastForward;
  });
  ui.pauseButton.addEventListener('click', () => setPaused(client.phase === PHASE_PLAYING));
  ui.difficultyButtons.forEach((button) => button.addEventListener('click', () => {
    skirmish.difficultyKey = button.dataset.difficulty;
    ui.renderDifficulty(skirmish.difficultyKey);
  }));
  elementById('start-skirmish-button').addEventListener('click', () => startMatch(skirmish.commanderKey, skirmish.deckKey, skirmish.difficultyKey, false));
  elementById('reset-campaign-button').addEventListener('click', () => {
    campaign.beaten = [];
    saveCampaign(campaign);
    ui.renderCampaign(campaign, startCampaignMatch);
  });
  elementById('resume-button').addEventListener('click', () => setPaused(false));
  elementById('abandon-button').addEventListener('click', openMenu);
  elementById('play-again-button').addEventListener('click', () => {
    if (client.isCampaignMatch) startCampaignMatch(client.commander.key);
    else startMatch(skirmish.commanderKey, skirmish.deckKey, skirmish.difficultyKey, false);
  });
  ui.onlineQuickButton.addEventListener('click', () => connectOnline(() => online.net.send({ type: 'quick', deckKey: online.deckKey })));
  ui.onlineCreateButton.addEventListener('click', () => connectOnline(() => online.net.send({ type: 'create', deckKey: online.deckKey })));
  ui.onlineJoinButton.addEventListener('click', () => {
    const code = ui.onlineCode.value.trim().toUpperCase();
    if (code.length === 0) {
      ui.setOnlineStatus('Enter a room code.');
      return;
    }
    connectOnline(() => online.net.send({ type: 'join', code }));
  });
  try {
    ui.onlineUrl.value = window.localStorage.getItem(ONLINE_URL_STORAGE_KEY) ?? '';
    ui.onlineName.value = window.localStorage.getItem(ONLINE_NAME_STORAGE_KEY) ?? '';
  } catch (error) {
    // Defaults stay empty.
  }
  ui.nextCommanderButton.addEventListener('click', () => {
    const key = nextCommanderKey();
    if (key !== null) startCampaignMatch(key);
  });
  elementById('back-to-menu-button').addEventListener('click', openMenu);

  openMenu();
  window.requestAnimationFrame(frame);
}

main();

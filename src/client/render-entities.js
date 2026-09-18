// ---- creeps (context translated to the creep, rotated so +x is forward;
// shape coordinates are in radius units; heads sit forward and oversized) ---

function drawCreepEyes(context, radius, forwardScale, spread, size) {
  const eyeX = radius * forwardScale;
  context.fillStyle = PALETTE.eyeGlow;
  context.fillRect(eyeX - size, -radius * spread - size, size * 2, size * 2);
  context.fillRect(eyeX - size, radius * spread - size, size * 2, size * 2);
  context.fillStyle = PALETTE.eye;
  context.fillRect(eyeX - size * 0.4, -radius * spread - size * 0.4, size * 0.8, size * 0.8);
  context.fillRect(eyeX - size * 0.4, radius * spread - size * 0.4, size * 0.8, size * 0.8);
}

function drawCreepHead(context, radius, points, color, eyeForward, eyeSpread) {
  tracePolygon(context, points, radius);
  fillAndOutline(context, color);
  context.fillStyle = PALETTE.highlight;
  tracePolygon(context, points.slice(0, 3).map(([x, y]) => [x * 0.75, y * 0.55]), radius);
  context.fill();
  drawCreepEyes(context, radius, eyeForward, eyeSpread, DRAW_SIZES.eyeSizePx);
}

function drawShapeShambler(context, type, radius, timeS) {
  const sway = Math.sin(timeS * 5) * 0.15;
  tracePolygon(context, [[-0.3, 0.5], [-1.2, 1.0 + sway], [-1.45, 0.8 + sway], [-0.55, 0.15]], radius);
  fillAndOutline(context, type.trimColor);
  tracePolygon(context, [[0.35, -0.55], [1.2, -1.0 - sway], [1.4, -0.7 - sway], [0.65, -0.2]], radius);
  fillAndOutline(context, PALETTE.flesh);
  context.fillStyle = PALETTE.bone;
  context.fillRect(1.0 * radius, (-0.95 - sway) * radius, 0.3 * radius, 0.12 * radius);
  tracePolygon(context, [[0.45, -0.75], [0.85, -0.25], [0.85, 0.45], [0.25, 0.9], [-0.6, 0.85], [-1.0, 0.25], [-0.85, -0.6], [-0.2, -0.95]], radius);
  fillAndOutline(context, type.bodyColor);
  context.fillStyle = PALETTE.fleshDark;
  tracePolygon(context, [[-0.5, -0.3], [0.1, -0.55], [0.35, -0.05], [-0.25, 0.15]], radius);
  context.fill();
  context.fillStyle = PALETTE.bone;
  context.fillRect(-0.4 * radius, 0.25 * radius, 0.55 * radius, 0.1 * radius);
  context.fillRect(-0.3 * radius, 0.45 * radius, 0.4 * radius, 0.1 * radius);
  drawCreepHead(context, radius, [[1.35, -0.45], [1.6, 0.05], [1.3, 0.55], [0.55, 0.5], [0.4, -0.35]], type.bodyColor, 1.25, 0.24);
  context.fillStyle = PALETTE.bone;
  tracePolygon(context, [[1.05, 0.55], [1.55, 0.35], [1.5, 0.75], [1.0, 0.85]], radius);
  context.fill();
}

function drawShapeLurcher(context, type, radius, timeS) {
  const stride = Math.sin(timeS * 12) * 0.3;
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([signX, signY]) => {
    const swing = stride * signX * signY;
    tracePolygon(context, [[0.3 * signX, 0.3 * signY], [(1.2 + swing) * signX, 1.35 * signY], [(1.6 + swing) * signX, 1.05 * signY], [0.55 * signX, 0.1 * signY]], radius);
    fillAndOutline(context, PALETTE.fleshDark);
    context.fillStyle = PALETTE.bone;
    tracePolygon(context, [[(1.45 + swing) * signX, 1.2 * signY], [(1.9 + swing) * signX, 1.35 * signY], [(1.6 + swing) * signX, 1.05 * signY]], radius);
    context.fill();
  });
  tracePolygon(context, [[0.9, 0], [0.55, -0.55], [-0.2, -0.7], [-0.9, -0.4], [-1.35, 0], [-0.9, 0.4], [-0.2, 0.7], [0.55, 0.55]], radius);
  fillAndOutline(context, type.bodyColor);
  context.fillStyle = PALETTE.bone;
  for (let index = -1; index <= 1; index += 1) context.fillRect((index * 0.45 - 0.2) * radius, -0.18 * radius, 0.28 * radius, 0.36 * radius);
  drawCreepHead(context, radius, [[1.5, -0.35], [1.7, 0.1], [1.4, 0.5], [0.7, 0.45], [0.6, -0.3]], type.trimColor, 1.35, 0.22);
  context.fillStyle = type.accentColor;
  tracePolygon(context, [[1.7, 0.1], [1.95, 0.15], [1.65, 0.35]], radius);
  context.fill();
}

function drawShapeCarapace(context, type, radius) {
  tracePolygon(context, [[1.0, 0], [0.75, -0.75], [0, -1.0], [-0.85, -0.85], [-1.15, 0], [-0.85, 0.85], [0, 1.0], [0.75, 0.75]], radius);
  fillAndOutline(context, PALETTE.fleshDark);
  [[-0.65, -0.7, 0.15, -0.9, 0.4, -0.35, -0.55, -0.3], [-0.65, 0.7, 0.15, 0.9, 0.4, 0.35, -0.55, 0.3], [0.3, -0.55, 0.9, -0.25, 0.9, 0.25, 0.3, 0.55]].forEach(([ax, ay, bx, by, cx, cy, dx, dy]) => {
    tracePolygon(context, [[ax, ay], [bx, by], [cx, cy], [dx, dy]], radius);
    fillAndOutline(context, type.bodyColor);
    context.fillStyle = PALETTE.highlight;
    tracePolygon(context, [[ax, ay], [bx, by], [(ax + bx) / 2 + 0.1, (ay + by) / 2 * 0.7]], radius);
    context.fill();
  });
  context.fillStyle = PALETTE.bone;
  context.fillRect(-0.9 * radius, -0.12 * radius, 1.3 * radius, 0.1 * radius);
  context.fillStyle = type.accentColor;
  context.fillRect(-0.35 * radius, -0.35 * radius, 0.18 * radius, 0.18 * radius);
  context.fillRect(-0.35 * radius, 0.17 * radius, 0.18 * radius, 0.18 * radius);
  drawCreepHead(context, radius, [[1.45, -0.4], [1.65, 0], [1.45, 0.4], [0.75, 0.45], [0.75, -0.45]], type.trimColor, 1.35, 0.2);
  tracePolygon(context, [[1.05, -0.45], [1.6, -0.85], [1.35, -0.25]], radius);
  fillAndOutline(context, PALETTE.bone);
  tracePolygon(context, [[1.05, 0.45], [1.6, 0.85], [1.35, 0.25]], radius);
  fillAndOutline(context, PALETTE.bone);
}

function drawShapeWispform(context, type, radius, timeS) {
  const flicker = 0.8 + 0.2 * Math.sin(timeS * 9);
  context.fillStyle = PALETTE.biomassGlow;
  traceRegularPolygon(context, 0, 0, radius * 1.7 * flicker, 7, timeS * 2);
  context.fill();
  context.globalAlpha = 0.85;
  tracePolygon(context, [[1.0, 0], [0.5, -0.75], [-0.3, -1.0], [-0.7, -0.5], [-1.5, -0.75], [-1.05, -0.15], [-1.6, 0.3], [-0.95, 0.35], [-1.4, 1.0], [-0.5, 0.8], [0.3, 0.95]], radius);
  fillAndOutline(context, type.bodyColor);
  context.globalAlpha = 1;
  drawCreepHead(context, radius, [[1.3, -0.45], [1.55, 0], [1.3, 0.45], [0.5, 0.45], [0.5, -0.45]], type.bodyColor, 1.15, 0.24);
  traceStar(context, radius * 0.1, 0, radius * 0.4 * flicker, radius * 0.15, 4, timeS * 3);
  fillOnly(context, type.accentColor);
}

function drawShapeBloater(context, type, radius, timeS) {
  const swell = 1 + 0.06 * Math.sin(timeS * 4);
  tracePolygon(context, [[0.7, 0.25], [0.6, -0.65], [0, -1.05], [-0.75, -0.9], [-1.1, -0.2], [-1.0, 0.55], [-0.4, 1.05], [0.4, 0.95]], radius * swell);
  fillAndOutline(context, type.bodyColor);
  context.fillStyle = PALETTE.highlight;
  tracePolygon(context, [[-0.7, -0.75], [-0.1, -0.9], [0.1, -0.5], [-0.55, -0.35]], radius * swell);
  context.fill();
  [[-0.3, -0.5], [0.2, 0.45], [-0.65, 0.3], [0.35, -0.25]].forEach(([x, y]) => {
    traceRegularPolygon(context, x * radius, y * radius, radius * 0.2 * swell, 5, timeS);
    fillAndOutline(context, type.accentColor);
  });
  context.fillStyle = PALETTE.fleshDark;
  tracePolygon(context, [[-0.2, 0.2], [0.1, 0.05], [0.25, 0.35], [-0.05, 0.5]], radius);
  context.fill();
  drawCreepHead(context, radius, [[1.3, -0.4], [1.5, 0], [1.3, 0.4], [0.6, 0.45], [0.55, -0.45]], PALETTE.flesh, 1.2, 0.2);
  context.fillStyle = PALETTE.bone;
  context.fillRect(0.95 * radius, 0.25 * radius, 0.5 * radius, 0.1 * radius);
}

function drawShapeReclaimer(context, type, radius, timeS) {
  const clamp = 0.15 + 0.1 * Math.sin(timeS * 3);
  [[1, 1], [1, -1]].forEach(([signX, signY]) => {
    tracePolygon(context, [[0.5, 0.6 * signY], [1.3, 0.9 * signY], [1.75, (0.6 + clamp) * signY], [1.6, (0.15 + clamp) * signY], [1.2, 0.4 * signY]], radius);
    fillAndOutline(context, type.trimColor);
    context.fillStyle = type.accentColor;
    context.fillRect(1.25 * radius, (0.55 + clamp * 0.5) * signY * radius - 2, 0.2 * radius, 4);
  });
  tracePolygon(context, [[0.95, -0.75], [0.95, 0.75], [0.4, 1.0], [-0.95, 0.9], [-1.05, -0.9], [0.4, -1.0]], radius);
  fillAndOutline(context, type.bodyColor);
  context.fillStyle = PALETTE.highlight;
  context.fillRect(-0.9 * radius, -0.85 * radius, 1.7 * radius, 0.12 * radius);
  context.beginPath();
  context.rect(-1.4 * radius, -0.6 * radius, 0.45 * radius, 1.2 * radius);
  fillAndOutline(context, type.trimColor);
  context.beginPath();
  context.rect(-0.6 * radius, -0.55 * radius, 0.95 * radius, 0.55 * radius);
  fillAndOutline(context, PALETTE.towerPlate);
  traceRegularPolygon(context, -0.15 * radius, -0.28 * radius, radius * 0.2, 6, 0);
  fillOnly(context, PALETTE.bone);
  context.fillStyle = PALETTE.eyeGlow;
  context.fillRect(-0.3 * radius, -0.34 * radius, 0.1 * radius, 0.1 * radius);
  context.fillRect(-0.05 * radius, -0.34 * radius, 0.1 * radius, 0.1 * radius);
  context.fillStyle = type.accentColor;
  for (let index = 0; index < 3; index += 1) context.fillRect((-0.6 + index * 0.3) * radius, 0.15 * radius, 0.15 * radius, 0.35 * radius);
  context.strokeStyle = PALETTE.eyeGlow;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-0.9 * radius, 0.6 * radius);
  context.lineTo(0.3 * radius, 0.85 * radius);
  context.stroke();
  drawCreepEyes(context, radius, 0.7, 0.3, DRAW_SIZES.eyeSizePx * 1.2);
}

const SHAPE_DRAWERS = Object.freeze({
  shambler: drawShapeShambler,
  lurcher: drawShapeLurcher,
  carapace: drawShapeCarapace,
  wispform: drawShapeWispform,
  bloater: drawShapeBloater,
  reclaimer: drawShapeReclaimer,
});

function drawCreep(context, creep, timeS, isHidden) {
  const type = creep.type;
  const radius = creep.radiusPx;
  const isAirborne = type.shape === 'wispform';
  const bob = Math.sin(timeS * DRAW_SIZES.creepBobRateHz * Math.PI * 2 + creep.id) * DRAW_SIZES.creepBobAmplitudePx * (isAirborne ? 3 : 1);
  context.globalAlpha = isHidden ? 0.3 : 1;
  context.fillStyle = PALETTE.shadow;
  context.beginPath();
  context.ellipse(creep.x + 4, creep.y + radius * 0.8, radius * 1.0, radius * 0.42, 0, 0, Math.PI * 2);
  context.fill();
  context.save();
  context.translate(creep.x, creep.y + bob);
  context.rotate(creep.angle);
  SHAPE_DRAWERS[type.shape](context, type, radius, timeS);
  if (creep.slowPct > 0) {
    context.fillStyle = PALETTE.slowTint;
    traceRegularPolygon(context, 0, 0, radius * 1.2, 6, 0);
    context.fill();
  }
  if (creep.burnRemainingS > 0) {
    context.fillStyle = PALETTE.burnTint;
    traceStar(context, 0, 0, radius * 1.3, radius * 0.7, 5, timeS * 8);
    context.fill();
  }
  context.restore();
  const barWidth = DRAW_SIZES.hpBarWidthPx * (radius > 15 ? 1.8 : 1);
  const barX = creep.x - barWidth / 2;
  const barY = creep.y - radius - DRAW_SIZES.hpBarOffsetPx - DRAW_SIZES.hpBarHeightPx;
  context.fillStyle = PALETTE.hpBarBack;
  context.fillRect(barX - 1, barY - 1, barWidth + 2, DRAW_SIZES.hpBarHeightPx + 2);
  context.fillStyle = creep.burnRemainingS > 0 ? PALETTE.hpBarBurn : (creep.slowPct > 0 ? PALETTE.hpBarSlow : PALETTE.hpBarFront);
  context.fillRect(barX, barY, barWidth * Math.max(0, creep.hp / creep.maxHp), DRAW_SIZES.hpBarHeightPx);
  context.globalAlpha = 1;
}

// ---- projectiles, pods, effects ----------------------------------------------

function drawProjectile(context, projectile) {
  context.save();
  context.translate(projectile.x, projectile.y);
  context.rotate(projectile.angle);
  if (projectile.kind === PROJECTILE_ROUND) {
    context.strokeStyle = PALETTE.round;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(-DRAW_SIZES.roundLengthPx, 0);
    context.lineTo(0, 0);
    context.stroke();
    context.fillStyle = PALETTE.arcCore;
    context.fillRect(-2, -1.5, 3, 3);
  } else if (projectile.kind === PROJECTILE_ARC) {
    tracePolygon(context, [[7, 0], [0, -4], [-12, -2], [-16, 0], [-12, 2], [0, 4]], 1);
    fillAndOutline(context, PALETTE.arcBolt);
    traceStar(context, 0, 0, 4, 1.5, 4, 0);
    fillOnly(context, PALETTE.arcCore);
  } else if (projectile.kind === PROJECTILE_SHELL) {
    traceRegularPolygon(context, 0, 0, DRAW_SIZES.shellRadiusPx, 8, 0);
    fillAndOutline(context, PALETTE.shell);
    context.fillStyle = PALETTE.shellShine;
    context.fillRect(-3, -3, 2, 2);
  } else if (projectile.kind === PROJECTILE_SHARD) {
    const radius = DRAW_SIZES.shardRadiusPx;
    tracePolygon(context, [[radius * 1.4, 0], [0, -radius * 0.6], [-radius, 0], [0, radius * 0.6]], 1);
    fillAndOutline(context, PALETTE.shard);
  } else {
    const radius = DRAW_SIZES.flameRadiusPx;
    tracePolygon(context, [[radius, 0], [0.2 * radius, -radius], [-radius, -0.3 * radius], [-radius, 0.3 * radius], [0.2 * radius, radius]], 1);
    fillOnly(context, PALETTE.flame);
    tracePolygon(context, [[radius * 0.5, 0], [0, -radius * 0.4], [-radius * 0.5, 0], [0, radius * 0.4]], 1);
    fillOnly(context, PALETTE.flameCore);
  }
  context.restore();
}

function drawPod(context, pod, timeS) {
  const targetX = pod.x;
  const targetY = pod.y;
  const progress = 1 - pod.remainingS / MATCH_RULES.podFlightS;
  const eased = progress * progress;
  const pulse = 0.7 + 0.3 * Math.sin(timeS * 10);
  context.strokeStyle = PALETTE.podMarker;
  context.lineWidth = 2;
  context.setLineDash([5, 4]);
  traceRegularPolygon(context, targetX, targetY, DRAW_SIZES.breachMarkerRadiusPx * (1.6 - eased * 0.6) * pulse, 4, timeS * 2);
  context.stroke();
  context.setLineDash([]);
  context.fillStyle = PALETTE.shadow;
  context.beginPath();
  context.ellipse(targetX + 4, targetY + 6, DRAW_SIZES.podShadowMaxRadiusPx * eased, DRAW_SIZES.podShadowMaxRadiusPx * eased * 0.5, 0, 0, Math.PI * 2);
  context.fill();
  const podY = targetY - DRAW_SIZES.podDropHeightPx * (1 - eased);
  const size = DRAW_SIZES.podSizePx;
  tracePolygon(context, [[targetX - size * 0.4, podY - size], [targetX + size * 0.4, podY - size], [targetX, podY - size * (1.8 + pulse)]], 1);
  fillOnly(context, PALETTE.podFlame);
  tracePolygon(context, [[targetX - size * 0.6, podY - size], [targetX + size * 0.6, podY - size], [targetX + size * 0.8, podY + size * 0.2], [targetX, podY + size], [targetX - size * 0.8, podY + size * 0.2]], 1);
  fillAndOutline(context, pod.card.kind === CARD_KIND_CREEPS ? PALETTE.pod : PALETTE.towerPlate);
  context.fillStyle = PALETTE.highlight;
  context.fillRect(targetX - size * 0.5, podY - size * 0.9, size * 0.4, size * 0.5);
  context.fillStyle = PALETTE.podFin;
  context.fillRect(targetX - size * 0.9, podY - size * 0.9, size * 0.3, size * 0.8);
  context.fillRect(targetX + size * 0.6, podY - size * 0.9, size * 0.3, size * 0.8);
  context.fillStyle = pod.card.kind === CARD_KIND_EMP ? PALETTE.empArc : (pod.card.kind === CARD_KIND_BREACHER ? PALETTE.flame : PALETTE.eyeGlow);
  context.fillRect(targetX - size * 0.25, podY - size * 0.3, size * 0.5, size * 0.3);
}

function drawEffect(context, effect) {
  const lifeFraction = effect.ttlS / effect.maxTtlS;
  context.globalAlpha = lifeFraction;
  if (effect.kind === 'ring') {
    context.strokeStyle = effect.color;
    context.lineWidth = 3;
    traceRegularPolygon(context, effect.x, effect.y, effect.radiusPx * (1.2 - lifeFraction), 10, lifeFraction);
    context.stroke();
  } else if (effect.kind === 'burst') {
    traceStar(context, effect.x, effect.y, effect.radiusPx * (1.4 - lifeFraction), effect.radiusPx * 0.4, 6, lifeFraction * 3);
    fillOnly(context, effect.color);
  } else if (effect.kind === 'puff') {
    context.fillStyle = effect.color;
    traceRegularPolygon(context, effect.x, effect.y, effect.radiusPx * (1.6 - lifeFraction), 7, lifeFraction * 2);
    context.fill();
    context.fillStyle = PALETTE.splatterDark;
    traceRegularPolygon(context, effect.x + 4, effect.y + 4, effect.radiusPx * 0.6, 5, lifeFraction);
    context.fill();
  } else if (effect.kind === 'spark') {
    context.fillStyle = effect.color;
    context.fillRect(effect.x - DRAW_SIZES.sparkSizePx / 2, effect.y - DRAW_SIZES.sparkSizePx / 2, DRAW_SIZES.sparkSizePx, DRAW_SIZES.sparkSizePx);
  } else {
    context.fillStyle = PALETTE.outline;
    context.font = `700 ${DRAW_SIZES.floatingTextFontPx}px 'Chakra Petch', sans-serif`;
    context.textAlign = 'center';
    drawLabel(context, effect.text, effect.x + 1, effect.y + 1);
    context.fillStyle = effect.color;
    drawLabel(context, effect.text, effect.x, effect.y);
  }
  context.globalAlpha = 1;
}

// ---- overlays, menus, tooltips -------------------------------------------------

function drawRangeRing(context, centerX, centerY, rangePx) {
  context.strokeStyle = PALETTE.rangeRing;
  context.lineWidth = 2;
  context.setLineDash([6, 4]);
  context.beginPath();
  context.arc(centerX, centerY, rangePx, 0, Math.PI * 2);
  context.stroke();
  context.setLineDash([]);
}

function drawSightLines(context, sim, tower, creeps) {
  context.lineWidth = DRAW_SIZES.losLineWidthPx;
  creeps.forEach((creep) => {
    if (!creep.hasEnteredStation || distanceBetween(tower.x, tower.y, creep.x, creep.y) > tower.rangePx) return;
    const isVisible = sim.hasLineOfSight(tower.x, tower.y, creep.x, creep.y) && !creep.isHidden(sim.map);
    context.strokeStyle = isVisible ? PALETTE.losVisible : PALETTE.losBlocked;
    context.setLineDash(isVisible ? [] : [4, 4]);
    context.beginPath();
    context.moveTo(tower.x, tower.y);
    context.lineTo(creep.x, creep.y);
    context.stroke();
  });
  context.setLineDash([]);
}

function drawTileHighlight(context, col, row, isValid) {
  context.fillStyle = isValid ? PALETTE.hoverValid : PALETTE.hoverInvalid;
  context.fillRect(col * TILE_SIZE_PX, row * TILE_SIZE_PX, TILE_SIZE_PX, TILE_SIZE_PX);
}

function drawCursorFrame(context, col, row, color) {
  context.strokeStyle = PALETTE.cursorFrameShadow;
  context.lineWidth = DRAW_SIZES.cursorLineWidthPx + 2;
  context.strokeRect(col * TILE_SIZE_PX + 2, row * TILE_SIZE_PX + 2, TILE_SIZE_PX - 4, TILE_SIZE_PX - 4);
  context.strokeStyle = color;
  context.lineWidth = DRAW_SIZES.cursorLineWidthPx;
  context.strokeRect(col * TILE_SIZE_PX + 2, row * TILE_SIZE_PX + 2, TILE_SIZE_PX - 4, TILE_SIZE_PX - 4);
}

function drawBreachMarkers(context, sim, targetSide, hoverBreachIndex, timeS) {
  const pulse = 0.85 + 0.15 * Math.sin(timeS * 6);
  sim.map.breachesBySide[targetSide].forEach((breach, index) => {
    if (!sim.isBreachOpen(targetSide, index)) return;
    const centerX = tileCenterX(breach.col);
    const centerY = tileCenterY(breach.row);
    const isHovered = index === hoverBreachIndex;
    context.strokeStyle = isHovered ? PALETTE.breachMarkerHover : PALETTE.breachMarker;
    context.lineWidth = isHovered ? 4 : 3;
    traceRegularPolygon(context, centerX, centerY, DRAW_SIZES.breachMarkerRadiusPx * pulse * (isHovered ? 1.25 : 1), 4, Math.PI / 4);
    context.stroke();
    context.beginPath();
    context.moveTo(centerX - DRAW_SIZES.breachMarkerRadiusPx * 1.5, centerY);
    context.lineTo(centerX + DRAW_SIZES.breachMarkerRadiusPx * 1.5, centerY);
    context.moveTo(centerX, centerY - DRAW_SIZES.breachMarkerRadiusPx * 1.5);
    context.lineTo(centerX, centerY + DRAW_SIZES.breachMarkerRadiusPx * 1.5);
    context.stroke();
  });
}

function drawSabotageMarker(context, card, col, row, timeS) {
  const centerX = tileCenterX(col);
  const centerY = tileCenterY(row);
  const pulse = 0.85 + 0.15 * Math.sin(timeS * 6);
  const color = card.kind === CARD_KIND_EMP ? PALETTE.sabotageMarker : PALETTE.cutterMarker;
  context.strokeStyle = color;
  context.lineWidth = 3;
  traceRegularPolygon(context, centerX, centerY, DRAW_SIZES.breachMarkerRadiusPx * pulse, 4, Math.PI / 4);
  context.stroke();
  context.beginPath();
  context.moveTo(centerX - DRAW_SIZES.breachMarkerRadiusPx * 1.5, centerY);
  context.lineTo(centerX + DRAW_SIZES.breachMarkerRadiusPx * 1.5, centerY);
  context.moveTo(centerX, centerY - DRAW_SIZES.breachMarkerRadiusPx * 1.5);
  context.lineTo(centerX, centerY + DRAW_SIZES.breachMarkerRadiusPx * 1.5);
  context.stroke();
  if (card.kind === CARD_KIND_EMP) {
    context.setLineDash([6, 4]);
    context.beginPath();
    context.arc(centerX, centerY, MATCH_RULES.empRadiusPx, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
  }
}

function drawSealedHatches(context, sim, timeS) {
  sim.map.breachesBySide.forEach((breaches, side) => {
    breaches.forEach((breach, index) => {
      if (sim.isBreachOpen(side, index)) return;
      drawSealedHatchOverlay(context, breach.col, breach.row, breach.openAtS - sim.clockS, timeS);
    });
  });
}

function drawMenuButton(context, option, isHighlighted) {
  const edgeColor = !option.isEnabled ? PALETTE.menuEdgeDisabled : (option.action === MENU_ACTION_SELL ? PALETTE.menuSell : PALETTE.menuEdge);
  context.fillStyle = PALETTE.menuFill;
  traceChamferedRect(context, option.x, option.y, option.halfWidthPx, option.halfHeightPx, MENU_LAYOUT.chamferPx);
  context.fill();
  context.strokeStyle = isHighlighted && option.isEnabled ? PALETTE.menuHighlight : edgeColor;
  context.lineWidth = isHighlighted ? 3 : 2;
  context.stroke();
}

function drawBuildMenu(context, menu, options, highlightedOption) {
  if (highlightedOption !== null) {
    drawRangeRing(context, tileCenterX(menu.col), tileCenterY(menu.row), TOWER_TYPES[highlightedOption.typeKey].levels[0].rangeTiles * TILE_SIZE_PX);
  }
  drawCursorFrame(context, menu.col, menu.row, PALETTE.playerColor);
  options.forEach((option) => {
    drawMenuButton(context, option, option === highlightedOption);
    context.save();
    context.translate(option.x, option.y - 4);
    context.scale(MENU_LAYOUT.iconScale, MENU_LAYOUT.iconScale);
    context.rotate(-Math.PI / 2);
    if (!option.isEnabled) context.globalAlpha = 0.4;
    drawTurret(context, option.typeKey, { typeKey: option.typeKey, type: TOWER_TYPES[option.typeKey], level: 1, flashS: 0, aimAngle: -Math.PI / 2 }, 0);
    context.restore();
    context.fillStyle = option.isEnabled ? PALETTE.menuText : PALETTE.menuTextDisabled;
    context.font = `700 ${MENU_LAYOUT.labelFontPx}px 'Chakra Petch', sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    drawLabel(context, option.label, option.x, option.y + option.halfHeightPx - 4);
  });
}

function drawPillMenu(context, options, highlightedOption) {
  options.forEach((option) => {
    drawMenuButton(context, option, option === highlightedOption);
    context.fillStyle = option.isEnabled ? PALETTE.menuText : PALETTE.menuTextDisabled;
    context.font = `700 ${MENU_LAYOUT.labelFontPx}px 'Chakra Petch', sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    drawLabel(context, option.label, option.x, option.y + 1);
  });
  context.textBaseline = 'alphabetic';
}

function describeTowerLevel(type, level) {
  const stats = type.levels[level - 1];
  const lines = [];
  if (type.isBulkhead) {
    lines.push(`Seals a corridor or vent for ${MATCH_RULES.bulkheadLifetimeS} s.`, 'Blocks movement and line of sight.', `Max ${MATCH_RULES.bulkheadCap}, no power draw.`);
    return lines;
  }
  const dps = stats.damage * stats.attacksPerS;
  lines.push(`${stats.damage} ${type.damageType} damage, ${stats.attacksPerS.toFixed(1)}/s (${Math.round(dps)} dps)`);
  lines.push(`Range ${stats.rangeTiles.toFixed(1)} tiles, power ${MATCH_RULES.towerPowerByLevel[level - 1]}`);
  if (type.splashRadiusPx > 0) lines.push(`Splash ${(type.splashRadiusPx / TILE_SIZE_PX).toFixed(1)} tiles`);
  if (stats.slowPct > 0) lines.push(`Slows ${Math.round(stats.slowPct * 100)}% for ${type.slowDurationS} s`);
  if (stats.burnPerS > 0) lines.push(`Burns ${stats.burnPerS}/s for ${type.burnDurationS} s, halts regen`);
  return lines;
}

function drawTooltip(context, anchorX, anchorY, title, subtitle, lines) {
  const width = DRAW_SIZES.tooltipWidthPx;
  const padding = DRAW_SIZES.tooltipPaddingPx;
  const lineHeight = DRAW_SIZES.tooltipLineHeightPx;
  const height = padding * 2 + lineHeight * (lines.length + 2);
  const left = Math.min(Math.max(anchorX, DRAW_SIZES.tooltipPaddingPx), CANVAS_WIDTH_PX - width - DRAW_SIZES.tooltipPaddingPx);
  const top = Math.min(Math.max(anchorY, DRAW_SIZES.tooltipPaddingPx), CANVAS_HEIGHT_PX - height - DRAW_SIZES.tooltipPaddingPx);
  traceChamferedRect(context, left + width / 2, top + height / 2, width / 2, height / 2, 6);
  context.fillStyle = PALETTE.tooltipFill;
  context.fill();
  context.strokeStyle = PALETTE.tooltipEdge;
  context.lineWidth = 2;
  context.stroke();
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.fillStyle = PALETTE.tooltipTitle;
  context.font = `700 ${DRAW_SIZES.tooltipTitleFontPx}px 'Chakra Petch', sans-serif`;
  drawLabel(context, title, left + padding, top + padding + 12);
  context.fillStyle = PALETTE.tooltipDim;
  context.font = `600 ${DRAW_SIZES.tooltipFontPx}px 'Rajdhani', sans-serif`;
  drawLabel(context, subtitle, left + padding, top + padding + 12 + lineHeight);
  context.fillStyle = PALETTE.tooltipText;
  lines.forEach((line, index) => {
    drawLabel(context, line, left + padding, top + padding + 12 + lineHeight * (index + 2));
  });
}


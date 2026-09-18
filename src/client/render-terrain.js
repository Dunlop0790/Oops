// ===========================================================================
// RENDERING (3/4 view, light from upper-left, heavy outlines, grime)
// ===========================================================================

function tracePolygon(context, points, scale) {
  context.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) context.moveTo(x * scale, y * scale);
    else context.lineTo(x * scale, y * scale);
  });
  context.closePath();
}

function traceRegularPolygon(context, centerX, centerY, radius, sides, rotation) {
  context.beginPath();
  for (let index = 0; index < sides; index += 1) {
    const angle = rotation + (Math.PI * 2 * index) / sides;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
}

function traceStar(context, centerX, centerY, outerRadius, innerRadius, points, rotation) {
  context.beginPath();
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = rotation + (Math.PI * index) / points;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
}

function traceChamferedRect(context, centerX, centerY, halfWidth, halfHeight, chamfer) {
  context.beginPath();
  context.moveTo(centerX - halfWidth + chamfer, centerY - halfHeight);
  context.lineTo(centerX + halfWidth - chamfer, centerY - halfHeight);
  context.lineTo(centerX + halfWidth, centerY - halfHeight + chamfer);
  context.lineTo(centerX + halfWidth, centerY + halfHeight - chamfer);
  context.lineTo(centerX + halfWidth - chamfer, centerY + halfHeight);
  context.lineTo(centerX - halfWidth + chamfer, centerY + halfHeight);
  context.lineTo(centerX - halfWidth, centerY + halfHeight - chamfer);
  context.lineTo(centerX - halfWidth, centerY - halfHeight + chamfer);
  context.closePath();
}

// A starboard player sees the world mirrored; labels must stay readable.
const VIEW = { isFlipped: false };

function drawLabel(context, text, x, y) {
  if (!VIEW.isFlipped) {
    context.fillText(text, x, y);
    return;
  }
  context.save();
  context.translate(x, y);
  context.scale(-1, 1);
  context.fillText(text, 0, 0);
  context.restore();
}

function fillAndOutline(context, fillColor) {
  context.fillStyle = fillColor;
  context.fill();
  context.strokeStyle = PALETTE.outline;
  context.lineWidth = DRAW_SIZES.outlineWidthPx;
  context.lineJoin = 'round';
  context.stroke();
}

function fillOnly(context, fillColor) {
  context.fillStyle = fillColor;
  context.fill();
}

// ---- terrain (themed per deck) -------------------------------------------------

function drawDeckDecor(context, theme, x, y, random) {
  const style = theme.decorStyle;
  if (style === DECOR_GARDEN) {
    context.strokeStyle = theme.detail;
    context.lineWidth = 2;
    context.beginPath();
    for (let blade = -1; blade <= 1; blade += 1) {
      context.moveTo(x + blade * 4, y + 6);
      context.lineTo(x + blade * 6, y - 6 - random() * 4);
    }
    context.stroke();
    return;
  }
  if (style === DECOR_CARGO) {
    context.beginPath();
    context.rect(x - 12, y - 9, 24, 18);
    fillAndOutline(context, theme.machine);
    context.fillStyle = PALETTE.highlight;
    context.fillRect(x - 10, y - 7, 20, 3);
    context.fillStyle = theme.detail;
    context.fillRect(x - 4, y - 2, 8, 4);
    return;
  }
  if (style === DECOR_CLINIC) {
    context.fillStyle = theme.detail;
    context.fillRect(x - 6, y - 2, 12, 4);
    context.fillRect(x - 2, y - 6, 4, 12);
    return;
  }
  if (style === DECOR_STARS) {
    context.fillStyle = PALETTE.star;
    context.fillRect(x - 1, y - 1, 2, 2);
    context.fillRect(x + 7, y + 5, 1.5, 1.5);
    return;
  }
  if (style === DECOR_FURNACE) {
    context.fillStyle = PALETTE.ventSlat;
    context.fillRect(x - 10, y - 8, 20, 16);
    context.fillStyle = theme.detail;
    for (let slat = 0; slat < 3; slat += 1) context.fillRect(x - 8, y - 6 + slat * 5, 16, 2);
    return;
  }
  context.strokeStyle = theme.detail;
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(x - 8, y);
  context.lineTo(x + 8, y);
  context.moveTo(x, y - 8);
  context.lineTo(x, y + 8);
  context.moveTo(x - 5, y - 5);
  context.lineTo(x + 5, y + 5);
  context.moveTo(x + 5, y - 5);
  context.lineTo(x - 5, y + 5);
  context.stroke();
}

function drawDeckTile(context, theme, col, row, random) {
  const x = col * TILE_SIZE_PX;
  const y = row * TILE_SIZE_PX;
  const gradient = context.createLinearGradient(x, y, x + TILE_SIZE_PX, y + TILE_SIZE_PX);
  gradient.addColorStop(0, random() < 0.5 ? theme.deckLight : theme.deckDark);
  gradient.addColorStop(1, theme.deckDark);
  context.fillStyle = gradient;
  context.fillRect(x, y, TILE_SIZE_PX, TILE_SIZE_PX);
  context.strokeStyle = PALETTE.deckPanelLine;
  context.lineWidth = 1.5;
  context.strokeRect(x + 0.5, y + 0.5, TILE_SIZE_PX - 1, TILE_SIZE_PX - 1);
  context.fillStyle = PALETTE.highlight;
  context.fillRect(x + 1, y + 1, TILE_SIZE_PX - 2, 2);
  context.fillRect(x + 1, y + 1, 2, TILE_SIZE_PX - 2);
  const detail = random();
  if (detail < 0.2) {
    context.strokeStyle = PALETTE.deckPanelLine;
    context.beginPath();
    context.moveTo(x + HALF_TILE_PX, y + 3);
    context.lineTo(x + HALF_TILE_PX, y + TILE_SIZE_PX - 3);
    context.stroke();
  } else if (detail < 0.45) {
    drawDeckDecor(context, theme, x + 10 + random() * (TILE_SIZE_PX - 20), y + 10 + random() * (TILE_SIZE_PX - 20), random);
  }
  context.fillStyle = PALETTE.deckRivet;
  [[5, 5], [TILE_SIZE_PX - 7, 5], [5, TILE_SIZE_PX - 7], [TILE_SIZE_PX - 7, TILE_SIZE_PX - 7]].forEach(([offsetX, offsetY]) => {
    context.fillRect(x + offsetX, y + offsetY, 2, 2);
  });
}

function drawCorridorTile(context, theme, map, col, row) {
  const x = col * TILE_SIZE_PX;
  const y = row * TILE_SIZE_PX;
  context.fillStyle = theme.corridorFloor;
  context.fillRect(x, y, TILE_SIZE_PX, TILE_SIZE_PX);
  context.strokeStyle = PALETTE.corridorGrate;
  context.lineWidth = 1;
  for (let line = 6; line < TILE_SIZE_PX; line += 6) {
    context.beginPath();
    context.moveTo(x, y + line + 0.5);
    context.lineTo(x + TILE_SIZE_PX, y + line + 0.5);
    context.stroke();
  }
  NEIGHBOR_OFFSETS.forEach((offset) => {
    const neighbor = map.tileAt(col + offset.col, row + offset.row);
    if (WALKABLE_TILES.has(neighbor)) return;
    context.fillStyle = theme.edgeLightDim;
    if (offset.col === 1) context.fillRect(x + TILE_SIZE_PX - 3, y, 3, TILE_SIZE_PX);
    if (offset.col === -1) context.fillRect(x, y, 3, TILE_SIZE_PX);
    if (offset.row === 1) context.fillRect(x, y + TILE_SIZE_PX - 3, TILE_SIZE_PX, 3);
    if (offset.row === -1) context.fillRect(x, y, TILE_SIZE_PX, 3);
    context.fillStyle = theme.edgeLight;
    const half = DRAW_SIZES.corridorLightLengthPx / 2;
    if (offset.col === 1) context.fillRect(x + TILE_SIZE_PX - 3, y + HALF_TILE_PX - half, 3, half * 2);
    if (offset.col === -1) context.fillRect(x, y + HALF_TILE_PX - half, 3, half * 2);
    if (offset.row === 1) context.fillRect(x + HALF_TILE_PX - half, y + TILE_SIZE_PX - 3, half * 2, 3);
    if (offset.row === -1) context.fillRect(x + HALF_TILE_PX - half, y, half * 2, 3);
  });
}

function drawVentTile(context, theme, col, row, digit) {
  const x = col * TILE_SIZE_PX;
  const y = row * TILE_SIZE_PX;
  context.fillStyle = theme.corridorFloor;
  context.fillRect(x, y, TILE_SIZE_PX, TILE_SIZE_PX);
  context.beginPath();
  context.rect(x + 3, y + 3, TILE_SIZE_PX - 6, TILE_SIZE_PX - 6);
  fillAndOutline(context, PALETTE.ventFrame);
  context.fillStyle = PALETTE.ventCover;
  context.fillRect(x + 7, y + 7, TILE_SIZE_PX - 14, TILE_SIZE_PX - 14);
  context.fillStyle = PALETTE.ventSlat;
  for (let slat = 11; slat < TILE_SIZE_PX - 9; slat += DRAW_SIZES.ventSlatSpacingPx) context.fillRect(x + 11, y + slat, TILE_SIZE_PX - 22, 3);
  context.fillStyle = theme.edgeLight;
  context.fillRect(x + HALF_TILE_PX - 6, y + TILE_SIZE_PX - 9, 12, 3);
}

function drawWallTile(context, theme, map, col, row, random) {
  const x = col * TILE_SIZE_PX;
  const y = row * TILE_SIZE_PX;
  const height = DRAW_SIZES.wallHeightPx;
  context.fillStyle = theme.wallShade;
  context.fillRect(x, y + height, TILE_SIZE_PX, TILE_SIZE_PX - height);
  context.fillStyle = theme.wall;
  context.fillRect(x, y, TILE_SIZE_PX, TILE_SIZE_PX - height);
  context.fillStyle = theme.wallTop;
  context.fillRect(x, y, TILE_SIZE_PX, 4);
  context.strokeStyle = PALETTE.outline;
  context.lineWidth = 1.5;
  context.strokeRect(x + 0.5, y + 0.5, TILE_SIZE_PX - 1, TILE_SIZE_PX - 1);
  const isHullRow = row === 0 || row === GRID_ROWS - 1;
  if (theme.decorStyle === DECOR_STARS && isHullRow && random() < 0.7) {
    context.beginPath();
    context.rect(x + 8, y + 8, TILE_SIZE_PX - 16, TILE_SIZE_PX - height - 14);
    fillAndOutline(context, '#05060d');
    context.fillStyle = PALETTE.star;
    for (let star = 0; star < 5; star += 1) {
      const size = random() < 0.3 ? 2 : 1;
      context.fillRect(x + 10 + random() * (TILE_SIZE_PX - 22), y + 10 + random() * (TILE_SIZE_PX - height - 18), size, size);
    }
    return;
  }
  const hasWallLeft = map.tileAt(col - 1, row) === TILE_WALL;
  const hasWallRight = map.tileAt(col + 1, row) === TILE_WALL;
  if (hasWallLeft || hasWallRight) {
    context.fillStyle = PALETTE.pipeDark;
    context.fillRect(x, y + 12, TILE_SIZE_PX, 7);
    context.fillStyle = PALETTE.pipe;
    context.fillRect(x, y + 12, TILE_SIZE_PX, 3);
    context.fillStyle = PALETTE.outline;
    context.fillRect(x + HALF_TILE_PX - 3, y + 10, 6, 11);
    if (theme.decorStyle === DECOR_FURNACE) {
      context.fillStyle = theme.detail;
      context.fillRect(x + 6, y + 26, TILE_SIZE_PX - 12, 2);
    }
    return;
  }
  context.fillStyle = PALETTE.pipeDark;
  context.fillRect(x + 20, y, 7, TILE_SIZE_PX - height);
  context.fillStyle = PALETTE.pipe;
  context.fillRect(x + 20, y, 3, TILE_SIZE_PX - height);
}

function drawMachineTile(context, theme, col, row, random) {
  const x = col * TILE_SIZE_PX;
  const y = row * TILE_SIZE_PX;
  const height = DRAW_SIZES.machineHeightPx;
  context.fillStyle = PALETTE.shadow;
  context.fillRect(x + 7, y + 9, TILE_SIZE_PX - 6, TILE_SIZE_PX - 6);
  context.beginPath();
  context.rect(x + 4, y + height, TILE_SIZE_PX - 8, TILE_SIZE_PX - height - 4);
  fillAndOutline(context, theme.machineShade);
  context.beginPath();
  context.rect(x + 4, y + 2, TILE_SIZE_PX - 8, TILE_SIZE_PX - height - 6);
  fillAndOutline(context, theme.machine);
  context.fillStyle = PALETTE.highlight;
  context.fillRect(x + 6, y + 4, TILE_SIZE_PX - 12, 3);
  if (theme.decorStyle === DECOR_GARDEN) {
    context.fillStyle = theme.detail;
    for (let leaf = 0; leaf < 4; leaf += 1) {
      traceRegularPolygon(context, x + 10 + leaf * 9, y + 14 + (leaf % 2) * 6, 5, 3, random() * Math.PI);
      context.fill();
    }
    return;
  }
  if (theme.decorStyle === DECOR_CLINIC) {
    context.fillStyle = theme.detail;
    context.fillRect(x + 20, y + 10, 8, 20);
    context.fillRect(x + 14, y + 16, 20, 8);
    return;
  }
  context.fillStyle = PALETTE.machineLight;
  for (let index = 0; index < 3; index += 1) {
    if (random() < 0.6) context.fillRect(x + 10 + index * 10, y + 12, 4, 3);
  }
  context.fillStyle = theme.edgeLight;
  context.fillRect(x + 10, y + 20, TILE_SIZE_PX - 20, 2);
  context.fillStyle = PALETTE.ventSlat;
  for (let slat = 0; slat < 3; slat += 1) context.fillRect(x + 10, y + 25 + slat * 4, TILE_SIZE_PX - 20, 2);
}

function drawBreachTile(context, theme, col, row) {
  const x = col * TILE_SIZE_PX;
  const y = row * TILE_SIZE_PX;
  context.fillStyle = PALETTE.breachHatch;
  context.fillRect(x, y, TILE_SIZE_PX, TILE_SIZE_PX);
  const stripeCount = 6;
  for (let index = 0; index < stripeCount; index += 1) {
    context.fillStyle = index % 2 === 0 ? PALETTE.breachStripe : PALETTE.breachStripeDark;
    tracePolygon(context, [[x + index * 8, y], [x + index * 8 + 8, y], [x + index * 8 + 2, y + 6], [x + index * 8 - 6, y + 6]], 1);
    context.fill();
    tracePolygon(context, [[x + index * 8, y + TILE_SIZE_PX - 6], [x + index * 8 + 8, y + TILE_SIZE_PX - 6], [x + index * 8 + 2, y + TILE_SIZE_PX], [x + index * 8 - 6, y + TILE_SIZE_PX]], 1);
    context.fill();
  }
  context.beginPath();
  context.rect(x + 7, y + 10, TILE_SIZE_PX - 14, TILE_SIZE_PX - 20);
  fillAndOutline(context, theme.corridorFloor);
  context.strokeStyle = PALETTE.deckPanelLine;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(x + HALF_TILE_PX, y + 10);
  context.lineTo(x + HALF_TILE_PX, y + TILE_SIZE_PX - 10);
  context.stroke();
}

function drawSealedHatchOverlay(context, col, row, remainingS, timeS) {
  const x = col * TILE_SIZE_PX;
  const y = row * TILE_SIZE_PX;
  const blink = Math.sin(timeS * 4) > 0;
  context.beginPath();
  context.rect(x + 7, y + 10, TILE_SIZE_PX - 14, TILE_SIZE_PX - 20);
  fillAndOutline(context, PALETTE.hatchSealed);
  context.strokeStyle = PALETTE.hatchSealedLight;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x + 11, y + 14);
  context.lineTo(x + TILE_SIZE_PX - 11, y + TILE_SIZE_PX - 14);
  context.moveTo(x + TILE_SIZE_PX - 11, y + 14);
  context.lineTo(x + 11, y + TILE_SIZE_PX - 14);
  context.stroke();
  if (blink) {
    context.fillStyle = PALETTE.hatchSealedLight;
    context.fillRect(x + HALF_TILE_PX - 2, y + HALF_TILE_PX - 2, 4, 4);
  }
  context.fillStyle = PALETTE.tooltipText;
  context.font = `700 11px 'Chakra Petch', sans-serif`;
  context.textAlign = 'center';
  drawLabel(context, formatClock(remainingS), x + HALF_TILE_PX, y + TILE_SIZE_PX - 2);
}

function drawCoreHousing(context, theme, col, row) {
  const x = col * TILE_SIZE_PX;
  const y = row * TILE_SIZE_PX;
  context.fillStyle = theme.corridorFloor;
  context.fillRect(x, y, TILE_SIZE_PX, TILE_SIZE_PX);
  traceRegularPolygon(context, x + HALF_TILE_PX, y + HALF_TILE_PX + 3, DRAW_SIZES.coreRadiusPx + 4, 8, Math.PI / 8);
  fillOnly(context, PALETTE.towerBaseDark);
  traceRegularPolygon(context, x + HALF_TILE_PX, y + HALF_TILE_PX, DRAW_SIZES.coreRadiusPx + 4, 8, Math.PI / 8);
  fillAndOutline(context, PALETTE.coreHousing);
}

function drawLamp(context, theme, centerX, centerY) {
  const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, DRAW_SIZES.lampRadiusPx);
  gradient.addColorStop(0, theme.lamp);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = gradient;
  context.fillRect(centerX - DRAW_SIZES.lampRadiusPx, centerY - DRAW_SIZES.lampRadiusPx, DRAW_SIZES.lampRadiusPx * 2, DRAW_SIZES.lampRadiusPx * 2);
}

function drawGrime(context, theme, map, random) {
  for (let index = 0; index < DRAW_SIZES.grimePerMap; index += 1) {
    context.fillStyle = theme.grime;
    context.beginPath();
    context.ellipse(random() * CANVAS_WIDTH_PX, random() * CANVAS_HEIGHT_PX, 10 + random() * 30, 6 + random() * 16, random() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }
  map.breachesBySide.flat().forEach((breach) => {
    for (let index = 0; index < DRAW_SIZES.splatterPerBreach; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = TILE_SIZE_PX * 0.4 + random() * TILE_SIZE_PX * 1.4;
      traceRegularPolygon(context, tileCenterX(breach.col) + Math.cos(angle) * distance, tileCenterY(breach.row) + Math.sin(angle) * distance, 3 + random() * 6, 5 + Math.floor(random() * 3), random() * Math.PI);
      fillOnly(context, theme.splatter);
    }
  });
}

function renderBackground(map, theme) {
  const random = createSeededRandom(4242);
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH_PX;
  canvas.height = CANVAS_HEIGHT_PX;
  const context = canvas.getContext('2d');
  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLUMNS; col += 1) {
      const tile = map.tileAt(col, row);
      if (tile === TILE_CORRIDOR) drawCorridorTile(context, theme, map, col, row);
      else if (DUCT_TILES.has(tile)) drawVentTile(context, theme, col, row, tile);
      else if (BREACH_TILES.has(tile)) drawBreachTile(context, theme, col, row);
      else if (tile === TILE_CORE) drawCoreHousing(context, theme, col, row);
      else drawDeckTile(context, theme, col, row, random);
    }
  }
  drawGrime(context, theme, map, random);
  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLUMNS; col += 1) {
      if (map.tileAt(col, row) !== TILE_CORRIDOR) continue;
      const openNeighbors = NEIGHBOR_OFFSETS.filter((offset) => WALKABLE_TILES.has(map.tileAt(col + offset.col, row + offset.row))).length;
      if (openNeighbors >= 3) drawLamp(context, theme, tileCenterX(col), tileCenterY(row));
    }
  }
  context.fillStyle = PALETTE.seam;
  context.fillRect(HALF_COLUMNS * TILE_SIZE_PX - DRAW_SIZES.seamWidthPx / 2, 0, DRAW_SIZES.seamWidthPx, CANVAS_HEIGHT_PX);
  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLUMNS; col += 1) {
      const tile = map.tileAt(col, row);
      if (tile === TILE_WALL) drawWallTile(context, theme, map, col, row, random);
      if (tile === TILE_MACHINE) drawMachineTile(context, theme, col, row, random);
    }
  }
  return canvas;
}

function drawOpenDucts(context, sim, timeS) {
  const pulse = 0.5 + 0.5 * Math.sin(timeS * 3);
  sim.map.ductPartnerByKey.forEach((partner, key) => {
    const col = key % GRID_COLUMNS;
    const row = Math.floor(key / GRID_COLUMNS);
    const state = sim.sides[sideOfColumn(col)];
    if (state.sealedKeys.has(key) || state.sealedKeys.has(tileKey(partner.col, partner.row))) return;
    context.globalAlpha = 0.4 + 0.6 * pulse;
    context.fillStyle = PALETTE.ductGlow;
    context.fillRect(col * TILE_SIZE_PX + 6, row * TILE_SIZE_PX + 6, TILE_SIZE_PX - 12, TILE_SIZE_PX - 12);
    context.globalAlpha = 1;
  });
  sim.map.ductPartnerByKey.forEach((partner, key) => {
    const col = key % GRID_COLUMNS;
    const row = Math.floor(key / GRID_COLUMNS);
    context.fillStyle = PALETTE.menuText;
    context.font = `700 11px 'Chakra Petch', sans-serif`;
    context.textAlign = 'center';
    drawLabel(context, `D${sim.map.tileAt(col, row)}`, tileCenterX(col), row * TILE_SIZE_PX + TILE_SIZE_PX - 12);
  });
}

function drawCore(context, core, coreHp, timeS) {
  const centerX = tileCenterX(core.col);
  const centerY = tileCenterY(core.row);
  const healthFraction = coreHp / MATCH_RULES.coreHp;
  const pulse = 0.8 + 0.2 * Math.sin(timeS * 3);
  const ringColor = healthFraction > 0.35 ? PALETTE.coreRing : PALETTE.coreDanger;
  const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, DRAW_SIZES.coreRadiusPx * 2.2 * pulse);
  glow.addColorStop(0, healthFraction > 0.35 ? PALETTE.coreGlow : 'rgba(226, 81, 63, 0.4)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = glow;
  context.fillRect(centerX - DRAW_SIZES.coreRadiusPx * 3, centerY - DRAW_SIZES.coreRadiusPx * 3, DRAW_SIZES.coreRadiusPx * 6, DRAW_SIZES.coreRadiusPx * 6);
  traceRegularPolygon(context, centerX, centerY, DRAW_SIZES.coreRadiusPx, 6, timeS * 0.4);
  fillAndOutline(context, PALETTE.towerPlate);
  context.strokeStyle = ringColor;
  context.lineWidth = 3;
  traceRegularPolygon(context, centerX, centerY, DRAW_SIZES.coreRadiusPx * 0.7 * pulse, 6, -timeS * 0.6);
  context.stroke();
  traceStar(context, centerX, centerY, DRAW_SIZES.coreRadiusPx * 0.38, DRAW_SIZES.coreRadiusPx * 0.18, 4, timeS);
  fillOnly(context, ringColor);
}

// ---- towers ------------------------------------------------------------------

function drawTowerBase(context, tower, timeS) {
  const half = DRAW_SIZES.towerBaseHalfPx + (tower.level - 1) * 1.5;
  const height = DRAW_SIZES.towerHeightPx + (tower.level - 1) * 2;
  context.fillStyle = PALETTE.shadow;
  traceChamferedRect(context, tower.x + 5, tower.y + height + 4, half, half, 5);
  context.fill();
  traceChamferedRect(context, tower.x, tower.y + height, half, half, 5);
  fillAndOutline(context, PALETTE.towerBaseDark);
  context.fillStyle = PALETTE.ventSlat;
  for (let slat = 0; slat < 2; slat += 1) context.fillRect(tower.x - half + 6, tower.y + half + slat * 3 + 1, half * 2 - 12, 1.5);
  traceChamferedRect(context, tower.x, tower.y, half, half, 5);
  fillAndOutline(context, PALETTE.towerBase);
  context.fillStyle = PALETTE.towerBaseLight;
  context.fillRect(tower.x - half + 3, tower.y - half + 3, half * 2 - 6, 3);
  context.fillRect(tower.x - half + 3, tower.y - half + 3, 3, half * 2 - 6);
  context.strokeStyle = PALETTE.deckPanelLine;
  context.lineWidth = 1;
  context.strokeRect(tower.x - half * 0.62, tower.y - half * 0.62, half * 1.24, half * 1.24);
  const blink = Math.sin(timeS * 3 + tower.id) > 0.6;
  context.fillStyle = blink ? tower.type.accent : PALETTE.towerBaseDark;
  context.fillRect(tower.x + half - 8, tower.y - half + 4, 4, 4);
  if (tower.level >= 2) {
    context.fillStyle = PALETTE.corridorEdgeLight;
    context.fillRect(tower.x - half + 2, tower.y + half - 5, half * 2 - 4, 2);
  }
  if (tower.level >= 3) {
    context.fillStyle = PALETTE.arcBolt;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([signX, signY]) => {
      context.fillRect(tower.x + signX * (half - 5) - 2, tower.y + signY * (half - 5) - 2, 4, 4);
    });
  }
  traceRegularPolygon(context, tower.x, tower.y + 2, DRAW_SIZES.towerTurretRadiusPx * 0.95, 8, Math.PI / 8);
  fillOnly(context, PALETTE.towerBaseDark);
}

function drawSentryTurret(context, tower) {
  const radius = DRAW_SIZES.towerTurretRadiusPx;
  tracePolygon(context, [[-0.75, -0.75], [0.5, -0.85], [1.0, 0], [0.5, 0.85], [-0.75, 0.75], [-1.0, 0]], radius);
  fillAndOutline(context, PALETTE.towerPlate);
  context.fillStyle = PALETTE.highlight;
  tracePolygon(context, [[-0.6, -0.55], [0.4, -0.65], [0.3, -0.3], [-0.5, -0.25]], radius);
  context.fill();
  [-0.36, 0.06].forEach((offsetY) => {
    context.beginPath();
    context.rect(0.3 * radius, offsetY * radius, radius * 1.55, radius * 0.3);
    fillAndOutline(context, tower.type.color);
  });
  context.fillStyle = PALETTE.towerBaseDark;
  context.fillRect(1.1 * radius, -0.42 * radius, 4, radius * 0.84);
  context.beginPath();
  context.rect(-0.5 * radius, -0.3 * radius, radius * 0.6, radius * 0.6);
  fillAndOutline(context, tower.type.accent);
  if (tower.flashS > 0) {
    traceStar(context, 2.0 * radius, 0, radius * 0.7, radius * 0.3, 4, 0);
    fillOnly(context, PALETTE.muzzleFlash);
  }
}

function drawArcTurret(context, tower, timeS) {
  const radius = DRAW_SIZES.towerTurretRadiusPx;
  tracePolygon(context, [[-0.7, 0.85], [-0.4, -0.95], [0.4, -0.95], [0.7, 0.85]], radius);
  fillAndOutline(context, PALETTE.towerPlate);
  for (let ring = 0; ring < 3; ring += 1) {
    context.strokeStyle = tower.type.color;
    context.lineWidth = 2.5;
    context.beginPath();
    context.moveTo(-0.5 * radius, (ring * 0.45 - 0.55) * radius);
    context.lineTo(0.5 * radius, (ring * 0.45 - 0.55) * radius);
    context.stroke();
  }
  const sparkCount = tower.level + 1;
  context.rotate(-tower.aimAngle);
  for (let index = 0; index < sparkCount; index += 1) {
    const angle = timeS * DRAW_SIZES.orbitRateHz * Math.PI * 2 + (Math.PI * 2 * index) / sparkCount;
    traceStar(context, Math.cos(angle) * DRAW_SIZES.orbitRadiusPx, Math.sin(angle) * DRAW_SIZES.orbitRadiusPx, 4, 1.5, 4, angle);
    fillOnly(context, tower.type.accent);
  }
  context.rotate(tower.aimAngle);
  tracePolygon(context, [[1.0, 0], [0.3, -0.4], [0.3, 0.4]], radius);
  fillAndOutline(context, tower.type.color);
  if (tower.flashS > 0) {
    context.strokeStyle = tower.type.accent;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(1.0 * radius, 0);
    context.lineTo(1.5 * radius, -0.3 * radius);
    context.lineTo(1.9 * radius, 0.2 * radius);
    context.lineTo(2.4 * radius, 0);
    context.stroke();
  }
}

function drawMortarTurret(context, tower) {
  const radius = DRAW_SIZES.towerTurretRadiusPx;
  traceRegularPolygon(context, 0, 0, radius * 0.9, 6, 0);
  fillAndOutline(context, PALETTE.towerPlate);
  context.fillStyle = PALETTE.highlight;
  tracePolygon(context, [[-0.7, -0.4], [-0.1, -0.75], [0.3, -0.5], [-0.3, -0.15]], radius);
  context.fill();
  tracePolygon(context, [[-0.3, -0.55], [1.45, -0.42], [1.45, 0.42], [-0.3, 0.55]], radius);
  fillAndOutline(context, tower.type.color);
  context.fillStyle = tower.type.accent;
  context.fillRect(radius * 0.5, -radius * 0.46, 3, radius * 0.92);
  context.fillRect(radius * 1.15, -radius * 0.44, 3, radius * 0.88);
  context.beginPath();
  context.rect(-radius * 0.5, -radius * 0.22, radius * 0.35, radius * 0.44);
  fillAndOutline(context, PALETTE.shell);
  if (tower.flashS > 0) {
    traceStar(context, 1.9 * radius, 0, radius * 0.9, radius * 0.35, 5, 0);
    fillOnly(context, PALETTE.muzzleFlash);
  }
}

function drawCryoTurret(context, tower, timeS) {
  const radius = DRAW_SIZES.towerTurretRadiusPx;
  const pulse = 0.85 + 0.15 * Math.sin(timeS * Math.PI * 2);
  context.fillStyle = PALETTE.slowTint;
  traceRegularPolygon(context, 0, 0, radius * 1.4 * pulse, 6, timeS * 0.5);
  context.fill();
  traceRegularPolygon(context, 0, 0, radius * 0.8, 6, Math.PI / 6);
  fillAndOutline(context, PALETTE.towerPlate);
  [0, Math.PI * 0.72, -Math.PI * 0.72].forEach((angle, index) => {
    context.save();
    context.rotate(angle);
    const length = index === 0 ? radius * 1.3 : radius * 0.85;
    tracePolygon(context, [[length, 0], [length * 0.3, -0.38 * radius], [-0.25 * radius, 0], [length * 0.3, 0.38 * radius]], 1);
    fillAndOutline(context, tower.type.color);
    tracePolygon(context, [[length * 0.9, 0], [length * 0.3, -0.14 * radius], [length * 0.3, 0.14 * radius]], 1);
    fillOnly(context, tower.type.accent);
    context.restore();
  });
  context.fillStyle = PALETTE.arcCore;
  context.fillRect(-2, -2, 4, 4);
}

function drawFlamerTurret(context, tower) {
  const radius = DRAW_SIZES.towerTurretRadiusPx;
  traceRegularPolygon(context, -0.2 * radius, 0, radius * 0.85, 8, Math.PI / 8);
  fillAndOutline(context, PALETTE.towerPlate);
  context.beginPath();
  context.rect(0.2 * radius, -0.32 * radius, radius * 1.35, radius * 0.64);
  fillAndOutline(context, tower.type.color);
  context.beginPath();
  context.rect(-0.7 * radius, -0.6 * radius, radius * 0.55, radius * 1.2);
  fillAndOutline(context, PALETTE.shell);
  context.fillStyle = tower.type.accent;
  context.fillRect(1.25 * radius, -0.2 * radius, radius * 0.3, radius * 0.4);
  context.fillStyle = PALETTE.highlight;
  context.fillRect(0.3 * radius, -0.28 * radius, radius * 1.1, 2);
  if (tower.flashS > 0) {
    tracePolygon(context, [[1.55, -0.35], [2.3, -0.15], [2.7, 0], [2.3, 0.15], [1.55, 0.35]], radius);
    fillOnly(context, PALETTE.flame);
    tracePolygon(context, [[1.6, -0.15], [2.2, 0], [1.6, 0.15]], radius);
    fillOnly(context, PALETTE.flameCore);
  }
}

function drawTurret(context, typeKey, tower, timeS) {
  if (typeKey === 'sentry') drawSentryTurret(context, tower);
  else if (typeKey === 'arc') drawArcTurret(context, tower, timeS);
  else if (typeKey === 'mortar') drawMortarTurret(context, tower);
  else if (typeKey === 'cryo') drawCryoTurret(context, tower, timeS);
  else if (typeKey === 'flamer') drawFlamerTurret(context, tower);
}

function drawBulkhead(context, tower) {
  const x = tower.col * TILE_SIZE_PX;
  const y = tower.row * TILE_SIZE_PX;
  const height = DRAW_SIZES.wallHeightPx;
  context.fillStyle = PALETTE.shadow;
  context.fillRect(x + 5, y + 7, TILE_SIZE_PX, TILE_SIZE_PX);
  context.beginPath();
  context.rect(x + 3, y + height, TILE_SIZE_PX - 6, TILE_SIZE_PX - height - 3);
  fillAndOutline(context, PALETTE.wallShade);
  context.beginPath();
  context.rect(x + 3, y + 3, TILE_SIZE_PX - 6, TILE_SIZE_PX - height - 6);
  fillAndOutline(context, tower.type.color);
  context.fillStyle = PALETTE.highlight;
  context.fillRect(x + 5, y + 5, TILE_SIZE_PX - 10, 3);
  for (let index = 0; index < 4; index += 1) {
    context.fillStyle = index % 2 === 0 ? PALETTE.breachStripe : PALETTE.breachStripeDark;
    context.fillRect(x + 8 + index * 8, y + 13, 8, 6);
  }
  context.strokeStyle = PALETTE.deckPanelLine;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(x + HALF_TILE_PX, y + 4);
  context.lineTo(x + HALF_TILE_PX, y + TILE_SIZE_PX - height - 4);
  context.stroke();
  const integrityFraction = tower.integrityS / MATCH_RULES.bulkheadLifetimeS;
  context.fillStyle = PALETTE.hpBarBack;
  context.fillRect(x + 8, y + TILE_SIZE_PX - height - 10, TILE_SIZE_PX - 16, 4);
  context.fillStyle = PALETTE.integrityBar;
  context.fillRect(x + 8, y + TILE_SIZE_PX - height - 10, (TILE_SIZE_PX - 16) * integrityFraction, 4);
}

function drawDisabledOverlay(context, tower, timeS) {
  const half = DRAW_SIZES.towerBaseHalfPx + 2;
  context.fillStyle = PALETTE.disabledTint;
  traceChamferedRect(context, tower.x, tower.y, half, half, 5);
  context.fill();
  context.strokeStyle = PALETTE.empArc;
  context.lineWidth = 2;
  for (let arc = 0; arc < 3; arc += 1) {
    const angle = timeS * 15 + arc * 2.1;
    context.beginPath();
    context.moveTo(tower.x + Math.cos(angle) * half * 0.6, tower.y + Math.sin(angle) * half * 0.6);
    context.lineTo(tower.x + Math.cos(angle + 0.4) * half * 0.9, tower.y + Math.sin(angle + 0.4) * half * 0.9 - 4);
    context.lineTo(tower.x + Math.cos(angle + 0.9) * half * 0.7, tower.y + Math.sin(angle + 0.9) * half * 0.7);
    context.stroke();
  }
}

function drawTower(context, tower, timeS) {
  if (tower.type.isBulkhead) {
    drawBulkhead(context, tower);
    return;
  }
  drawTowerBase(context, tower, timeS);
  context.save();
  context.translate(tower.x, tower.y - 2);
  context.rotate(tower.aimAngle);
  drawTurret(context, tower.typeKey, tower, timeS);
  context.restore();
  context.fillStyle = PALETTE.corridorEdgeLight;
  for (let pip = 0; pip < tower.level; pip += 1) {
    context.fillRect(tower.x - (tower.level - 1) * 4 + pip * 8 - 2, tower.y + DRAW_SIZES.towerBaseHalfPx + 3, DRAW_SIZES.towerLevelPipPx, DRAW_SIZES.towerLevelPipPx);
  }
  if (tower.isDisabled) drawDisabledOverlay(context, tower, timeS);
}


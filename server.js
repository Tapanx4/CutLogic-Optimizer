const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

const colors = [
  '#a7f3d0', '#bae6fd', '#fecaca', '#fde68a',
  '#fed7aa', '#99f6e4', '#fbcfe8', '#c7d2fe'
];

// 🔀 Fisher-Yates shuffle helper
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 🛠 Guillotine bin packing
function guillotinePack(pieces, sheetLength, sheetWidth, sheetQuantity = null) {
  const sheets = [];

  const pieceColors = {};
  let colorIndex = 0;
  pieces.forEach(p => {
    const key = `${p.originalLength}x${p.originalWidth}`;
    if (!pieceColors[key]) pieceColors[key] = colors[colorIndex++ % colors.length];
  });

  // Sort pieces by area descending, then longest side
  const sortedPieces = [...pieces].sort((a, b) => {
    const areaDiff = (b.width * b.height) - (a.width * a.height);
    if (areaDiff !== 0) return areaDiff;
    return Math.max(b.width, b.height) - Math.max(a.width, a.height);
  });

  // Each piece has width, height, data
  const unplaced = [...sortedPieces];
  
  while (unplaced.length > 0) {
    if (sheetQuantity !== null && sheets.length >= sheetQuantity) {
      throw new Error(`Cannot fit all pieces within ${sheetQuantity} sheets`);
    }

    const freeRects = [{ x: 0, y: 0, width: sheetWidth, height: sheetLength }];
    const placements = [];

    let i = 0;
    while (i < unplaced.length) {
      const piece = unplaced[i];
      let placed = false;

      for (let j = 0; j < freeRects.length; j++) {
        const rect = freeRects[j];

        // Try rotation if it fits better
        let pw = piece.width, ph = piece.height, rot = false;
        if ((piece.width > rect.width || piece.height > rect.height) && piece.height <= rect.width && piece.width <= rect.height) {
          pw = piece.height;
          ph = piece.width;
          rot = true;
        }

        if (pw <= rect.width && ph <= rect.height) {
          // Place piece
          placements.push({
            x: rect.x,
            y: rect.y,
            width: pw,
            height: ph,
            rot,
            originalLength: piece.originalLength,
            originalWidth: piece.originalWidth,
            color: pieceColors[`${piece.originalLength}x${piece.originalWidth}`]
          });

          // Guillotine split: replace freeRect with remaining spaces
          const newRects = [];
          const rightW = rect.width - pw;
          const topH = rect.height - ph;
          if (rightW > 0) newRects.push({ x: rect.x + pw, y: rect.y, width: rightW, height: ph });
          if (topH > 0) newRects.push({ x: rect.x, y: rect.y + ph, width: rect.width, height: topH });

          freeRects.splice(j, 1, ...newRects);
          placed = true;
          unplaced.splice(i, 1); // remove from unplaced
          break;
        }
      }

      if (!placed) i++;
    }

    sheets.push(placements);
  }

  // Calculate total waste
  const totalPieceArea = pieces.reduce((acc, p) => acc + (p.width * p.height), 0);
  const totalSheetArea = sheets.length * sheetLength * sheetWidth;
  const waste = totalSheetArea - totalPieceArea;

  return { placements: sheets, waste };
}

app.post('/optimize', (req, res) => {
  const { sheetLength, sheetWidth, sheetQuantity, measurementUnit, pieces } = req.body;

  try {
    if (!sheetLength || !sheetWidth || !pieces || pieces.length === 0) {
      return res.status(400).json({ error: 'Sheet dimensions and pieces are required.' });
    }

    const PRECISION_MULTIPLIER = 100;
    const scaledSheetLength = Math.round(parseFloat(sheetLength) * PRECISION_MULTIPLIER);
    const scaledSheetWidth = Math.round(parseFloat(sheetWidth) * PRECISION_MULTIPLIER);

    const scaledPieces = pieces.map(p => ({
      length: Math.round(parseFloat(p.length) * PRECISION_MULTIPLIER),
      width: Math.round(parseFloat(p.width) * PRECISION_MULTIPLIER),
      quantity: parseInt(p.quantity),
      originalLength: parseFloat(p.length),
      originalWidth: parseFloat(p.width)
    }));

    // Expand pieces according to quantity
    const allPieces = scaledPieces.flatMap(p =>
      Array.from({ length: p.quantity }, () => ({ width: p.width, height: p.length, originalLength: p.originalLength, originalWidth: p.originalWidth }))
    );

    // Validate pieces
    for (const piece of allPieces) {
      if ((piece.width > scaledSheetWidth && piece.width > scaledSheetLength) ||
          (piece.height > scaledSheetWidth && piece.height > scaledSheetLength)) {
        throw new Error(`Piece ${piece.originalLength}x${piece.originalWidth} is too large for the sheet.`);
      }
    }

    const result = guillotinePack(allPieces, scaledSheetLength, scaledSheetWidth, sheetQuantity ? parseInt(sheetQuantity) : null);

    // Convert back to original units
    const finalPlacements = result.placements.map(sheet =>
      sheet.map(p => ({
        x: p.x / PRECISION_MULTIPLIER,
        y: p.y / PRECISION_MULTIPLIER,
        width: p.width / PRECISION_MULTIPLIER,
        height: p.height / PRECISION_MULTIPLIER,
        originalLength: p.originalLength,
        originalWidth: p.originalWidth,
        id: `${p.originalLength}x${p.originalWidth}-${Math.random().toString(36).substring(2, 9)}`,
        color: p.color
      }))
    );

    const finalWaste = result.waste / (PRECISION_MULTIPLIER ** 2);

    res.json({
      placements: finalPlacements,
      waste: finalWaste,
      totalSheetsUsed: finalPlacements.length,
      measurementUnit
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Guillotine optimizer API running on http://localhost:${PORT}`);
});



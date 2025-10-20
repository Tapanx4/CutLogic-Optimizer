import React, { useState, useMemo } from 'react';
import axios from 'axios';

// --- SVG Icons (as functional components) ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const ScissorsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>;
const RotateCcwIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L3 12"/></svg>;

// --- Initial State Constants for Reset ---
const initialPieces = [
      { length: '5', width: '5', quantity: '8' },
      { length: '10', width: '0.2', quantity: '4' },
];
const initialSheetLength = '10';
const initialSheetWidth = '10';

const OptimizerForm = () => {
  const [sheetLength, setSheetLength] = useState(initialSheetLength);
  const [sheetWidth, setSheetWidth] = useState(initialSheetWidth);
  const [sheetQuantity, setSheetQuantity] = useState('');
  const [measurementUnit, setMeasurementUnit] = useState('cm');
  const [pieces, setPieces] = useState(initialPieces);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);

  const handlePieceChange = (index, event) => {
    const { name, value } = event.target;
    const newPieces = [...pieces];
    newPieces[index][name] = value;
    setPieces(newPieces);
  };

  const handleAddPiece = () => {
    setPieces([...pieces, { length: '', width: '', quantity: '' }]);
  };

  const handleRemovePiece = (index) => {
    const newPieces = [...pieces];
    newPieces.splice(index, 1);
    setPieces(newPieces);
  };
  
  const handleReset = () => {
      setSheetLength(initialSheetLength);
      setSheetWidth(initialSheetWidth);
      setSheetQuantity('');
      setPieces(initialPieces);
      setResult(null);
      setError(null);
      setSelectedSheetIndex(0);
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setSelectedSheetIndex(0);
    setIsLoading(true);

    try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await axios.post(`${apiUrl}/optimize`, {
        sheetLength: parseFloat(sheetLength),
        sheetWidth: parseFloat(sheetWidth),
        sheetQuantity: sheetQuantity ? parseInt(sheetQuantity) : undefined,
        measurementUnit,
        pieces: pieces.filter(p => p.length && p.width && p.quantity).map(piece => ({
          length: parseFloat(piece.length),
          width: parseFloat(piece.width),
          quantity: parseInt(piece.quantity)
        }))
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response ? err.response.data.error : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const pieceLegend = useMemo(() => {
    if (!result) return [];
    const legend = new Map();
    result.placements.forEach(sheet => {
        sheet.forEach(piece => {
            if (piece) {
                const key = `${piece.originalLength}x${piece.originalWidth}`;
                if (!legend.has(key)) {
                    legend.set(key, {
                        length: piece.originalLength,
                        width: piece.originalWidth,
                        color: piece.color,
                    });
                }
            }
        });
    });
    return Array.from(legend.values());
  }, [result]);

//   const renderGrid = (sheetPieces, currentSheetLength, currentSheetWidth) => {
//   const maxDim = Math.max(currentSheetWidth, currentSheetLength);
//   const scale = 500 / maxDim;

//   if (!Array.isArray(sheetPieces)) {
//     return <div className="text-red-500 p-4">Error: Invalid sheet data format.</div>;
//   }

//   return sheetPieces.map(piece => {
//     const top = piece.y * scale;
//     const left = piece.x * scale;
//     const height = piece.height * scale;
//     const width = piece.width * scale;

//     const showText = width > 25 && height > 15;

//     return (
//       <div
//         key={piece.id}
//         className="absolute box-border flex items-center justify-center select-none"
//         style={{
//           top: `${top}px`,
//           left: `${left}px`,
//           height: `${height}px`,
//           width: `${width}px`,
//           backgroundColor: piece.color || '#f5d76e',
//           border: '1px solid #555',
//         }}
//         title={`${piece.originalLength} x ${piece.originalWidth}`}
//       >
//         {showText && (
//           <span className="text-xs font-semibold text-black tracking-tight">
//             {`${piece.originalLength} x ${piece.originalWidth}`}
//           </span>
//         )}
//       </div>
//     );
//   });
// };
const renderGrid = (sheetPieces, currentSheetLength, currentSheetWidth) => {
  const maxDim = Math.max(currentSheetWidth, currentSheetLength);
  const scale = 500 / maxDim;
  const minPixelSize = 1; // 👈 Minimum pixel dimension

  if (!Array.isArray(sheetPieces)) {
    return <div className="text-red-500 p-4">Error: Invalid sheet data format.</div>;
  }

  return sheetPieces.map(piece => {
    const top = piece.y * scale;
    const left = piece.x * scale;

    // Scale dimensions
    let height = piece.height * scale;
    let width = piece.width * scale;

    // ✅ Ensure visibility for thin pieces
    if (width > 0 && width < minPixelSize) width = minPixelSize;
    if (height > 0 && height < minPixelSize) height = minPixelSize;

    const showText = width > 25 && height > 15;

    return (
      <div
        key={piece.id}
        className="absolute box-border flex items-center justify-center select-none"
        style={{
          top: `${top}px`,
          left: `${left}px`,
          height: `${height}px`,
          width: `${width}px`,
          backgroundColor: piece.color || '#f5d76e',
          border: '1px solid #555',
        }}
        title={`${piece.originalLength} x ${piece.originalWidth}`}
      >
        {showText && (
          <span className="text-xs font-semibold text-black tracking-tight">
            {`${piece.originalLength} x ${piece.originalWidth}`}
          </span>
        )}
      </div>
    );
  });
};

  
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-3">
              <ScissorsIcon />
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">CutLogic</h1>
          </div>
          <p className="mt-2 text-lg text-slate-600">Your Smart Cutting Stock Optimizer</p>
        </header>

        <div className="relative">
          {isLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl z-10 fade-in">
                  <div className="loader"></div>
                  <p className="mt-4 text-lg font-semibold text-slate-700">Optimizing, please wait...</p>
              </div>
          )}
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 items-start">
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-3">Sheet Dimensions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="sheetLength" className="block text-base font-medium text-slate-600 mb-1">Length</label>
                      <input id="sheetLength" type="number" step="any" value={sheetLength} onChange={(e) => setSheetLength(e.target.value)} required className="text-base w-full bg-slate-50 border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400" />
                    </div>
                    <div>
                      <label htmlFor="sheetWidth" className="block text-base font-medium text-slate-600 mb-1">Width</label>
                      <input id="sheetWidth" type="number" step="any" value={sheetWidth} onChange={(e) => setSheetWidth(e.target.value)} required className="text-base w-full bg-slate-50 border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400" />
                    </div>
                     <div>
                      <label htmlFor="measurementUnit" className="block text-base font-medium text-slate-600 mb-1">Unit</label>
                      <select id="measurementUnit" value={measurementUnit} onChange={(e) => setMeasurementUnit(e.target.value)} required className="text-base w-full bg-slate-50 border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400">
                          <option value="cm">cm</option>
                          <option value="in">in</option>
                          <option value="ft">ft</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="sheetQuantity" className="block text-base font-medium text-slate-600 mb-1">Quantity</label>
                      <input id="sheetQuantity" type="number" placeholder="Unlimited" value={sheetQuantity} onChange={(e) => setSheetQuantity(e.target.value)} className="text-base w-full bg-slate-50 border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400" />
                    </div>
                  </div>
                </div>
              </div>
                
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-3">Pieces to Cut</h3>
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-slate-500 mb-2 px-1">
                    <div className="col-span-4 text-center">Length</div>
                    <div className="col-span-4 text-center">Width</div>
                    <div className="col-span-3 text-center">Qty</div>
                    <div className="col-span-1"></div>
                </div>
                <div className="space-y-3">
                  {pieces.map((piece, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                          <input type="number" step="any" name="length" placeholder="L" value={piece.length} onChange={(e) => handlePieceChange(index, e)} required className="text-base col-span-4 bg-slate-50 border border-slate-300 rounded-lg p-3 text-center focus:ring-2 focus:ring-yellow-400"/>
                          <input type="number" step="any" name="width" placeholder="W" value={piece.width} onChange={(e) => handlePieceChange(index, e)} required className="text-base col-span-4 bg-slate-50 border border-slate-300 rounded-lg p-3 text-center focus:ring-2 focus:ring-yellow-400"/>
                          <input type="number" name="quantity" placeholder="Qty" value={piece.quantity} onChange={(e) => handlePieceChange(index, e)} required className="text-base col-span-3 bg-slate-50 border border-slate-300 rounded-lg p-3 text-center focus:ring-2 focus:ring-yellow-400"/>
                          {pieces.length > 1 ? (
                              <button type="button" onClick={() => handleRemovePiece(index)} className="col-span-1 text-slate-400 hover:text-red-500 flex items-center justify-center h-full">
                                  <TrashIcon />
                              </button>
                          ) : <div className="col-span-1"></div> }
                      </div>
                  ))}
                </div>
                <button type="button" onClick={handleAddPiece} className="mt-4 flex items-center gap-2 text-base font-semibold text-yellow-600 hover:text-yellow-500">
                    <PlusIcon /> Add Piece Type
                </button>
              </div>

              <div className="md:col-span-2 mt-4 flex flex-col sm:flex-row gap-4">
                <button 
                  type="button" 
                  onClick={handleReset} 
                  className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-4 px-6 rounded-lg text-lg transition-colors"
                >
                  <RotateCcwIcon /> Reset
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full flex items-center justify-center gap-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold py-4 px-4 rounded-lg text-xl transition-all transform hover:scale-105 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg"
                >
                  Optimize Cuts
                </button>
              </div>
            </form>
          </div>
        </div>

        {error && <div className="mt-8 text-center text-red-600 bg-red-100 p-4 rounded-lg fade-in">{error}</div>}
        {result && (
          <div className="mt-10 fade-in">
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">Optimization Summary</h2>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="bg-slate-100 p-4 rounded-lg">
                          <div className="text-sm font-medium text-slate-500">Sheets Used</div>
                          <div className="text-3xl font-bold text-yellow-600">{result.placements.length}</div>
                      </div>
                      <div className="bg-slate-100 p-4 rounded-lg">
                          <div className="text-sm font-medium text-slate-500">Total Waste</div>
                          <div className="text-3xl font-bold text-slate-800">{result.waste.toFixed(2)} {measurementUnit}²</div>
                      </div>
                       <div className="bg-slate-100 p-4 rounded-lg">
                          <div className="text-sm font-medium text-slate-500">Efficiency</div>
                          <div className="text-3xl font-bold text-green-600">{
                            (() => {
                              const sLength = parseFloat(sheetLength);
                              const sWidth = parseFloat(sheetWidth);
                              if (!sLength || !sWidth) return '0.00%';
                              const totalSheetArea = result.placements.length * sLength * sWidth;
                              if (totalSheetArea === 0) return '0.00%';
                              const efficiency = ((totalSheetArea - result.waste) / totalSheetArea) * 100;
                              return `${efficiency.toFixed(2)}%`;
                            })()
                          }</div>
                      </div>
                      <div className="bg-slate-100 p-4 rounded-lg">
                          <div className="text-sm font-medium text-slate-500">Pieces Cut</div>
                          <div className="text-3xl font-bold text-slate-800">{pieces.reduce((acc, p) => acc + (parseInt(p.quantity) || 0), 0)}</div>
                      </div>
                  </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <div className="flex border-b border-slate-200">
                    {result.placements.map((_, index) => (
                        <button 
                            key={index}
                            onClick={() => setSelectedSheetIndex(index)}
                            className={`px-4 py-3 text-sm font-semibold transition-colors ${
                                selectedSheetIndex === index 
                                ? 'border-b-2 border-yellow-500 text-yellow-600' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Sheet {index + 1}
                        </button>
                    ))}
                </div>

                <div className="pt-6">
                    {result.placements.map((sheetPieces, index) => (
                        <div key={index} className={selectedSheetIndex === index ? 'block' : 'hidden'}>
                            <div className="mx-auto" style={{width: '550px', height: '550px'}}>
                                <div className="relative w-full h-full">
                                    <div
  className="relative"
  style={{
    backgroundColor: '#f4f4f4',
    width: `${parseFloat(sheetWidth) * (500 / Math.max(parseFloat(sheetLength), parseFloat(sheetWidth)))}px`,
    height: `${parseFloat(sheetLength) * (500 / Math.max(parseFloat(sheetLength), parseFloat(sheetWidth)))}px`,
    border: '2px solid #444',
    backgroundImage:
      'linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)',
    backgroundSize: '20px 20px'
  }}
>

                                        {renderGrid(sheetPieces, parseFloat(sheetLength), parseFloat(sheetWidth))}
                                    </div>
                                    <div className="absolute -left-2 top-0 -translate-x-full text-xs text-slate-500 flex items-center gap-2" style={{writingMode: 'vertical-rl', transform: 'rotate(180deg) translateX(100%)'}}>
                                        <span>{sheetLength} {measurementUnit}</span>
                                    </div>
                                    <div className="absolute -top-2 left-0 -translate-y-full text-xs text-slate-500 flex items-center gap-2">
                                        <span>{sheetWidth} {measurementUnit}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                 {pieceLegend.length > 0 && (
                      <div className="mt-6 border-t border-slate-200 pt-4">
                          <h4 className="text-sm font-semibold text-slate-500 mb-2 text-center">Piece Legend</h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
                              {pieceLegend.map(p => (
                                  <div key={`${p.length}x${p.width}`} className="flex items-center gap-2 text-sm">
                                      <div className="w-4 h-4 rounded-sm shadow-inner" style={{ backgroundColor: p.color, filter: 'saturate(1.2) contrast(1.1) brightness(0.95)' }}></div>
                                      <span>{p.length} x {p.width} {measurementUnit}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizerForm;


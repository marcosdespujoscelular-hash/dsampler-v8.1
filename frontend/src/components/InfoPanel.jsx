import React from 'react';

const InfoPanel = ({ loopMode, layerMode, selectedSlice, padAssignments }) => {
    return (
        <div className="bg-slate-900 rounded border border-slate-800 p-4 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Status & Info</h2>

            {/* Mode Indicators */}
            <div className="space-y-2">
                <div className={`p-3 rounded border ${loopMode ? 'bg-cyan-950/30 border-cyan-900/50' : 'bg-slate-950 border-slate-800'}`}>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Loop Mode</h4>
                    <p className={`text-xs font-bold ${loopMode ? 'text-cyan-400' : 'text-slate-400'}`}>
                        {loopMode ? '🔄 CONTINUOUS LOOP' : '▶️ ONE-SHOT'}
                    </p>
                </div>

                <div className={`p-3 rounded border ${layerMode ? 'bg-purple-950/30 border-purple-900/50' : 'bg-slate-950 border-slate-800'}`}>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Layering</h4>
                    <p className={`text-xs font-bold ${layerMode ? 'text-purple-400' : 'text-slate-400'}`}>
                        {layerMode ? '📚 POLYPHONIC (LAYERS)' : '✂️ MONOPHONIC (CUT-SELF)'}
                    </p>
                </div>
            </div>

            {/* Selected Slice Info */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Selection</h4>
                {selectedSlice ? (
                    <div>
                        <p className="text-sm font-bold text-cyan-400">SLICE {selectedSlice.measure}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Click a pad to assign</p>
                    </div>
                ) : (
                    <p className="text-[10px] text-slate-600 italic">Select a slice from timeline</p>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <div className="text-lg font-bold text-slate-300">{Object.keys(padAssignments).length}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Pads Used</div>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <div className="text-lg font-bold text-slate-300">9</div>
                    <div className="text-[10px] text-slate-500 uppercase">Total Pads</div>
                </div>
            </div>

            {/* Controls Hint */}
            <div className="text-[10px] text-slate-600 mt-2 text-center">
                <p>⌨️ Press <strong>1-9</strong> to trigger pads</p>
            </div>
        </div>
    );
};

export default InfoPanel;

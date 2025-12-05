import React, { useState } from 'react';
import KickOffsetControl from './KickOffsetControl';

const AnalysisResult = ({ data, onSlice }) => {
    const [measuresPerSlice, setMeasuresPerSlice] = useState(1);
    const [kickOffset, setKickOffset] = useState(0);

    if (!data) return null;

    const handleSlice = () => {
        onSlice(data.filename, data.bpm, data.time_signature, measuresPerSlice, kickOffset);
    };

    return (
        <div className="mt-4 p-4 bg-slate-900/50 rounded border border-slate-800">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Analysis Result</h2>
                <button
                    onClick={handleSlice}
                    className="bg-pink-600 text-white text-xs font-bold py-1 px-4 rounded hover:bg-pink-500 transition-colors shadow-[0_0_10px_rgba(219,39,119,0.4)]"
                >
                    ⚡ SLICE AUDIO
                </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">BPM</p>
                    <p className="text-lg font-bold text-cyan-400">{Math.round(data.bpm)}</p>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">Sig</p>
                    <p className="text-lg font-bold text-cyan-400">{data.time_signature}</p>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">Key</p>
                    <p className="text-lg font-bold text-purple-400">{data.key}</p>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">Kick</p>
                    <p className="text-lg font-bold text-green-400">{data.kick_recommendation}</p>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Measures per Slice</label>
                <div className="flex gap-1">
                    {[0.5, 1, 2, 3, 4].map((num) => (
                        <button
                            key={num}
                            onClick={() => setMeasuresPerSlice(num)}
                            className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-colors ${measuresPerSlice === num
                                ? 'bg-cyan-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {num === 0.5 ? '1/2' : num}
                        </button>
                    ))}
                </div>
            </div>

            <KickOffsetControl onOffsetChange={setKickOffset} />
        </div>
    );
};

export default AnalysisResult;

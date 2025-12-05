import React, { useState } from 'react';

const EffectsPanel = ({ effectsChain, isBypassed, onToggleBypass }) => {
    const [reverbMix, setReverbMix] = useState(0.3);
    const [delayTime, setDelayTime] = useState(0.25);
    const [delayFeedback, setDelayFeedback] = useState(0.4);
    const [delayMix, setDelayMix] = useState(0.3);
    const [filterType, setFilterType] = useState('lowpass');
    const [filterFreq, setFilterFreq] = useState(20000);
    const [filterRes, setFilterRes] = useState(1);

    const handleReverbChange = (e) => {
        const value = parseFloat(e.target.value);
        setReverbMix(value);
        if (effectsChain) effectsChain.setReverbMix(value);
    };

    const handleDelayTimeChange = (e) => {
        const value = parseFloat(e.target.value);
        setDelayTime(value);
        if (effectsChain) effectsChain.setDelayTime(value);
    };

    const handleDelayFeedbackChange = (e) => {
        const value = parseFloat(e.target.value);
        setDelayFeedback(value);
        if (effectsChain) effectsChain.setDelayFeedback(value);
    };

    const handleDelayMixChange = (e) => {
        const value = parseFloat(e.target.value);
        setDelayMix(value);
        if (effectsChain) effectsChain.setDelayMix(value);
    };

    const handleFilterTypeChange = (e) => {
        const value = e.target.value;
        setFilterType(value);
        if (effectsChain) effectsChain.setFilterType(value);
    };

    const handleFilterFreqChange = (e) => {
        const value = parseFloat(e.target.value);
        setFilterFreq(value);
        if (effectsChain) effectsChain.setFilterFrequency(value);
    };

    const handleFilterResChange = (e) => {
        const value = parseFloat(e.target.value);
        setFilterRes(value);
        if (effectsChain) effectsChain.setFilterResonance(value);
    };

    return (
        <div className={`rounded border p-4 transition-colors ${isBypassed ? 'bg-slate-900 border-slate-800 opacity-75' : 'bg-slate-900 border-cyan-900/50 shadow-[0_0_15px_rgba(8,145,178,0.1)]'}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isBypassed ? 'text-slate-500' : 'text-cyan-400'}`}>
                    <span>🎛️</span>
                    <span>Master FX</span>
                </h3>
                <button
                    onClick={onToggleBypass}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border transition-all ${isBypassed
                        ? 'bg-transparent border-slate-700 text-slate-500 hover:text-slate-300'
                        : 'bg-cyan-950 border-cyan-500 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                        }`}
                >
                    {isBypassed ? 'BYPASSED' : 'ACTIVE'}
                </button>
            </div>

            {/* Reverb */}
            <div className="mb-4">
                <label className="block text-slate-400 text-[10px] font-bold mb-1 uppercase tracking-wider">
                    Reverb
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={reverbMix}
                        onChange={handleReverbChange}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                    />
                    <div className="text-slate-500 text-[10px] w-8 text-right">{Math.round(reverbMix * 100)}%</div>
                </div>
            </div>

            {/* Delay */}
            <div className="mb-4">
                <label className="block text-slate-400 text-[10px] font-bold mb-1 uppercase tracking-wider">
                    Delay
                </label>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-600 text-[9px] w-8">TIME</span>
                        <input
                            type="range"
                            min="0.05"
                            max="2"
                            step="0.05"
                            value={delayTime}
                            onChange={handleDelayTimeChange}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                        />
                        <span className="text-slate-500 text-[9px] w-8 text-right">{(delayTime * 1000).toFixed(0)}ms</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-600 text-[9px] w-8">FDBK</span>
                        <input
                            type="range"
                            min="0"
                            max="0.9"
                            step="0.01"
                            value={delayFeedback}
                            onChange={handleDelayFeedbackChange}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                        />
                        <span className="text-slate-500 text-[9px] w-8 text-right">{Math.round(delayFeedback * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-600 text-[9px] w-8">MIX</span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={delayMix}
                            onChange={handleDelayMixChange}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                        />
                        <span className="text-slate-500 text-[9px] w-8 text-right">{Math.round(delayMix * 100)}%</span>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="mb-2">
                <label className="block text-slate-400 text-[10px] font-bold mb-1 uppercase tracking-wider">
                    Filter
                </label>
                <div className="space-y-1">
                    <select
                        value={filterType}
                        onChange={handleFilterTypeChange}
                        className="w-full bg-slate-950 text-slate-300 border border-slate-800 rounded px-1 py-0.5 text-[10px] mb-1 focus:border-cyan-700 outline-none"
                    >
                        <option value="lowpass">Low Pass</option>
                        <option value="highpass">High Pass</option>
                        <option value="bandpass">Band Pass</option>
                        <option value="notch">Notch</option>
                    </select>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-600 text-[9px] w-8">FREQ</span>
                        <input
                            type="range"
                            min="20"
                            max="20000"
                            step="10"
                            value={filterFreq}
                            onChange={handleFilterFreqChange}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                        />
                        <span className="text-slate-500 text-[9px] w-8 text-right">{filterFreq < 1000 ? filterFreq : (filterFreq / 1000).toFixed(1) + 'k'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-600 text-[9px] w-8">RES</span>
                        <input
                            type="range"
                            min="0.1"
                            max="30"
                            step="0.1"
                            value={filterRes}
                            onChange={handleFilterResChange}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                        />
                        <span className="text-slate-500 text-[9px] w-8 text-right">{filterRes.toFixed(1)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EffectsPanel;

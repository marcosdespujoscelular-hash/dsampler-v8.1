import React, { useState } from 'react';

const KickOffsetControl = ({ onOffsetChange }) => {
    const [offset, setOffset] = useState(0); // in milliseconds

    const handleOffsetChange = (e) => {
        const newOffset = parseInt(e.target.value);
        setOffset(newOffset);
        onOffsetChange(newOffset);
    };

    const handleReset = () => {
        setOffset(0);
        onOffsetChange(0);
    };

    return (
        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-lg">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-indigo-200">🎯 Kick Offset Adjustment</h4>
                <button
                    onClick={handleReset}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs transition-colors"
                >
                    Reset
                </button>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-indigo-300">
                    <span>Offset: <strong className="text-white">{offset}ms</strong></span>
                    <span className="text-indigo-400">Fine-tune kick start point</span>
                </div>

                <input
                    type="range"
                    min="-100"
                    max="100"
                    value={offset}
                    onChange={handleOffsetChange}
                    className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />

                <div className="flex justify-between text-xs text-indigo-400">
                    <span>-100ms (earlier)</span>
                    <span>0ms</span>
                    <span>+100ms (later)</span>
                </div>
            </div>

            <p className="mt-3 text-xs text-indigo-300">
                💡 Adjust if kicks aren't perfectly aligned. Negative values start earlier, positive values start later.
            </p>
        </div>
    );
};

export default KickOffsetControl;

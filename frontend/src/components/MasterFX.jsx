import React, { useState, useEffect } from 'react';

const MasterFX = ({ onRateChange }) => {
    const [rate, setRate] = useState(1.0);
    const [isVaporwave, setIsVaporwave] = useState(false);

    const handleRateChange = (e) => {
        const newRate = parseFloat(e.target.value);
        setRate(newRate);
        setIsVaporwave(false); // Disable vaporwave toggle if manual adjustment
        onRateChange(newRate);
    };

    const toggleVaporwave = () => {
        if (isVaporwave) {
            setRate(1.0);
            onRateChange(1.0);
            setIsVaporwave(false);
        } else {
            setRate(0.9);
            onRateChange(0.9);
            setIsVaporwave(true);
        }
    };

    const handleReset = () => {
        setRate(1.0);
        setIsVaporwave(false);
        onRateChange(1.0);
    };

    return (
        <div className={`mt-6 p-6 rounded-lg shadow-xl transition-all duration-500 ${isVaporwave
            ? 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 border-2 border-pink-400/50'
            : 'bg-white'
            }`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${isVaporwave ? 'text-pink-400 font-mono tracking-widest' : 'text-gray-800'}`}>
                    {isVaporwave ? 'M A S T E R  F X' : 'Master FX'}
                </h3>
                <button
                    onClick={handleReset}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                    Reset
                </button>
            </div>

            {/* Playback Rate Slider */}
            <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                    <span className={isVaporwave ? 'text-cyan-300' : 'text-gray-600'}>Speed / Pitch</span>
                    <span className={`font-bold ${isVaporwave ? 'text-pink-400' : 'text-blue-600'}`}>
                        {Math.round(rate * 100)}%
                    </span>
                </div>
                <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={rate}
                    onChange={handleRateChange}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isVaporwave ? 'bg-purple-900 accent-pink-500' : 'bg-gray-200 accent-blue-600'
                        }`}
                />
                <div className={`flex justify-between text-xs mt-1 ${isVaporwave ? 'text-purple-300' : 'text-gray-400'}`}>
                    <span>Slow (0.5x)</span>
                    <span>Normal (1.0x)</span>
                    <span>Fast (1.5x)</span>
                </div>
            </div>

            {/* Vaporwave Toggle */}
            <button
                onClick={toggleVaporwave}
                className={`w-full py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-[1.02] ${isVaporwave
                    ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
            >
                {isVaporwave ? '🌊 V A P O R W A V E   O N 🌴' : '🌊 Vaporwave Mode'}
            </button>

            {isVaporwave && (
                <div className="mt-3 text-center text-xs text-pink-300 font-mono animate-pulse">
                    S L O W E D   +   R E V E R B   (kinda)
                </div>
            )}
        </div>
    );
};

export default MasterFX;

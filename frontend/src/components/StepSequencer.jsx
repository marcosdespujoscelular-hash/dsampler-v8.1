import React from 'react';

const StepSequencer = ({ pads, bpm, isPlaying, onPlayingChange, patterns, onPatternsChange, currentStep, isRecording, onRecordToggle }) => {

    const toggleStep = (padNum, stepIndex) => {
        if (onPatternsChange) {
            onPatternsChange(prev => ({
                ...prev,
                [padNum]: prev[padNum].map((val, idx) =>
                    idx === stepIndex ? !val : val
                )
            }));
        }
    };

    const clearPattern = () => {
        const emptyPatterns = {};
        for (let i = 1; i <= 9; i++) {
            emptyPatterns[i] = Array(16).fill(false);
        }
        if (onPatternsChange) {
            onPatternsChange(emptyPatterns);
        }
    };

    const getPadColor = (padNum) => {
        if (padNum <= 3) return { bg: 'bg-blue-500', active: 'bg-blue-600', hover: 'hover:bg-blue-400' };
        if (padNum <= 6) return { bg: 'bg-orange-500', active: 'bg-orange-600', hover: 'hover:bg-orange-400' };
        return { bg: 'bg-red-500', active: 'bg-red-600', hover: 'hover:bg-red-400' };
    };

    return (
        <div className="bg-gray-800 rounded-lg p-3 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-white">Channel Rack</h3>
                    <div className="flex gap-1">
                        <button
                            onClick={() => onPlayingChange(!isPlaying)}
                            className={`px-3 py-1 rounded text-xs font-bold ${isPlaying
                                ? 'bg-red-600 hover:bg-red-500'
                                : 'bg-green-600 hover:bg-green-500'
                                } text-white transition-colors`}
                        >
                            {isPlaying ? '■ Stop' : '▶ Play'}
                        </button>

                        {/* Global Record Button */}
                        <button
                            onClick={onRecordToggle}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${isRecording
                                ? 'bg-red-600 text-white animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]'
                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`}></div>
                            REC
                        </button>

                        <button
                            onClick={clearPattern}
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>
                <div className="text-xs text-gray-400">
                    {bpm} BPM
                </div>
            </div>

            {/* Grid Container */}
            <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                    {/* Beat Numbers Header */}
                    <div className="flex items-center mb-1">
                        <div className="w-24 flex-shrink-0"></div>
                        <div className="flex-1 flex">
                            {Array(16).fill(0).map((_, i) => (
                                <div key={i} className="flex-1 text-center">
                                    {i % 4 === 0 && (
                                        <span className="text-xs text-gray-500 font-bold">
                                            {i / 4 + 1}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pad Rows */}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(padNum => {
                        const colors = getPadColor(padNum);
                        return (
                            <div key={padNum} className="flex items-center mb-1 group">
                                {/* Pad Label */}
                                <div className="w-24 flex-shrink-0 pr-2">
                                    <div className={`${colors.bg} rounded px-2 py-1 text-white text-xs font-bold text-center`}>
                                        Pad {padNum}
                                    </div>
                                </div>

                                {/* Steps Grid */}
                                <div className="flex-1 flex gap-0.5">
                                    {patterns[padNum].map((isActive, stepIndex) => {
                                        const isCurrentStep = currentStep === stepIndex;
                                        const isBeatStart = stepIndex % 4 === 0;

                                        return (
                                            <button
                                                key={stepIndex}
                                                onClick={() => toggleStep(padNum, stepIndex)}
                                                className={`
                                                    flex-1 h-6 rounded-sm transition-all relative
                                                    ${isActive
                                                        ? `${colors.active} ${colors.hover} shadow-md`
                                                        : isBeatStart
                                                            ? 'bg-gray-700 hover:bg-gray-600'
                                                            : 'bg-gray-750 hover:bg-gray-650'
                                                    }
                                                    ${isCurrentStep ? 'ring-2 ring-yellow-400' : ''}
                                                `}
                                                style={{
                                                    backgroundColor: !isActive ? (isBeatStart ? '#374151' : '#2d3748') : undefined
                                                }}
                                            >
                                                {isActive && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-1 h-1 bg-white rounded-full opacity-50"></div>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500 text-center">
                16 Steps • Click to toggle • {isPlaying ? '🔴 Playing' : '⏸ Stopped'}
            </div>
        </div>
    );
};

export default StepSequencer;

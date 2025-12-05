import React, { useState, useEffect, useRef } from 'react';

const SequencerControls = ({ isRecording, onToggleRecord, bpm, onQuantize }) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-lg font-bold text-gray-700 mb-4">Smart Sequencer</h2>

            <div className="flex items-center gap-4">
                <button
                    onClick={onToggleRecord}
                    className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${isRecording
                        ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`}></div>
                    {isRecording ? 'RECORDING...' : 'REC'}
                </button>
            </div>

            {isRecording && (
                <div className="mt-3 text-xs text-center text-red-500 font-mono">
                    Recording... (Press Stop to finish)
                </div>
            )}

            {!isRecording && (
                <button
                    onClick={onQuantize}
                    className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Quantized WAV
                </button>
            )}

            <div className="mt-4 text-xs text-gray-400">
                <p>💡 Records your performance, fixes timing errors (Quantize), and exports a high-quality WAV file.</p>
            </div>
        </div>
    );
};

export default SequencerControls;

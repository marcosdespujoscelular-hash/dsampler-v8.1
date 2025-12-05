import React, { useState, useEffect, useCallback } from 'react';
import SamplerPad from './SamplerPad';
import config from '../config';

const SamplerPads = ({ selectedSlice, jobId, slices, loopMode, setLoopMode, onAssignmentsChange, audioContext, effectsChain, onPadTrigger }) => {
    const [padAssignments, setPadAssignments] = useState({});
    const [playingPads, setPlayingPads] = useState(new Set());

    // Update parent about assignments
    useEffect(() => {
        if (onAssignmentsChange) {
            onAssignmentsChange(padAssignments);
        }
    }, [padAssignments, onAssignmentsChange]);

    // Stable triggerPad function with useCallback
    const triggerPad = useCallback((padNumber, isKeyTrigger = false) => {
        console.log(`🎹 Triggering pad ${padNumber}, Key:`, isKeyTrigger);

        // Notify parent of trigger (for recording)
        if (onPadTrigger) {
            onPadTrigger(padNumber);
        }

        // Always trigger sound (forcePlay=false for user clicks, respecting toggle)
        const triggerFunc = window[`triggerPad${padNumber}`];

        if (triggerFunc) {
            triggerFunc(loopMode, false); // forcePlay=false for user interaction
            window.dispatchEvent(new CustomEvent('padTriggered', { detail: { padNumber } }));
            console.log(`✅ Pad ${padNumber} triggered successfully`);
        } else {
            console.warn(`❌ Pad ${padNumber} trigger function NOT available`);
        }
    }, [loopMode, onPadTrigger]);

    // Keyboard event handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            const code = e.code;
            const key = e.key;
            let keyNum = null;

            // Try code first (physical location)
            if (code === 'Digit1' || code === 'Numpad1') keyNum = 1;
            else if (code === 'Digit2' || code === 'Numpad2') keyNum = 2;
            else if (code === 'Digit3' || code === 'Numpad3') keyNum = 3;
            else if (code === 'Digit4' || code === 'Numpad4') keyNum = 4;
            else if (code === 'Digit5' || code === 'Numpad5') keyNum = 5;
            else if (code === 'Digit6' || code === 'Numpad6') keyNum = 6;
            else if (code === 'Digit7' || code === 'Numpad7') keyNum = 7;
            else if (code === 'Digit8' || code === 'Numpad8') keyNum = 8;
            else if (code === 'Digit9' || code === 'Numpad9') keyNum = 9;

            // Fallback to key (character) if code fails
            if (keyNum === null) {
                const parsed = parseInt(key);
                if (!isNaN(parsed) && parsed >= 1 && parsed <= 9) {
                    keyNum = parsed;
                }
            }

            if (keyNum !== null) {
                console.log(`⌨️ Key pressed: ${keyNum} (code: ${code}, key: ${key})`);
                // Prevent default only if it's not an input
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    triggerPad(keyNum, true);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [triggerPad]);

    const handleAssignPad = (padNumber) => {
        if (!selectedSlice) {
            alert('Please select a slice from the timeline first');
            return;
        }

        const audioUrl = `${config.API_URL}/download/${jobId}/${selectedSlice.filename}`;

        setPadAssignments(prev => ({
            ...prev,
            [padNumber]: {
                slice: selectedSlice,
                audioUrl: audioUrl
            }
        }));

        console.log(`📝 Assigned slice ${selectedSlice.measure} to pad ${padNumber}`);
    };

    const handleClearAll = () => {
        if (confirm('Clear all pad assignments?')) {
            setPadAssignments({});
        }
    };

    const handleStopAll = () => {
        // Stop all pads that have the stop function registered
        for (let i = 1; i <= 9; i++) {
            const stopFunc = window[`stopPad${i}`];
            if (stopFunc) {
                stopFunc();
            }
        }
        console.log('⏹️ Stopped all pads');
    };

    return (
        <div className="mt-4 bg-slate-900 rounded border border-slate-800 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span>🎹</span>
                    <span>Sampler Pads</span>
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setLoopMode(!loopMode)}
                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all border ${loopMode
                            ? 'bg-cyan-950 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                            : 'bg-transparent border-slate-600 text-slate-500 hover:border-slate-400 hover:text-slate-300'
                            }`}
                        title={loopMode ? 'Loop ON: Click pad again to stop' : 'Loop OFF: One-shot playback'}
                    >
                        {loopMode ? 'LOOP: ON' : 'LOOP: OFF'}
                    </button>

                    <button
                        onClick={handleStopAll}
                        className="px-3 py-1 bg-slate-800 hover:bg-orange-900/50 border border-slate-700 hover:border-orange-500/50 text-slate-400 hover:text-orange-400 rounded text-[10px] font-bold transition-all uppercase tracking-widest flex items-center gap-1"
                        title="Stop all playing pads"
                    >
                        <span>⏹</span> STOP
                    </button>

                    <button
                        onClick={handleClearAll}
                        className="px-3 py-1 bg-slate-800 hover:bg-red-900/50 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 rounded text-[10px] font-bold transition-all uppercase tracking-widest"
                    >
                        CLEAR
                    </button>
                </div>
            </div>

            {/* Helpful hint */}
            <div className="mb-4 text-xs text-cyan-400 bg-cyan-950/30 px-3 py-2 rounded border border-cyan-900/50">
                💡 <strong className="font-bold">Tip:</strong>
                {loopMode
                    ? ' Loop ON: Click pad to start looping, click again to stop • Shift+Click to reassign'
                    : ' Loop OFF: Click pad for one-shot • Shift+Click to reassign'
                }
            </div>

            {/* Grid with explicit rows to prevent "contagion" bug */}
            <div className="grid grid-cols-3 gap-4">
                {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(padNumber => (
                    <SamplerPad
                        key={padNumber}
                        padNumber={padNumber}
                        assignment={padAssignments[padNumber]}
                        onAssign={handleAssignPad}
                        onPlay={() => triggerPad(padNumber)}
                        onPlayStateChange={(isPlaying) => {
                            setPlayingPads(prev => {
                                const newSet = new Set(prev);
                                if (isPlaying) newSet.add(padNumber);
                                else newSet.delete(padNumber);
                                return newSet;
                            });
                        }}
                        isPlaying={playingPads.has(padNumber)}
                        loopMode={loopMode}
                        audioContext={audioContext}
                        effectsChain={effectsChain}
                    />
                ))}
            </div>
        </div>
    );
};

export default SamplerPads;

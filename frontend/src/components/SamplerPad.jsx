import React, { useRef, useEffect, useState, useCallback } from 'react';
import { drawWaveform, loadAudioBuffer } from '../utils/WaveformRenderer';

const SamplerPad = ({ padNumber, assignment, onAssign, onPlay, onTrigger, isPlaying, loopMode, onPlayStateChange, audioContext, effectsChain }) => {
    const audioRef = useRef(null);
    const canvasRef = useRef(null);
    const [isPressed, setIsPressed] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // NEW: Track loading state

    // Web Audio API Refs
    const audioBufferRef = useRef(null);
    const activeSourceNodeRef = useRef(null);
    const isLoadingBufferRef = useRef(false);

    useEffect(() => {
        if (onTrigger) {
            onTrigger(audioRef);
        }
    }, [onTrigger]);

    // Load Audio Buffer when assignment changes
    useEffect(() => {
        if (assignment && assignment.audioUrl && audioContext) {
            isLoadingBufferRef.current = true;
            setIsLoading(true); // Show loading indicator
            console.log(`📥 [Pad ${padNumber}] Loading audio buffer...`);

            loadAudioBuffer(audioContext, assignment.audioUrl).then(buffer => {
                if (buffer) {
                    audioBufferRef.current = buffer;
                    isLoadingBufferRef.current = false;
                    setIsLoading(false); // Hide loading indicator
                    console.log(`✅ [Pad ${padNumber}] Buffer loaded successfully (${buffer.duration.toFixed(2)}s)`);

                    // PERFORMANCE: Waveform drawing disabled
                    // if (canvasRef.current) {
                    //     drawWaveform(canvasRef.current, buffer);
                    // }
                } else {
                    console.error(`❌ [Pad ${padNumber}] Failed to load buffer`);
                    isLoadingBufferRef.current = false;
                    setIsLoading(false); // Hide loading indicator even on failure
                }
            });
        } else {
            audioBufferRef.current = null;
            setIsLoading(false);
        }
    }, [assignment, audioContext, padNumber]);

    // Handle click
    const handleClick = (e) => {
        const hasAssignment = !!assignment;
        const shouldReassign = e.shiftKey && hasAssignment;

        if (shouldReassign) {
            onAssign(padNumber);
        } else if (hasAssignment) {
            if (onPlay) onPlay();
        } else {
            onAssign(padNumber);
        }
    };

    // Stop function for this pad
    const stopPad = useCallback(() => {
        if (activeSourceNodeRef.current) {
            try {
                activeSourceNodeRef.current.stop();
                activeSourceNodeRef.current.disconnect();
                activeSourceNodeRef.current = null;
                if (onPlayStateChange) onPlayStateChange(false);
            } catch (e) { }
        }
    }, [onPlayStateChange]);

    // ULTRA ROBUST trigger function using Web Audio API
    const triggerSound = useCallback((shouldLoop = loopMode, forcePlay = false) => {
        // Verification 1: Has assignment
        if (!assignment) return;

        // Verification 2: Buffer is ready
        if (!audioBufferRef.current) {
            console.warn(`⏳ [Pad ${padNumber}] Buffer not ready`);
            return;
        }

        // ===== USER CLICK LOGIC (not from sequencer) =====
        if (!forcePlay) {
            console.log(`👆 USER CLICK (not sequencer)`);

            // LOOP ON: Toggle behavior for same pad ONLY
            if (shouldLoop && activeSourceNodeRef.current) {
                console.log(`🔄 LOOP ON + Already Playing → TOGGLE OFF`);
                stopPad();
                return;
            }

            // LOOP OFF: Strict monophonic - stop ALL other pads immediately
            if (!shouldLoop) {
                console.log(`🎵 LOOP OFF → Monophonic mode (strict)`);

                // Stop ALL other pads first (before checking if this pad is playing)
                for (let i = 1; i <= 9; i++) {
                    if (i !== padNumber) {
                        const stopFunc = window[`stopPad${i}`];
                        if (stopFunc) {
                            stopFunc();
                        }
                    }
                }

                // If THIS pad is already playing, stop it explicitly here to prevent overlap
                if (activeSourceNodeRef.current) {
                    console.log(`🔄 This pad already playing, stopping immediately for restart`);
                    try {
                        activeSourceNodeRef.current.stop();
                        activeSourceNodeRef.current.disconnect();
                    } catch (e) {
                        // Ignore errors if already stopped
                    }
                    activeSourceNodeRef.current = null;
                    if (onPlayStateChange) onPlayStateChange(false);
                }
            }

            // LOOP ON: Do NOT stop other pads (polyphonic mode)
            // Only the toggle behavior above stops this specific pad
            if (shouldLoop) {
                console.log(`🎵 LOOP ON → Polyphonic mode (multiple pads can play)`);
                // No stopping of other pads - they continue playing
            }
        } else {
            console.log(`🎼 SEQUENCER CALL → Always restart from 0`);
        }

        // ===== SEQUENCER LOGIC (forcePlay = true) =====
        // Always restart pad from beginning, even if it's already playing
        if (forcePlay && activeSourceNodeRef.current) {
            try {
                activeSourceNodeRef.current.stop();
                activeSourceNodeRef.current.disconnect();
                activeSourceNodeRef.current = null;
                console.log(`🔄 [Pad ${padNumber}] Restarting from sequencer`);
            } catch (e) {
                // Already stopped
            }
        }

        // Resume context if suspended
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }

        try {
            // Create new Buffer Source
            const source = audioContext.createBufferSource();
            source.buffer = audioBufferRef.current; // CRITICAL FIX: Use audioBufferRef.current
            source.loop = shouldLoop;
            source.playbackRate.value = window.globalPlaybackRate || 1.0;

            // Connect to Effects Chain
            if (effectsChain) {
                effectsChain.connectSource(source);
            } else {
                source.connect(audioContext.destination);
            }

            // Start Playback
            source.start(0);
            activeSourceNodeRef.current = source;

            // Visual Feedback
            setIsPressed(true);
            if (onPlayStateChange) onPlayStateChange(true);
            setTimeout(() => setIsPressed(false), 100);

            // Handle End
            source.onended = () => {
                // Only clear if this source is still the active one
                if (activeSourceNodeRef.current === source) {
                    activeSourceNodeRef.current = null;
                    if (onPlayStateChange) onPlayStateChange(false);
                    window.dispatchEvent(new CustomEvent('padStopped', { detail: { padNumber } }));
                }
            };

            const mode = forcePlay ? 'SEQUENCER' : (shouldLoop ? 'LOOP' : 'ONE-SHOT');
            console.log(`🔊 [Pad ${padNumber}] Playing (${mode})`);

        } catch (err) {
            console.error(`❌ [Pad ${padNumber}] Playback failed:`, err);
        }

    }, [assignment, loopMode, audioContext, onPlayStateChange, padNumber, effectsChain, stopPad]);

    // Expose trigger and stop methods to window
    useEffect(() => {
        // Trigger function - sequencer calls with forcePlay=true to bypass toggle
        window[`triggerPad${padNumber}`] = (shouldLoop, forcePlay = true) => {
            console.log(`🎯 [Pad ${padNumber}] Trigger function CALLED. Assignment:`, !!assignment, 'Buffer:', !!audioBufferRef.current);
            if (assignment) {
                triggerSound(shouldLoop, forcePlay);
            } else {
                console.warn(`⚠️ Pad ${padNumber} has no assignment`);
            }
        };

        // Stop function
        window[`stopPad${padNumber}`] = stopPad;

        console.log(`✅ [Pad ${padNumber}] Trigger functions REGISTERED. Assignment:`, !!assignment, 'Buffer:', !!audioBufferRef.current);

        return () => {
            console.log(`🗑️ [Pad ${padNumber}] Trigger functions UNREGISTERED`);
            delete window[`triggerPad${padNumber}`];
            delete window[`stopPad${padNumber}`];
        };
    }, [padNumber, triggerSound, stopPad, assignment]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (activeSourceNodeRef.current) {
                try {
                    activeSourceNodeRef.current.stop();
                    activeSourceNodeRef.current.disconnect();
                } catch (e) { }
            }
        };
    }, []);

    return (
        <div className="relative">
            <button
                onClick={handleClick}
                disabled={isLoading} // Disable clicks while loading
                className={`
                    w-full aspect-[1/0.6] rounded border-2 transition-all duration-75
                    flex flex-col items-center justify-center gap-1
                    ${isLoading
                        ? 'bg-gradient-to-br from-yellow-900/50 to-orange-900/50 border-yellow-600/50 cursor-wait animate-pulse'
                        : assignment
                            ? isPlaying
                                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)] scale-[0.98]'
                                : isPressed
                                    ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-500 scale-[0.95]'
                                    : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 hover:border-cyan-500/50 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                            : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'
                    }
                `}
                title={isLoading ? 'Loading audio...' : (assignment ? `${assignment.slice.measure} (Shift+Click to reassign)` : 'Click to assign slice')}
            >
                {isLoading ? (
                    <>
                        <span className="text-2xl animate-spin">⏳</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                            Loading...
                        </span>
                    </>
                ) : (
                    <>
                        <span className={`text-2xl font-bold ${assignment ? (isPlaying ? 'text-white' : 'text-cyan-400') : 'text-slate-600'}`}>
                            {padNumber}
                        </span>
                        {assignment && (
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isPlaying ? 'text-cyan-100' : 'text-slate-400'}`}>
                                {assignment.slice.measure}
                            </span>
                        )}
                    </>
                )}
            </button>

            {/* Hidden canvas for waveform (disabled for performance) */}
            <canvas
                ref={canvasRef}
                className="hidden"
                width="200"
                height="60"
            />
        </div>
    );
};

export default SamplerPad;

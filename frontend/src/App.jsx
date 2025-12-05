import React, { useState, useRef, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import AnalysisResult from './components/AnalysisResult';
import TimelineSliceViewer from './components/TimelineSliceViewer';
import AudioPlayer from './components/AudioPlayer';
import SamplerPads from './components/SamplerPads';
import MasterFX from './components/MasterFX';
import InfoPanel from './components/InfoPanel';
import SequencerControls from './components/SequencerControls';
import EffectsPanel from './components/EffectsPanel';
import StepSequencer from './components/StepSequencer';
import VUMeter from './components/VUMeter';
import { EffectsChain } from './utils/EffectsChain';
import config from './config';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-100 text-red-900 rounded-lg m-4">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <details className="whitespace-pre-wrap">
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [sliceData, setSliceData] = useState(null);
  const [isSlicing, setIsSlicing] = useState(false);
  const [selectedSlice, setSelectedSlice] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // V6 States
  const [loopMode, setLoopMode] = useState(false); // V8: Start with Loop OFF
  const [padAssignments, setPadAssignments] = useState({});
  const [sequencerPlaying, setSequencerPlaying] = useState(false);
  const [sequencerPatterns, setSequencerPatterns] = useState(() => {
    const patterns = {};
    for (let i = 1; i <= 9; i++) {
      patterns[i] = Array(16).fill(false);
    }
    return patterns;
  });

  // ... (other states)

  const [isGlobalRecording, setIsGlobalRecording] = useState(false);

  // Lifted Sequencer State
  const [currentStep, setCurrentStep] = useState(-1);

  // Audio Context & Effects
  const audioContextRef = useRef(null);
  const effectsChainRef = useRef(null);
  const [isEffectsBypassed, setIsEffectsBypassed] = useState(true); // V8: Start with Effects Bypassed

  // Initialize Audio Context and Effects Chain
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      effectsChainRef.current = new EffectsChain(audioContextRef.current);
      // V8: Initialize with bypass enabled
      effectsChainRef.current.toggleBypass(true);
    }
  }, []);

  const toggleEffectsBypass = () => {
    if (effectsChainRef.current) {
      const newState = !isEffectsBypassed;
      setIsEffectsBypassed(newState);
      effectsChainRef.current.toggleBypass(newState);
    }
  };

  // Sequencer Clock Logic (Lifted from StepSequencer)
  // Use ref for patterns to avoid resetting interval on every pattern change
  const sequencerPatternsRef = useRef(sequencerPatterns);

  useEffect(() => {
    sequencerPatternsRef.current = sequencerPatterns;
  }, [sequencerPatterns]);

  useEffect(() => {
    console.log('🕒 Sequencer Effect: Playing=', sequencerPlaying, 'BPM=', analysisData?.bpm);

    if (!sequencerPlaying) {
      setCurrentStep(-1);
      return;
    }

    const bpm = analysisData?.bpm || 120;
    const stepDuration = (60 / bpm) * 1000 / 4; // 16th notes
    console.log('⏱️ Step Duration:', stepDuration, 'ms');

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const next = (prev + 1) % 16;

        // Use ref to get latest patterns without resetting interval
        const currentPatterns = sequencerPatternsRef.current;

        // Trigger pads for this step
        Object.keys(currentPatterns).forEach(padNum => {
          if (currentPatterns[padNum][next]) {
            console.log(`🎼 Sequencer Step ${next}: Triggering Pad ${padNum}`);
            const triggerFunc = window[`triggerPad${padNum}`];
            if (triggerFunc) {
              triggerFunc(false); // Trigger without looping
            } else {
              console.warn(`⚠️ No trigger function for Pad ${padNum}`);
            }
          }
        });

        return next;
      });
    }, stepDuration);

    return () => clearInterval(interval);
  }, [sequencerPlaying, analysisData?.bpm]); // Removed sequencerPatterns from dependencies


  // Update global rate for components that read it directly
  window.globalPlaybackRate = playbackRate;

  // Update all active audio elements when rate changes
  useEffect(() => {
    document.querySelectorAll('audio').forEach(audio => {
      audio.playbackRate = playbackRate;
    });
  }, [playbackRate]);



  const handleUploadSuccess = (data) => {
    setAnalysisData(data);
    setSliceData(null);
    setSelectedSlice(null);
  };

  const handleSlice = async (filename, bpm, timeSignature, measuresPerSlice, kickOffset = 0) => {
    setIsSlicing(true);
    try {
      const response = await fetch(`${config.API_URL}/slice?filename=${filename}&bpm=${bpm}&time_signature=${timeSignature}&measures_per_slice=${measuresPerSlice}&kick_offset=${kickOffset}`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Validate data structure
        if (data && Array.isArray(data.slices)) {
          setSliceData(data);
        } else {
          console.error('Invalid slice data received:', data);
          alert('Error: Received invalid slice data from server.');
        }
      } else {
        console.error('Slicing failed');
        alert('Slicing failed. Please try again.');
      }
    } catch (error) {
      console.error('Error slicing audio:', error);
    } finally {
      setIsSlicing(false);
    }
  };

  const handleSliceSelect = (slice) => {
    setSelectedSlice(slice);
  };

  // Handle Pad Recording (Global Real-time)
  const handlePadTrigger = (padNumber) => {
    console.log('🎹 Pad triggered:', padNumber, 'REC:', isGlobalRecording, 'Playing:', sequencerPlaying, 'Step:', currentStep);

    // Only record if Global Record is ON
    if (!isGlobalRecording) {
      console.log('⏸️ REC is OFF, not recording');
      return;
    }

    // If sequencer is not playing, start it and record to first step
    if (!sequencerPlaying) {
      console.log('▶️ Starting sequencer and recording to step 0');
      setSequencerPlaying(true);
      setSequencerPatterns(prev => ({
        ...prev,
        [padNumber]: prev[padNumber].map((val, idx) => idx === 0 ? true : val)
      }));
      return;
    }

    // If playing, record to current step
    // Use a safe check for currentStep to ensure it's valid
    const targetStep = currentStep >= 0 ? currentStep : 0;
    console.log('🔴 Recording pad', padNumber, 'to step', targetStep);

    setSequencerPatterns(prev => {
      const newPatterns = { ...prev };
      const padPattern = [...newPatterns[padNumber]];
      padPattern[targetStep] = true;
      newPatterns[padNumber] = padPattern;
      console.log('✅ Pattern updated:', newPatterns[padNumber]);
      return newPatterns;
    });
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-200 py-4 px-4 font-sans selection:bg-pink-500/30">
        <div className="max-w-[1800px] mx-auto">
          {/* Discrete Header */}
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/50 pb-2">
            <div className="flex items-baseline gap-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-400">
                DSAMPLER <span className="text-pink-600">V8.1</span> PRO
              </h1>
              <span className="text-xs text-slate-600 uppercase tracking-widest font-semibold">
                Audio Workstation
              </span>
            </div>
            <div className="text-xs text-slate-600 font-mono">
              v8.1.0-alpha
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            {/* LEFT COLUMN: Tools & Info (2 cols - more compact) */}
            <div className="col-span-12 lg:col-span-2 space-y-4">
              <div className="bg-slate-900/50 rounded border border-slate-800 p-3">
                <h2 className="text-xs font-bold mb-3 text-slate-500 uppercase tracking-wider">Source Audio</h2>
                <FileUpload onUploadSuccess={handleUploadSuccess} />
              </div>

              {analysisData && (
                <AnalysisResult
                  data={analysisData}
                  onSlice={handleSlice}
                />
              )}



              <InfoPanel
                loopMode={loopMode}
                selectedSlice={selectedSlice}
                padAssignments={padAssignments}
              />
            </div>

            {/* CENTER COLUMN: Performance (7 cols) */}
            <div className="col-span-12 lg:col-span-7 space-y-4">
              {isSlicing && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
                  <p className="mt-4 text-slate-500 text-sm">Processing audio...</p>
                </div>
              )}

              {sliceData && (
                <>
                  <TimelineSliceViewer
                    slices={sliceData.slices}
                    jobId={sliceData.job_id}
                    onSliceSelect={handleSliceSelect}
                  />

                  <SamplerPads
                    selectedSlice={selectedSlice}
                    jobId={sliceData.job_id}
                    slices={sliceData.slices}
                    loopMode={loopMode}
                    setLoopMode={setLoopMode}
                    onAssignmentsChange={setPadAssignments}
                    audioContext={audioContextRef.current}
                    effectsChain={effectsChainRef.current}
                    onPadTrigger={handlePadTrigger}
                  />

                  <StepSequencer
                    pads={padAssignments}
                    bpm={analysisData?.bpm || 120}
                    isPlaying={sequencerPlaying}
                    onPlayingChange={setSequencerPlaying}
                    patterns={sequencerPatterns}
                    onPatternsChange={setSequencerPatterns}
                    currentStep={currentStep}
                    isRecording={isGlobalRecording}
                    onRecordToggle={() => setIsGlobalRecording(!isGlobalRecording)}
                  />
                </>
              )}
            </div>

            {/* RIGHT COLUMN: FX & Sequencer (3 cols) */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              {/* Visualizers */}
              <div className="bg-black rounded border border-slate-800 p-3 shadow-inner">
                <h3 className="text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-wider flex justify-between">
                  <span>Master Output</span>
                  <span className="text-green-500">● LIVE</span>
                </h3>
                <VUMeter audioContext={audioContextRef.current} sourceNode={effectsChainRef.current?.masterGain} />
              </div>

              <EffectsPanel
                effectsChain={effectsChainRef.current}
                isBypassed={isEffectsBypassed}
                onToggleBypass={toggleEffectsBypass}
              />

              {/* PayPal Donation Button */}
              <div className="bg-slate-900/50 rounded border border-slate-800 p-4 shadow-lg">
                <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider text-center">
                  Support Development
                </h3>
                <a
                  href="https://paypal.me/MarcosDespujos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">💝</span>
                    <span>Donate via PayPal</span>
                  </div>
                </a>
                <p className="text-[10px] text-slate-600 mt-2 text-center">
                  Help keep DSampler free and updated
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary >
  );
}

export default App;

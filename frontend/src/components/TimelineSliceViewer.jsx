import React, { useState, useRef } from 'react';
import config from '../config';

const TimelineSliceViewer = ({ slices, jobId, onSliceSelect }) => {
    const [selectedSlice, setSelectedSlice] = useState(null);
    const [zoom, setZoom] = useState(1); // 1 = 100%, 2 = 200%, etc.
    const [scrollPosition, setScrollPosition] = useState(0);
    const [playingSlice, setPlayingSlice] = useState(null);
    const containerRef = useRef(null);
    const audioRef = useRef(null);

    if (!slices || slices.length === 0) return null;

    const handleSliceClick = (slice) => {
        // Add a timestamp to force re-trigger even if same slice
        // This makes it work like a sampler/piano
        const sliceWithTimestamp = {
            ...slice,
            clickTimestamp: Date.now()
        };
        setSelectedSlice(sliceWithTimestamp);
        onSliceSelect(sliceWithTimestamp);

        // Play audio preview
        playPreview(slice);
    };

    const playPreview = (slice) => {
        if (audioRef.current) {
            // Stop current audio
            audioRef.current.pause();
            audioRef.current.currentTime = 0;

            // Set new source and play
            const audioUrl = `${config.API_URL}/download/${jobId}/${slice.filename}`;
            audioRef.current.src = audioUrl;
            audioRef.current.play().then(() => {
                setPlayingSlice(slice.measure);
            }).catch(err => {
                console.error('Preview playback failed:', err);
                setPlayingSlice(null);
            });
        }
    };

    const handleAudioEnded = () => {
        setPlayingSlice(null);
    };

    const handleDownload = () => {
        if (selectedSlice) {
            const downloadUrl = `${config.API_URL}/download/${jobId}/${selectedSlice.filename}`;
            window.open(downloadUrl, '_blank');
        }
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.5, 5)); // Max 500%
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.5, 0.5)); // Min 50%
    };

    const handleScroll = (e) => {
        setScrollPosition(e.target.scrollLeft);
    };

    // Calculate total duration for proportional widths
    const totalDuration = slices[slices.length - 1]?.end_time || 1;

    return (
        <div className="mt-4">
            {/* Hidden audio element for preview */}
            <audio ref={audioRef} onEnded={handleAudioEnded} />

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Timeline View 🎵</h3>

                    {/* Download Button */}
                    {selectedSlice && (
                        <button
                            onClick={handleDownload}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold transition-colors flex items-center gap-1 shadow-md uppercase tracking-wider"
                            title="Download selected slice"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download {selectedSlice.measure}
                        </button>
                    )}
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-mono">ZOOM: {Math.round(zoom * 100)}%</span>
                    <div className="flex gap-1">
                        <button
                            onClick={handleZoomOut}
                            disabled={zoom <= 0.5}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors flex items-center gap-1 border border-slate-700"
                            title="Zoom Out"
                        >
                            <span className="text-xs font-bold">-</span>
                        </button>
                        <button
                            onClick={handleZoomIn}
                            disabled={zoom >= 5}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors flex items-center gap-1 border border-slate-700"
                            title="Zoom In"
                        >
                            <span className="text-xs font-bold">+</span>
                        </button>
                        <button
                            onClick={() => setZoom(1)}
                            className="px-2 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 rounded transition-colors text-[10px] uppercase font-bold"
                            title="Reset Zoom"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview hint */}
            <div className="mb-2 text-[10px] text-cyan-400 bg-cyan-950/30 px-3 py-2 rounded border border-cyan-900/50 flex items-center gap-2">
                <span>🎧</span> Click on any slice to preview its sound before assigning to a pad
            </div>

            {/* Timeline container with horizontal scroll */}
            <div className="bg-slate-900 rounded border border-slate-800 p-4 shadow-xl">
                <div
                    ref={containerRef}
                    className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900"
                    onScroll={handleScroll}
                    style={{ maxWidth: '100%' }}
                >
                    <div
                        className="relative h-24 bg-slate-950 rounded flex border border-slate-800"
                        style={{
                            minWidth: `${zoom * 100}%`,
                            width: `${zoom * 100}%`
                        }}
                    >
                        {slices.map((slice, index) => {
                            if (!slice || typeof slice.start_time !== 'number' || typeof slice.end_time !== 'number') {
                                return null;
                            }
                            const widthPercent = ((slice.end_time - slice.start_time) / totalDuration) * 100;
                            const isSelected = selectedSlice?.measure === slice.measure;
                            const isPlaying = playingSlice === slice.measure;

                            return (
                                <div
                                    key={index}
                                    className={`relative flex-shrink-0 cursor-pointer transition-all duration-200 border-r border-slate-900/50 ${isSelected
                                        ? 'bg-cyan-600 hover:bg-cyan-500'
                                        : 'bg-slate-800 hover:bg-slate-700'
                                        }`}
                                    style={{ width: `${widthPercent}%` }}
                                    onClick={() => handleSliceClick(slice)}
                                    title={`Measure ${slice.measure}\n${slice.start_time.toFixed(2)}s - ${slice.end_time.toFixed(2)}s\nClick to preview`}
                                >
                                    {/* Slice number and playing indicator */}
                                    <div className="absolute inset-0 flex items-center justify-center gap-1">
                                        <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-500'
                                            }`}>
                                            {slice.measure}
                                        </span>
                                        {isPlaying && (
                                            <span className="text-white animate-pulse text-xs">🔊</span>
                                        )}
                                    </div>

                                    {/* Hover info */}
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10 border border-slate-700">
                                        {slice.start_time.toFixed(2)}s - {slice.end_time.toFixed(2)}s
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Time markers */}
                <div className="flex justify-between mt-2 text-[10px] text-slate-600 font-mono">
                    <span>0:00</span>
                    <span>{totalDuration.toFixed(2)}s</span>
                </div>

                {/* Removed zoom hint for cleaner UI */}
            </div>
        </div>
    );
};

export default TimelineSliceViewer;

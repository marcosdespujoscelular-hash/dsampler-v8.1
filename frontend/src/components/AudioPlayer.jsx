import React, { useState, useRef, useEffect } from 'react';
import KickExtractorControls from './KickExtractorControls';
import config from '../config';

const AudioPlayer = ({ slice, jobId }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(null);

    useEffect(() => {
        if (audioRef.current && slice) {
            // Stop current playback
            audioRef.current.pause();
            audioRef.current.currentTime = 0; // Reset to beginning
            audioRef.current.load();
            audioRef.current.loop = true; // Enable loop
            audioRef.current.playbackRate = window.globalPlaybackRate || 1.0; // Apply global rate
            setCurrentTime(0);

            // Auto-play from the beginning
            audioRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                })
                .catch((error) => {
                    console.error('Auto-play failed:', error);
                    setIsPlaying(false);
                });
        }
    }, [slice]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newTime = percentage * duration;

        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleDownload = () => {
        window.open(`${config.API_URL}/download/${jobId}/${slice.filename}`, '_blank');
    };

    if (!slice) {
        return (
            <div className="mt-4 p-6 bg-gray-50 rounded-lg text-center text-gray-500">
                Click on a slice in the timeline to play it
            </div>
        );
    }

    return (
        <div className="mt-4 p-6 bg-white rounded-lg shadow-md">
            <audio
                ref={audioRef}
                src={`${config.API_URL}/download/${jobId}/${slice.filename}`}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
            />

            <div className="flex items-center gap-4">
                {/* Play/Pause Button */}
                <button
                    onClick={togglePlay}
                    className="w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                >
                    {isPlaying ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </button>

                {/* Progress Bar */}
                <div className="flex-1">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span className="font-medium">Measure {slice.measure}</span>
                        <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                    <div
                        className="h-2 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
                        onClick={handleSeek}
                    >
                        <div
                            className="h-full bg-blue-600 transition-all"
                            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                        />
                    </div>
                </div>

                {/* Download Button */}
                <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                </button>
            </div>

            {/* Kick Extractor Controls */}
            <KickExtractorControls slice={slice} jobId={jobId} />
        </div>
    );
};

export default AudioPlayer;

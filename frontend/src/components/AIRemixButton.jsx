import React, { useState } from 'react';
import config from '../config';

const AIRemixButton = ({ jobId, bpm, onRemixGenerated }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerateRemix = async () => {
        if (!jobId || !bpm) {
            setError('Please upload and slice audio first');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch(`${config.API_URL}/ai-remix?job_id=${jobId}&bpm=${bpm}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to generate remix');
            }

            const data = await response.json();

            if (onRemixGenerated) {
                onRemixGenerated(data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadRemix = () => {
        if (jobId) {
            window.open(`${config.API_URL}/download-remix/${jobId}`, '_blank');
        }
    };

    return (
        <div className="mt-4 bg-gradient-to-br from-purple-900 to-indigo-900 rounded-lg p-6 shadow-2xl border-2 border-purple-500">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>✨</span>
                    <span>AI Remix Generator</span>
                </h3>
            </div>

            <p className="text-purple-200 text-sm mb-4">
                Let AI analyze your slices and create a unique musical composition with intelligent structure and flow.
            </p>

            <div className="flex gap-2">
                <button
                    onClick={handleGenerateRemix}
                    disabled={isGenerating || !jobId}
                    className={`
                        flex-1 px-6 py-3 rounded-lg font-bold text-white
                        transition-all duration-200 transform
                        ${isGenerating || !jobId
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 hover:scale-105 shadow-lg'
                        }
                    `}
                >
                    {isGenerating ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">🤖</span>
                            <span>Generating...</span>
                        </span>
                    ) : (
                        <span>🎵 Generate AI Remix</span>
                    )}
                </button>

                <button
                    onClick={handleDownloadRemix}
                    disabled={!jobId}
                    className={`
                        px-6 py-3 rounded-lg font-bold text-white
                        transition-all duration-200
                        ${!jobId
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-500'
                        }
                    `}
                    title="Download last generated remix"
                >
                    💾 Download
                </button>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
                    ⚠️ {error}
                </div>
            )}
        </div>
    );
};

export default AIRemixButton;

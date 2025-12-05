import React, { useState } from 'react';
import config from '../config';

const KickExtractorControls = ({ slice, jobId, onKicksExtracted }) => {
    const [isExtracting, setIsExtracting] = useState(false);
    const [enhancementLevel, setEnhancementLevel] = useState(50);
    const [kicksFilename, setKicksFilename] = useState(null);

    const handleExtractKicks = async () => {
        setIsExtracting(true);
        try {
            const response = await fetch(
                `${config.API_URL}/extract-kicks?job_id=${jobId}&filename=${slice.filename}&enhancement_level=${enhancementLevel}`,
                { method: 'POST' }
            );

            if (!response.ok) throw new Error('Kick extraction failed');

            const data = await response.json();
            setKicksFilename(data.kicks_filename);
            if (onKicksExtracted) {
                onKicksExtracted(data.kicks_filename);
            }
        } catch (error) {
            console.error(error);
            alert('Error extracting kicks');
        } finally {
            setIsExtracting(false);
        }
    };

    const handleDownloadKicks = () => {
        if (kicksFilename) {
            window.open(`${config.API_URL}/download-kicks/${jobId}/${slice.filename}`, '_blank');
        }
    };

    if (!slice) return null;

    return (
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <h4 className="text-sm font-semibold text-purple-900 mb-3">🥁 Kick Extraction & Enhancement</h4>

            <div className="space-y-3">
                {/* Enhancement Level Slider */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Enhancement Level: {enhancementLevel}%
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={enhancementLevel}
                        onChange={(e) => setEnhancementLevel(parseInt(e.target.value))}
                        className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        disabled={isExtracting}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Subtle</span>
                        <span>Powerful</span>
                    </div>
                </div>

                {/* Extract Button */}
                <button
                    onClick={handleExtractKicks}
                    disabled={isExtracting}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isExtracting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Extracting Kicks...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                            <span>Extract Kicks Only</span>
                        </>
                    )}
                </button>

                {/* Download Kicks Button */}
                {kicksFilename && (
                    <button
                        onClick={handleDownloadKicks}
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download Kicks</span>
                    </button>
                )}
            </div>

            {kicksFilename && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    ✓ Kicks extracted successfully!
                </div>
            )}
        </div>
    );
};

export default KickExtractorControls;

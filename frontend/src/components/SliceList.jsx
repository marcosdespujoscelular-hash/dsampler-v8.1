import React from 'react';
import config from '../config';

const SliceList = ({ slices, jobId }) => {
    if (!slices || slices.length === 0) return null;

    const handleDownload = (filename) => {
        window.open(`${config.API_URL}/download/${jobId}/${filename}`, '_blank');
    };

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Generated Slices</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {slices.map((slice, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border rounded hover:bg-gray-50">
                        <div>
                            <p className="font-medium">Measure {slice.measure}</p>
                            <p className="text-xs text-gray-500">
                                {slice.start_time.toFixed(2)}s - {slice.end_time.toFixed(2)}s
                            </p>
                        </div>
                        <button
                            onClick={() => handleDownload(slice.filename)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Download
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SliceList;

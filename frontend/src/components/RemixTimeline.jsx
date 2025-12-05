import React from 'react';

const RemixTimeline = ({ remixData }) => {
    if (!remixData) return null;

    const { sequence, categories } = remixData;

    // Color mapping for categories
    const categoryColors = {
        intro: 'from-blue-500 to-blue-600',
        build: 'from-yellow-500 to-orange-600',
        drop: 'from-red-500 to-pink-600',
        breakdown: 'from-green-500 to-teal-600',
        outro: 'from-purple-500 to-indigo-600'
    };

    // Determine category for each slice
    const getCategoryForSlice = (sliceIndex) => {
        for (const [category, indices] of Object.entries(categories)) {
            if (indices.includes(sliceIndex)) {
                return category;
            }
        }
        return 'unknown';
    };

    return (
        <div className="mt-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">🎼 Remix Structure</h3>

            {/* Category Legend */}
            <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(categoryColors).map(([category, gradient]) => (
                    <div key={category} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded bg-gradient-to-r ${gradient}`}></div>
                        <span className="text-xs text-gray-300 capitalize">{category}</span>
                    </div>
                ))}
            </div>

            {/* Sequence Timeline */}
            <div className="space-y-2">
                {sequence.map((item, index) => {
                    const category = getCategoryForSlice(item.slice_index);
                    const gradient = categoryColors[category] || 'from-gray-500 to-gray-600';

                    return (
                        <div key={index} className="flex items-center gap-3">
                            <div className="text-gray-400 text-sm w-8">{index + 1}</div>
                            <div className={`flex-1 bg-gradient-to-r ${gradient} rounded-lg p-3 shadow-md`}>
                                <div className="flex items-center justify-between">
                                    <div className="text-white font-semibold">
                                        Slice {item.slice_index}
                                        <span className="text-xs ml-2 opacity-75 capitalize">({category})</span>
                                    </div>
                                    <div className="text-white/80 text-sm">
                                        × {item.repetitions}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 text-center text-gray-400 text-sm">
                Total: {sequence.reduce((sum, item) => sum + item.repetitions, 0)} slices
            </div>
        </div>
    );
};

export default RemixTimeline;

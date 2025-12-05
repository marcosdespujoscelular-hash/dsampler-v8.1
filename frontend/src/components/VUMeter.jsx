import React, { useEffect, useRef, useState } from 'react';

const VUMeter = ({ audioContext, sourceNode, label = "Master" }) => {
    const canvasRef = useRef(null);
    const analyserRef = useRef(null);
    const [level, setLevel] = useState(0);

    useEffect(() => {
        if (!audioContext || !sourceNode || !canvasRef.current) return;

        // Create analyser
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        // Connect source to analyser (without disrupting audio flow)
        try {
            sourceNode.connect(analyser);
        } catch (e) {
            // Already connected
        }

        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevel = () => {
            if (!analyserRef.current) return;

            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
            const normalizedLevel = avg / 255;

            setLevel(normalizedLevel);

            // Draw on canvas
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                const width = canvas.width;
                const height = canvas.height;

                // Clear
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(0, 0, width, height);

                // Draw level bar
                const barWidth = width * normalizedLevel;

                // Gradient based on level
                const gradient = ctx.createLinearGradient(0, 0, width, 0);
                gradient.addColorStop(0, '#00ff00');
                gradient.addColorStop(0.7, '#ffff00');
                gradient.addColorStop(1, '#ff0000');

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, barWidth, height);

                // Peak indicator
                if (normalizedLevel > 0.9) {
                    ctx.fillStyle = '#ff0000';
                    ctx.fillRect(width - 5, 0, 5, height);
                }
            }

            requestAnimationFrame(updateLevel);
        };

        updateLevel();

        return () => {
            if (analyserRef.current) {
                try {
                    analyserRef.current.disconnect();
                } catch (e) {
                    // Already disconnected
                }
            }
        };
    }, [audioContext, sourceNode]);

    return (
        <div className="vu-meter">
            <label className="block text-gray-300 text-xs font-bold mb-1">
                {label}
            </label>
            <canvas
                ref={canvasRef}
                width={200}
                height={20}
                className="w-full h-5 rounded bg-gray-900"
            />
            <div className="text-gray-400 text-xs mt-1">
                {(level * 100).toFixed(0)}%
            </div>
        </div>
    );
};

export default VUMeter;

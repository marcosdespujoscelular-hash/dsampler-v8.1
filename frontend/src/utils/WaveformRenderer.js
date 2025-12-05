export function drawWaveform(canvas, audioBuffer) {
    if (!canvas || !audioBuffer) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Draw center line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, amp);
    ctx.lineTo(width, amp);
    ctx.stroke();

    // Draw waveform
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (let i = 0; i < width; i++) {
        const sliceStart = i * step;
        const sliceEnd = (i + 1) * step;
        const slice = data.slice(sliceStart, sliceEnd);

        if (slice.length === 0) continue;

        const min = Math.min(...slice);
        const max = Math.max(...slice);

        const y1 = (1 + min) * amp;
        const y2 = (1 + max) * amp;

        ctx.moveTo(i, y1);
        ctx.lineTo(i, y2);
    }

    ctx.stroke();
}

export async function loadAudioBuffer(audioContext, url) {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        return audioBuffer;
    } catch (error) {
        console.error('Error loading audio buffer:', error);
        return null;
    }
}

// AudioRenderer.js - Handles offline rendering and WAV export

export const renderRecording = async (events, padAssignments, bpm) => {
    if (events.length === 0) return null;

    // 1. Quantize Events
    // Calculate beat duration in ms
    const msPerBeat = 60000 / bpm;
    // We'll quantize to 1/4 beats (16th notes) for good resolution
    const quantizeGrid = msPerBeat / 4;

    // Align to first hit
    const triggerEvents = events.filter(e => e.type === 'trigger');
    if (triggerEvents.length === 0) return null;

    const firstEventTime = Math.min(...triggerEvents.map(e => e.time));

    // Process events into "Notes" with start and duration
    // We need to pair triggers with stops
    const notes = [];
    const activeNotes = {}; // pad -> startTime

    // Sort events by time
    const sortedEvents = [...events].sort((a, b) => a.time - b.time);

    sortedEvents.forEach(event => {
        // Shift time relative to first hit
        const relativeTime = Math.max(0, event.time - firstEventTime);
        // Quantize
        const quantizedTime = Math.round(relativeTime / quantizeGrid) * quantizeGrid / 1000; // seconds

        if (event.type === 'trigger') {
            // If this pad is already playing (monophonic cut or fast retrigger), stop previous note
            if (activeNotes[event.pad] !== undefined) {
                // Previous note ends NOW (at the start of this new note)
                const prevNote = activeNotes[event.pad];
                prevNote.duration = quantizedTime - prevNote.startTime;
                notes.push(prevNote);
            }

            // Start new note
            activeNotes[event.pad] = {
                pad: event.pad,
                startTime: quantizedTime,
                duration: null // Unknown yet
            };
        } else if (event.type === 'stop') {
            if (activeNotes[event.pad]) {
                const note = activeNotes[event.pad];
                note.duration = quantizedTime - note.startTime;
                notes.push(note);
                delete activeNotes[event.pad];
            }
        }
    });

    // Add any remaining active notes (played until end of recording or full sample length)
    Object.values(activeNotes).forEach(note => {
        note.duration = 10; // Default max duration if not stopped? Or let it play full buffer?
        // If we set duration to null/undefined, we can let the buffer play out.
        notes.push(note);
    });

    // 2. Prepare Audio Context
    const lastNoteEnd = Math.max(...notes.map(n => n.startTime + (n.duration || 2)));
    const duration = lastNoteEnd + 2; // Add tail
    const sampleRate = 44100;
    const offlineCtx = new OfflineAudioContext(2, duration * sampleRate, sampleRate);

    // 3. Load Audio Buffers
    const bufferMap = {};
    const uniquePadNumbers = [...new Set(notes.map(n => n.pad))];

    await Promise.all(uniquePadNumbers.map(async (padNum) => {
        const assignment = padAssignments[padNum];
        if (assignment && assignment.audioUrl) {
            try {
                const response = await fetch(assignment.audioUrl);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
                bufferMap[padNum] = audioBuffer;
            } catch (error) {
                console.error(`Failed to load audio for pad ${padNum}`, error);
            }
        }
    }));

    // 4. Schedule Sounds
    notes.forEach(note => {
        const buffer = bufferMap[note.pad];
        if (buffer) {
            const source = offlineCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(offlineCtx.destination);
            source.start(note.startTime);

            // If we have a specific duration (because it was stopped), stop the source
            if (note.duration && note.duration > 0) {
                // Better: Gain envelope for release
                const gainNode = offlineCtx.createGain();
                source.disconnect();
                source.connect(gainNode);
                gainNode.connect(offlineCtx.destination);

                const stopTime = note.startTime + note.duration;
                // Prevent negative time values if duration is tiny
                const safeStopTime = Math.max(note.startTime + 0.01, stopTime);

                gainNode.gain.setValueAtTime(1, safeStopTime - 0.05);
                gainNode.gain.linearRampToValueAtTime(0, safeStopTime);
                source.stop(safeStopTime);
            }
        }
    });

    // 5. Render
    const renderedBuffer = await offlineCtx.startRendering();
    return bufferToWav(renderedBuffer);
};

// Helper: Convert AudioBuffer to WAV Blob
function bufferToWav(abuffer) {
    const numOfChan = abuffer.numberOfChannels,
        length = abuffer.length * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [],
        sampleRate = abuffer.sampleRate;

    let offset = 0;
    let pos = 0;

    // write WAVE header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * 2 * numOfChan);         // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit (hardcoded in this example)

    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length

    // write interleaved data
    for (let i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    while (pos < abuffer.length) {
        for (let i = 0; i < numOfChan; i++) {             // interleave channels
            let sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
            view.setInt16(44 + offset, sample, true);          // write 16-bit sample
            offset += 2;
        }
        pos++;
    }

    return new Blob([buffer], { type: "audio/wav" });

    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}

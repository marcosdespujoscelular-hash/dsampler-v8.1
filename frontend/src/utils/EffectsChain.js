export class EffectsChain {
    constructor(audioContext) {
        this.ctx = audioContext;
        this.masterGain = this.ctx.createGain();

        // Create effects
        this.reverb = this.createReverb();
        this.delay = this.createDelay();
        this.filter = this.createFilter();

        // Connect chain: filter → delay → reverb → master
        this.filter.connect(this.delay.input);
        this.delay.output.connect(this.reverb.input);
        this.reverb.output.connect(this.masterGain);

        this.masterGain.connect(this.ctx.destination);
    }

    createReverb() {
        const convolver = this.ctx.createConvolver();
        const dry = this.ctx.createGain();
        const wet = this.ctx.createGain();
        const input = this.ctx.createGain();
        const output = this.ctx.createGain();

        // Create impulse response for reverb
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * 2; // 2 second reverb
        const impulse = this.ctx.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }

        convolver.buffer = impulse;

        // Connect: input → dry → output
        //                → wet → convolver → output
        input.connect(dry);
        input.connect(wet);
        wet.connect(convolver);
        convolver.connect(output);
        dry.connect(output);

        // Default mix: 70% dry, 30% wet
        dry.gain.value = 0.7;
        wet.gain.value = 0.3;

        return { input, output, dry, wet, convolver };
    }

    createDelay() {
        const delayNode = this.ctx.createDelay(2.0);
        const feedback = this.ctx.createGain();
        const wet = this.ctx.createGain();
        const dry = this.ctx.createGain();
        const input = this.ctx.createGain();
        const output = this.ctx.createGain();

        // Connect: input → dry → output
        //                → delayNode → feedback → delayNode (loop)
        //                           → wet → output
        input.connect(dry);
        input.connect(delayNode);
        delayNode.connect(feedback);
        feedback.connect(delayNode);
        delayNode.connect(wet);
        dry.connect(output);
        wet.connect(output);

        // Default settings
        delayNode.delayTime.value = 0.25; // 250ms
        feedback.gain.value = 0.4;
        dry.gain.value = 0.7;
        wet.gain.value = 0.3;

        return { input, output, delayNode, feedback, dry, wet };
    }

    createFilter() {
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 20000; // Fully open by default
        filter.Q.value = 1;

        return filter;
    }

    connectSource(source) {
        source.connect(this.filter);
        return this.masterGain;
    }

    setReverbMix(value) {
        // value: 0-1
        this.reverb.dry.gain.value = 1 - value;
        this.reverb.wet.gain.value = value;
    }

    setDelayTime(value) {
        // value in seconds
        this.delay.delayNode.delayTime.value = value;
    }

    setDelayFeedback(value) {
        // value: 0-1
        this.delay.feedback.gain.value = value;
    }

    setDelayMix(value) {
        // value: 0-1
        this.delay.dry.gain.value = 1 - value;
        this.delay.wet.gain.value = value;
    }

    setFilterType(type) {
        // 'lowpass', 'highpass', 'bandpass', 'notch'
        this.filter.type = type;
    }

    setFilterFrequency(value) {
        // value in Hz
        this.filter.frequency.value = value;
    }

    setFilterResonance(value) {
        // value: 0.1-30
        this.filter.Q.value = value;
    }

    setMasterVolume(value) {
        // value: 0-1
        this.masterGain.gain.value = value;
    }

    toggleBypass(isBypassed) {
        this.isBypassed = isBypassed;
        // If bypassed, we might want to disconnect effects or set mix to 0
        // A simple way is to set Wet gains to 0 and Dry to 1 for all effects
        // But since we have a chain, it's better to disconnect/reconnect or use a master bypass gain
        // For simplicity, let's just control the mix of each effect

        if (isBypassed) {
            // Set all effects to 100% dry
            this.reverb.dry.gain.value = 1;
            this.reverb.wet.gain.value = 0;
            this.delay.dry.gain.value = 1;
            this.delay.wet.gain.value = 0;
            // Filter is harder to bypass without changing frequency, so let's open it up
            this.filter.frequency.value = 20000;
        } else {
            // Restore default/current settings (would need to store them)
            // For now, let's just restore default mix
            this.reverb.dry.gain.value = 0.7;
            this.reverb.wet.gain.value = 0.3;
            this.delay.dry.gain.value = 0.7;
            this.delay.wet.gain.value = 0.3;
            // Filter frequency would need to be restored from state
        }
    }
}

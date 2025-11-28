export const playScanSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1000, ctx.currentTime); // 1000Hz beep
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime); // Volume

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.1); // 100ms duration
    } catch (e) {
        console.error("Audio play failed", e);
    }
};

export const playCashSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();

        // Create a more pleasant cash register sound with multiple tones
        const playTone = (frequency, startTime, duration) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime + startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

            oscillator.start(ctx.currentTime + startTime);
            oscillator.stop(ctx.currentTime + startTime + duration);
        };

        // Cash register "cha-ching" sound
        playTone(800, 0, 0.1);      // First tone
        playTone(1000, 0.05, 0.15); // Second tone (overlapping)
        playTone(1200, 0.1, 0.2);   // Third tone (higher)

    } catch (e) {
        console.error("Cash sound play failed", e);
    }
};

// Sound for adding items to cart
export const playAddToCartSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
        console.error("Add to cart sound failed", e);
    }
};

// Sound for placing an order
export const playPlaceOrderSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();

        // Play a pleasant confirmation sound
        const playTone = (frequency, startTime, duration) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime + startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

            oscillator.start(ctx.currentTime + startTime);
            oscillator.stop(ctx.currentTime + startTime + duration);
        };

        // Confirmation "ding-ding" sound
        playTone(523.25, 0, 0.2);   // C5
        playTone(659.25, 0.1, 0.3); // E5
    } catch (e) {
        console.error("Place order sound failed", e);
    }
};

// Sound for button clicks
export const playButtonClickSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.05);
    } catch (e) {
        console.error("Button click sound failed", e);
    }
};
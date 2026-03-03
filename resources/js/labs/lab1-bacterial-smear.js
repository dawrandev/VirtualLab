/**
 * Lab 1: Bacterial Smear Preparation
 * Alpine.js Component for Virtual Microbiology Laboratory
 */

import Alpine from 'alpinejs';

/**
 * ==================== SOUND MANAGER ====================
 * Web Audio API asosidagi dinamik ovoz effektlari tizimi
 * Barcha tovushlar JavaScript kodida sintez qilinadi
 */
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isInitialized = false;
        this.isMuted = false;

        // Active sound nodes for cleanup
        this.activeSounds = new Map();

        // Burner hum state
        this.burnerHumNode = null;
        this.burnerHumGain = null;
        this.burnerHumActive = false;
    }

    /**
     * AudioContext'ni ishga tushirish (foydalanuvchi interaksiyasidan keyin)
     */
    async init() {
        if (this.isInitialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.audioContext.destination);

            // Resume if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.isInitialized = true;
            console.log('🔊 SoundManager initialized');
        } catch (error) {
            console.warn('Audio initialization failed:', error);
        }
    }

    /**
     * Ovozni o'chirish/yoqish
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : 0.5;
        }
        return this.isMuted;
    }

    /**
     * ==================== GORELKA SHISHILLASHI (Burner Hum) ====================
     * WhiteNoise + LowPass Filter = Doimiy olov shishillashi
     */
    startBurnerHum() {
        if (!this.isInitialized || this.burnerHumActive || this.isMuted) return;

        try {
            // White noise generator
            const bufferSize = 2 * this.audioContext.sampleRate;
            const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const output = noiseBuffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            this.burnerHumNode = this.audioContext.createBufferSource();
            this.burnerHumNode.buffer = noiseBuffer;
            this.burnerHumNode.loop = true;

            // Low-pass filter for fire-like sound
            const lowPassFilter = this.audioContext.createBiquadFilter();
            lowPassFilter.type = 'lowpass';
            lowPassFilter.frequency.value = 200;
            lowPassFilter.Q.value = 1;

            // Bandpass for more realistic fire sound
            const bandPassFilter = this.audioContext.createBiquadFilter();
            bandPassFilter.type = 'bandpass';
            bandPassFilter.frequency.value = 150;
            bandPassFilter.Q.value = 0.5;

            // Gain with fade in
            this.burnerHumGain = this.audioContext.createGain();
            this.burnerHumGain.gain.value = 0;

            // Connect nodes
            this.burnerHumNode.connect(lowPassFilter);
            lowPassFilter.connect(bandPassFilter);
            bandPassFilter.connect(this.burnerHumGain);
            this.burnerHumGain.connect(this.masterGain);

            // Start and fade in
            this.burnerHumNode.start();
            this.burnerHumGain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.3);

            // Add subtle crackling variation
            this.startBurnerCrackle();

            this.burnerHumActive = true;
        } catch (error) {
            console.warn('Burner hum error:', error);
        }
    }

    /**
     * Gorelka shishillashini to'xtatish
     */
    stopBurnerHum() {
        if (!this.burnerHumActive || !this.burnerHumGain) return;

        try {
            // Fade out
            this.burnerHumGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);

            // Stop after fade
            setTimeout(() => {
                if (this.burnerHumNode) {
                    this.burnerHumNode.stop();
                    this.burnerHumNode.disconnect();
                    this.burnerHumNode = null;
                }
                this.stopBurnerCrackle();
            }, 500);

            this.burnerHumActive = false;
        } catch (error) {
            console.warn('Stop burner hum error:', error);
        }
    }

    /**
     * Olov uchun qitirlovchi effekt
     */
    startBurnerCrackle() {
        if (this.crackleInterval) return;

        this.crackleInterval = setInterval(() => {
            if (!this.burnerHumActive || this.isMuted) return;

            // Random crackle
            if (Math.random() > 0.7) {
                this.playCrackle();
            }
        }, 200);
    }

    stopBurnerCrackle() {
        if (this.crackleInterval) {
            clearInterval(this.crackleInterval);
            this.crackleInterval = null;
        }
    }

    playCrackle() {
        if (!this.isInitialized || this.isMuted) return;

        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sawtooth';
            osc.frequency.value = 80 + Math.random() * 60;

            gain.gain.value = 0.03;
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            osc.stop(this.audioContext.currentTime + 0.05);
        } catch (error) {}
    }

    /**
     * ==================== MUVAFFAQIYAT SIGNALI (Success Ping) ====================
     * Yuqori chastotali, yoqimli "ding" ovozi
     */
    playSuccessPing() {
        if (!this.isInitialized || this.isMuted) return;

        try {
            const now = this.audioContext.currentTime;

            // Primary tone
            const osc1 = this.audioContext.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.value = 880; // A5

            // Harmonic overtone
            const osc2 = this.audioContext.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.value = 1320; // E6

            // Third harmonic for richness
            const osc3 = this.audioContext.createOscillator();
            osc3.type = 'triangle';
            osc3.frequency.value = 1760; // A6

            // Gain envelopes
            const gain1 = this.audioContext.createGain();
            const gain2 = this.audioContext.createGain();
            const gain3 = this.audioContext.createGain();

            gain1.gain.setValueAtTime(0.3, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

            gain2.gain.setValueAtTime(0.15, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

            gain3.gain.setValueAtTime(0.08, now);
            gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            // Connect
            osc1.connect(gain1);
            osc2.connect(gain2);
            osc3.connect(gain3);
            gain1.connect(this.masterGain);
            gain2.connect(this.masterGain);
            gain3.connect(this.masterGain);

            // Play
            osc1.start(now);
            osc2.start(now);
            osc3.start(now);
            osc1.stop(now + 0.8);
            osc2.stop(now + 0.6);
            osc3.stop(now + 0.4);
        } catch (error) {
            console.warn('Success ping error:', error);
        }
    }

    /**
     * ==================== XATO SIGNALI (Error Buzz) ====================
     * Past chastotali, yoqimsiz "buzz" ovozi
     */
    playErrorBuzz() {
        if (!this.isInitialized || this.isMuted) return;

        try {
            const now = this.audioContext.currentTime;

            // Low frequency buzz
            const osc1 = this.audioContext.createOscillator();
            osc1.type = 'sawtooth';
            osc1.frequency.value = 110;

            // Dissonant tone
            const osc2 = this.audioContext.createOscillator();
            osc2.type = 'square';
            osc2.frequency.value = 116; // Slightly detuned for unpleasant beating

            // Gain envelopes
            const gain1 = this.audioContext.createGain();
            const gain2 = this.audioContext.createGain();

            gain1.gain.setValueAtTime(0.2, now);
            gain1.gain.linearRampToValueAtTime(0, now + 0.3);

            gain2.gain.setValueAtTime(0.15, now);
            gain2.gain.linearRampToValueAtTime(0, now + 0.3);

            // Low pass filter for muffled sound
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400;

            // Connect
            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gain1);
            gain1.connect(this.masterGain);

            // Play
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.3);
            osc2.stop(now + 0.3);
        } catch (error) {
            console.warn('Error buzz error:', error);
        }
    }

    /**
     * ==================== TOMCHI OVOZI (Drop Sound) ====================
     * Suyuqlik tomishi uchun
     */
    playDropSound() {
        if (!this.isInitialized || this.isMuted) return;

        try {
            const now = this.audioContext.currentTime;

            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);

            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 0.15);
        } catch (error) {
            console.warn('Drop sound error:', error);
        }
    }

    /**
     * ==================== METALL TEGISH OVOZI (Metal Clink) ====================
     * Halqa va shisha tegishishi uchun
     */
    playMetalClink() {
        if (!this.isInitialized || this.isMuted) return;

        try {
            const now = this.audioContext.currentTime;

            // High frequency ping
            const osc1 = this.audioContext.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.value = 2000 + Math.random() * 500;

            // Metallic overtone
            const osc2 = this.audioContext.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.value = 4500 + Math.random() * 500;

            const gain1 = this.audioContext.createGain();
            const gain2 = this.audioContext.createGain();

            gain1.gain.setValueAtTime(0.1, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            gain2.gain.setValueAtTime(0.05, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

            // High pass for metallic sound
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 1500;

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gain1);
            gain1.connect(this.masterGain);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.2);
            osc2.stop(now + 0.1);
        } catch (error) {
            console.warn('Metal clink error:', error);
        }
    }

    /**
     * ==================== SURTISH OVOZI (Smear Sound) ====================
     * Oynada surtish uchun
     */
    playSmearSound() {
        if (!this.isInitialized || this.isMuted) return;

        try {
            const now = this.audioContext.currentTime;

            // Pink noise for friction
            const bufferSize = this.audioContext.sampleRate * 0.1;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
                b6 = white * 0.115926;
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;

            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 3000;
            filter.Q.value = 1;

            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.1);

            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            source.start(now);
        } catch (error) {
            console.warn('Smear sound error:', error);
        }
    }

    /**
     * ==================== SUV OQISHI OVOZI (Water Flow) ====================
     */
    playWaterFlow() {
        if (!this.isInitialized || this.isMuted) return;

        try {
            const now = this.audioContext.currentTime;
            const duration = 1.2;

            // White noise for water
            const bufferSize = this.audioContext.sampleRate * duration;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;

            // Bandpass filter for water-like sound
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 2500;
            filter.Q.value = 0.5;

            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
            gain.gain.linearRampToValueAtTime(0.1, now + duration - 0.3);
            gain.gain.linearRampToValueAtTime(0, now + duration);

            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            source.start(now);
            source.stop(now + duration);
        } catch (error) {
            console.warn('Water flow error:', error);
        }
    }

    /**
     * ==================== TUGMA BOSILISHI (Button Click) ====================
     */
    playButtonClick() {
        if (!this.isInitialized || this.isMuted) return;

        try {
            const now = this.audioContext.currentTime;

            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 0.05);
        } catch (error) {}
    }

    /**
     * ==================== FINAL FANFARA (Completion Fanfare) ====================
     * Laboratoriya tugaganda
     */
    playCompletionFanfare() {
        if (!this.isInitialized || this.isMuted) return;

        try {
            const now = this.audioContext.currentTime;

            // Arpeggio notes
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

            notes.forEach((freq, index) => {
                const osc = this.audioContext.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;

                const gain = this.audioContext.createGain();
                const startTime = now + index * 0.15;

                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.start(startTime);
                osc.stop(startTime + 0.8);
            });

            // Final chord
            setTimeout(() => {
                const chordFreqs = [523.25, 659.25, 783.99];
                chordFreqs.forEach(freq => {
                    const osc = this.audioContext.createOscillator();
                    osc.type = 'triangle';
                    osc.frequency.value = freq;

                    const gain = this.audioContext.createGain();
                    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.5);

                    osc.connect(gain);
                    gain.connect(this.masterGain);

                    osc.start();
                    osc.stop(this.audioContext.currentTime + 1.5);
                });
            }, 600);
        } catch (error) {
            console.warn('Completion fanfare error:', error);
        }
    }

    /**
     * Barcha ovozlarni to'xtatish
     */
    stopAll() {
        this.stopBurnerHum();
        this.stopBurnerCrackle();
    }

    /**
     * Tozalash
     */
    dispose() {
        this.stopAll();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.isInitialized = false;
    }
}

// Global SoundManager instance
const soundManager = new SoundManager();

/**
 * ==================== TRANSLATIONS (i18n) ====================
 * 3 tilli qo'llab-quvvatlash: O'zbek, Qoraqolpoq, Rus
 */
const translations = {
    uz: {
        // Page titles
        pageTitle: 'Bakterial surtma tayyorlash',
        pageSubtitle: 'Virtual mikrobiologiya laboratoriyasi - Lab 1',

        // Header
        progress: 'Jarayon',
        soundOn: 'Ovoz yoqilgan',
        soundOff: 'Ovoz o\'chirilgan',

        // Status badges
        statusSterilized: 'Sterillandi',
        statusSampleTaken: 'Namuna olindi',
        statusSmearReady: 'Surtma tayyor',
        statusFixed: 'Fiksatsiya',
        statusDyed: 'Bo\'yaldi',
        statusWashed: 'Yuvildi',

        // Tools panel
        toolsTitle: 'Asboblar',
        toolLoop: 'Bakterial halqa',
        toolSlide: 'Buyum oynasi',
        toolTube: 'Namuna probirkasi',
        loopSterilized: 'Sterillangan',
        smearReady: 'Surtma tayyor',

        // Workbench
        workbenchTitle: 'Ish stoli',
        burnerLabel: 'Olov',
        sampleLabel: 'Namuna',
        gentianViolet: 'Gencian fiolet',
        distilledWater: 'Distillangan suv',

        // Loop labels
        loopDragToFlame: 'Olovga suring',
        loopHeating: 'Qizdirmoqda...',
        loopDragToTube: 'Probirkaga suring',
        loopSmearProgress: 'Aylana surtish',

        // Steps panel
        stepsTitle: 'Bosqichlar',
        step1: 'Sterillash',
        step2: 'Namuna olish',
        step3: 'Surtma',
        step4: 'Fiksatsiya',
        step5: 'Bo\'yash/Yuvish',
        resetBtn: 'Qayta boshlash',

        // Stage progress
        stageProgressTitle: 'Bosqich progress',
        stage4Title: 'Fiksatsiya',
        stage5Title: 'Bo\'yash/Yuvish',
        waiting: 'Kutilmoqda',
        ready: 'Tayyor',
        completed: 'Tugallandi',

        // Staining controls
        stainingTitle: 'Vizual bo\'yash',
        stainingDesc: 'Pipetkalarni oynaga tomizing: avval bo\'yoq, keyin suv.',
        reactionTime: 'Reaksiya vaqti',
        washNow: 'Endi suv bilan yuving!',
        viewMicroscope: 'Mikroskopga o\'tish',

        // Modal
        modalStep: 'Bosqich',
        modalUnderstand: 'Tushundim, boshlang',
        modalNext: 'Keyingi bosqich',

        // Step descriptions
        step1Title: 'Halqani sterillash',
        step1Desc: 'Bakterial halqani Bunzen gorelkasining olov ustiga olib boring va 3 soniya davomida qizdiring. Halqa qizarib ketishi kerak - bu barcha yot mikroblarni o\'ldiradi va kontaminatsiyani oldini oladi.',
        step2Title: 'Namuna olish',
        step2Desc: 'Sterillangan halqani bakterial kultura probirkasiga ehtiyotkorlik bilan kiriting. Halqa uchini suyuqlikka botirib, oz miqdorda namuna oling.',
        step3Title: 'Surtma yaratish',
        step3Desc: 'Namuna olgan halqani buyum oynasi ustiga qo\'ying va namunani tekis, yupqa qatlamda suring. Namuna shisha butun yuzasiga bir tekis yoyilishi kerak.',
        step4Title: 'Termik fiksatsiya',
        step4Desc: 'Surtma qilingan buyum oynasini olov ustiga olib boring. Issiqlik ta\'sirida bakteriyalar oynaga yopishib qoladi.',
        step5Title: 'Bo\'yash va yuvish',
        step5Desc: 'Surtmaga Gencian fioletni to\'liq quying va keyin suv bilan yuvish bosqichini bajaring.',

        // Results
        resultTitle: 'Yakuniy natija',
        resultSubtitle: 'Dinamik mikroskop natijasi va baholash hisobot',
        totalScore: 'Umumiy ball',
        category: 'Baholash toifasi',
        categoryFull: 'To\'liq javob',
        categoryPartial: 'To\'liq emas javob',
        categoryNone: 'Javob yo\'q',
        criteriaTitle: 'Mezon',
        criteriaScore: 'Ball',
        critSterilization: 'Sterillash',
        critSampling: 'Namuna olish',
        critSmear: 'Surtma',
        critFixation: 'Fiksatsiya',
        critDye: 'Bo\'yash',
        critWashing: 'Yuvish',
        errorsTitle: 'Xatolar',
        scoreInfo: 'To\'liq javob: 9-10 | To\'liq emas: 5-8.5 | Javob yo\'q: 0-4.5',

        // Error messages
        errLoopNotHeld: 'Halqa olovda ushlanmadi.',
        errSterilizationShort: 'Sterillash vaqti 3 soniyadan kam bo\'ldi.',
        errUnsterilizedSample: 'Namuna sterillanmagan halqa bilan olindi.',
        errSmearIncomplete: 'Surtma uchun halqani oynada aylana qilib bir necha marta surting.',
        errSmearNotInTarget: 'Surtma target-area ichida to\'g\'ri bajarilmadi.',
        errFixationCount: 'Fiksatsiya {count} marta bajarildi (ideal: 3).',
        errWashBeforeDye: 'Yuvishdan oldin bo\'yoq tomizilishi kerak.',
        errNoWaitTime: 'Bo\'yoq reaksiyasi uchun kamida 5-10 soniya kutilmadi.',
        errNoDyeBeforeMicroscope: 'Mikroskopga o\'tishdan oldin bo\'yoq tomizilmadi.',
        errNoWashBeforeMicroscope: 'Bo\'yoq yuvilmasdan mikroskopga o\'tildi, natija buzildi.',

        // Footer
        footerTitle: 'Tibbiy Virtual Laboratoriya',
        footerSubtitle: 'Ta\'limiy simulyatsiya',

        // Language names
        langUz: 'O\'zbekcha',
        langKaa: 'Qaraqalpaqsha',
        langRu: 'Ruscha'
    },

    kaa: {
        // Page titles
        pageTitle: 'Bakterial sürtpe tayarlaw',
        pageSubtitle: 'Virtual mikrobiologiya laboratoriyası - Lab 1',

        // Header
        progress: 'Barísi',
        soundOn: 'Ses qosılǵan',
        soundOff: 'Ses óshirilgen',

        // Status badges
        statusSterilized: 'Sterillendi',
        statusSampleTaken: 'Úlgi alındı',
        statusSmearReady: 'Sürtpe tayar',
        statusFixed: 'Fiksatsiya',
        statusDyed: 'Boyaldı',
        statusWashed: 'Juwıldı',

        // Tools panel
        toolsTitle: 'Ásbaplar',
        toolLoop: 'Bakterial ilmek',
        toolSlide: 'Buyım aynası',
        toolTube: 'Úlgi probirkası',
        loopSterilized: 'Sterillengen',
        smearReady: 'Sürtpe tayar',

        // Workbench
        workbenchTitle: 'Jumıs stolı',
        burnerLabel: 'Jalın',
        sampleLabel: 'Úlgi',
        gentianViolet: 'Gensian fiolet',
        distilledWater: 'Distillengen suw',

        // Loop labels
        loopDragToFlame: 'Jalınǵa tartıń',
        loopHeating: 'Qızdırılmaqta...',
        loopDragToTube: 'Probirkaga tartıń',
        loopSmearProgress: 'Aylanma sürtpelew',

        // Steps panel
        stepsTitle: 'Basqıshlar',
        step1: 'Sterillew',
        step2: 'Úlgi alıw',
        step3: 'Sürtpe',
        step4: 'Fiksatsiya',
        step5: 'Boyaw/Juwıw',
        resetBtn: 'Qayta baslaw',

        // Stage progress
        stageProgressTitle: 'Basqısh progressi',
        stage4Title: 'Fiksatsiya',
        stage5Title: 'Boyaw/Juwıw',
        waiting: 'Kútilmekte',
        ready: 'Tayar',
        completed: 'Tamamlandı',

        // Staining controls
        stainingTitle: 'Vizual boyaw',
        stainingDesc: 'Pipetkaları aynaga tamızıń: aldı boyaq, keyin suw.',
        reactionTime: 'Reaksiya waqtı',
        washNow: 'Endi suw menen juwıń!',
        viewMicroscope: 'Mikroskopqaótıw',

        // Modal
        modalStep: 'Basqısh',
        modalUnderstand: 'Túsindim, baslaymız',
        modalNext: 'Keyingi basqısh',

        // Step descriptions
        step1Title: 'İlmekti sterillew',
        step1Desc: 'Bakterial ilmekti Bunzen gorelkasınıń jalınıústine alıp barıń hám 3 sekund dawamında qızdırıń. İlmek qızarıp ketiwi kerek - bul barlıq mikroblardı óltiredi.',
        step2Title: 'Úlgi alıw',
        step2Desc: 'Sterillengen ilmekti bakterial kultura probirkasına ehtiyatkorlik penen kiritiń. İlmek ushın suyıqlıqqa batırıp, az múgdarda úlgi alıń.',
        step3Title: 'Sürtpe jaratıw',
        step3Desc: 'Úlgi alǵan ilmekti buyım aynası üstine qoyıń hám úlgini tegis, jupqa qatlamda surtıń.',
        step4Title: 'Termik fiksatsiya',
        step4Desc: 'Sürtpe qılınǵan buyım aynasın jalın üstine alıp barıń. Isıqlıq tásirinde bakteriyalar aynaga jabısıp qaladi.',
        step5Title: 'Boyaw hám juwıw',
        step5Desc: 'Sürtpege Gensian fioletti tolıq quyıń hám keyin suw menen juwıw basqıshın orınlań.',

        // Results
        resultTitle: 'Juwmaqlawshı nátiyje',
        resultSubtitle: 'Dinamik mikroskop nátiyjes hám bahalaw есеби',
        totalScore: 'Ulıwma ball',
        category: 'Bahalaw kategoriyası',
        categoryFull: 'Tolıq juwap',
        categoryPartial: 'Tolıq emes juwap',
        categoryNone: 'Juwap joq',
        criteriaTitle: 'Kriteriya',
        criteriaScore: 'Ball',
        critSterilization: 'Sterillew',
        critSampling: 'Úlgi alıw',
        critSmear: 'Sürtpe',
        critFixation: 'Fiksatsiya',
        critDye: 'Boyaw',
        critWashing: 'Juwıw',
        errorsTitle: 'Qátelikler',
        scoreInfo: 'Tolıq juwap: 9-10 | Tolıq emes: 5-8.5 | Juwap joq: 0-4.5',

        // Error messages
        errLoopNotHeld: 'İlmek jalında uslanbadı.',
        errSterilizationShort: 'Sterillew waqtı 3 sekundtan az boldı.',
        errUnsterilizedSample: 'Úlgi sterillenbegenilmek penen alındı.',
        errSmearIncomplete: 'Sürtpe ushın ilmekti aynada aylanma etip bir neshe ret surtıń.',
        errSmearNotInTarget: 'Sürtpe target-area ishinde durıs orınlanmadı.',
        errFixationCount: 'Fiksatsiya {count} ret orınlandı (ideal: 3).',
        errWashBeforeDye: 'Juwıwdan aldın boyaq tamızılıwı kerek.',
        errNoWaitTime: 'Boyaq reaksiyası ushın keminde 5-10 sekund kútilmedi.',
        errNoDyeBeforeMicroscope: 'Mikroskopqa ótiw aldında boyaq tamızılmadı.',
        errNoWashBeforeMicroscope: 'Boyaq juwılmay mikroskopqa ótildi, nátiyje buzıldı.',

        // Footer
        footerTitle: 'Meditsinalıq Virtual Laboratoriya',
        footerSubtitle: 'Oqıw simulyatsiyası',

        // Language names
        langUz: 'Ózbeksha',
        langKaa: 'Qaraqalpaqsha',
        langRu: 'Russha'
    },

    ru: {
        // Page titles
        pageTitle: 'Приготовление бактериального мазка',
        pageSubtitle: 'Виртуальная микробиологическая лаборатория - Лаб 1',

        // Header
        progress: 'Прогресс',
        soundOn: 'Звук включен',
        soundOff: 'Звук выключен',

        // Status badges
        statusSterilized: 'Стерилизовано',
        statusSampleTaken: 'Образец взят',
        statusSmearReady: 'Мазок готов',
        statusFixed: 'Фиксация',
        statusDyed: 'Окрашено',
        statusWashed: 'Промыто',

        // Tools panel
        toolsTitle: 'Инструменты',
        toolLoop: 'Бактериальная петля',
        toolSlide: 'Предметное стекло',
        toolTube: 'Пробирка с образцом',
        loopSterilized: 'Стерилизована',
        smearReady: 'Мазок готов',

        // Workbench
        workbenchTitle: 'Рабочий стол',
        burnerLabel: 'Пламя',
        sampleLabel: 'Образец',
        gentianViolet: 'Генциан фиолет',
        distilledWater: 'Дистиллированная вода',

        // Loop labels
        loopDragToFlame: 'Перетащите к пламени',
        loopHeating: 'Нагревается...',
        loopDragToTube: 'Перетащите к пробирке',
        loopSmearProgress: 'Круговое нанесение',

        // Steps panel
        stepsTitle: 'Этапы',
        step1: 'Стерилизация',
        step2: 'Взятие образца',
        step3: 'Мазок',
        step4: 'Фиксация',
        step5: 'Окраска/Промывка',
        resetBtn: 'Начать заново',

        // Stage progress
        stageProgressTitle: 'Прогресс этапа',
        stage4Title: 'Фиксация',
        stage5Title: 'Окраска/Промывка',
        waiting: 'Ожидание',
        ready: 'Готово',
        completed: 'Завершено',

        // Staining controls
        stainingTitle: 'Визуальная окраска',
        stainingDesc: 'Нанесите на стекло: сначала краситель, затем воду.',
        reactionTime: 'Время реакции',
        washNow: 'Теперь промойте водой!',
        viewMicroscope: 'К микроскопу',

        // Modal
        modalStep: 'Этап',
        modalUnderstand: 'Понятно, начинаем',
        modalNext: 'Следующий этап',

        // Step descriptions
        step1Title: 'Стерилизация петли',
        step1Desc: 'Поднесите бактериальную петлю к пламени горелки Бунзена и держите 3 секунды. Петля должна раскалиться - это убивает все микробы и предотвращает контаминацию.',
        step2Title: 'Взятие образца',
        step2Desc: 'Осторожно введите стерилизованную петлю в пробирку с бактериальной культурой. Погрузите кончик петли в жидкость и возьмите небольшое количество образца.',
        step3Title: 'Создание мазка',
        step3Desc: 'Поместите петлю с образцом на предметное стекло и равномерно распределите образец тонким слоем по поверхности.',
        step4Title: 'Термическая фиксация',
        step4Desc: 'Поднесите стекло с мазком к пламени. Под действием тепла бактерии прикрепляются к стеклу.',
        step5Title: 'Окраска и промывка',
        step5Desc: 'Нанесите генциан фиолет на мазок, затем промойте водой.',

        // Results
        resultTitle: 'Итоговый результат',
        resultSubtitle: 'Динамический результат микроскопии и отчет оценки',
        totalScore: 'Общий балл',
        category: 'Категория оценки',
        categoryFull: 'Полный ответ',
        categoryPartial: 'Неполный ответ',
        categoryNone: 'Нет ответа',
        criteriaTitle: 'Критерий',
        criteriaScore: 'Балл',
        critSterilization: 'Стерилизация',
        critSampling: 'Взятие образца',
        critSmear: 'Мазок',
        critFixation: 'Фиксация',
        critDye: 'Окраска',
        critWashing: 'Промывка',
        errorsTitle: 'Ошибки',
        scoreInfo: 'Полный ответ: 9-10 | Неполный: 5-8.5 | Нет ответа: 0-4.5',

        // Error messages
        errLoopNotHeld: 'Петля не была удержана в пламени.',
        errSterilizationShort: 'Время стерилизации менее 3 секунд.',
        errUnsterilizedSample: 'Образец взят нестерилизованной петлей.',
        errSmearIncomplete: 'Для мазка нужно круговыми движениями нанести образец на стекло.',
        errSmearNotInTarget: 'Мазок не нанесен правильно в целевую область.',
        errFixationCount: 'Фиксация выполнена {count} раз (идеально: 3).',
        errWashBeforeDye: 'Перед промывкой нужно нанести краситель.',
        errNoWaitTime: 'Не выдержано время реакции красителя (5-10 сек).',
        errNoDyeBeforeMicroscope: 'Краситель не нанесен перед переходом к микроскопу.',
        errNoWashBeforeMicroscope: 'Переход к микроскопу без промывки, результат искажен.',

        // Footer
        footerTitle: 'Медицинская Виртуальная Лаборатория',
        footerSubtitle: 'Учебная симуляция',

        // Language names
        langUz: 'Узбекский',
        langKaa: 'Каракалпакский',
        langRu: 'Русский'
    }
};

// Register component before Alpine starts
Alpine.data('bacterialSmearLab', () => ({
    // Language state
    currentLang: 'uz',

    // Drag state
    isDragging: false,
    draggedItem: null,
    dragOffset: { x: 0, y: 0 },
    hoveredZone: null,

    // Drag direction tracking for loop bending
    dragDirection: null,
    lastDragX: 0,
    lastDragY: 0,
    dragVelocityX: 0,
    dragVelocityY: 0,

    // Steam effect state
    showSteam: false,
    dyeDropAnimating: false,

    // Audio state
    soundEnabled: true,
    soundInitialized: false,

    // Item positions (absolute positioning within workbench)
    itemPositions: {
        loop: { x: 50, y: 100 },
        slide: { x: 25, y: 395 },
        dyePipette: { x: 430, y: 248 },
        waterPipette: { x: 430, y: 336 }
    },

    // Experiment state
    state: {
        isSterilized: false,
        hasSample: false,
        isSmearCreated: false,
        isFixed: false,
        isDyed: false,
        isWashed: false
    },

    sterilizationProgress: 0,
    liquidLevel: 60,
    sterilizationInterval: null,
    sterilizationHoldMs: 0,
    heatingStartAt: null,
    sterilizationSeconds: 0,

    // Heating state
    isHeating: false,

    // Smearing state
    isSmearing: false,
    smearLines: [],
    lastLoopCenterX: 0,
    sampleDipCount: 0,
    sampleDipTarget: 3,
    smearRequiredTurns: 2,
    smearOrbitAccum: 0,
    smearOrbitTurns: 0,
    smearPrevAngle: null,
    smearCompleted: false,
    fixationPasses: 0,
    isFixing: false,
    dyeCoverage: 0,
    isDyeSpreadVisible: false,
    isDyeMatured: false,
    isRunoffAnimating: false,
    stainingWaitRequired: 7,
    stainingTimeLeft: 0,
    stainingTimer: null,
    canWashNow: false,
    resultSceneVisible: false,
    bacteriaParticles: [],

    // Scoring state
    userScore: 0,
    errors: [],
    stepScores: {
        sterilization: 0,
        sampling: 0,
        smear: 0,
        fixation: 0,
        dye: 0,
        washing: 0
    },

    // Modal state
    showModal: true,
    currentStep: 1,
    modalViewed: { 1: false, 2: false, 3: false, 4: false, 5: false },

    // Steps data (O'zbek tilida)
    steps: {
        1: {
            title: 'Halqani sterillash',
            description: 'Bakterial halqani Bunzen gorelkasining olov ustiga olib boring va 3 soniya davomida qizdiring. Halqa qizarib ketishi kerak - bu barcha yot mikroblarni o\'ldiradi va kontaminatsiyani oldini oladi.',
            animationType: 'sterilization',
            animationHTML: `
                <svg class="step-svg" viewBox="0 0 240 220" aria-label="Sterillash animatsiyasi">
                    <rect x="90" y="176" width="60" height="18" rx="5" fill="#334155"></rect>
                    <rect x="108" y="132" width="24" height="44" rx="3" fill="#64748b"></rect>
                    <rect x="96" y="116" width="48" height="18" rx="10" fill="#475569"></rect>
                    <g class="step1-flame">
                        <ellipse cx="120" cy="93" rx="18" ry="30" fill="#2563eb"></ellipse>
                        <ellipse cx="120" cy="98" rx="9" ry="16" fill="#fef3c7"></ellipse>
                    </g>
                    <g class="step1-loop">
                        <line x1="174" y1="144" x2="158" y2="106" stroke="#64748b" stroke-width="5" stroke-linecap="round"></line>
                        <circle cx="152" cy="92" r="14" fill="none" stroke="#f97316" stroke-width="5"></circle>
                    </g>
                </svg>
            `
        },
        2: {
            title: 'Namuna olish',
            description: 'Sterillangan halqani bakterial kultura probirkasiga ehtiyotkorlik bilan kiriting. Halqa uchini suyuqlikka botirib, oz miqdorda namuna oling. Probirkadagi suyuqlik darajasi kamayadi.',
            animationType: 'sampling',
            animationHTML: `
                <svg class="step-svg" viewBox="0 0 240 220" aria-label="Namuna olish animatsiyasi">
                    <rect x="84" y="56" width="48" height="22" rx="4" fill="#374151"></rect>
                    <rect x="86" y="74" width="44" height="112" rx="8" fill="rgba(209,213,219,0.5)" stroke="#94a3b8" stroke-width="2"></rect>
                    <rect x="88" y="128" width="40" height="54" rx="0" fill="rgba(34,197,94,0.45)"></rect>
                    <g class="step2-loop">
                        <line x1="176" y1="54" x2="150" y2="96" stroke="#ef4444" stroke-width="5" stroke-linecap="round"></line>
                        <circle cx="144" cy="108" r="12" fill="none" stroke="#ef4444" stroke-width="5"></circle>
                    </g>
                </svg>
            `
        },
        3: {
            title: 'Surtma yaratish',
            description: 'Namuna olgan halqani buyum oynasi (slide) ustiga qo\'ying va namunani tekis, yupqa qatlamda suring. Namuna shisha butun yuzasiga bir tekis yoyilishi kerak.',
            animationType: 'smearing',
            animationHTML: `
                <svg class="step-svg" viewBox="0 0 240 220" aria-label="Surtma tayyorlash animatsiyasi">
                    <rect x="34" y="90" width="172" height="52" rx="5" fill="rgba(248,250,252,0.9)" stroke="#94a3b8" stroke-width="2"></rect>
                    <ellipse cx="120" cy="116" rx="58" ry="14" fill="rgba(139,92,246,0.25)"></ellipse>
                    <path d="M66 116 C78 103, 162 103, 174 116 C162 129, 78 129, 66 116 Z" fill="none" stroke="#7c3aed" stroke-width="3" stroke-dasharray="6 6"></path>
                    <g class="step3-loop">
                        <line x1="120" y1="78" x2="120" y2="94" stroke="#ef4444" stroke-width="4" stroke-linecap="round"></line>
                        <circle cx="120" cy="103" r="8" fill="none" stroke="#ef4444" stroke-width="3"></circle>
                    </g>
                </svg>
            `
        },
        4: {
            title: 'Termik fiksatsiya',
            description: 'Surtma qilingan buyum oynasini olov ustiga olib boring. Issiqlik ta\'sirida bakteriyalar oynaga yopishib qoladi va keyinchalik bo\'yash jarayonida yuvilib ketmaydi.',
            animationType: 'fixation',
            animationHTML: `
                <svg class="step-svg" viewBox="0 0 240 220" aria-label="Fiksatsiya animatsiyasi">
                    <rect x="94" y="176" width="52" height="16" rx="5" fill="#334155"></rect>
                    <rect x="108" y="132" width="24" height="44" rx="3" fill="#64748b"></rect>
                    <rect x="96" y="116" width="48" height="18" rx="10" fill="#475569"></rect>
                    <g class="step4-flame">
                        <ellipse cx="120" cy="92" rx="16" ry="28" fill="#2563eb"></ellipse>
                        <ellipse cx="120" cy="98" rx="8" ry="14" fill="#fde68a"></ellipse>
                    </g>
                    <g class="step4-slide">
                        <rect x="74" y="42" width="92" height="26" rx="4" fill="rgba(255,255,255,0.92)" stroke="#9ca3af" stroke-width="2"></rect>
                        <ellipse cx="120" cy="56" rx="20" ry="6" fill="rgba(139,92,246,0.45)"></ellipse>
                    </g>
                </svg>
            `
        },
        5: {
            title: 'Bo\'yash va yuvish',
            description: 'Surtmaga Gencian fioletni to\'liq quying va keyin suv bilan yuvish bosqichini bajaring. Shu bosqichdan keyin mikroskop natijasi chiqadi.',
            animationType: 'staining',
            animationHTML: `
                <svg class="step-svg" viewBox="0 0 240 220" aria-label="Bo'yash animatsiyasi">
                    <rect x="42" y="108" width="156" height="40" rx="5" fill="rgba(255,255,255,0.9)" stroke="#9ca3af" stroke-width="2"></rect>
                    <ellipse cx="120" cy="128" rx="44" ry="10" fill="rgba(124,58,237,0.25)"></ellipse>
                    <g class="step5-pipette">
                        <rect x="82" y="28" width="34" height="72" rx="10" fill="#8b5cf6"></rect>
                        <path d="M99 100 L99 114" stroke="#6d28d9" stroke-width="5" stroke-linecap="round"></path>
                    </g>
                    <circle class="step5-drop" cx="99" cy="118" r="5" fill="#7c3aed"></circle>
                </svg>
            `
        }
    },

    // Computed properties
    get completedSteps() {
        const milestones = [
            this.state.isSterilized,
            this.state.hasSample,
            this.state.isSmearCreated,
            this.state.isFixed,
            this.state.isDyed && this.state.isWashed
        ];
        return milestones.filter(Boolean).length;
    },

    get allStepsCompleted() {
        return Object.values(this.state).every(v => v);
    },

    get currentStepData() {
        const step = this.steps[this.currentStep];
        // Return step with translated title and description
        return {
            ...step,
            title: this.t(`step${this.currentStep}Title`),
            description: this.t(`step${this.currentStep}Desc`)
        };
    },

    get sampleProgressText() {
        return `${this.sampleDipCount}/${this.sampleDipTarget}`;
    },

    get smearOrbitPercent() {
        const ratio = this.smearOrbitTurns / this.smearRequiredTurns;
        return Math.max(0, Math.min(100, Math.round(ratio * 100)));
    },

    get fixationProgressPercent() {
        return Math.max(0, Math.min(100, Math.round((this.fixationPasses / 3) * 100)));
    },

    get stainingProgressPercent() {
        if (!this.state.isDyed) return 0;
        if (this.canWashNow || this.stainingWaitRequired <= 0) return 100;
        const elapsed = this.stainingWaitRequired - this.stainingTimeLeft;
        return Math.max(0, Math.min(100, Math.round((elapsed / this.stainingWaitRequired) * 100)));
    },

    get scoreOutOfTen() {
        const scaled = (this.userScore / 9) * 10;
        return Math.max(0, Math.min(10, Number(scaled.toFixed(1))));
    },

    get scorePercent() {
        return Math.round((this.scoreOutOfTen / 10) * 100);
    },

    get answerCategory() {
        if (this.scoreOutOfTen >= 9) return 'To\'liq javob';
        if (this.scoreOutOfTen >= 5) return 'To\'liq emas javob';
        return 'Javob yo\'q';
    },

    get microscopeQuality() {
        if (this.scoreOutOfTen > 8) return 'high';
        if (this.scoreOutOfTen >= 5) return 'medium';
        return 'low';
    },

    // ==================== TRANSLATION METHODS ====================
    /**
     * Tilni olish (Translation getter)
     * @param {string} key - Tarjima kaliti
     * @returns {string} - Tarjima qilingan matn
     */
    t(key) {
        const lang = translations[this.currentLang];
        if (!lang) return key;
        return lang[key] || translations['uz'][key] || key;
    },

    /**
     * Tilni o'zgartirish
     * @param {string} lang - Yangi til kodi ('uz', 'kaa', 'ru')
     */
    setLanguage(lang) {
        if (['uz', 'kaa', 'ru'].includes(lang)) {
            this.currentLang = lang;
            // Update document title
            document.title = `Lab 1: ${this.t('pageTitle')} - ${this.t('footerTitle')}`;
            // Play button click sound
            soundManager.playButtonClick();
            // Save to localStorage
            try {
                localStorage.setItem('labLang', lang);
            } catch (e) {}
        }
    },

    /**
     * Saqlangan tilni yuklash
     */
    loadSavedLanguage() {
        try {
            const savedLang = localStorage.getItem('labLang');
            if (savedLang && ['uz', 'kaa', 'ru'].includes(savedLang)) {
                this.currentLang = savedLang;
            }
        } catch (e) {}
    },

    /**
     * Answer category with translation
     */
    get answerCategoryTranslated() {
        if (this.scoreOutOfTen >= 9) return this.t('categoryFull');
        if (this.scoreOutOfTen >= 5) return this.t('categoryPartial');
        return this.t('categoryNone');
    },

    // Modal methods
    openModal(stepNumber) {
        this.currentStep = stepNumber;
        this.showModal = true;
    },

    closeModal() {
        this.showModal = false;
        this.modalViewed[this.currentStep] = true;

        // Initialize sound on first user interaction
        if (!this.soundInitialized) {
            this.initSound();
            // Also load saved language on first interaction
            this.loadSavedLanguage();
        }
        soundManager.playButtonClick();
    },

    // ==================== SOUND METHODS ====================
    async initSound() {
        await soundManager.init();
        this.soundInitialized = true;
    },

    toggleSound() {
        if (!this.soundInitialized) {
            this.initSound();
        }
        this.soundEnabled = !soundManager.toggleMute();
        soundManager.playButtonClick();
    },

    checkAndShowModal() {
        if (!this.state.isSterilized && !this.modalViewed[1]) {
            this.openModal(1);
        } else if (this.state.isSterilized && !this.state.hasSample && !this.modalViewed[2]) {
            this.openModal(2);
        } else if (this.state.hasSample && !this.state.isSmearCreated && !this.modalViewed[3]) {
            this.openModal(3);
        } else if (this.state.isSmearCreated && !this.state.isFixed && !this.modalViewed[4]) {
            this.openModal(4);
        } else if (this.state.isFixed && (!this.state.isDyed || !this.state.isWashed) && !this.modalViewed[5]) {
            this.openModal(5);
        }
    },

    // Drag methods
    startDrag(itemName, event) {
        if (this.showModal) return;
        if (this.resultSceneVisible) return;
        if ((itemName === 'dyePipette' || itemName === 'waterPipette') && !this.state.isFixed) return;

        this.isDragging = true;
        this.draggedItem = itemName;
        const rect = event.currentTarget.getBoundingClientRect();
        this.dragOffset.x = event.clientX - rect.left;
        this.dragOffset.y = event.clientY - rect.top;
        event.preventDefault();
    },

    onDrag(event) {
        if (!this.isDragging || !this.draggedItem || this.showModal) return;

        const workbench = this.$refs.workbench;
        if (!workbench) return;

        const workbenchRect = workbench.getBoundingClientRect();

        const newX = event.clientX - workbenchRect.left - this.dragOffset.x;
        const newY = event.clientY - workbenchRect.top - this.dragOffset.y;

        // Track drag velocity for direction-based bending
        this.dragVelocityX = newX - this.lastDragX;
        this.dragVelocityY = newY - this.lastDragY;

        // Determine drag direction
        const threshold = 2;
        if (Math.abs(this.dragVelocityX) > Math.abs(this.dragVelocityY)) {
            if (this.dragVelocityX > threshold) {
                this.dragDirection = 'right';
            } else if (this.dragVelocityX < -threshold) {
                this.dragDirection = 'left';
            }
        } else {
            if (this.dragVelocityY > threshold) {
                this.dragDirection = 'down';
            } else if (this.dragVelocityY < -threshold) {
                this.dragDirection = 'up';
            }
        }

        this.lastDragX = newX;
        this.lastDragY = newY;

        this.itemPositions[this.draggedItem].x = newX;
        this.itemPositions[this.draggedItem].y = newY;

        if (this.heatingStartAt !== null) {
            const liveMs = this.sterilizationHoldMs + (Date.now() - this.heatingStartAt);
            this.sterilizationProgress = Math.min(100, Math.round((liveMs / 3000) * 100));
        }

        this.checkCollisions();
    },

    endDrag() {
        if (this.isDragging && this.hoveredZone) {
            this.handleDrop(this.draggedItem, this.hoveredZone);
        }
        this.stopHeating();
        this.smearPrevAngle = null;
        this.isDragging = false;
        this.draggedItem = null;
        this.hoveredZone = null;
        this.isHeating = false;
        this.isSmearing = false;
        // Reset drag direction
        this.dragDirection = null;
        this.dragVelocityX = 0;
        this.dragVelocityY = 0;
    },

    checkCollisions() {
        if (!this.draggedItem) return;

        const item = this.itemPositions[this.draggedItem];
        const itemMetrics = {
            loop: { width: 80, height: 120 },
            slide: { width: 120, height: 40 },
            dyePipette: { width: 110, height: 56 },
            waterPipette: { width: 110, height: 56 }
        };
        const itemWidth = itemMetrics[this.draggedItem]?.width ?? 80;
        const itemHeight = itemMetrics[this.draggedItem]?.height ?? 40;

        // Bunsen burner flame zone (strict center hit for heating)
        const flameZone = { x: 332, y: 188, width: 36, height: 76 };
        if (this.isColliding(item, itemWidth, itemHeight, flameZone, 0)) {
            this.hoveredZone = 'sterilize';
            // Heating effect while dragging over flame
            if (this.draggedItem === 'loop' && !this.state.isSterilized) {
                this.isHeating = true;
                this.startHeating();
            }
            return;
        } else {
            this.isHeating = false;
            this.stopHeating();
        }

        // Sample tube zone
        const sampleZone = { x: 520, y: 120, width: 60, height: 120 };
        if (this.isColliding(item, itemWidth, itemHeight, sampleZone)) {
            this.hoveredZone = 'sampleTube';
            return;
        }

        // Slide area (dynamic)
        if (this.draggedItem === 'loop') {
            const slidePos = this.itemPositions.slide;
            const slideZone = { x: slidePos.x, y: slidePos.y, width: 120, height: 40 };
            if (this.isColliding(item, itemWidth, itemHeight, slideZone)) {
                this.hoveredZone = 'slideArea';
                this.lastLoopCenterX = item.x + itemWidth / 2;
                // Smearing effect while dragging over slide
                if (this.state.hasSample && !this.state.isSmearCreated) {
                    this.isSmearing = true;
                    this.addSmearLine(item.x - slidePos.x);
                    this.trackSmearOrbit(item.x + itemWidth / 2, item.y + itemHeight / 2, slidePos);
                    // Play occasional smear sound
                    if (Math.random() > 0.85) {
                        soundManager.playSmearSound();
                    }
                }
                return;
            } else {
                this.isSmearing = false;
                this.smearPrevAngle = null;
            }
        }

        if (this.draggedItem === 'dyePipette' || this.draggedItem === 'waterPipette') {
            const slidePos = this.itemPositions.slide;
            const stainZone = { x: slidePos.x + 14, y: slidePos.y + 2, width: 92, height: 36 };
            if (this.isColliding(item, itemWidth, itemHeight, stainZone, 6)) {
                this.hoveredZone = this.draggedItem === 'dyePipette' ? 'dyeDrop' : 'washDrop';
                return;
            }
        }

        // Fixation zone
        const fixationZone = { x: 320, y: 178, width: 60, height: 96 };
        if (this.draggedItem === 'slide' && this.isColliding(item, itemWidth, itemHeight, fixationZone, 4)) {
            this.hoveredZone = 'fixation';
            return;
        }

        this.hoveredZone = null;
    },

    addSmearLine(xPos) {
        // Build a denser, organic smear trail
        if (this.smearLines.length < 28) {
            const clampedX = Math.max(5, Math.min(xPos + 40, 100));
            const line = {
                id: Date.now(),
                x: clampedX,
                y: (Math.random() * 16) + 12,
                width: Math.random() * 40 + 26,
                height: Math.random() * 4 + 3,
                rotate: (Math.random() * 18) - 9,
                opacity: (Math.random() * 0.35) + 0.45,
                inTarget: clampedX >= 30 && clampedX <= 90
            };
            this.smearLines.push(line);
        }
    },

    isColliding(item, itemWidth, itemHeight, zone, padding = 20) {
        const itemCenterX = item.x + itemWidth / 2;
        const itemCenterY = item.y + itemHeight / 2;

        const expandedZone = {
            x: zone.x - padding,
            y: zone.y - padding,
            width: zone.width + (padding * 2),
            height: zone.height + (padding * 2)
        };

        return itemCenterX >= expandedZone.x &&
               itemCenterX <= expandedZone.x + expandedZone.width &&
               itemCenterY >= expandedZone.y &&
               itemCenterY <= expandedZone.y + expandedZone.height;
    },

    handleDrop(item, zone) {
        if (item === 'loop' && zone === 'sterilize' && !this.state.isSterilized) {
            this.startSterilization();
        } else if (item === 'loop' && zone === 'sampleTube' && !this.state.hasSample) {
            this.collectSample();
        } else if (item === 'loop' && zone === 'slideArea' && this.state.hasSample && !this.state.isSmearCreated) {
            this.createSmear();
        } else if (item === 'slide' && zone === 'fixation' && this.state.isSmearCreated) {
            this.fixSmear();
        } else if (item === 'dyePipette' && zone === 'dyeDrop' && this.state.isFixed) {
            this.dropDye();
        } else if (item === 'waterPipette' && zone === 'washDrop' && this.state.isFixed) {
            this.dropWater();
        }
    },

    trackSmearOrbit(loopCenterX, loopCenterY, slidePos) {
        const cx = slidePos.x + 60;
        const cy = slidePos.y + 20;
        const dx = loopCenterX - cx;
        const dy = loopCenterY - cy;
        const radius = Math.sqrt((dx * dx) + (dy * dy));

        // Keep motion near circular path so user visibly rubs in oval/circle manner
        if (radius < 20 || radius > 68) {
            this.smearPrevAngle = null;
            return;
        }

        const angle = Math.atan2(dy, dx);
        if (this.smearPrevAngle === null) {
            this.smearPrevAngle = angle;
            return;
        }

        let delta = angle - this.smearPrevAngle;
        while (delta > Math.PI) delta -= (Math.PI * 2);
        while (delta < -Math.PI) delta += (Math.PI * 2);

        if (Math.abs(delta) < 1.2) {
            this.smearOrbitAccum += Math.abs(delta);
            this.smearOrbitTurns = this.smearOrbitAccum / (Math.PI * 2);
        }

        this.smearPrevAngle = angle;

        if (!this.smearCompleted && this.smearOrbitTurns >= this.smearRequiredTurns && this.smearLines.length >= 18) {
            this.completeSmearStep();
        }
    },

    // Action methods
    startHeating() {
        if (this.heatingStartAt !== null) return;
        this.heatingStartAt = Date.now();
        // Start burner sound
        soundManager.startBurnerHum();
    },

    stopHeating() {
        if (this.heatingStartAt === null) return;
        this.sterilizationHoldMs += Date.now() - this.heatingStartAt;
        this.heatingStartAt = null;
        const percent = Math.min(100, (this.sterilizationHoldMs / 3000) * 100);
        this.sterilizationProgress = Math.round(percent);
        this.sterilizationSeconds = Number((this.sterilizationHoldMs / 1000).toFixed(1));
        // Stop burner sound
        soundManager.stopBurnerHum();
    },

    recomputeTotalScore() {
        this.userScore = Object.values(this.stepScores).reduce((acc, value) => acc + value, 0);
    },

    setStepScore(step, score) {
        this.stepScores[step] = score;
        this.recomputeTotalScore();
    },

    addError(message) {
        if (!this.errors.includes(message)) {
            this.errors.push(message);
            // Play error sound
            soundManager.playErrorBuzz();
        }
    },

    startSterilization() {
        this.stopHeating();

        if (this.sterilizationHoldMs <= 0) {
            this.addError(this.t('errLoopNotHeld'));
            this.setStepScore('sterilization', 0);
            return;
        }

        const seconds = this.sterilizationHoldMs / 1000;
        this.sterilizationSeconds = Number(seconds.toFixed(1));
        const sterilizationScore = seconds >= 3 ? 1 : 0.5;
        this.setStepScore('sterilization', sterilizationScore);

        if (seconds < 3) {
            this.addError(this.t('errSterilizationShort'));
        }

        this.state.isSterilized = true;
        // Play success sound
        soundManager.playSuccessPing();
        setTimeout(() => {
            this.checkAndShowModal();
        }, 300);
    },

    collectSample() {
        if (!this.state.isSterilized) {
            this.setStepScore('sampling', 0);
            this.addError(this.t('errUnsterilizedSample'));
            return;
        }

        this.sampleDipCount += 1;
        this.liquidLevel = Math.max(20, 60 - (this.sampleDipCount * 8));
        // Play dip sound
        soundManager.playDropSound();

        if (this.sampleDipCount < this.sampleDipTarget) {
            return;
        }

        this.setStepScore('sampling', 2);
        setTimeout(() => {
            this.state.hasSample = true;
            // Play success sound
            soundManager.playSuccessPing();
            this.checkAndShowModal();
        }, 250);
    },

    createSmear() {
        if (this.state.isSmearCreated) return;

        if (this.smearOrbitTurns < this.smearRequiredTurns || this.smearLines.length < 18) {
            this.addError(this.t('errSmearIncomplete'));
            return;
        }

        this.completeSmearStep();
    },

    completeSmearStep() {
        if (this.smearCompleted) return;
        this.smearCompleted = true;

        const targetHits = this.smearLines.filter(line => line.inTarget).length;
        const targetRate = this.smearLines.length > 0 ? (targetHits / this.smearLines.length) : 0;
        const localCenterX = this.lastLoopCenterX - this.itemPositions.slide.x;
        const droppedInTarget = localCenterX >= 30 && localCenterX <= 90;
        const isTargetSmear = targetRate >= 0.5 || droppedInTarget;

        this.setStepScore('smear', isTargetSmear ? 1 : 0);
        if (!isTargetSmear) {
            this.addError(this.t('errSmearNotInTarget'));
        }

        setTimeout(() => {
            this.state.isSmearCreated = true;
            // Play success sound
            soundManager.playSuccessPing();
            this.checkAndShowModal();
        }, 300);
    },

    fixSmear() {
        this.fixationPasses += 1;
        this.isFixing = true;
        // Show steam effect during fixation
        this.showSteam = true;
        // Play metal clink sound when slide touches flame
        soundManager.playMetalClink();
        // Brief burner sound
        soundManager.startBurnerHum();

        let fixationScore = 0;
        if (this.fixationPasses === 3) {
            fixationScore = 2;
        } else if (this.fixationPasses === 2 || this.fixationPasses === 4) {
            fixationScore = 1;
        } else if (this.fixationPasses === 1 || this.fixationPasses === 5) {
            fixationScore = 0.5;
        }
        this.setStepScore('fixation', fixationScore);

        setTimeout(() => {
            this.isFixing = false;
            this.showSteam = false;
            soundManager.stopBurnerHum();
            if (this.fixationPasses >= 3) {
                this.state.isFixed = true;
                // Play success sound
                soundManager.playSuccessPing();
                if (this.fixationPasses !== 3) {
                    this.addError(this.t('errFixationCount').replace('{count}', this.fixationPasses));
                }
                this.checkAndShowModal();
            }
        }, 500);
    },

    dropDye() {
        if (!this.state.isFixed || this.state.isDyed) return;

        // Play drop sound
        soundManager.playDropSound();

        // Trigger dye drop spreading animation
        this.dyeDropAnimating = true;
        setTimeout(() => {
            this.dyeDropAnimating = false;
        }, 1200);

        this.dyeCoverage = 100;
        this.isDyeSpreadVisible = true;
        this.canWashNow = false;
        this.state.isDyed = true;
        this.setStepScore('dye', 1);
        this.stainingTimeLeft = this.stainingWaitRequired;

        if (this.stainingTimer) {
            clearInterval(this.stainingTimer);
        }

        this.stainingTimer = setInterval(() => {
            this.stainingTimeLeft -= 1;
            if (this.stainingTimeLeft <= 0) {
                clearInterval(this.stainingTimer);
                this.stainingTimer = null;
                this.stainingTimeLeft = 0;
                this.canWashNow = true;
                this.isDyeMatured = true;
            }
        }, 1000);
    },

    dropWater() {
        if (!this.state.isFixed || this.state.isWashed) return;
        if (!this.state.isDyed) {
            this.addError(this.t('errWashBeforeDye'));
            this.setStepScore('washing', 0);
            return;
        }

        // Play water flow sound
        soundManager.playWaterFlow();

        this.state.isWashed = true;
        this.isRunoffAnimating = true;

        if (this.stainingTimer) {
            clearInterval(this.stainingTimer);
            this.stainingTimer = null;
        }

        if (this.canWashNow) {
            this.setStepScore('washing', 2);
            // Play success sound
            soundManager.playSuccessPing();
        } else {
            this.setStepScore('washing', 0);
            this.addError(this.t('errNoWaitTime'));
        }

        setTimeout(() => {
            this.isRunoffAnimating = false;
            this.finishLab();
        }, 1300);
    },

    observeMicroscope() {
        if (!this.state.isDyed) {
            this.addError(this.t('errNoDyeBeforeMicroscope'));
            this.setStepScore('dye', 0);
        }
        if (!this.state.isWashed) {
            this.addError(this.t('errNoWashBeforeMicroscope'));
            this.setStepScore('washing', 0);
            this.setStepScore('dye', Math.min(this.stepScores.dye, 0.5));
        }
        this.finishLab(true);
    },

    buildBacteriaParticles() {
        const quality = this.microscopeQuality;
        const count = quality === 'high' ? 28 : quality === 'medium' ? 10 : 5;
        const particles = [];

        for (let i = 0; i < count; i += 1) {
            particles.push({
                id: `b-${i}`,
                left: Math.random() * 90 + 5,
                top: Math.random() * 90 + 5,
                size: quality === 'high'
                    ? (Math.random() * 10 + 7)
                    : quality === 'medium'
                        ? (Math.random() * 7 + 5)
                        : (Math.random() * 12 + 6),
                delay: (Math.random() * 1.8).toFixed(2),
                opacity: quality === 'high' ? 0.95 : quality === 'medium' ? 0.45 : 0.25
            });
        }

        this.bacteriaParticles = particles;
    },

    finishLab(force = false) {
        if (!this.allStepsCompleted && !force) return;
        if (this.fixationPasses !== 3) {
            this.addError(this.t('errFixationCount').replace('{count}', this.fixationPasses));
        }
        this.buildBacteriaParticles();
        this.resultSceneVisible = true;
        this.showModal = false;
        // Stop any active sounds
        soundManager.stopAll();
        // Play completion fanfare
        soundManager.playCompletionFanfare();
    },

    resetSimulation() {
        this.state = {
            isSterilized: false,
            hasSample: false,
            isSmearCreated: false,
            isFixed: false,
            isDyed: false,
            isWashed: false
        };
        this.sterilizationProgress = 0;
        this.liquidLevel = 60;
        this.itemPositions = {
            loop: { x: 50, y: 100 },
            slide: { x: 25, y: 395 },
            dyePipette: { x: 430, y: 248 },
            waterPipette: { x: 430, y: 336 }
        };
        this.sterilizationHoldMs = 0;
        this.heatingStartAt = null;
        this.sterilizationSeconds = 0;
        this.fixationPasses = 0;
        this.isFixing = false;
        this.dyeCoverage = 0;
        this.isDyeSpreadVisible = false;
        this.isDyeMatured = false;
        this.isRunoffAnimating = false;
        this.stainingWaitRequired = 7;
        this.stainingTimeLeft = 0;
        this.canWashNow = false;
        this.resultSceneVisible = false;
        this.bacteriaParticles = [];
        this.userScore = 0;
        this.errors = [];
        this.stepScores = {
            sterilization: 0,
            sampling: 0,
            smear: 0,
            fixation: 0,
            dye: 0,
            washing: 0
        };
        this.isDragging = false;
        this.draggedItem = null;
        this.hoveredZone = null;
        this.isHeating = false;
        this.isSmearing = false;
        this.smearLines = [];
        this.sampleDipCount = 0;
        this.sampleDipTarget = 3;
        this.smearRequiredTurns = 2;
        this.smearOrbitAccum = 0;
        this.smearOrbitTurns = 0;
        this.smearPrevAngle = null;
        this.smearCompleted = false;
        // Reset new visual effect states
        this.dragDirection = null;
        this.lastDragX = 0;
        this.lastDragY = 0;
        this.dragVelocityX = 0;
        this.dragVelocityY = 0;
        this.showSteam = false;
        this.dyeDropAnimating = false;
        if (this.sterilizationInterval) {
            clearInterval(this.sterilizationInterval);
        }
        if (this.stainingTimer) {
            clearInterval(this.stainingTimer);
            this.stainingTimer = null;
        }
        this.modalViewed = { 1: false, 2: false, 3: false, 4: false, 5: false };
        this.currentStep = 1;
        this.showModal = true;
    }
}));

// Start Alpine
Alpine.start();

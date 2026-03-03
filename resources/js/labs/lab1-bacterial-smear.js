/**
 * Lab 1: Bacterial Smear Preparation
 * Alpine.js Component for Virtual Microbiology Laboratory
 */

import Alpine from 'alpinejs';

// Register component before Alpine starts
Alpine.data('bacterialSmearLab', () => ({
    // Drag state
    isDragging: false,
    draggedItem: null,
    dragOffset: { x: 0, y: 0 },
    hoveredZone: null,

    // Item positions (absolute positioning within workbench)
    itemPositions: {
        loop: { x: 50, y: 100 },
        slide: { x: 25, y: 395 },
        dyePipette: { x: 610, y: 300 },
        waterPipette: { x: 610, y: 390 }
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
            animationType: 'sterilization'
        },
        2: {
            title: 'Namuna olish',
            description: 'Sterillangan halqani bakterial kultura probirkasiga ehtiyotkorlik bilan kiriting. Halqa uchini suyuqlikka botirib, oz miqdorda namuna oling. Probirkadagi suyuqlik darajasi kamayadi.',
            animationType: 'sampling'
        },
        3: {
            title: 'Surtma yaratish',
            description: 'Namuna olgan halqani buyum oynasi (slide) ustiga qo\'ying va namunani tekis, yupqa qatlamda suring. Namuna shisha butun yuzasiga bir tekis yoyilishi kerak.',
            animationType: 'smearing'
        },
        4: {
            title: 'Termik fiksatsiya',
            description: 'Surtma qilingan buyum oynasini olov ustiga olib boring. Issiqlik ta\'sirida bakteriyalar oynaga yopishib qoladi va keyinchalik bo\'yash jarayonida yuvilib ketmaydi.',
            animationType: 'fixation'
        },
        5: {
            title: 'Bo\'yash va yuvish',
            description: 'Surtmaga Gencian fioletni to\'liq quying va keyin suv bilan yuvish bosqichini bajaring. Shu bosqichdan keyin mikroskop natijasi chiqadi.',
            animationType: 'staining'
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
        return this.steps[this.currentStep];
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

    // Modal methods
    openModal(stepNumber) {
        this.currentStep = stepNumber;
        this.showModal = true;
    },

    closeModal() {
        this.showModal = false;
        this.modalViewed[this.currentStep] = true;
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

        this.itemPositions[this.draggedItem].x = event.clientX - workbenchRect.left - this.dragOffset.x;
        this.itemPositions[this.draggedItem].y = event.clientY - workbenchRect.top - this.dragOffset.y;

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
        this.isDragging = false;
        this.draggedItem = null;
        this.hoveredZone = null;
        this.isHeating = false;
        this.isSmearing = false;
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
                }
                return;
            } else {
                this.isSmearing = false;
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
        // Limit number of smear lines
        if (this.smearLines.length < 15) {
            const clampedX = Math.max(5, Math.min(xPos + 40, 100));
            const line = {
                id: Date.now(),
                x: clampedX,
                width: Math.random() * 30 + 20,
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

    // Action methods
    startHeating() {
        if (this.heatingStartAt !== null) return;
        this.heatingStartAt = Date.now();
    },

    stopHeating() {
        if (this.heatingStartAt === null) return;
        this.sterilizationHoldMs += Date.now() - this.heatingStartAt;
        this.heatingStartAt = null;
        const percent = Math.min(100, (this.sterilizationHoldMs / 3000) * 100);
        this.sterilizationProgress = Math.round(percent);
        this.sterilizationSeconds = Number((this.sterilizationHoldMs / 1000).toFixed(1));
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
        }
    },

    startSterilization() {
        this.stopHeating();

        if (this.sterilizationHoldMs <= 0) {
            this.addError('Halqa olovda ushlanmadi.');
            this.setStepScore('sterilization', 0);
            return;
        }

        const seconds = this.sterilizationHoldMs / 1000;
        this.sterilizationSeconds = Number(seconds.toFixed(1));
        const sterilizationScore = seconds >= 3 ? 1 : 0.5;
        this.setStepScore('sterilization', sterilizationScore);

        if (seconds < 3) {
            this.addError('Sterillash vaqti 3 soniyadan kam bo\'ldi.');
        }

        this.state.isSterilized = true;
        setTimeout(() => {
            this.checkAndShowModal();
        }, 300);
    },

    collectSample() {
        this.liquidLevel = 40;

        if (this.state.isSterilized) {
            this.setStepScore('sampling', 2);
        } else {
            this.setStepScore('sampling', 0);
            this.addError('Namuna sterillanmagan halqa bilan olindi.');
        }

        setTimeout(() => {
            this.state.hasSample = true;
            this.checkAndShowModal();
        }, 600);
    },

    createSmear() {
        const targetHits = this.smearLines.filter(line => line.inTarget).length;
        const targetRate = this.smearLines.length > 0 ? (targetHits / this.smearLines.length) : 0;
        const localCenterX = this.lastLoopCenterX - this.itemPositions.slide.x;
        const droppedInTarget = localCenterX >= 30 && localCenterX <= 90;
        const isTargetSmear = targetRate >= 0.5 || droppedInTarget;

        this.setStepScore('smear', isTargetSmear ? 1 : 0);
        if (!isTargetSmear) {
            this.addError('Surtma target-area ichida to\'g\'ri bajarilmadi.');
        }

        setTimeout(() => {
            this.state.isSmearCreated = true;
            this.checkAndShowModal();
        }, 800);
    },

    fixSmear() {
        this.fixationPasses += 1;
        this.isFixing = true;

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
            if (this.fixationPasses >= 3) {
                this.state.isFixed = true;
                if (this.fixationPasses !== 3) {
                    this.addError(`Fiksatsiya ${this.fixationPasses} marta bajarildi (ideal: 3).`);
                }
                this.checkAndShowModal();
            }
        }, 500);
    },

    dropDye() {
        if (!this.state.isFixed || this.state.isDyed) return;

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
            this.addError('Yuvishdan oldin bo\'yoq tomizilishi kerak.');
            this.setStepScore('washing', 0);
            return;
        }

        this.state.isWashed = true;
        this.isRunoffAnimating = true;

        if (this.stainingTimer) {
            clearInterval(this.stainingTimer);
            this.stainingTimer = null;
        }

        if (this.canWashNow) {
            this.setStepScore('washing', 2);
        } else {
            this.setStepScore('washing', 0);
            this.addError('Bo\'yoq reaksiyasi uchun kamida 5-10 soniya kutilmadi.');
        }

        setTimeout(() => {
            this.isRunoffAnimating = false;
            this.finishLab();
        }, 1300);
    },

    observeMicroscope() {
        if (!this.state.isDyed) {
            this.addError('Mikroskopga o\'tishdan oldin bo\'yoq tomizilmadi.');
            this.setStepScore('dye', 0);
        }
        if (!this.state.isWashed) {
            this.addError('Bo\'yoq yuvilmasdan mikroskopga o\'tildi, natija buzildi.');
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
            this.addError(`Fiksatsiya ${this.fixationPasses} marta bajarildi (ideal: 3).`);
        }
        this.buildBacteriaParticles();
        this.resultSceneVisible = true;
        this.showModal = false;
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
            dyePipette: { x: 610, y: 300 },
            waterPipette: { x: 610, y: 390 }
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

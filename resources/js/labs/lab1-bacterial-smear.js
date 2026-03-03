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
        slide: { x: 200, y: 100 }
    },

    // Experiment state
    state: {
        isSterilized: false,
        hasSample: false,
        isSmearCreated: false,
        isFixed: false
    },

    sterilizationProgress: 0,
    liquidLevel: 60,
    sterilizationInterval: null,

    // Heating state
    isHeating: false,

    // Smearing state
    isSmearing: false,
    smearLines: [],

    // Modal state
    showModal: true,
    currentStep: 1,
    modalViewed: { 1: false, 2: false, 3: false, 4: false },

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
        }
    },

    // Computed properties
    get completedSteps() {
        return Object.values(this.state).filter(v => v).length;
    },

    get allStepsCompleted() {
        return Object.values(this.state).every(v => v);
    },

    get currentStepData() {
        return this.steps[this.currentStep];
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
        }
    },

    // Drag methods
    startDrag(itemName, event) {
        if (this.showModal) return;

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

        this.checkCollisions();
    },

    endDrag() {
        if (this.isDragging && this.hoveredZone) {
            this.handleDrop(this.draggedItem, this.hoveredZone);
        }
        this.isDragging = false;
        this.draggedItem = null;
        this.hoveredZone = null;
        this.isHeating = false;
        this.isSmearing = false;
    },

    checkCollisions() {
        if (!this.draggedItem) return;

        const item = this.itemPositions[this.draggedItem];
        const itemWidth = this.draggedItem === 'loop' ? 80 : 120;
        const itemHeight = this.draggedItem === 'loop' ? 120 : 40;

        // Bunsen burner zone
        const bunsenZone = { x: 250, y: 180, width: 100, height: 200 };
        if (this.isColliding(item, itemWidth, itemHeight, bunsenZone)) {
            this.hoveredZone = 'sterilize';
            // Heating effect while dragging over flame
            if (this.draggedItem === 'loop' && !this.state.isSterilized) {
                this.isHeating = true;
            }
            return;
        } else {
            this.isHeating = false;
        }

        // Sample tube zone
        const sampleZone = { x: 430, y: 130, width: 60, height: 120 };
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

        // Fixation zone
        const fixationZone = { x: 250, y: 100, width: 100, height: 100 };
        if (this.draggedItem === 'slide' && this.isColliding(item, itemWidth, itemHeight, fixationZone)) {
            this.hoveredZone = 'fixation';
            return;
        }

        this.hoveredZone = null;
    },

    addSmearLine(xPos) {
        // Limit number of smear lines
        if (this.smearLines.length < 15) {
            const line = {
                id: Date.now(),
                x: Math.max(5, Math.min(xPos + 40, 100)),
                width: Math.random() * 30 + 20
            };
            this.smearLines.push(line);
        }
    },

    isColliding(item, itemWidth, itemHeight, zone) {
        const itemCenterX = item.x + itemWidth / 2;
        const itemCenterY = item.y + itemHeight / 2;

        const expandedZone = {
            x: zone.x - 20,
            y: zone.y - 20,
            width: zone.width + 40,
            height: zone.height + 40
        };

        return itemCenterX >= expandedZone.x &&
               itemCenterX <= expandedZone.x + expandedZone.width &&
               itemCenterY >= expandedZone.y &&
               itemCenterY <= expandedZone.y + expandedZone.height;
    },

    handleDrop(item, zone) {
        if (item === 'loop' && zone === 'sterilize' && !this.state.isSterilized) {
            this.startSterilization();
        } else if (item === 'loop' && zone === 'sampleTube' && this.state.isSterilized && !this.state.hasSample) {
            this.collectSample();
        } else if (item === 'loop' && zone === 'slideArea' && this.state.hasSample && !this.state.isSmearCreated) {
            this.createSmear();
        } else if (item === 'slide' && zone === 'fixation' && this.state.isSmearCreated && !this.state.isFixed) {
            this.fixSmear();
        }
    },

    // Action methods
    startSterilization() {
        let progress = 0;
        this.sterilizationProgress = 0;
        this.sterilizationInterval = setInterval(() => {
            progress += 10;
            this.sterilizationProgress = progress;
            if (progress >= 100) {
                clearInterval(this.sterilizationInterval);
                this.state.isSterilized = true;
                setTimeout(() => {
                    this.sterilizationProgress = 0;
                    this.checkAndShowModal();
                }, 500);
            }
        }, 300);
    },

    collectSample() {
        this.liquidLevel = 40;
        setTimeout(() => {
            this.state.hasSample = true;
            this.checkAndShowModal();
        }, 600);
    },

    createSmear() {
        setTimeout(() => {
            this.state.isSmearCreated = true;
            this.checkAndShowModal();
        }, 800);
    },

    fixSmear() {
        setTimeout(() => {
            this.state.isFixed = true;
        }, 1000);
    },

    resetSimulation() {
        this.state = {
            isSterilized: false,
            hasSample: false,
            isSmearCreated: false,
            isFixed: false
        };
        this.sterilizationProgress = 0;
        this.liquidLevel = 60;
        this.itemPositions = {
            loop: { x: 50, y: 100 },
            slide: { x: 200, y: 100 }
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
        this.modalViewed = { 1: false, 2: false, 3: false, 4: false };
        this.currentStep = 1;
        this.showModal = true;
    }
}));

// Start Alpine
Alpine.start();

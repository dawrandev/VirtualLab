<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lab 1: Bakterial surtma tayyorlash - Virtual Laboratoriya</title>
    <script src="https://cdn.tailwindcss.com"></script>
    @vite(['resources/css/labs/lab1-bacterial-smear.css', 'resources/js/labs/lab1-bacterial-smear.js'])
</head>
<body class="lab-page bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
<div x-data="bacterialSmearLab" x-cloak class="min-h-screen flex flex-col"
     @mousemove.window="onDrag($event)" @mouseup.window="endDrag()" @mouseleave.window="endDrag()">

    <template x-if="showModal">
        <div class="modal-overlay" @click.self="closeModal()">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="step-badge">Bosqich <span x-text="currentStep"></span>/5</div>
                    <h2 x-text="currentStepData.title"></h2>
                </div>
                <div class="modal-body">
                    <div class="animation-container">
                        <p class="text-slate-700 text-center px-6" x-text="currentStepData.description"></p>
                    </div>
                    <div class="modal-actions">
                        <button @click="closeModal()" class="btn-primary">Tushundim, boshlang</button>
                        <button @click="openModal(currentStep === 5 ? 1 : currentStep + 1)" class="btn-secondary" x-show="currentStep < 5">Keyingi bosqich</button>
                    </div>
                </div>
            </div>
        </div>
    </template>

    <header class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
            <div>
                <h1 class="text-3xl font-bold">Bakterial surtma tayyorlash</h1>
                <p class="text-blue-100 text-sm mt-1">Virtual mikrobiologiya laboratoriyasi - Lab 1</p>
            </div>
            <div class="text-right">
                <p class="text-sm text-blue-100 mb-2">Jarayon: <span x-text="completedSteps"></span>/5</p>
                <div class="flex gap-2 flex-wrap justify-end">
                    <span x-show="state.isSterilized" class="bg-green-400 text-white px-3 py-1 rounded-full text-xs font-semibold">Sterillandi</span>
                    <span x-show="state.hasSample" class="bg-green-400 text-white px-3 py-1 rounded-full text-xs font-semibold">Namuna olindi</span>
                    <span x-show="state.isSmearCreated" class="bg-green-400 text-white px-3 py-1 rounded-full text-xs font-semibold">Surtma tayyor</span>
                    <span x-show="state.isFixed" class="bg-green-400 text-white px-3 py-1 rounded-full text-xs font-semibold">Fiksatsiya qilindi</span>
                    <span x-show="state.isDyed" class="bg-green-400 text-white px-3 py-1 rounded-full text-xs font-semibold">Bo'yaldi</span>
                    <span x-show="state.isWashed" class="bg-green-400 text-white px-3 py-1 rounded-full text-xs font-semibold">Yuvildi</span>
                </div>
            </div>
        </div>
    </header>

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 py-8 grid grid-cols-12 gap-6">
        <aside class="col-span-3 space-y-4">
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">Asboblar</h2>
                <div class="space-y-3">
                    <div class="inventory-item"><div class="text-sm text-gray-600">Bakterial halqa</div></div>
                    <div class="inventory-item"><div class="text-sm text-gray-600">Buyum oynasi</div></div>
                    <div class="inventory-item"><div class="text-sm text-gray-600">Namuna probirkasi: <span x-text="liquidLevel"></span>%</div></div>
                </div>
            </div>
        </aside>

        <section class="col-span-6">
            <div class="workbench-surface bg-white rounded-lg shadow-2xl p-8" x-ref="workbench">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Ish stoli</h2>

                <div class="inoculating-loop"
                     :style="`left: ${itemPositions.loop.x}px; top: ${itemPositions.loop.y}px;`"
                     :class="{'dragging': isDragging && draggedItem === 'loop'}"
                     @mousedown="startDrag('loop', $event)">
                    <div class="loop-handle"></div>
                    <div class="loop-circle" :class="{'heating': isHeating, 'sterilized': state.isSterilized && !isHeating, 'has-sample': state.hasSample}"></div>
                    <div x-show="sterilizationProgress > 0 && sterilizationProgress < 100" class="sterilization-progress">
                        <div class="sterilization-bar" :style="`width: ${sterilizationProgress}%`"></div>
                    </div>
                    <div class="loop-label">
                        <span x-show="!state.isSterilized && !isHeating">Olovga suring</span>
                        <span x-show="isHeating">Qizdirmoqda...</span>
                        <span x-show="state.isSterilized && !state.hasSample">Probirkaga suring</span>
                    </div>
                </div>

                <div class="glass-slide"
                     :style="`left: ${itemPositions.slide.x}px; top: ${itemPositions.slide.y}px;`"
                     :class="{'dragging': isDragging && draggedItem === 'slide', 'smearing-active': isSmearing}"
                     @mousedown="startDrag('slide', $event)">
                    <div class="slide-glass">
                        <div class="smear-trail">
                            <template x-for="line in smearLines" :key="line.id">
                                <div class="smear-line" :style="`left: ${line.x}px; top: 50%; width: ${line.width}px; transform: translateY(-50%);`"></div>
                            </template>
                        </div>
                        <div class="target-area"></div>
                        <div class="smear" :class="{'visible': state.isSmearCreated, 'fixed': state.isFixed}"></div>
                        <div class="stain-overlay" :class="{'visible': isDyeSpreadVisible, 'mature': isDyeMatured, 'washed': state.isWashed}"></div>
                        <div class="wash-runoff" :class="{'running': isRunoffAnimating}">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                </div>

                <div class="bunsen-burner" style="left: 300px; top: 180px;">
                    <div class="burner-base"></div><div class="burner-stem"></div><div class="burner-head"></div><div class="flame"></div><div class="burner-label">Olov</div>
                </div>
                <div class="sample-tube" style="left: 520px; top: 120px;" :class="{'tube-waiting': state.isSterilized && !state.hasSample}">
                    <div class="tube-cap"></div><div class="tube-body"><div class="liquid" :style="`height: ${liquidLevel}%`"></div></div><div class="tube-label">Namuna</div>
                </div>

                <div class="drop-zone-highlight" :class="{'active': hoveredZone === 'sterilize'}" style="left: 332px; top: 188px; width: 36px; height: 76px;"></div>
                <div class="drop-zone-highlight" :class="{'active': hoveredZone === 'sampleTube'}" style="left: 520px; top: 120px; width: 60px; height: 120px;"></div>
                <div class="drop-zone-highlight" :class="{'active': hoveredZone === 'slideArea'}" :style="`left: ${itemPositions.slide.x}px; top: ${itemPositions.slide.y}px; width: 120px; height: 40px;`"></div>
                <div class="drop-zone-highlight" :class="{'active': hoveredZone === 'fixation'}" style="left: 320px; top: 178px; width: 60px; height: 96px;"></div>
                <div class="drop-zone-highlight" :class="{'active': hoveredZone === 'dyeDrop'}" :style="`left: ${itemPositions.slide.x + 14}px; top: ${itemPositions.slide.y + 2}px; width: 92px; height: 36px;`"></div>
                <div class="drop-zone-highlight" :class="{'active': hoveredZone === 'washDrop'}" :style="`left: ${itemPositions.slide.x + 14}px; top: ${itemPositions.slide.y + 2}px; width: 92px; height: 36px;`"></div>

                <div x-show="state.isFixed && !resultSceneVisible" class="staining-controls absolute right-6 bottom-6 bg-white/95 rounded-xl p-4 shadow-xl border border-violet-200">
                    <p class="text-sm font-semibold text-violet-800 mb-1">5-bosqich: Vizual bo'yash</p>
                    <p class="text-xs text-gray-600 mb-2">Pipetkalarni oynaga tomizing: avval bo'yoq, keyin suv.</p>
                    <p class="text-xs text-violet-700 mb-3" x-show="state.isDyed && !canWashNow">
                        Reaksiya vaqti: <span x-text="stainingTimeLeft"></span>s
                    </p>
                    <div class="flex items-center gap-2">
                        <button @click="observeMicroscope()" class="px-3 py-2 rounded-lg text-sm font-semibold bg-slate-700 text-white hover:bg-slate-800">
                            Mikroskopga o'tish
                        </button>
                    </div>
                </div>

                <div x-show="state.isFixed && !resultSceneVisible"
                     class="reagent-tool reagent-dye"
                     :style="`left:${itemPositions.dyePipette.x}px; top:${itemPositions.dyePipette.y}px;`"
                     :class="{'dragging': isDragging && draggedItem === 'dyePipette', 'used': state.isDyed}"
                     @mousedown="startDrag('dyePipette', $event)">
                    <svg viewBox="0 0 120 60" width="110" height="56" aria-label="Gencian fiolet pipetka">
                        <rect x="6" y="20" width="52" height="30" rx="10" fill="#6d28d9"/>
                        <rect x="12" y="24" width="40" height="22" rx="7" fill="#8b5cf6"/>
                        <path d="M58 33 L112 24 L114 30 L61 39 Z" fill="#cbd5e1"/>
                        <circle cx="25" cy="35" r="6" fill="#ddd6fe"/>
                    </svg>
                    <span>Gencian fiolet</span>
                </div>

                <div x-show="state.isFixed && !resultSceneVisible"
                     class="reagent-tool reagent-water"
                     :style="`left:${itemPositions.waterPipette.x}px; top:${itemPositions.waterPipette.y}px;`"
                     :class="{'dragging': isDragging && draggedItem === 'waterPipette', 'used': state.isWashed}"
                     @mousedown="startDrag('waterPipette', $event)">
                    <svg viewBox="0 0 120 60" width="110" height="56" aria-label="Distillangan suv pipetka">
                        <rect x="6" y="20" width="52" height="30" rx="10" fill="#0ea5e9"/>
                        <rect x="12" y="24" width="40" height="22" rx="7" fill="#67e8f9"/>
                        <path d="M58 33 L112 24 L114 30 L61 39 Z" fill="#cbd5e1"/>
                        <circle cx="25" cy="35" r="6" fill="#ecfeff"/>
                    </svg>
                    <span>Distillangan suv</span>
                </div>
            </div>
        </section>

        <aside class="col-span-3 space-y-4">
            <div class="bg-white rounded-lg shadow-lg p-6 sticky top-8">
                <h2 class="text-xl font-bold text-gray-800 mb-6">Bosqichlar</h2>
                <div class="space-y-3 text-sm text-gray-700">
                    <div class="step-card" :class="state.isSterilized ? 'completed' : 'pending'">1. Sterillash</div>
                    <div class="step-card" :class="state.hasSample ? 'completed' : 'pending'">2. Namuna olish</div>
                    <div class="step-card" :class="state.isSmearCreated ? 'completed' : 'pending'">3. Surtma</div>
                    <div class="step-card" :class="state.isFixed ? 'completed' : 'pending'">4. Fiksatsiya</div>
                    <div class="step-card" :class="state.isDyed && state.isWashed ? 'completed' : 'pending'">5. Bo'yash/Yuvish</div>
                </div>
                <button @click="resetSimulation()" class="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition">Qayta boshlash</button>
            </div>
        </aside>
    </main>

    <template x-if="resultSceneVisible">
        <div class="result-scene">
            <div class="result-panel">
                <h2 class="text-3xl font-bold text-slate-800 mb-2">Yakuniy natija</h2>
                <p class="text-slate-600 mb-6">Dinamik mikroskop natijasi va baholash hisobot</p>
                <div class="microscope-lens" :class="`quality-${microscopeQuality}`">
                    <div class="lens-core">
                        <template x-if="microscopeQuality !== 'low'">
                            <template x-for="particle in bacteriaParticles" :key="particle.id">
                                <span class="bacteria-dot" :style="`left:${particle.left}%; top:${particle.top}%; width:${particle.size}px; height:${particle.size}px; opacity:${particle.opacity}; animation-delay:${particle.delay}s;`"></span>
                            </template>
                        </template>
                        <template x-if="microscopeQuality === 'low'">
                            <template x-for="particle in bacteriaParticles" :key="particle.id">
                                <span class="artifact-dot" :style="`left:${particle.left}%; top:${particle.top}%; width:${particle.size}px; height:${particle.size}px; opacity:${particle.opacity};`"></span>
                            </template>
                        </template>
                    </div>
                </div>
                <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="result-card">
                        <p class="text-sm text-slate-500">Umumiy ball</p>
                        <p class="text-3xl font-bold text-slate-800"><span x-text="scoreOutOfTen"></span> / 10</p>
                        <p class="text-base text-slate-600 mt-1"><span x-text="scorePercent"></span>%</p>
                    </div>
                    <div class="result-card">
                        <p class="text-sm text-slate-500">Baholash toifasi</p>
                        <p class="text-2xl font-bold text-slate-800" x-text="answerCategory"></p>
                        <p class="text-xs text-slate-500 mt-2">To'liq javob: 9-10 | To'liq emas: 5-8.5 | Javob yo'q: 0-4.5</p>
                    </div>
                </div>
                <div class="result-card mt-4 overflow-hidden">
                    <table class="w-full text-left text-sm">
                        <thead><tr class="text-slate-500 border-b border-slate-200"><th class="py-2">Mezon</th><th class="py-2">Ball</th></tr></thead>
                        <tbody class="text-slate-700">
                        <tr><td class="py-2">Sterillash</td><td class="py-2" x-text="stepScores.sterilization"></td></tr>
                        <tr><td class="py-2">Namuna olish</td><td class="py-2" x-text="stepScores.sampling"></td></tr>
                        <tr><td class="py-2">Surtma</td><td class="py-2" x-text="stepScores.smear"></td></tr>
                        <tr><td class="py-2">Fiksatsiya</td><td class="py-2" x-text="stepScores.fixation"></td></tr>
                        <tr><td class="py-2">Bo'yash</td><td class="py-2" x-text="stepScores.dye"></td></tr>
                        <tr><td class="py-2">Yuvish</td><td class="py-2" x-text="stepScores.washing"></td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="result-card mt-4" x-show="errors.length > 0">
                    <p class="font-semibold text-rose-700 mb-2">Xatolar</p>
                    <ul class="text-sm text-rose-700 list-disc pl-5">
                        <template x-for="err in errors" :key="err"><li x-text="err"></li></template>
                    </ul>
                </div>
                <button @click="resetSimulation()" class="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition">Qayta boshlash</button>
            </div>
        </div>
    </template>

    <footer class="bg-gray-800 text-white py-4 text-center text-sm">
        <p>Tibbiy Virtual Laboratoriya - Bakterial surtma tayyorlash | Ta'limiy simulyatsiya</p>
    </footer>
</div>
</body>
</html>

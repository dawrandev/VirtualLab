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
    <div x-data="bacterialSmearLab"
         x-cloak
         class="min-h-screen flex flex-col"
         @mousemove.window="onDrag($event)"
         @mouseup.window="endDrag()"
         @mouseleave.window="endDrag()">

        {{-- ==================== INSTRUCTION MODAL ==================== --}}
        <template x-if="showModal">
            <div class="modal-overlay" @click.self="closeModal()">
                <div class="modal-content">
                    {{-- Header --}}
                    <div class="modal-header">
                        <div class="step-badge">Bosqich <span x-text="currentStep"></span>/4</div>
                        <h2 x-text="currentStepData.title"></h2>
                    </div>

                    {{-- Body --}}
                    <div class="modal-body">
                        {{-- Animation Container --}}
                        <div class="animation-container">
                            {{-- Step 1: Sterilization --}}
                            <template x-if="currentStepData.animationType === 'sterilization'">
                                <svg width="200" height="220" viewBox="0 0 200 220">
                                    <rect x="75" y="180" width="50" height="15" fill="#4a5568" rx="5"/>
                                    <rect x="90" y="140" width="20" height="40" fill="#718096" rx="2"/>
                                    <rect x="80" y="120" width="40" height="20" fill="#4a5568" rx="10"/>
                                    <g class="anim-flame">
                                        <ellipse cx="100" cy="95" rx="15" ry="25" fill="url(#flameGrad)"/>
                                        <ellipse cx="100" cy="100" rx="8" ry="15" fill="#fef3c7"/>
                                    </g>
                                    <g class="anim-loop-heating">
                                        <line x1="150" y1="140" x2="150" y2="80" stroke="#718096" stroke-width="3" stroke-linecap="round"/>
                                        <circle cx="150" cy="70" r="12" fill="none" stroke="#718096" stroke-width="3"/>
                                    </g>
                                    <defs>
                                        <linearGradient id="flameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stop-color="#fde68a"/>
                                            <stop offset="50%" stop-color="#f59e0b"/>
                                            <stop offset="100%" stop-color="#dc2626" stop-opacity="0.8"/>
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </template>

                            {{-- Step 2: Sampling --}}
                            <template x-if="currentStepData.animationType === 'sampling'">
                                <svg width="200" height="220" viewBox="0 0 200 220">
                                    <rect x="70" y="80" width="40" height="100" fill="rgba(229,231,235,0.4)" stroke="#9ca3af" stroke-width="2" rx="5"/>
                                    <rect x="70" y="70" width="40" height="15" fill="#4a5568" rx="3"/>
                                    <g class="anim-liquid-level">
                                        <rect x="72" y="120" width="36" height="55" fill="rgba(34,197,94,0.5)"/>
                                    </g>
                                    <g class="anim-loop-dip">
                                        <line x1="130" y1="40" x2="130" y2="100" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
                                        <circle cx="130" cy="110" r="10" fill="none" stroke="#ef4444" stroke-width="3"/>
                                    </g>
                                    <circle cx="130" cy="110" r="3" fill="#22c55e" opacity="0.7">
                                        <animate attributeName="opacity" values="0;0.7;0" dur="2.5s" repeatCount="indefinite"/>
                                    </circle>
                                </svg>
                            </template>

                            {{-- Step 3: Smearing --}}
                            <template x-if="currentStepData.animationType === 'smearing'">
                                <svg width="240" height="200" viewBox="0 0 240 200">
                                    <rect x="30" y="90" width="180" height="50" fill="rgba(255,255,255,0.8)" stroke="#9ca3af" stroke-width="2" rx="3"/>
                                    <path class="anim-smear-appear"
                                          d="M 50 115 Q 80 110 120 115 T 190 115"
                                          stroke="#8b5cf6"
                                          stroke-width="8"
                                          stroke-opacity="0.4"
                                          fill="none"
                                          stroke-dasharray="200"
                                          stroke-dashoffset="200"
                                          stroke-linecap="round"/>
                                    <g class="anim-loop-spread">
                                        <line x1="120" y1="80" x2="120" y2="95" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
                                        <circle cx="120" cy="105" r="8" fill="none" stroke="#ef4444" stroke-width="2.5"/>
                                        <circle cx="120" cy="105" r="3" fill="#22c55e" opacity="0.6"/>
                                    </g>
                                </svg>
                            </template>

                            {{-- Step 4: Fixation --}}
                            <template x-if="currentStepData.animationType === 'fixation'">
                                <svg width="200" height="220" viewBox="0 0 200 220">
                                    <rect x="75" y="180" width="50" height="15" fill="#4a5568" rx="5"/>
                                    <rect x="90" y="140" width="20" height="40" fill="#718096" rx="2"/>
                                    <rect x="80" y="120" width="40" height="20" fill="#4a5568" rx="10"/>
                                    <g class="anim-flame">
                                        <ellipse cx="100" cy="95" rx="15" ry="25" fill="url(#flameGrad2)"/>
                                        <ellipse cx="100" cy="100" rx="8" ry="15" fill="#fef3c7"/>
                                    </g>
                                    <g class="anim-heat-waves">
                                        <path d="M 70 80 Q 80 75 90 80 T 110 80" stroke="#f59e0b" stroke-width="2" fill="none" opacity="0.3"/>
                                        <path d="M 75 70 Q 85 65 95 70 T 115 70" stroke="#f59e0b" stroke-width="2" fill="none" opacity="0.3"/>
                                    </g>
                                    <g class="anim-slide-fix">
                                        <rect x="60" y="30" width="80" height="25" fill="rgba(255,255,255,0.8)" stroke="#9ca3af" stroke-width="2" rx="2"/>
                                        <ellipse cx="100" cy="42" rx="20" ry="5" fill="#8b5cf6" opacity="0.4"/>
                                    </g>
                                    <defs>
                                        <linearGradient id="flameGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stop-color="#fde68a"/>
                                            <stop offset="50%" stop-color="#f59e0b"/>
                                            <stop offset="100%" stop-color="#dc2626" stop-opacity="0.8"/>
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </template>
                        </div>

                        {{-- Description --}}
                        <p class="modal-description" x-text="currentStepData.description"></p>

                        {{-- Actions --}}
                        <div class="modal-actions">
                            <button @click="closeModal()" class="btn-primary">
                                Tushundim, boshlang
                            </button>
                            <button @click="openModal(currentStep === 4 ? 1 : currentStep + 1)"
                                    class="btn-secondary"
                                    x-show="currentStep < 4">
                                Keyingi bosqich
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        {{-- ==================== HEADER ==================== --}}
        <header class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold">Bakterial surtma tayyorlash</h1>
                        <p class="text-blue-100 text-sm mt-1">Virtual mikrobiologiya laboratoriyasi - Lab 1</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <button @click="openModal(1)"
                                class="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition flex items-center gap-2">
                            <span>Yo'riqnoma</span>
                        </button>
                        <div class="text-right">
                            <p class="text-sm text-blue-100 mb-2">Jarayon: <span x-text="completedSteps"></span>/4</p>
                            <div class="flex gap-2 flex-wrap justify-end">
                                <span x-show="state.isSterilized" class="bg-green-400 text-white px-3 py-1 rounded-full text-xs font-semibold">Sterillandi</span>
                                <span x-show="state.hasSample" class="bg-green-400 text-white px-3 py-1 rounded-full text-xs font-semibold">Namuna olindi</span>
                                <span x-show="state.isSmearCreated" class="bg-green-400 text-white px-3 py-1 rounded-full text-xs font-semibold">Surtma tayyor</span>
                                <span x-show="state.isFixed" class="bg-green-400 text-white px-3 py-1 rounded-full text-xs font-semibold">Fiksatsiya qilindi</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        {{-- ==================== MAIN CONTENT ==================== --}}
        <main class="flex-1 max-w-7xl w-full mx-auto px-4 py-8 grid grid-cols-12 gap-6">

            {{-- LEFT SIDEBAR: Equipment Inventory --}}
            <aside class="col-span-3 space-y-4">
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">Asboblar</h2>
                    <div class="space-y-3">
                        <div class="inventory-item">
                            <div class="text-sm text-gray-600">Bakterial halqa</div>
                            <p class="inventory-status"
                               :class="state.isSterilized ? 'text-green-600 font-semibold' : 'text-gray-500'">
                                <span x-show="!state.isSterilized">Sterillash kerak</span>
                                <span x-show="state.isSterilized">Tayyor</span>
                            </p>
                        </div>
                        <div class="inventory-item">
                            <div class="text-sm text-gray-600">Buyum oynasi</div>
                            <p class="inventory-status text-gray-500">Surtma uchun</p>
                        </div>
                        <div class="inventory-item">
                            <div class="text-sm text-gray-600">Namuna probirkasi</div>
                            <p class="inventory-status"
                               :class="state.hasSample ? 'text-green-600 font-semibold' : 'text-gray-500'">
                                <span x-show="!state.hasSample">Suyuqlik: <span x-text="liquidLevel"></span>%</span>
                                <span x-show="state.hasSample">Namuna olindi</span>
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {{-- CENTER: Workbench --}}
            <section class="col-span-6">
                <div class="workbench-surface bg-white rounded-lg shadow-2xl p-8" x-ref="workbench">
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">Ish stoli</h2>

                    {{-- Draggable Inoculating Loop --}}
                    <div class="inoculating-loop"
                         :style="`left: ${itemPositions.loop.x}px; top: ${itemPositions.loop.y}px;`"
                         :class="{'dragging': isDragging && draggedItem === 'loop'}"
                         @mousedown="startDrag('loop', $event)">
                        <div class="loop-handle"></div>
                        <div class="loop-circle" :class="{
                            'heating': isHeating,
                            'sterilized': state.isSterilized && !isHeating,
                            'has-sample': state.hasSample
                        }"></div>
                        <div x-show="sterilizationProgress > 0 && sterilizationProgress < 100" class="sterilization-progress">
                            <div class="sterilization-bar" :style="`width: ${sterilizationProgress}%`"></div>
                        </div>
                        <div class="loop-label">
                            <span x-show="!state.isSterilized && !isHeating">Olovga suring</span>
                            <span x-show="isHeating">Qizdirmoqda...</span>
                            <span x-show="state.isSterilized && !state.hasSample && !isHeating">Probirkaga suring</span>
                            <span x-show="state.hasSample && !state.isSmearCreated">Oynaga suring</span>
                            <span x-show="state.isSmearCreated">Tayyor</span>
                        </div>
                    </div>

                    {{-- Draggable Glass Slide --}}
                    <div class="glass-slide"
                         :style="`left: ${itemPositions.slide.x}px; top: ${itemPositions.slide.y}px;`"
                         :class="{
                             'dragging': isDragging && draggedItem === 'slide',
                             'waiting-for-sample': state.hasSample && !state.isSmearCreated,
                             'smearing-active': isSmearing
                         }"
                         @mousedown="startDrag('slide', $event)">
                        <div class="slide-glass">
                            {{-- Smear trail lines --}}
                            <div class="smear-trail">
                                <template x-for="line in smearLines" :key="line.id">
                                    <div class="smear-line"
                                         :style="`left: ${line.x}px; top: 50%; width: ${line.width}px; transform: translateY(-50%);`">
                                    </div>
                                </template>
                            </div>
                            {{-- Final smear --}}
                            <div class="smear" :class="{'visible': state.isSmearCreated, 'fixed': state.isFixed}"></div>
                        </div>
                        <div class="slide-label" x-show="!state.isSmearCreated && !isSmearing">Buyum oynasi</div>
                        <div class="slide-label" x-show="isSmearing" style="color: #8b5cf6;">Surtma qilinmoqda...</div>
                        <div class="slide-label" x-show="state.isSmearCreated && !state.isFixed" style="color: #7c3aed;">Olovga olib boring</div>
                    </div>

                    {{-- Fixed Bunsen Burner --}}
                    <div class="bunsen-burner" style="left: 300px; top: 180px;">
                        <div class="burner-base"></div>
                        <div class="burner-stem"></div>
                        <div class="burner-head"></div>
                        <div class="flame"></div>
                        <div class="burner-label">Olov</div>
                    </div>

                    {{-- Fixed Sample Tube --}}
                    <div class="sample-tube"
                         style="left: 450px; top: 130px;"
                         :class="{'tube-waiting': state.isSterilized && !state.hasSample}">
                        <div class="tube-cap"></div>
                        <div class="tube-body">
                            <div class="liquid" :style="`height: ${liquidLevel}%`"></div>
                        </div>
                        <div class="tube-label">Namuna</div>
                    </div>

                    {{-- Drop Zone Highlights --}}
                    <div class="drop-zone-highlight"
                         :class="{'active': hoveredZone === 'sterilize'}"
                         style="left: 250px; top: 180px; width: 100px; height: 200px;"></div>
                    <div class="drop-zone-highlight"
                         :class="{'active': hoveredZone === 'sampleTube'}"
                         style="left: 430px; top: 130px; width: 60px; height: 120px;"></div>
                    <div class="drop-zone-highlight"
                         :class="{'active': hoveredZone === 'slideArea'}"
                         :style="`left: ${itemPositions.slide.x}px; top: ${itemPositions.slide.y}px; width: 120px; height: 40px;`"></div>
                    <div class="drop-zone-highlight"
                         :class="{'active': hoveredZone === 'fixation'}"
                         style="left: 250px; top: 100px; width: 100px; height: 100px;"></div>

                    {{-- Completion Message --}}
                    <div x-show="allStepsCompleted"
                         x-transition
                         class="completion-message absolute bottom-4 left-1/2 transform -translate-x-1/2 w-4/5 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-500 rounded-lg p-6 text-center">
                        <h3 class="text-2xl font-bold text-green-700 mb-2">Tayyorlash yakunlandi!</h3>
                        <p class="text-green-600">Bakterial surtma mikroskopik tekshirish uchun tayyor.</p>
                    </div>
                </div>
            </section>

            {{-- RIGHT SIDEBAR: Progress Tracker --}}
            <aside class="col-span-3 space-y-4">
                <div class="bg-white rounded-lg shadow-lg p-6 sticky top-8">
                    <h2 class="text-xl font-bold text-gray-800 mb-6">Bosqichlar</h2>

                    <div class="space-y-4">
                        {{-- Step 1 --}}
                        <div class="step-card"
                             :class="state.isSterilized ? 'completed' : 'pending'"
                             @click="openModal(1)">
                            <div class="flex items-start gap-3">
                                <span class="flex items-center justify-center h-8 w-8 rounded-full text-lg"
                                      :class="state.isSterilized ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'">
                                    <span x-text="state.isSterilized ? '✓' : '1'"></span>
                                </span>
                                <div class="flex-1">
                                    <p class="font-semibold text-gray-800">Halqani sterillash</p>
                                    <p class="text-sm text-gray-600 mt-1">Halqani olov ustiga suring</p>
                                    <p class="text-xs text-blue-600 mt-1">Ko'rsatma ko'rish uchun bosing</p>
                                </div>
                            </div>
                        </div>

                        {{-- Step 2 --}}
                        <div class="step-card"
                             :class="[state.hasSample ? 'completed' : 'pending', !state.isSterilized ? 'disabled' : '']"
                             @click="openModal(2)">
                            <div class="flex items-start gap-3">
                                <span class="flex items-center justify-center h-8 w-8 rounded-full text-lg"
                                      :class="state.hasSample ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'">
                                    <span x-text="state.hasSample ? '✓' : '2'"></span>
                                </span>
                                <div class="flex-1">
                                    <p class="font-semibold text-gray-800">Namuna olish</p>
                                    <p class="text-sm text-gray-600 mt-1">Halqani probirkaga suring</p>
                                    <p class="text-xs text-blue-600 mt-1">Ko'rsatma ko'rish uchun bosing</p>
                                </div>
                            </div>
                        </div>

                        {{-- Step 3 --}}
                        <div class="step-card"
                             :class="[state.isSmearCreated ? 'completed' : 'pending', !state.hasSample ? 'disabled' : '']"
                             @click="openModal(3)">
                            <div class="flex items-start gap-3">
                                <span class="flex items-center justify-center h-8 w-8 rounded-full text-lg"
                                      :class="state.isSmearCreated ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'">
                                    <span x-text="state.isSmearCreated ? '✓' : '3'"></span>
                                </span>
                                <div class="flex-1">
                                    <p class="font-semibold text-gray-800">Surtma tayyorlash</p>
                                    <p class="text-sm text-gray-600 mt-1">Halqani slide ustiga suring</p>
                                    <p class="text-xs text-blue-600 mt-1">Ko'rsatma ko'rish uchun bosing</p>
                                </div>
                            </div>
                        </div>

                        {{-- Step 4 --}}
                        <div class="step-card"
                             :class="[state.isFixed ? 'completed' : 'pending', !state.isSmearCreated ? 'disabled' : '']"
                             @click="openModal(4)">
                            <div class="flex items-start gap-3">
                                <span class="flex items-center justify-center h-8 w-8 rounded-full text-lg"
                                      :class="state.isFixed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'">
                                    <span x-text="state.isFixed ? '✓' : '4'"></span>
                                </span>
                                <div class="flex-1">
                                    <p class="font-semibold text-gray-800">Fiksatsiya</p>
                                    <p class="text-sm text-gray-600 mt-1">Slide ni olov ustiga suring</p>
                                    <p class="text-xs text-blue-600 mt-1">Ko'rsatma ko'rish uchun bosing</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {{-- Tips Section --}}
                    <div class="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                        <p class="text-sm font-semibold text-blue-900 mb-2">Maslahatlar</p>
                        <ul class="text-xs text-blue-800 space-y-1">
                            <li>Sterillash barcha mikroorganizmlarni o'ldiradi</li>
                            <li>Har doim sterilangan halqadan foydalaning</li>
                            <li>Namunani yupqa qatlamda surting</li>
                            <li>Fiksatsiya namunani mahkamlaydi</li>
                        </ul>
                    </div>

                    {{-- Reset Button --}}
                    <button @click="resetSimulation()"
                            class="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2">
                        Qayta boshlash
                    </button>
                </div>
            </aside>
        </main>

        {{-- ==================== FOOTER ==================== --}}
        <footer class="bg-gray-800 text-white py-4 text-center text-sm">
            <p>Tibbiy Virtual Laboratoriya - Bakterial surtma tayyorlash | Ta'limiy simulyatsiya</p>
        </footer>
    </div>
</body>

</html>

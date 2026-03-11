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
                    <div class="step-badge"><span x-text="t('modalStep')"></span> <span x-text="currentStep"></span>/5</div>
                    <h2 x-text="currentStepData.title"></h2>
                </div>
                <div class="modal-body">
                    <div class="animation-container">
                        <div class="step-animation-wrap" x-html="currentStepData.animationHTML"></div>
                    </div>
                    <p class="modal-description text-slate-700 text-center px-6 mt-4" x-text="currentStepData.description"></p>
                    <div class="modal-actions">
                        <button @click="closeModal()" class="btn-primary" x-text="t('modalUnderstand')"></button>
                        <button @click="openModal(currentStep === 5 ? 1 : currentStep + 1)" class="btn-secondary" x-show="currentStep < 5" x-text="t('modalNext')"></button>
                    </div>
                </div>
            </div>
        </div>
    </template>

    <header class="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white shadow-2xl relative overflow-hidden">
        <!-- Background decoration -->
        <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.05\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        <div class="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between relative">
            <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center shadow-lg">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                    </svg>
                </div>
                <div>
                    <h1 class="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent" x-text="t('pageTitle')"></h1>
                    <p class="text-indigo-300 text-sm mt-0.5" x-text="t('pageSubtitle')"></p>
                </div>
            </div>
            <div class="text-right">
                <div class="flex items-center gap-3 mb-3">
                    <!-- Language Switcher -->
                    <div class="relative flex items-center gap-1 bg-white/10 rounded-lg p-1">
                        <button @click="setLanguage('uz')"
                                class="px-2 py-1 text-xs font-medium rounded-md transition-all duration-200"
                                :class="currentLang === 'uz' ? 'bg-white text-indigo-900 shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/10'">
                            UZ
                        </button>
                        <button @click="setLanguage('kaa')"
                                class="px-2 py-1 text-xs font-medium rounded-md transition-all duration-200"
                                :class="currentLang === 'kaa' ? 'bg-white text-indigo-900 shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/10'">
                            QQ
                        </button>
                        <button @click="setLanguage('ru')"
                                class="px-2 py-1 text-xs font-medium rounded-md transition-all duration-200"
                                :class="currentLang === 'ru' ? 'bg-white text-indigo-900 shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/10'">
                            RU
                        </button>
                    </div>
                    <span class="text-slate-500">|</span>
                    <!-- Sound Toggle Button -->
                    <button @click="toggleSound()" class="p-2 rounded-lg transition-all duration-200 hover:bg-white/10" :class="soundEnabled ? 'text-white' : 'text-slate-400'" :title="soundEnabled ? t('soundOn') : t('soundOff')">
                        <svg x-show="soundEnabled" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                        </svg>
                        <svg x-show="!soundEnabled" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
                        </svg>
                    </button>
                    <span class="text-slate-500">|</span>
                    <span class="text-sm text-indigo-200" x-text="t('progress') + ':'"></span>
                    <div class="flex gap-1">
                        <template x-for="i in 5" :key="i">
                            <div class="w-8 h-2 rounded-full transition-all duration-300"
                                 :class="i <= completedSteps ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-sm shadow-green-400/50' : 'bg-slate-700'"></div>
                        </template>
                    </div>
                    <span class="text-sm font-semibold text-white"><span x-text="completedSteps"></span>/5</span>
                </div>
                <div class="flex gap-2 flex-wrap justify-end">
                    <span x-show="state.isSterilized" class="bg-gradient-to-r from-green-400/90 to-emerald-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg shadow-green-500/20 border border-green-400/30" x-text="t('statusSterilized')"></span>
                    <span x-show="state.hasSample" class="bg-gradient-to-r from-green-400/90 to-emerald-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg shadow-green-500/20 border border-green-400/30" x-text="t('statusSampleTaken')"></span>
                    <span x-show="state.isSmearCreated" class="bg-gradient-to-r from-green-400/90 to-emerald-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg shadow-green-500/20 border border-green-400/30" x-text="t('statusSmearReady')"></span>
                    <span x-show="state.isFixed" class="bg-gradient-to-r from-green-400/90 to-emerald-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg shadow-green-500/20 border border-green-400/30" x-text="t('statusFixed')"></span>
                    <span x-show="state.isDyed" class="bg-gradient-to-r from-violet-400/90 to-purple-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg shadow-purple-500/20 border border-violet-400/30" x-text="t('statusDyed')"></span>
                    <span x-show="state.isWashed" class="bg-gradient-to-r from-cyan-400/90 to-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg shadow-blue-500/20 border border-cyan-400/30" x-text="t('statusWashed')"></span>
                </div>
            </div>
        </div>
    </header>

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 py-8 grid grid-cols-12 gap-6">
        <aside class="col-span-3 space-y-4">
            <div class="glass-panel rounded-2xl shadow-xl p-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                    </svg>
                    <span x-text="t('toolsTitle')"></span>
                </h2>
                <p class="text-xs text-slate-500 mb-3 text-center italic" x-text="t('dragHint')"></p>
                <div class="inventory-container" style="position: relative; min-height: 400px;">
                    <!-- Matchbox in Sidebar -->
                    <div class="matchbox"
                         style="position: absolute; left: 50%; top: 380px; transform: translateX(-50%);">
                        <div class="matchbox-container">
                            <div class="matchbox-label" x-text="t('matches')"></div>
                            <div class="matchbox-striker"></div>
                        </div>
                    </div>

                    <!-- Match (draggable) in Sidebar -->
                    <div x-show="matchState.inInventory && !matchState.isBurned"
                         class="match-stick"
                         style="position: absolute; left: 50%; top: 340px; transform: translateX(-50%);"
                         :class="{
                             'dragging': isDragging && draggedItem === 'match',
                             'burning': matchState.isLit
                         }"
                         @mousedown="startDrag('match', $event)">
                        <div class="match-head" :class="{'lit': matchState.isLit}"></div>
                        <div class="match-stick-body"></div>
                        <div x-show="matchState.isLit" class="match-flame"></div>
                        <div x-show="matchState.isLit && matchState.burnTimeLeft > 0" class="match-burn-timer">
                            <span x-text="matchState.burnTimeLeft + 's'"></span>
                        </div>
                    </div>

                    <!-- Inoculating Loop in Sidebar -->
                    <div x-show="inventoryState.loop"
                         class="inoculating-loop"
                         style="position: absolute; left: 50%; top: 20px; transform: translateX(-50%);"
                         :class="{
                             'dragging': isDragging && draggedItem === 'loop',
                             'drag-left': isDragging && draggedItem === 'loop' && dragDirection === 'left',
                             'drag-right': isDragging && draggedItem === 'loop' && dragDirection === 'right',
                             'drag-up': isDragging && draggedItem === 'loop' && dragDirection === 'up',
                             'drag-down': isDragging && draggedItem === 'loop' && dragDirection === 'down'
                         }"
                         @mousedown="startDrag('loop', $event)">
                        <div class="loop-handle"></div>
                        <div class="loop-circle" :class="{'heating': isHeating, 'sterilized': state.isSterilized && !isHeating, 'has-sample': state.hasSample}"></div>
                        <div x-show="sterilizationProgress > 0 && sterilizationProgress < 100" class="sterilization-progress">
                            <div class="sterilization-bar" :style="`width: ${sterilizationProgress}%`"></div>
                        </div>
                    </div>

                    <!-- Glass Slide in Sidebar -->
                    <div x-show="inventoryState.slide"
                         class="glass-slide"
                         style="position: absolute; left: 50%; top: 160px; transform: translateX(-50%);"
                         :class="{'dragging': isDragging && draggedItem === 'slide', 'smearing-active': isSmearing, 'fixing': isFixing, 'drying': isDrying}"
                         @mousedown="startDrag('slide', $event)">
                        <div class="steam-container" x-show="showSteam">
                            <div class="steam-particle"></div>
                            <div class="steam-particle"></div>
                            <div class="steam-particle"></div>
                            <div class="steam-particle"></div>
                            <div class="steam-particle"></div>
                        </div>
                        <div class="heat-shimmer" x-show="isFixing"></div>
                        <div class="slide-glass">
                            <div class="smear-trail">
                                <template x-for="line in smearLines" :key="line.id">
                                    <div class="smear-line" :style="`left:${line.x}px; top:${line.y}px; width:${line.width}px; height:${line.height}px; opacity:${line.opacity}; transform:translateY(-50%) rotate(${line.rotate}deg);`"></div>
                                </template>
                            </div>
                            <div class="target-area"></div>
                            <div class="smear-orbit-guide" x-show="state.hasSample && !state.isSmearCreated">
                                <div class="orbit-ring"></div>
                                <div class="orbit-progress" :style="`background: conic-gradient(#8b5cf6 ${smearOrbitPercent}%, rgba(203,213,225,0.35) ${smearOrbitPercent}% 100%);`"></div>
                            </div>
                            <div class="smear" :class="{'visible': state.isSmearCreated, 'fixed': state.isFixed}"></div>
                            <div class="smear-pigment" :class="{'visible': state.isSmearCreated, 'fixed': state.isFixed}"></div>
                            <div class="dye-drop-animation" :class="{'active': dyeDropAnimating}"></div>
                            <div class="stain-overlay" :class="{'visible': isDyeSpreadVisible, 'mature': isDyeMatured, 'washed': state.isWashed}"></div>
                            <div class="wash-runoff" :class="{'running': isRunoffAnimating}">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>

                    <!-- Dye Pipette in Sidebar -->
                    <div x-show="inventoryState.dyePipette && !resultSceneVisible"
                         class="reagent-tool reagent-dye"
                         style="position: absolute; left: 50%; top: 220px; transform: translateX(-50%);"
                         :class="{'dragging': isDragging && draggedItem === 'dyePipette', 'used': state.isDyed, 'locked': !state.isFixed}"
                         @mousedown="startDrag('dyePipette', $event)">
                        <svg viewBox="0 0 120 60" width="110" height="56" :aria-label="t('gentianViolet')">
                            <rect x="6" y="20" width="52" height="30" rx="10" fill="#6d28d9"/>
                            <rect x="12" y="24" width="40" height="22" rx="7" fill="#8b5cf6"/>
                            <path d="M58 33 L112 24 L114 30 L61 39 Z" fill="#cbd5e1"/>
                            <circle cx="25" cy="35" r="6" fill="#ddd6fe"/>
                        </svg>
                        <span x-text="t('gentianViolet')"></span>
                    </div>

                    <!-- Water Pipette in Sidebar -->
                    <div x-show="inventoryState.waterPipette && !resultSceneVisible"
                         class="reagent-tool reagent-water"
                         style="position: absolute; left: 50%; top: 300px; transform: translateX(-50%);"
                         :class="{'dragging': isDragging && draggedItem === 'waterPipette', 'used': state.isWashed, 'locked': !state.isFixed}"
                         @mousedown="startDrag('waterPipette', $event)">
                        <svg viewBox="0 0 120 60" width="110" height="56" :aria-label="t('distilledWater')">
                            <rect x="6" y="20" width="52" height="30" rx="10" fill="#0ea5e9"/>
                            <rect x="12" y="24" width="40" height="22" rx="7" fill="#67e8f9"/>
                            <path d="M58 33 L112 24 L114 30 L61 39 Z" fill="#cbd5e1"/>
                            <circle cx="25" cy="35" r="6" fill="#ecfeff"/>
                        </svg>
                        <span x-text="t('distilledWater')"></span>
                    </div>
                </div>
            </div>

            <!-- Bosqich Progress Card - Asboblar paneli tagida -->
            <div x-show="!resultSceneVisible && state.isSmearCreated"
                 x-transition:enter="transition ease-out duration-300"
                 x-transition:enter-start="opacity-0 transform -translate-y-2"
                 x-transition:enter-end="opacity-100 transform translate-y-0"
                 class="glass-panel rounded-2xl shadow-xl p-5">
                <h3 class="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <span x-text="t('stageProgressTitle')"></span>
                </h3>
                <div class="space-y-4">
                    <!-- 4-bosqich: Fiksatsiya -->
                    <div class="stage-progress-item" :class="{'done': state.isFixed}">
                        <div class="flex items-center justify-between text-sm mb-2">
                            <span class="font-medium text-gray-700 flex items-center gap-2">
                                <span class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                                      :class="state.isFixed ? 'bg-green-500 text-white' : 'bg-amber-100 text-amber-700'">4</span>
                                <span x-text="t('stage4Title')"></span>
                            </span>
                            <span class="text-xs font-semibold" :class="state.isFixed ? 'text-green-600' : 'text-amber-600'" x-text="`${Math.min(fixationPasses, 3)}/3`"></span>
                        </div>
                        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500 rounded-full" :style="`width:${fixationProgressPercent}%`"></div>
                        </div>
                    </div>
                    <!-- 5-bosqich: Bo'yash/Yuvish -->
                    <div class="stage-progress-item" :class="{'done': state.isWashed}">
                        <div class="flex items-center justify-between text-sm mb-2">
                            <span class="font-medium text-gray-700 flex items-center gap-2">
                                <span class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                                      :class="state.isWashed ? 'bg-green-500 text-white' : 'bg-violet-100 text-violet-700'">5</span>
                                <span x-text="t('stage5Title')"></span>
                            </span>
                            <span class="text-xs font-semibold" :class="state.isWashed ? 'text-green-600' : 'text-violet-600'">
                                <span x-show="!state.isDyed" x-text="t('waiting')"></span>
                                <span x-show="state.isDyed && !canWashNow" x-text="stainingTimeLeft + 's'"></span>
                                <span x-show="state.isDyed && canWashNow && !state.isWashed" x-text="t('ready')"></span>
                                <span x-show="state.isWashed">✓</span>
                            </span>
                        </div>
                        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-500 rounded-full" :style="`width:${stainingProgressPercent}%`"></div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>

        <section class="col-span-6">
            <div class="workbench-surface bg-white rounded-lg shadow-2xl p-8" x-ref="workbench">
                <h2 class="text-2xl font-bold text-gray-800 mb-4" x-text="t('workbenchTitle')"></h2>

                <!-- Inoculating Loop on Workbench -->
                <div x-show="!inventoryState.loop"
                     class="inoculating-loop"
                     :style="`left: ${itemPositions.loop.x}px; top: ${itemPositions.loop.y}px;`"
                     :class="{
                         'dragging': isDragging && draggedItem === 'loop',
                         'drag-left': isDragging && draggedItem === 'loop' && dragDirection === 'left',
                         'drag-right': isDragging && draggedItem === 'loop' && dragDirection === 'right',
                         'drag-up': isDragging && draggedItem === 'loop' && dragDirection === 'up',
                         'drag-down': isDragging && draggedItem === 'loop' && dragDirection === 'down'
                     }"
                     @mousedown="startDrag('loop', $event)">
                    <div class="loop-handle"></div>
                    <div class="loop-circle" :class="{'heating': isHeating, 'sterilized': state.isSterilized && !isHeating, 'has-sample': state.hasSample}"></div>
                    <div x-show="sterilizationProgress > 0 && sterilizationProgress < 100" class="sterilization-progress">
                        <div class="sterilization-bar" :style="`width: ${sterilizationProgress}%`"></div>
                    </div>
                    <div class="loop-label">
                        <span x-show="!state.isSterilized && !isHeating" x-text="t('loopDragToFlame')"></span>
                        <span x-show="isHeating" x-text="t('loopHeating')"></span>
                        <span x-show="state.isSterilized && !state.hasSample"><span x-text="t('loopDragToTube')"></span> (<span x-text="sampleProgressText"></span>)</span>
                        <span x-show="state.hasSample && !state.isSmearCreated"><span x-text="t('loopSmearProgress')"></span>: <span x-text="smearOrbitPercent"></span>%</span>
                    </div>
                </div>

                <!-- Match on Workbench -->
                <div x-show="!matchState.inInventory && !matchState.isBurned"
                     class="match-stick"
                     :style="`left: ${itemPositions.match.x}px; top: ${itemPositions.match.y}px;`"
                     :class="{
                         'dragging': isDragging && draggedItem === 'match',
                         'burning': matchState.isLit
                     }"
                     @mousedown="startDrag('match', $event)">
                    <div class="match-head" :class="{'lit': matchState.isLit}"></div>
                    <div class="match-stick-body"></div>
                    <div x-show="matchState.isLit" class="match-flame"></div>
                    <div x-show="matchState.isLit && matchState.burnTimeLeft > 0" class="match-burn-timer">
                        <span x-text="matchState.burnTimeLeft + 's'"></span>
                    </div>
                </div>

                <!-- Glass Slide on Workbench -->
                <div x-show="!inventoryState.slide"
                     class="glass-slide"
                     :style="`left: ${itemPositions.slide.x}px; top: ${itemPositions.slide.y}px; ${slideRotation > 0 ? 'transform: rotate(' + slideRotation + 'deg); transform-origin: left center;' : ''}`"
                     :class="{'dragging': isDragging && draggedItem === 'slide', 'smearing-active': isSmearing, 'fixing': isFixing, 'drying': isDrying, 'rotated': slideRotation > 0}"
                     @mousedown="startDrag('slide', $event)">
                    <div class="steam-container" x-show="showSteam">
                        <div class="steam-particle"></div>
                        <div class="steam-particle"></div>
                        <div class="steam-particle"></div>
                        <div class="steam-particle"></div>
                        <div class="steam-particle"></div>
                    </div>
                    <div class="heat-shimmer" x-show="isFixing"></div>
                    <div class="slide-glass">
                        <!-- Frosted edge zones (safe grip areas) -->
                        <div class="frosted-edge frosted-edge-left"></div>
                        <div class="frosted-edge frosted-edge-right"></div>
                        <div class="smear-trail">
                            <template x-for="line in smearLines" :key="line.id">
                                <div class="smear-line" :style="`left:${line.x}px; top:${line.y}px; width:${line.width}px; height:${line.height}px; opacity:${line.opacity}; transform:translateY(-50%) rotate(${line.rotate}deg);`"></div>
                            </template>
                        </div>
                        <div class="target-area"></div>
                        <div class="smear-orbit-guide" x-show="state.hasSample && !state.isSmearCreated">
                            <div class="orbit-ring"></div>
                            <div class="orbit-progress" :style="`background: conic-gradient(#8b5cf6 ${smearOrbitPercent}%, rgba(203,213,225,0.35) ${smearOrbitPercent}% 100%);`"></div>
                        </div>
                        <div class="smear" :class="{'visible': state.isSmearCreated, 'fixed': state.isFixed}"></div>
                        <div class="smear-pigment" :class="{'visible': state.isSmearCreated, 'fixed': state.isFixed}"></div>
                        <div class="dye-drop-animation" :class="{'active': dyeDropAnimating}"></div>
                        <div class="stain-overlay" :class="{'visible': isDyeSpreadVisible, 'mature': isDyeMatured, 'washed': state.isWashed}"></div>
                        <div class="wash-runoff" :class="{'running': isRunoffAnimating, 'angled': slideRotation >= 30}">
                            <span></span><span></span><span></span>
                        </div>
                    </div>

                    <!-- Rotation control (visible when dye applied and waiting for wash) -->
                    <div x-show="state.isDyed && canWashNow && !state.isWashed"
                         x-transition:enter="transition ease-out duration-200"
                         x-transition:enter-start="opacity-0 scale-90"
                         x-transition:enter-end="opacity-100 scale-100"
                         class="rotation-control">
                        <div class="rotation-control-label" x-text="t('rotationLabel') || 'Burchak'"></div>
                        <input type="range"
                               class="rotation-slider"
                               min="0"
                               max="90"
                               step="5"
                               x-model="slideRotation"
                               @input="updateSlideRotation($event.target.value)">
                        <div class="rotation-angle-display"
                             :class="{
                                 'perfect': slideRotation >= 40 && slideRotation <= 50,
                                 'good': (slideRotation >= 30 && slideRotation < 40) || (slideRotation > 50 && slideRotation <= 60),
                                 'warning': slideRotation < 30 || slideRotation > 60
                             }">
                            <span x-text="slideRotation + '°'"></span>
                        </div>
                    </div>

                    <!-- Angle indicator guide line -->
                    <div x-show="state.isDyed && canWashNow && !state.isWashed" class="angle-indicator"></div>
                </div>

                <!-- Spirit Lamp (static) -->
                <div class="spirit-lamp" style="left: 300px; top: 180px;" :class="{'lit': lampState.isLit}">
                    <div class="lamp-holder"></div>
                    <div class="lamp-flask">
                        <div class="lamp-liquid"></div>
                        <div class="lamp-wick"></div>
                    </div>
                    <div class="lamp-flame" x-show="lampState.isLit"></div>
                    <div class="lamp-glow" x-show="lampState.isLit"></div>
                    <div class="lamp-smoke" x-show="lampState.isLit">
                        <div class="smoke-particle"></div>
                        <div class="smoke-particle"></div>
                        <div class="smoke-particle"></div>
                    </div>
                    <div class="lamp-label" x-text="t('spiritLamp')"></div>
                </div>

                <!-- Sample Tube (static) -->
                <div class="sample-tube" style="left: 520px; top: 120px;" :class="{'tube-waiting': state.isSterilized && !state.hasSample}">
                    <div class="tube-cap"></div><div class="tube-body"><div class="liquid" :style="`height: ${liquidLevel}%`"></div></div><div class="tube-label" x-text="t('sampleLabel')"></div>
                </div>

                <!-- Drop Zone Highlights -->
                <div class="drop-zone-highlight" :class="{'active': hoveredZone === 'sterilize'}" style="left: 332px; top: 188px; width: 36px; height: 76px;"></div>
                <div class="drop-zone-highlight" :class="{'active': hoveredZone === 'sampleTube'}" style="left: 520px; top: 120px; width: 60px; height: 120px;"></div>
                <div class="drop-zone-highlight" :class="{'active': hoveredZone === 'slideArea' && !inventoryState.slide}" :style="`left: ${itemPositions.slide.x}px; top: ${itemPositions.slide.y}px; width: 120px; height: 40px;`"></div>
                <div class="drop-zone-highlight" :class="{'active': hoveredZone === 'fixation'}" style="left: 320px; top: 178px; width: 60px; height: 96px;"></div>
                <div class="drop-zone-highlight" :class="{'active': hoveredZone === 'dyeDrop' && !inventoryState.slide}" :style="`left: ${itemPositions.slide.x + 14}px; top: ${itemPositions.slide.y + 2}px; width: 92px; height: 36px;`"></div>
                <div class="drop-zone-highlight" :class="{'active': hoveredZone === 'washDrop' && !inventoryState.slide}" :style="`left: ${itemPositions.slide.x + 14}px; top: ${itemPositions.slide.y + 2}px; width: 92px; height: 36px;`"></div>

                <!-- Dye Pipette on Workbench -->
                <div x-show="!resultSceneVisible && !inventoryState.dyePipette"
                     class="reagent-tool reagent-dye"
                     :style="`left:${itemPositions.dyePipette.x}px; top:${itemPositions.dyePipette.y}px;`"
                     :class="{'dragging': isDragging && draggedItem === 'dyePipette', 'used': state.isDyed, 'locked': !state.isFixed}"
                     @mousedown="startDrag('dyePipette', $event)">
                    <svg viewBox="0 0 120 60" width="110" height="56" :aria-label="t('gentianViolet')">
                        <rect x="6" y="20" width="52" height="30" rx="10" fill="#6d28d9"/>
                        <rect x="12" y="24" width="40" height="22" rx="7" fill="#8b5cf6"/>
                        <path d="M58 33 L112 24 L114 30 L61 39 Z" fill="#cbd5e1"/>
                        <circle cx="25" cy="35" r="6" fill="#ddd6fe"/>
                    </svg>
                    <span x-text="t('gentianViolet')"></span>
                </div>

                <!-- Water Pipette on Workbench -->
                <div x-show="!resultSceneVisible && !inventoryState.waterPipette"
                     class="reagent-tool reagent-water"
                     :style="`left:${itemPositions.waterPipette.x}px; top:${itemPositions.waterPipette.y}px;`"
                     :class="{'dragging': isDragging && draggedItem === 'waterPipette', 'used': state.isWashed, 'locked': !state.isFixed}"
                     @mousedown="startDrag('waterPipette', $event)">
                    <svg viewBox="0 0 120 60" width="110" height="56" :aria-label="t('distilledWater')">
                        <rect x="6" y="20" width="52" height="30" rx="10" fill="#0ea5e9"/>
                        <rect x="12" y="24" width="40" height="22" rx="7" fill="#67e8f9"/>
                        <path d="M58 33 L112 24 L114 30 L61 39 Z" fill="#cbd5e1"/>
                        <circle cx="25" cy="35" r="6" fill="#ecfeff"/>
                    </svg>
                    <span x-text="t('distilledWater')"></span>
                </div>
            </div>
        </section>

        <aside class="col-span-3 space-y-4">
            <div class="glass-panel rounded-2xl shadow-xl p-6 sticky top-8">
                <h2 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                    </svg>
                    <span x-text="t('stepsTitle')"></span>
                </h2>
                <div class="space-y-3 text-sm text-gray-700">
                    <div class="step-card flex items-center gap-3" :class="state.isSterilized ? 'completed' : 'pending'" @click="openModal(1)">
                        <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" :class="state.isSterilized ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'">1</span>
                        <span x-text="t('step1')"></span>
                        <svg x-show="state.isSterilized" class="w-4 h-4 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                    </div>
                    <div class="step-card flex items-center gap-3" :class="state.hasSample ? 'completed' : 'pending'" @click="openModal(2)">
                        <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" :class="state.hasSample ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'">2</span>
                        <span x-text="t('step2')"></span>
                        <svg x-show="state.hasSample" class="w-4 h-4 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                    </div>
                    <div class="step-card flex items-center gap-3" :class="state.isSmearCreated ? 'completed' : 'pending'" @click="openModal(3)">
                        <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" :class="state.isSmearCreated ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'">3</span>
                        <span x-text="t('step3')"></span>
                        <svg x-show="state.isSmearCreated" class="w-4 h-4 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                    </div>
                    <div class="step-card flex items-center gap-3" :class="state.isFixed ? 'completed' : 'pending'" @click="openModal(4)">
                        <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" :class="state.isFixed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'">4</span>
                        <span x-text="t('step4')"></span>
                        <svg x-show="state.isFixed" class="w-4 h-4 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                    </div>
                    <div class="step-card flex items-center gap-3" :class="state.isDyed && state.isWashed ? 'completed' : 'pending'" @click="openModal(5)">
                        <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" :class="state.isDyed && state.isWashed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'">5</span>
                        <span x-text="t('step5')"></span>
                        <svg x-show="state.isDyed && state.isWashed" class="w-4 h-4 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                    </div>
                </div>
                <button @click="resetSimulation()" class="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    <span x-text="t('resetBtn')"></span>
                </button>
            </div>

            <!-- Drying Timer Card - O'ng panelda -->
            <div x-show="state.isFixed && !isDried && !resultSceneVisible"
                 x-transition:enter="transition ease-out duration-300"
                 x-transition:enter-start="opacity-0 transform translate-y-2"
                 x-transition:enter-end="opacity-100 transform translate-y-0"
                 class="glass-panel rounded-2xl shadow-xl p-5 border border-amber-200/30">
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <p class="text-sm font-bold text-slate-800" x-text="t('dryingTitle')"></p>
                </div>
                <p class="text-xs text-slate-600 mb-3 leading-relaxed" x-text="t('dryingDesc')"></p>
                <div x-show="isDrying" class="mb-3 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/50">
                    <div class="flex items-center justify-between text-xs mb-2">
                        <span class="text-amber-700 font-medium" x-text="t('dryingTime') + ':'"></span>
                        <span class="font-bold text-amber-800" x-text="dryingTimeLeft + 's'"></span>
                    </div>
                    <div class="h-2 bg-amber-100 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000 rounded-full" :style="`width: ${100 - (dryingTimeLeft / 4 * 100)}%`"></div>
                    </div>
                </div>
                <div x-show="!isDrying" class="text-center py-2">
                    <p class="text-xs text-amber-600 font-medium" x-text="t('dryingWaiting')"></p>
                </div>
            </div>

            <!-- 5-bosqich: Vizual bo'yash - O'ng panelda -->
            <div x-show="isDried && !resultSceneVisible"
                 x-transition:enter="transition ease-out duration-300"
                 x-transition:enter-start="opacity-0 transform translate-y-2"
                 x-transition:enter-end="opacity-100 transform translate-y-0"
                 class="glass-panel rounded-2xl shadow-xl p-5 border border-violet-200/30">
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                        </svg>
                    </div>
                    <p class="text-sm font-bold text-slate-800" x-text="t('stainingTitle')"></p>
                </div>
                <p class="text-xs text-slate-600 mb-3 leading-relaxed" x-text="t('stainingDesc')"></p>
                <div x-show="state.isDyed && !canWashNow" class="mb-3 p-2.5 rounded-xl bg-violet-50/80 border border-violet-200/50">
                    <div class="flex items-center justify-between text-xs mb-2">
                        <span class="text-violet-700 font-medium" x-text="t('reactionTime') + ':'"></span>
                        <span class="font-bold text-violet-800" x-text="stainingTimeLeft + 's'"></span>
                    </div>
                    <div class="h-2 bg-violet-100 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-1000 rounded-full" :style="`width: ${100 - (stainingTimeLeft / stainingWaitRequired * 100)}%`"></div>
                    </div>
                </div>
                <div x-show="state.isDyed && canWashNow && !state.isWashed" class="mb-3 p-2.5 rounded-xl bg-cyan-50/80 border border-cyan-200/50">
                    <p class="text-xs text-cyan-700 font-medium text-center" x-text="t('washNow')"></p>
                </div>
                <button @click="observeMicroscope()" class="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-slate-700 to-slate-800 text-white hover:from-slate-800 hover:to-slate-900 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                    </svg>
                    <span x-text="t('viewMicroscope')"></span>
                </button>
            </div>
        </aside>
    </main>

    <template x-if="resultSceneVisible">
        <div class="result-scene">
            <div class="result-panel">
                <h2 class="text-3xl font-bold text-slate-800 mb-2" x-text="t('resultTitle')"></h2>
                <p class="text-slate-600 mb-6" x-text="t('resultSubtitle')"></p>
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
                        <p class="text-sm text-slate-500" x-text="t('totalScore')"></p>
                        <p class="text-3xl font-bold text-slate-800"><span x-text="scoreOutOfTen"></span> / 10</p>
                        <p class="text-base text-slate-600 mt-1"><span x-text="scorePercent"></span>%</p>
                    </div>
                    <div class="result-card">
                        <p class="text-sm text-slate-500" x-text="t('category')"></p>
                        <p class="text-2xl font-bold text-slate-800" x-text="answerCategoryTranslated"></p>
                        <p class="text-xs text-slate-500 mt-2" x-text="t('scoreInfo')"></p>
                    </div>
                </div>
                <div class="result-card mt-4 overflow-hidden">
                    <table class="w-full text-left text-sm">
                        <thead><tr class="text-slate-500 border-b border-slate-200"><th class="py-2" x-text="t('criteriaTitle')"></th><th class="py-2" x-text="t('criteriaScore')"></th></tr></thead>
                        <tbody class="text-slate-700">
                        <tr><td class="py-2" x-text="t('critSterilization')"></td><td class="py-2" x-text="stepScores.sterilization"></td></tr>
                        <tr><td class="py-2" x-text="t('critSampling')"></td><td class="py-2" x-text="stepScores.sampling"></td></tr>
                        <tr><td class="py-2" x-text="t('critSmear')"></td><td class="py-2" x-text="stepScores.smear"></td></tr>
                        <tr><td class="py-2" x-text="t('critFixation')"></td><td class="py-2" x-text="stepScores.fixation"></td></tr>
                        <tr><td class="py-2" x-text="t('critDye')"></td><td class="py-2" x-text="stepScores.dye"></td></tr>
                        <tr><td class="py-2" x-text="t('critWashing')"></td><td class="py-2" x-text="stepScores.washing"></td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="result-card mt-4" x-show="errors.length > 0">
                    <p class="font-semibold text-rose-700 mb-2" x-text="t('errorsTitle')"></p>
                    <ul class="text-sm text-rose-700 list-disc pl-5">
                        <template x-for="err in errors" :key="err"><li x-text="err"></li></template>
                    </ul>
                </div>
                <button @click="resetSimulation()" class="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition" x-text="t('resetBtn')"></button>
            </div>
        </div>
    </template>

    <footer class="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-5 text-center relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-t from-transparent to-slate-900/50"></div>
        <div class="relative flex items-center justify-center gap-2 text-sm">
            <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
            </svg>
            <span class="text-slate-400" x-text="t('footerTitle')"></span>
            <span class="text-slate-600">|</span>
            <span class="text-slate-300 font-medium" x-text="t('pageTitle')"></span>
            <span class="text-slate-600">|</span>
            <span class="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent font-semibold" x-text="t('footerSubtitle')"></span>
        </div>
    </footer>

    <!-- Virtual Hand Overlay -->
    <div x-show="isDragging && draggedItem"
         class="virtual-hand"
         :class="handGripClass"
         :style="`left: ${handPosition.x}px; top: ${handPosition.y}px;`">
        <svg viewBox="0 0 100 120" width="80" height="96">
            <!-- Palm -->
            <ellipse cx="50" cy="70" rx="25" ry="30" fill="#ffd4a3" stroke="#d4a574" stroke-width="1.5"/>

            <!-- Thumb -->
            <g class="hand-thumb">
                <ellipse cx="25" cy="65" rx="8" ry="18" fill="#ffd4a3" stroke="#d4a574" stroke-width="1.5" transform="rotate(-25 25 65)"/>
            </g>

            <!-- Index finger -->
            <g class="hand-index">
                <rect x="45" y="20" width="10" height="35" rx="5" fill="#ffd4a3" stroke="#d4a574" stroke-width="1.5"/>
                <ellipse cx="50" cy="20" rx="5" ry="7" fill="#ffb380" stroke="#d4a574" stroke-width="1"/>
            </g>

            <!-- Middle finger -->
            <g class="hand-middle">
                <rect x="55" y="15" width="10" height="40" rx="5" fill="#ffd4a3" stroke="#d4a574" stroke-width="1.5"/>
                <ellipse cx="60" cy="15" rx="5" ry="7" fill="#ffb380" stroke="#d4a574" stroke-width="1"/>
            </g>

            <!-- Ring finger -->
            <g class="hand-ring">
                <rect x="65" y="20" width="10" height="35" rx="5" fill="#ffd4a3" stroke="#d4a574" stroke-width="1.5"/>
                <ellipse cx="70" cy="20" rx="5" ry="7" fill="#ffb380" stroke="#d4a574" stroke-width="1"/>
            </g>

            <!-- Pinky -->
            <g class="hand-pinky">
                <rect x="75" y="30" width="8" height="28" rx="4" fill="#ffd4a3" stroke="#d4a574" stroke-width="1.5"/>
                <ellipse cx="79" cy="30" rx="4" ry="6" fill="#ffb380" stroke="#d4a574" stroke-width="1"/>
            </g>
        </svg>
    </div>
</div>
</body>
</html>

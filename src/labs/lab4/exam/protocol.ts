/**
 * Lab 4 — **paper-disk diffusion** (antibiotic sensitivity). Exam scoring
 * follows the assignment PDF exactly: five criteria, each graded full / partial
 * (half) / zero, max 100.
 */

export type LabMode = "learn" | "exam";
export type ExamPhase = "planning" | "execution" | "result";

export const INCUBATE_MS = 10000;
export const DISPLAY_INCUBATE_HOURS = 24;

export interface MainStep {
  id: string;
  card: string;
  result: string;
  full: number;
  partial: number;
  requires: string[];
}

export const MAIN_STEPS: MainStep[] = [
  {
    id: "lawn",
    card: "Kulturani gazon usulida ekish",
    result: "Steril paxta tamponni kulturaga botirib, idishni ~60° aylantirib 3 yo'nalishda «gazon» eking va ~5 daqiqa quriting",
    full: 10,
    partial: 5,
    requires: [],
  },
  {
    id: "disks",
    card: "Antibiotik disklarini qo'yish",
    result: "Antibiotik shimdirilgan qog'oz disklarni pinset bilan agar yuzasiga joylashtirish",
    full: 20,
    partial: 10,
    requires: ["lawn"],
  },
  {
    id: "incubate",
    card: "Termostat 37°C, 24 soat",
    result: "Ekilgan idishni ag'darilgan holda 37°C da 24 soat termostatda saqlash",
    full: 22,
    partial: 11,
    requires: ["disks"],
  },
  {
    id: "measure",
    card: "Tormozlanish zonasini o'lchash",
    result: "Disk atrofidagi steril (o'sishi to'xtagan) zona diametrini o'lchash",
    full: 28,
    partial: 14,
    requires: ["incubate"],
  },
  {
    id: "classify",
    card: "Sezuvchanlikni aniqlash",
    result: "Zonani antibiotik chegaralari bilan baholash: Sezgir / Oraliq / Chidamli (CLSI)",
    full: 20,
    partial: 10,
    requires: ["measure"],
  },
];

export const MAX_SCORE = MAIN_STEPS.reduce((a, s) => a + s.full, 0); // 100

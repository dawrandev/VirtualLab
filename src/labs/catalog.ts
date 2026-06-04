/**
 * Catalog of the 6 microbiology laboratories shown on the home menu.
 * Lab 1 (methylene-blue simple stain) is fully built; the rest are planned
 * and shown as "coming soon" until implemented.
 */
export interface LabEntry {
  id: number;
  /** Route under /lab/<id>. */
  href: string;
  title: string;
  subtitle: string;
  description: string;
  /** Accent colours for the icon chip + hover ring. */
  accent: { from: string; to: string; ring: string; soft: string };
  /** SVG inner markup (paths/shapes) rendered inside a 0 0 24 24 viewBox. */
  paths: string;
  available: boolean;
}

export const LABS: LabEntry[] = [
  {
    id: 1,
    href: "/lab/1",
    title: "Bakterial hujayra morfologiyasi",
    subtitle: "Oddiy bo'yash — metilen ko'ki",
    description: "Surtma tayyorlash, fiksatsiya va metilen ko'ki bilan bo'yab, hujayra shaklini mikroskopda o'rganish.",
    accent: { from: "#6366f1", to: "#4338ca", ring: "#a5b4fc", soft: "#eef2ff" },
    paths:
      "M9 3h6M10 3v6.5L5.5 18a2.5 2.5 0 0 0 2.3 3.5h8.4a2.5 2.5 0 0 0 2.3-3.5L14 9.5V3M7.5 15h9",
    available: true,
  },
  {
    id: 2,
    href: "/lab/2",
    title: "Gram bo'yash usuli",
    subtitle: "Differensial bo'yash",
    description: "Gen-violet, lyugol, spirt va fuksin bilan Gram-musbat va Gram-manfiy bakteriyalarni ajratish.",
    accent: { from: "#a855f7", to: "#7e22ce", ring: "#d8b4fe", soft: "#faf5ff" },
    paths:
      "M5 4h14M7 4v4l-2 9a2 2 0 0 0 2 2.6M17 4v4l2 9a2 2 0 0 1-2 2.6M9 20h6",
    available: true,
  },
  {
    id: 3,
    href: "/lab/3",
    title: "Drigalski usulida ekish",
    subtitle: "Shpatel bilan ekish — toza kultura",
    description: "Suspenziyani shpatel bilan 3 ta plastinkaga ketma-ket surtib, alohida koloniyalardan toza kultura ajratish va Gram bo'yash.",
    accent: { from: "#14b8a6", to: "#0f766e", ring: "#5eead4", soft: "#f0fdfa" },
    paths:
      "M4 9a8 4 0 1 0 16 0 8 4 0 1 0-16 0zM7 9q5 -3 10 0M7 11q5 -2 10 0",
    available: true,
  },
  {
    id: 4,
    href: "/lab/4",
    title: "Antibiotiklarga sezuvchanlik",
    subtitle: "Qog'oz disk usuli (disk-diffuziya)",
    description: "Kulturani gazon ekib, antibiotik disklarini qo'yib, tormozlanish zonalarini o'lchab sezuvchanlikni aniqlash.",
    accent: { from: "#0ea5e9", to: "#0369a1", ring: "#7dd3fc", soft: "#f0f9ff" },
    paths:
      "M4 9a8 4 0 1 0 16 0 8 4 0 1 0-16 0zM9 7.5a1.4 1.4 0 1 0 0 2.8M14 8a1.6 1.6 0 1 0 0 3M11 11a1.3 1.3 0 1 0 0 2.6",
    available: true,
  },
  {
    id: 5,
    href: "/lab/5",
    title: "Bakteriya harakatchanligi",
    subtitle: "Osma tomchi usuli",
    description: "Tirik bakteriyalarni osma tomchida kuzatib, haqiqiy harakat va broun harakatini farqlash.",
    accent: { from: "#f59e0b", to: "#b45309", ring: "#fcd34d", soft: "#fffbeb" },
    paths:
      "M12 3c3 4 5 6.5 5 9a5 5 0 0 1-10 0c0-2.5 2-5 5-9zM10.5 13a1.5 1.5 0 0 0 1.5 1.5",
    available: false,
  },
  {
    id: 6,
    href: "/lab/6",
    title: "Ziehl-Neelsen usuli",
    subtitle: "Kislotaga chidamli bo'yash",
    description: "Karbol fuksin, kislota va metilen ko'ki bilan sil tayoqchasini (KChB) aniqlash.",
    accent: { from: "#ec4899", to: "#be185d", ring: "#f9a8d4", soft: "#fdf2f8" },
    paths:
      "M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7zM12 6v6M9 9h6",
    available: false,
  },
];

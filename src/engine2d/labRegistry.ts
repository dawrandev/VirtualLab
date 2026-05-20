import type { Lab2DConfig, LabId } from "./types";

type LabRecord = {
  id: LabId;
  slug: string;
  load: () => Promise<{ default: Lab2DConfig }>;
};

export const lab2DRecords: LabRecord[] = [
  {
    id: 1,
    slug: "bacterial-smear",
    load: () => import("@/labs/lab1/config2d"),
  },
];

export async function loadLab2DConfig(idOrSlug: number | string): Promise<Lab2DConfig | null> {
  const record = lab2DRecords.find(
    (r) => r.id === Number(idOrSlug) || r.slug === idOrSlug,
  );
  if (!record) return null;
  const mod = await record.load();
  return mod.default;
}

export function listLab2D(): Array<{ id: LabId; slug: string }> {
  return lab2DRecords.map(({ id, slug }) => ({ id, slug }));
}

import type { LabConfig, LabId } from "./types";

/**
 * Registry of all available labs. Each entry is loaded lazily so unused labs
 * don't bloat the initial bundle. Add labs here as they're built.
 */
type LabRecord = {
  id: LabId;
  slug: string;
  load: () => Promise<{ default: LabConfig }>;
};

export const labRecords: LabRecord[] = [
  {
    id: 1,
    slug: "bacterial-smear",
    load: () => import("@/labs/lab1/config"),
  },
];

export async function loadLabConfig(idOrSlug: number | string): Promise<LabConfig | null> {
  const record = labRecords.find(
    (r) => r.id === Number(idOrSlug) || r.slug === idOrSlug,
  );
  if (!record) return null;
  const mod = await record.load();
  return mod.default;
}

export function listLabs(): Array<{ id: LabId; slug: string }> {
  return labRecords.map(({ id, slug }) => ({ id, slug }));
}

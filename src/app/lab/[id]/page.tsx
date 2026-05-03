import { LabExperience } from "@/components/LabExperience";
import { listLabs } from "@/engine/labRegistry";

/** Required for static export of dynamic route. */
export function generateStaticParams() {
  return listLabs().map((l) => ({ id: String(l.id) }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LabPage({ params }: PageProps) {
  const { id } = await params;
  return <LabExperience labId={Number(id)} />;
}

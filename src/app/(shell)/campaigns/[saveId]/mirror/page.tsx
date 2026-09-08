import { MirrorView } from "@/components/campaign/MirrorView";

type Props = {
  params: Promise<{ saveId: string }>;
};

export default async function MirrorPage({ params }: Props) {
  const { saveId } = await params;
  return <MirrorView saveId={saveId} />;
}

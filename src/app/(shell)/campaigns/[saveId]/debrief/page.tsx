import { DebriefFlow } from "@/components/campaign/DebriefFlow";

type Props = {
  params: Promise<{ saveId: string }>;
};

export default async function DebriefPage({ params }: Props) {
  const { saveId } = await params;
  return <DebriefFlow saveId={saveId} />;
}

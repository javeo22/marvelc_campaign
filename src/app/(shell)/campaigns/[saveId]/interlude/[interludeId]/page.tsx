import { InterludeFlow } from "@/components/campaign/InterludeFlow";

type Props = {
  params: Promise<{ saveId: string; interludeId: string }>;
};

export default async function InterludePage({ params }: Props) {
  const { saveId, interludeId } = await params;
  return <InterludeFlow saveId={saveId} interludeId={interludeId} />;
}

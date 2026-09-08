import { JourneyView } from "@/components/campaign/JourneyView";

type Props = {
  params: Promise<{ saveId: string }>;
};

export default async function JourneyPage({ params }: Props) {
  const { saveId } = await params;
  return <JourneyView saveId={saveId} />;
}

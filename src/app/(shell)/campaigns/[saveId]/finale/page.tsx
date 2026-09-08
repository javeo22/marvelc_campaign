import { FinaleView } from "@/components/campaign/FinaleView";

type Props = {
  params: Promise<{ saveId: string }>;
};

export default async function FinalePage({ params }: Props) {
  const { saveId } = await params;
  return <FinaleView saveId={saveId} />;
}

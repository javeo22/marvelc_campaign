import { PassportView } from "@/components/campaign/PassportView";

type Props = {
  params: Promise<{ saveId: string }>;
};

export default async function PassportPage({ params }: Props) {
  const { saveId } = await params;
  return <PassportView saveId={saveId} />;
}

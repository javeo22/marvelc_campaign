import { CampaignDashboard } from "@/components/campaign/CampaignDashboard";

type Props = {
  params: Promise<{ saveId: string }>;
};

export default async function CampaignPage({ params }: Props) {
  const { saveId } = await params;
  return <CampaignDashboard saveId={saveId} />;
}

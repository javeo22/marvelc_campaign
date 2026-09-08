import { notFound } from "next/navigation";
import { IssuePreparation } from "@/components/campaign/IssuePreparation";

type Props = {
  params: Promise<{ saveId: string; issueNumber: string }>;
};

export default async function PrepareIssuePage({ params }: Props) {
  const { saveId, issueNumber } = await params;
  const parsed = Number(issueNumber);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 15) notFound();
  return <IssuePreparation saveId={saveId} issueNumber={parsed} />;
}

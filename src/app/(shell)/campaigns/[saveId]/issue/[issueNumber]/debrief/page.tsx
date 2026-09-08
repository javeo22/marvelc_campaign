import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ saveId: string }>;
};

export default async function IssueDebriefAliasPage({ params }: Props) {
  const { saveId } = await params;
  redirect(`/campaigns/${saveId}/debrief`);
}

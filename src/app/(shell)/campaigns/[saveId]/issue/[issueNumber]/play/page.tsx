import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ saveId: string }>;
};

export default async function IssuePlayAliasPage({ params }: Props) {
  const { saveId } = await params;
  redirect(`/campaigns/${saveId}/play`);
}

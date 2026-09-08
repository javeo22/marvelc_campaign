import { BackupView } from "@/components/campaign/BackupView";

type Props = {
  searchParams: Promise<{ saveId?: string }>;
};

export default async function BackupPage({ searchParams }: Props) {
  const { saveId } = await searchParams;
  return <BackupView saveId={saveId} />;
}

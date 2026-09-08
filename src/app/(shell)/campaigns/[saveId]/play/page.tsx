import { TableMode } from "@/components/play/TableMode";

type Props = {
  params: Promise<{ saveId: string }>;
};

export default async function PlayPage({ params }: Props) {
  const { saveId } = await params;
  return <TableMode saveId={saveId} />;
}

import Link from "next/link";
import { ErrorPanel } from "@/components/comic/ComicPrimitives";

export default function NotFound() {
  return (
    <main className="app-main">
      <ErrorPanel title="Panel not found">
        <p>The requested route is not part of this campaign companion.</p>
        <Link className="button" href="/">Return to campaign library</Link>
      </ErrorPanel>
    </main>
  );
}

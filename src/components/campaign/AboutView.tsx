import Link from "next/link";
import { ComicHeader, ComicPanel } from "@/components/comic/ComicPrimitives";

export function AboutView() {
  const cardImagesRequested = process.env.NEXT_PUBLIC_CARD_IMAGE_MODE === "remote";

  return (
    <>
      <ComicHeader eyebrow="About" title="Fan project notice" subtitle="This companion supports physical play and does not replace the game." />
      <ComicPanel>
        <p>
          Core Protocol Companion is an unofficial, noncommercial fan-made companion for use with a legally obtained physical copy of Marvel Champions: The Card Game. It is not affiliated with, authorized by, sponsored by, or endorsed by Fantasy Flight Games, Asmodee, Marvel, Disney, or MarvelCDB.
        </p>
        <p>
          Marvel Champions, Marvel characters, names, logos, card artwork, card text, and related marks and creative material belong to their respective owners. Campaign text and original application interface elements are fan-created unless otherwise identified.
        </p>
        <p>
          Card metadata or externally hosted images may be unavailable or disabled at any time.
          {cardImagesRequested
            ? " This build may request remote MarvelCDB-hosted images directly when the server kill switch also allows it."
            : " Remote images are off until the launch checklist is signed."}
        </p>
        <p>
          Rights holders and service operators can report attribution, linking, or removal requests through the project issues page.
        </p>
        <Link className="button" href="/settings">Settings</Link>
        <Link className="button" href="https://github.com/javeo22/marvelc_campaign/issues" target="_blank" rel="noreferrer">
          Rights contact
        </Link>
      </ComicPanel>
    </>
  );
}

import Image from "next/image";
import { ImageOff } from "lucide-react";

export function ExternalCardImage({
  mode,
  src,
  alt,
  unavailableReason,
  label,
  meta
}: {
  mode: "off" | "remote";
  src: string | null;
  alt: string;
  unavailableReason?: string | null;
  label?: string;
  meta?: string;
}) {
  if (mode === "off" || !src) {
    return (
      <div className="card-art-slot" aria-label={alt}>
        <div className="card-art-slot__fallback">
          <ImageOff aria-hidden="true" />
          <strong>{label ?? "Metadata only"}</strong>
          {meta ? <span>{meta}</span> : null}
          <small>{unavailableReason ?? "Card images are disabled by the global launch gate."}</small>
        </div>
      </div>
    );
  }
  return (
    <div className="card-art-slot">
      <Image
        src={src}
        alt={alt}
        width={240}
        height={336}
        unoptimized
        loading="lazy"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}

import Image from "next/image";
import { ImageOff } from "lucide-react";

export function ExternalCardImage({
  mode,
  src,
  alt,
  unavailableReason,
  label,
  meta,
  orientation = "portrait"
}: {
  mode: "off" | "remote";
  src: string | null;
  alt: string;
  unavailableReason?: string | null;
  label?: string;
  meta?: string;
  orientation?: "portrait" | "landscape";
}) {
  if (mode === "off" || !src) {
    return (
      <div className="card-art-slot" data-orientation={orientation} aria-label={alt}>
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
    <div className="card-art-slot" data-orientation={orientation}>
      <Image
        src={src}
        alt={alt}
        width={orientation === "landscape" ? 336 : 240}
        height={orientation === "landscape" ? 240 : 336}
        unoptimized
        loading="lazy"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}

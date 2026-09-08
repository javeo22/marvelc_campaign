import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const noindex = process.env.NEXT_PUBLIC_BETA_NOINDEX === "true";
  return {
    rules: {
      userAgent: "*",
      allow: noindex ? undefined : "/",
      disallow: noindex ? "/" : undefined
    }
  };
}

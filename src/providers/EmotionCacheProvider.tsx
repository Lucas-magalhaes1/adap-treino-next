"use client";

import { CacheProvider } from "@emotion/react";
import { createEmotionCache } from "../providers/createEmotionCache";
export default function EmotionCacheProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const cache = createEmotionCache();

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}

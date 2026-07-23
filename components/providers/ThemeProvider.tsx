"use client";

/**
 * ThemeProvider
 * Thin wrapper around `next-themes` ThemeProvider so it can be imported
 * as a named export and used inside the RSC-friendly root layout without
 * the "use client" directive polluting the layout file.
 */

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

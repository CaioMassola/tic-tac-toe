"use client";

import { usePreferences } from "@/lib/preferences";
import { translations } from "@/lib/translations";

export function useTranslation() {
  const { locale } = usePreferences();

  return translations[locale];
}

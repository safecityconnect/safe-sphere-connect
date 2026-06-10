"use client";

import { Globe } from "lucide-react";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";

type LanguageSelectorProps = {
  className?: string;
  compact?: boolean;
};

export function LanguageSelector({ className, compact = false }: LanguageSelectorProps) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {!compact && (
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{t.selectLanguage}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code as Locale)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              locale === code
                ? "bg-primary text-white"
                : "bg-slate-100 text-muted hover:bg-primary-light hover:text-primary"
            )}
          >
            {LOCALE_LABELS[code]}
          </button>
        ))}
      </div>
    </div>
  );
}

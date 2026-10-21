import React from "react";
import {
  Clock,
  BarChart,
  Database,
  Settings,
  UploadCloud,
  Terminal,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { translate } from "@common/i18n/translator";
import { TranslationDictionary } from "@common/i18n/types";
import { Locale } from "@/src/bindings/Locale";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { AppTabId } from "@common/types/navigation";
import { cn } from "@/lib/utils";

export type LargeTabId = AppTabId;

interface TabBarProps {
  locale: Locale;
  customTranslations?: Partial<TranslationDictionary>;
  activeLargeTab: AppTabId;
  setActiveLargeTab: (tab: AppTabId) => void;
}

export default function TabBar({
  locale,
  customTranslations,
  activeLargeTab,
  setActiveLargeTab,
}: TabBarProps) {
  const tabs: Array<{
    id: AppTabId;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    label: string;
  }> = [
    {
      id: "tasks",
      icon: Clock,
      iconColor: "text-orange-400",
      label: translate(locale, "app", "TabMain", customTranslations),
    },
    {
      id: "reports",
      icon: BarChart,
      iconColor: "text-teal-400",
      label: translate(locale, "report", "TabReports", customTranslations),
    },
    {
      id: "db",
      icon: Database,
      iconColor: "text-indigo-400",
      label: translate(locale, "database", "TabDb", customTranslations),
    },
    {
      id: "settings",
      icon: Settings,
      iconColor: "text-yellow-400",
      label: translate(locale, "settings", "TabOptions", customTranslations),
    },
    {
      id: "backup",
      icon: UploadCloud,
      iconColor: "text-emerald-400",
      label: translate(locale, "settings", "TabBackup", customTranslations),
    },
    {
      id: "cli",
      icon: Terminal,
      iconColor: "text-muted-foreground",
      label: translate(locale, "cli", "TabCli", customTranslations),
    },
    {
      id: "manual",
      icon: BookOpen,
      iconColor: "text-rose-400",
      label: translate(locale, "help", "TabManual", customTranslations),
    },
    {
      id: "credits",
      icon: Sparkles,
      iconColor: "text-sky-400",
      label: translate(locale, "help", "TabCredits", customTranslations),
    },
  ];

  return (
    <div className="shrink-0 z-20 border-b border-border bg-muted/30 transition-all duration-300">
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Tabs
          value={activeLargeTab}
          onValueChange={(val) => {
            if (val) setActiveLargeTab(val as AppTabId);
          }}
        >
          <TabsList
            aria-label="Navigation tabs"
            className="flex gap-1.5 py-2.5 whitespace-nowrap min-w-max group-data-horizontal/tabs:!h-auto !h-auto bg-transparent border-0 p-0"
          >
            {tabs.map((tb) => {
              const isActive = activeLargeTab === tb.id;
              return (
                <TabsTrigger
                  key={tb.id}
                  value={tb.id}
                  data-testid={`tab-${tb.id}`}
                  onClick={() => setActiveLargeTab(tb.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 h-auto rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer capitalize flex-none",
                    isActive
                      ? "bg-card text-foreground border border-border shadow-xs font-extrabold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <tb.icon
                    className={cn(
                      "w-4 h-4",
                      tb.iconColor,
                      isActive && "animate-pulse",
                    )}
                  />
                  <span>{tb.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}

import React from "react";
import { ListTodo, BarChart3, Settings } from "lucide-react";
import { translate, TranslationDictionary } from "@common/i18n/translator";
import { Locale } from "@/src/bindings/Locale";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { Area } from "@components/ui/area";
import { MediumTabId } from "@common/types/navigation";
import { cn } from "@/lib/utils";

export type MediumTabType = MediumTabId;
export type { MediumTabId };

export interface MediumTabBarProps {
  currentTab: MediumTabId;
  onSelectTab: (tab: MediumTabId) => void;
  locale?: Locale;
  customTranslations?: Partial<TranslationDictionary>;
}

export default function MediumTabBar({
  currentTab,
  onSelectTab,
  locale = "en",
  customTranslations,
}: MediumTabBarProps) {
  const tabs = [
    {
      id: "tasks" as const,
      icon: ListTodo,
      label: translate(locale, "app", "TabMain", customTranslations),
      testId: "medium-tab-tasks",
    },
    {
      id: "reports" as const,
      icon: BarChart3,
      label: translate(locale, "report", "TabReports", customTranslations),
      testId: "medium-tab-reports",
    },
    {
      id: "settings" as const,
      icon: Settings,
      label: translate(locale, "settings", "TabOptions", customTranslations),
      testId: "medium-tab-settings",
    },
  ];

  return (
    <Area
      as="nav"
      id="medium-bottom-nav"
      className="shrink-0 mt-2 z-30"
      aria-label="Navigation Tabs"
    >
      <Tabs
        value={currentTab}
        onValueChange={(val) => {
          if (val) onSelectTab(val as MediumTabId);
        }}
      >
        <TabsList
          aria-label="Navigation Tabs"
          className="p-1.5 border border-border rounded-section grid grid-cols-3 gap-section w-full h-auto group-data-horizontal/tabs:h-auto items-stretch bg-card/95 backdrop-blur-md text-foreground justify-start overflow-hidden"
        >
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                data-testid={tab.testId}
                onClick={() => onSelectTab(tab.id)}
                className={cn(
                  "flex-1 h-full min-h-[44px] py-2 px-1.5 flex flex-col items-center justify-center gap-1 rounded-section text-[length:var(--text-main)] leading-tight transition-all cursor-pointer overflow-hidden",
                  isActive
                    ? "text-primary font-bold bg-primary/10 shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="icon-medium shrink-0" />
                <span className="text-main leading-tight tracking-tight text-inherit truncate max-w-full">
                  {tab.label}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </Area>
  );
}

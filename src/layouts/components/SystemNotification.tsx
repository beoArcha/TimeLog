import React from 'react';
import { AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';
import { AnimatedCard } from '@components/AnimatedCard';
import { Button } from '@components/ui/button';
import { Caption } from '@components/ui/typography';
import { useWindowShell } from '@common/contexts/WindowShellContext';

/**
 * System notification banner for displaying tray and engine state alerts.
 */
export default function SystemNotification() {
  const { trayNotification, setTrayNotification } = useWindowShell();

  return (
    <AnimatePresence>
      {trayNotification && (
        <AnimatedCard
          id="tray-toast-notification"
          hoverable={false}
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] max-w-md w-full border-2 p-4 rounded-2xl shadow-2xl flex-row items-start gap-3.5 bg-card/95 backdrop-blur-xl border-orange-500/50 text-card-foreground h-auto"
        >
          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-500 shrink-0 border border-orange-500/30 animate-pulse">
            <Bell className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-wider text-orange-500 uppercase">
                System Notification Tray
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTrayNotification(null)}
                className="size-6 p-0 text-muted-foreground hover:text-foreground"
                aria-label="Close notification"
              >
                <X className="w-4 h-4 cursor-pointer" />
              </Button>
            </div>
            <Caption variant="muted" className="mt-1 leading-relaxed">
              {trayNotification}
            </Caption>
          </div>
        </AnimatedCard>
      )}
    </AnimatePresence>
  );
}

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';
import { useOxyFlow } from '@common/hooks/OxyContext';

export default function SystemNotification() {
  const { trayNotification, setTrayNotification, resolvedTheme } = useOxyFlow();

  return (
    <AnimatePresence>
      {trayNotification && (
        <motion.div
          id="tray-toast-notification"
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] max-w-md w-full border-2 p-4 rounded-2xl shadow-2xl flex items-start gap-3.5 ${
            resolvedTheme === 'light'
              ? 'bg-[#FCFAF8]/95 backdrop-blur-xl border-orange-500/50 text-[#2C2421]'
              : resolvedTheme === 'high-contrast'
              ? 'bg-black border-white text-white'
              : 'bg-slate-900/90 backdrop-blur-2xl border-orange-500/40 text-white'
          }`}
        >
          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-450 shrink-0 border border-orange-500/30 animate-pulse">
            <Bell className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-wider text-orange-500 uppercase">System Notification Tray</span>
              <button 
                onClick={() => setTrayNotification(null)}
                className={`text-xs ${resolvedTheme === 'light' ? 'text-[#8A7A71] hover:text-slate-950' : 'text-[#9B8C83] hover:text-white'}`}
              >
                <X className="w-4 h-4 cursor-pointer" />
              </button>
            </div>
            <p className={`text-xs font-sans mt-1 leading-relaxed ${
              resolvedTheme === 'light' ? 'text-[#5A4A42]' : 'text-slate-200'
            }`}>
              {trayNotification}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

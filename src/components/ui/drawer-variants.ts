import { cva } from 'class-variance-authority';

export const drawerVariants = cva(
  'fixed z-50 flex flex-col bg-card/95 backdrop-blur-xl text-card-foreground border-border shadow-2xl transition-all duration-300 ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 max-h-[85vh] border-b animate-in slide-in-from-top duration-300 data-[starting-style]:-translate-y-full data-[ending-style]:-translate-y-full data-[ending-style]:animate-out data-[ending-style]:slide-out-to-top data-[ending-style]:fade-out-0',
        bottom: 'inset-x-0 bottom-0 max-h-[85vh] border-t animate-in slide-in-from-bottom duration-300 data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full data-[ending-style]:animate-out data-[ending-style]:slide-out-to-bottom data-[ending-style]:fade-out-0',
        left: 'inset-y-0 left-0 max-w-[85vw] sm:max-w-md w-full border-r animate-in slide-in-from-left duration-300 data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full data-[ending-style]:animate-out data-[ending-style]:slide-out-to-left data-[ending-style]:fade-out-0',
        right: 'inset-y-0 right-0 max-w-[85vw] sm:max-w-md w-full border-l animate-in slide-in-from-right duration-300 data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full data-[ending-style]:animate-out data-[ending-style]:slide-out-to-right data-[ending-style]:fade-out-0',
      },
    },
    defaultVariants: {
      side: 'top',
    },
  }
);

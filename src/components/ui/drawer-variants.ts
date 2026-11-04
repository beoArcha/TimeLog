import { cva } from 'class-variance-authority';

export const drawerVariants = cva(
  'fixed z-50 flex flex-col bg-card/95 backdrop-blur-xl text-card-foreground border-border shadow-2xl transition-all duration-300 ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 max-h-[85vh] border-b data-[starting-style]:-translate-y-full data-[ending-style]:-translate-y-full',
        bottom: 'inset-x-0 bottom-0 max-h-[85vh] border-t data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full',
        left: 'inset-y-0 left-0 max-w-[85vw] sm:max-w-md w-full border-r data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full',
        right: 'inset-y-0 right-0 max-w-[85vw] sm:max-w-md w-full border-l data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full',
      },
    },
    defaultVariants: {
      side: 'top',
    },
  }
);

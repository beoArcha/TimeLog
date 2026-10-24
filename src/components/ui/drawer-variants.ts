import { cva } from 'class-variance-authority';

export const drawerVariants = cva(
  'fixed z-50 flex flex-col bg-card/95 backdrop-blur-xl text-card-foreground border-border shadow-2xl transition-all duration-300 ease-out',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 max-h-[85vh] border-b animate-in slide-in-from-top duration-300',
        bottom: 'inset-x-0 bottom-0 max-h-[85vh] border-t animate-in slide-in-from-bottom duration-300',
        left: 'inset-y-0 left-0 max-w-[85vw] sm:max-w-md w-full border-r animate-in slide-in-from-left duration-300',
        right: 'inset-y-0 right-0 max-w-[85vw] sm:max-w-md w-full border-l animate-in slide-in-from-right duration-300',
      },
    },
    defaultVariants: {
      side: 'top',
    },
  }
);

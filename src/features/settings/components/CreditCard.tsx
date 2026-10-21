import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { AnimatedCard } from '@components/AnimatedCard';
import { HStack } from '@components/ui/stack';
import { Heading } from '@components/ui/typography';

export interface CreditCardProps {
  title: React.ReactNode;
  icon: LucideIcon;
  iconBgClass: string;
  iconColorClass: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  delay?: number;
}

export function CreditCard({
  title,
  icon: Icon,
  iconBgClass,
  iconColorClass,
  children,
  footer,
  delay = 0.05,
}: CreditCardProps) {
  return (
    <AnimatedCard delay={delay}>
      <HStack gap="sm" className="mb-3">
        <div className={`w-8 h-8 rounded-full ${iconBgClass} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColorClass}`} />
        </div>
        <Heading level={3} className="text-sm font-bold text-foreground">
          {title}
        </Heading>
      </HStack>

      {children}

      {footer && <div className="mt-auto pt-3">{footer}</div>}
    </AnimatedCard>
  );
}

export default CreditCard;

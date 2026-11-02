import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { AnimatedCard } from '@components/AnimatedCard';
import { HStack, VStack } from '@components/ui/stack';
import { Heading } from '@components/ui/typography';
import { IconBox } from '@components/ui/icon-box';
import { cn } from '@/lib/utils';

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
    <AnimatedCard delay={delay} className="flex flex-col h-full">
      <HStack gap="sm" className="mb-3">
        <IconBox
          variant="ghost"
          size="sm"
          rounded="full"
          className={cn('shrink-0', iconBgClass)}
        >
          <Icon className={`w-4 h-4 ${iconColorClass}`} />
        </IconBox>
        <Heading level={3} className="text-sm font-bold text-foreground">
          {title}
        </Heading>
      </HStack>

      {children}

      {footer && <VStack className="mt-auto pt-3">{footer}</VStack>}
    </AnimatedCard>
  );
}

export default CreditCard;

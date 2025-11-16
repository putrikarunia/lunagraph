import { cn } from '../../lib/utils';
import React, { createElement, CSSProperties, PropsWithChildren } from 'react';



type Variants =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'accent'
  | 'white'
  | 'danger'
  | 'success'
  | 'selection'
export type Sizes = '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '2.5xl' | '3xl' | '3.5xl';
export type Weights = 'regular' | 'medium' | 'semibold' | 'bold' | 'black';

const variantClasses: Record<Variants, string> = {
  primary: 'text-foreground',
  secondary: 'text-secondary-foreground',
  tertiary: 'text-muted-foreground',
  accent: 'text-accent-foreground',
  white: 'text-white',
  danger: 'text-destructive',
  success: 'text-green-600 dark:text-green-400',
  selection: 'text-selection'
};

const sizeClasses: Record<Sizes, string> = {
  '3xs': 'text-[11px] leading-4 tracking-[-0.01em]',
  '2xs': 'text-xs leading-4 tracking-[-0.01em]',
  xs: 'text-[13px] leading-5 tracking-[-0.01em]',
  sm: 'text-sm leading-5 tracking-[-0.01em]',
  md: 'text-base leading-6 tracking-[-0.02em]',
  lg: 'text-lg leading-7 tracking-[-0.02em]',
  xl: 'text-xl leading-7 tracking-[-0.02em]',
  '2xl': 'text-2xl leading-9 tracking-[-0.02em] font-lora',
  '2.5xl': 'text-[28px] leading-10 tracking-[-0.02em] font-lora',
  '3xl': 'text-3xl leading-10 tracking-[-0.02em] font-lora',
  '3.5xl': 'text-[32px] leading-10 tracking-[-0.02em] font-lora',
};

const weightClasses: Record<Weights, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  black: 'font-black',
};

type TextProps = PropsWithChildren<{
  id?: string;
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label';
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  variant?: Variants;
  size?: Sizes;
  weight?: Weights;
}>;

type TextType = HTMLParagraphElement | HTMLHeadingElement | HTMLSpanElement;

/**
 * @example
 * <Text variant={'error'} size={'lg'} weight={'medium'} />
 */
const Text = React.forwardRef<TextType, TextProps>(
  ({ as, className, style, variant = 'primary', size = 'md', weight = 'regular', ...props }, ref) => {
    return createElement(
      as ?? 'span',
      {
        ref,
        className: cn('p-0 m-0', variantClasses[variant], sizeClasses[size], weightClasses[weight], className),
        style,
        ...props,
      },
      props.children
    );
  }
);

Text.displayName = 'Text';

export { Text };

// Adapted from shadcn/ui base-nova button (MIT), keeping the variants/sizes used here.
/* eslint-disable react/prop-types */
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cn } from 'cn';

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        'group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
        variant === 'ghost'
          ? 'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground'
          : 'bg-primary text-primary-foreground hover:bg-primary/80',
        size === 'icon-lg' ? 'size-9' : 'h-8 gap-1.5 px-2.5',
        className,
      )}
      {...props}
    />
  );
}

export { Button };

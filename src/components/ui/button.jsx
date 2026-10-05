// Adapted from shadcn/ui base-nova button (MIT); only the default variant is needed.
/* eslint-disable react/prop-types */
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cn } from 'cn';

function Button({ className, ...props }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        'group/button inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary bg-clip-padding px-2.5 text-sm font-medium whitespace-nowrap text-primary-foreground transition-all outline-none select-none hover:bg-primary/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
        className,
      )}
      {...props}
    />
  );
}

export { Button };

// Adapted from shadcn/ui base-nova tooltip (MIT), without optional animation utilities.
/* eslint-disable react/prop-types */
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import { cn } from 'cn';

function TooltipProvider({ delay = 0, ...props }) {
  return <TooltipPrimitive.Provider delay={delay} {...props} />;
}

function Tooltip(props) {
  return <TooltipPrimitive.Root {...props} />;
}

function TooltipTrigger(props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  children,
  side = 'top',
  sideOffset = 4,
  align = 'center',
  alignOffset = 0,
  ...props
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            'z-50 inline-flex w-fit max-w-xs items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background',
            className,
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow
            aria-hidden="true"
            className="text-foreground data-[side=top]:-bottom-1.5 data-[side=top]:rotate-180 data-[side=bottom]:-top-1.5 data-[side=left]:-right-2 data-[side=left]:rotate-90 data-[side=right]:-left-2 data-[side=right]:-rotate-90"
          >
            <svg width="12" height="6" viewBox="0 0 12 6" fill="currentColor">
              <path d="M0 6 6 0 12 6Z" />
            </svg>
          </TooltipPrimitive.Arrow>
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };

import { useSyncExternalStore } from 'react';
import { hazardCategories } from '../lib/hazard-categories.mjs';

// eslint-disable-next-line react/prop-types
export default function HazardSwitches({ locale = 'en' }) {
  const enabled = useSyncExternalStore(
    hazardCategories.subscribe,
    hazardCategories.getSnapshot,
    hazardCategories.getServerSnapshot,
  );
  const japanese = locale === 'ja';
  const labels = {
    tsunami: japanese ? '津波' : 'Tsunami',
    flooding: japanese ? '洪水' : 'Flooding',
    landslide: japanese ? '土砂災害' : 'Landslide',
  };
  return (
    <fieldset className="grid gap-4 border-0">
      <legend className="mb-4 font-semibold">
        {japanese ? 'ハザード' : 'Hazard categories'}
      </legend>
      {Object.entries(labels).map(([category, label]) => (
        <label
          key={category}
          className="flex items-center justify-between gap-4"
        >
          {label}
          <input
            type="checkbox"
            role="switch"
            checked={enabled[category]}
            onChange={(event) =>
              hazardCategories.setEnabled(category, event.target.checked)
            }
            className="size-5 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          />
        </label>
      ))}
    </fieldset>
  );
}

// Page-lifetime intent shared by React islands. Location, layout and future
// layer request results must not write this state: only resident controls do.
const initial = Object.freeze({
  tsunami: true,
  flooding: false,
  landslide: false,
});
let enabled = initial;
const listeners = new Set();

export const hazardCategories = Object.freeze({
  getSnapshot: () => enabled,
  getServerSnapshot: () => initial,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setEnabled(category, checked) {
    if (!Object.hasOwn(initial, category) || typeof checked !== 'boolean')
      throw new TypeError(
        'Expected a hazard category and boolean checked state',
      );
    if (enabled[category] === checked) return;
    enabled = Object.freeze({ ...enabled, [category]: checked });
    for (const listener of listeners) listener();
  },
});

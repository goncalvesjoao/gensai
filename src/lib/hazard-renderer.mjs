import { addProtocol, removeProtocol } from 'maplibre-gl';

let serial = 0;

// A single rendered raster selects the uppermost nontransparent source pixel.
// Never stack hazard rasters: even partially transparent edges must not blend
// against a lower hazard. Each definition remains independently reported.
export function createHazardRenderer(map, report) {
  const protocol = `gensai-hazard-${++serial}`;
  let generation = 0;
  let source;
  let active = [];
  let disposed = false;
  let states = {};
  const requests = new Set();

  addProtocol(protocol, async (request, abortController) => {
    const match = request.url.match(/\/(\d+)\/(\d+)\/(\d+)\/(\d+)\.png$/);
    if (!match) throw new Error('Invalid hazard tile address');
    const [, epoch, z, x, y] = match;
    const current = Number(epoch);
    if (disposed || current !== generation)
      throw new Error('Stale hazard tile');
    const controller = new AbortController();
    const cancel = () => controller.abort();
    abortController.signal.addEventListener('abort', cancel, { once: true });
    if (abortController.signal.aborted) cancel();
    requests.add(controller);
    const definitions = active;
    const output = new Uint8ClampedArray(256 * 256 * 4);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const valid = () =>
      !disposed && current === generation && !controller.signal.aborted;
    const publish = () => {
      if (valid())
        report(
          Object.fromEntries(
            Object.entries(states).map(([id, state]) => [
              id,
              state.failed ? 'failed' : state.pending ? 'loading' : 'loaded',
            ]),
          ),
        );
    };
    // Fetch concurrently, consume in registry order, never completion order.
    const results = definitions.map(async (definition) => {
      states[definition.id].pending++;
      publish();
      const images = [];
      try {
        const urls =
          typeof definition.tiles === 'function'
            ? definition.tiles({ z: Number(z), x: Number(x), y: Number(y) })
            : definition.tiles;
        // Promise.all retains URL order even when prefecture requests finish
        // out of order. One failed path must not discard other available data.
        const fetched = await Promise.all(
          urls.map(async (template) => {
            try {
              const url = template
                .replace('{z}', z)
                .replace('{x}', x)
                .replace('{y}', y);
              const response = await fetch(url, { signal: controller.signal });
              if (!response.ok)
                throw new Error(`Hazard request ${response.status}`);
              const image = await createImageBitmap(await response.blob());
              if (image.width !== 256 || image.height !== 256) {
                image.close();
                throw new Error('Expected official 256 × 256 tile');
              }
              return image;
            } catch {
              if (valid()) states[definition.id].failed = true;
              return null;
            }
          }),
        );
        images.push(...fetched.filter(Boolean));
        return { definition, images };
      } catch (error) {
        if (valid()) states[definition.id].failed = true;
        return { definition, images, error };
      } finally {
        if (valid()) {
          states[definition.id].pending--;
          publish();
        }
      }
    });
    try {
      for (const { definition, images, error } of await Promise.all(results)) {
        if (valid()) {
          if (error) states[definition.id].failed = true;
          publish();
        }
        for (const image of images || []) {
          if (valid()) {
            context.clearRect(0, 0, 256, 256);
            context.drawImage(image, 0, 0);
            const pixels = context.getImageData(0, 0, 256, 256).data;
            for (let offset = 0; offset < pixels.length; offset += 4) {
              if (pixels[offset + 3] === 0) continue;
              output[offset] = pixels[offset];
              output[offset + 1] = pixels[offset + 1];
              output[offset + 2] = pixels[offset + 2];
              output[offset + 3] = pixels[offset + 3];
            }
          }
          image.close();
        }
      }
      if (!valid()) throw new Error('Stale hazard tile');
      context.putImageData(new ImageData(output, 256, 256), 0, 0);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (!valid()) throw new Error('Stale hazard tile');
      return { data: await blob.arrayBuffer() };
    } finally {
      requests.delete(controller);
      abortController.signal.removeEventListener('abort', cancel);
    }
  });

  return {
    setLayers(definitions) {
      generation++;
      for (const request of requests) request.abort();
      requests.clear();
      if (source) {
        map.removeLayer(source);
        map.removeSource(source);
        source = undefined;
      }
      active = [...definitions].sort((a, b) => a.order - b.order);
      states = Object.fromEntries(
        active.map((definition) => [
          definition.id,
          { pending: 0, failed: false },
        ]),
      );
      report(
        Object.fromEntries(
          active.map((definition) => [definition.id, 'loading']),
        ),
      );
      if (!active.length) return;
      source = `hazards-${generation}`;
      map.addSource(source, {
        type: 'raster',
        tiles: [`${protocol}://tiles/${generation}/{z}/{x}/{y}.png`],
        tileSize: 256,
        minzoom: 2,
        maxzoom: 17,
      });
      map.addLayer({
        id: source,
        source,
        type: 'raster',
        paint: {
          'raster-opacity': 1,
          'raster-fade-duration': 0,
          'raster-resampling': 'nearest',
        },
      });
    },
    dispose() {
      disposed = true;
      generation++;
      for (const request of requests) request.abort();
      removeProtocol(protocol);
    },
  };
}

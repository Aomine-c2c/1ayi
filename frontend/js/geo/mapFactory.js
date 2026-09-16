import { CanvasMapProvider } from './canvasMapProvider.js';

/**
 * Map Factory & Registry
 * Allows dynamic switching of map providers (e.g. 'canvas', 'leaflet', 'maplibre')
 * without modifying any component or view consuming the map.
 */
class MapProviderFactory {
  constructor() {
    this.providers = new Map();
    this.defaultProvider = 'canvas';

    // Register built-in Canvas Map Provider
    this.register('canvas', CanvasMapProvider);
  }

  register(name, providerClass) {
    this.providers.set(name.toLowerCase(), providerClass);
  }

  create(containerId, options = {}) {
    const providerName = (options.provider || this.defaultProvider).toLowerCase();
    const ProviderClass = this.providers.get(providerName);
    if (!ProviderClass) {
      console.warn(`[MapFactory] Provider "${providerName}" not registered, falling back to "${this.defaultProvider}".`);
      const FallbackClass = this.providers.get(this.defaultProvider);
      return new FallbackClass(containerId, options);
    }
    return new ProviderClass(containerId, options);
  }

  setDefault(name) {
    if (this.providers.has(name.toLowerCase())) {
      this.defaultProvider = name.toLowerCase();
    } else {
      console.warn(`[MapFactory] Cannot set unknown default provider "${name}".`);
    }
  }
}

export const mapFactory = new MapProviderFactory();

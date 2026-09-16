/**
 * Map Abstraction Layer & Provider Interfaces
 * Decouples the domain logic from any concrete map rendering engine
 * (e.g. Canvas Engine, Leaflet, MapLibre, Google Maps, OpenLayers).
 */

/**
 * @typedef {Object} MapCoordinate
 * @property {number} lat - Latitude in degrees (-90 to 90)
 * @property {number} lon - Longitude in degrees (-180 to 180)
 */

/**
 * @typedef {Object} MapMarker
 * @property {string} id - Unique identifier
 * @property {number} lat - Latitude
 * @property {number} lon - Longitude
 * @property {string} title - Marker label/title
 * @property {string} [subtitle] - Optional subtitle
 * @property {string} [category] - e.g. 'farm', 'station', 'field'
 * @property {string} [crop] - Associated crop
 * @property {number} [areaHa] - Area in hectares
 * @property {'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'OPTIMAL'} [riskLevel] - Risk assessment
 * @property {string} [suitability] - e.g. 'HIGH (88%)'
 * @property {string} [weatherAlert] - e.g. 'Frost Advisory'
 * @property {string} [color] - Hex color code for marker
 * @property {any} [data] - Arbitrary attached domain payload
 */

/**
 * @typedef {Object} MapPolygon
 * @property {string} id
 * @property {MapCoordinate[]} coordinates
 * @property {string} [strokeColor]
 * @property {string} [fillColor]
 * @property {number} [strokeWidth]
 * @property {string} [label]
 */

/**
 * Standard Map Component State
 * @typedef {'LOADING' | 'READY' | 'ERROR' | 'NO_LOCATION' | 'SELECTED'} MapState
 */

/**
 * Map Adapter Interface
 * Any third-party map provider must fulfill this adapter contract.
 */
export class MapAdapter {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = options;
    this.state = 'LOADING';
    this.markers = [];
    this.polygons = [];
    this.selectedMarker = null;
    this.selectedLocation = null;
    this.onLocationSelect = options.onLocationSelect || null;
    this.onMarkerClick = options.onMarkerClick || null;
    this.stateChangeListeners = [];
  }

  onStateChange(cb) {
    this.stateChangeListeners.push(cb);
  }

  setState(newState, error = null) {
    this.state = newState;
    this.lastError = error;
    this.stateChangeListeners.forEach(cb => cb(newState, error));
  }

  setCenter(coord, zoom = 10) {
    throw new Error('Method setCenter() must be implemented by adapter');
  }

  setMarkers(markers = []) {
    throw new Error('Method setMarkers() must be implemented by adapter');
  }

  setPolygons(polygons = []) {
    throw new Error('Method setPolygons() must be implemented by adapter');
  }

  setSelectedLocation(coord) {
    throw new Error('Method setSelectedLocation() must be implemented by adapter');
  }

  destroy() {
    // cleanup
  }
}

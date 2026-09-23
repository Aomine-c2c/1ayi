import { MapAdapter } from './mapAdapter.js';

export class LeafletMapProvider extends MapAdapter {
  constructor(containerId, options = {}) {
    super(containerId, options);
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    
    // Default center and zoom (Zimbabwe focus by default)
    this.center = options.center || { lat: -19.0154, lon: 29.1549 };
    this.zoom = options.zoom || 7;
    
    this.map = null;
    this.markersLayer = null;
    this._weatherData = new Map();
    this.leafletMarkers = new Map(); // Store references to leaflet markers by ID
    
    this.init();
  }

  init() {
    if (!this.container) {
      this.setState('ERROR', new Error(`Container #${this.containerId} not found in DOM.`));
      return;
    }
    
    if (!window.L) {
      this.setState('ERROR', new Error('Leaflet library not loaded'));
      return;
    }

    try {
      this.container.innerHTML = ''; // clear
      
      // Initialize Leaflet Map
      this.map = L.map(this.container).setView([this.center.lat, this.center.lon], this.zoom);
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.map);
      
      this.markersLayer = L.layerGroup().addTo(this.map);

      // Bind Map clicks for location picking
      this.map.on('click', (e) => {
        if (this.options.allowLocationSelect) {
          const coord = { lat: parseFloat(e.latlng.lat.toFixed(4)), lon: parseFloat(e.latlng.lng.toFixed(4)) };
          this.setSelectedLocation(coord);
          if (this.onLocationSelect) {
            this.onLocationSelect(coord);
          }
        }
      });
      
      this.setState('READY');
      
    } catch (err) {
      this.setState('ERROR', err);
    }
  }

  setCenter(coord, zoom = 7) {
    this.center = coord;
    this.zoom = zoom;
    if (this.map) {
      this.map.setView([coord.lat, coord.lon], zoom);
    }
  }

  setMarkers(markers = []) {
    this.markers = markers;
    if (!this.map || !this.markersLayer) return;
    
    this.markersLayer.clearLayers();
    this.leafletMarkers.clear();

    markers.forEach(m => {
      // Determine color
      let markerColor = m.color || '#059669';
      if (m.riskLevel === 'HIGH' || m.riskLevel === 'CRITICAL') markerColor = '#be123c';
      else if (m.riskLevel === 'MEDIUM') markerColor = '#d97706';
      else if (m.riskLevel === 'OPTIMAL') markerColor = '#047857';

      // Custom div icon for marker
      const html = `
        <div style="
          width: 20px; 
          height: 20px; 
          background-color: ${markerColor}; 
          border-radius: 50%; 
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0,0,0,0.4);
          position: relative;
        ">
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: html,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const leafletMarker = L.marker([m.lat, m.lon], { icon }).addTo(this.markersLayer);
      
      // Bind click
      leafletMarker.on('click', () => {
        if (this.onMarkerClick) {
          this.onMarkerClick(m);
        }
      });

      // Bind tooltip
      leafletMarker.bindTooltip(`
        <strong>${m.title}</strong><br>
        ${m.crop ? `Crop: ${m.crop}<br>` : ''}
        ${m.areaHa ? `Size: ${m.areaHa} ha` : ''}
      `);

      this.leafletMarkers.set(m.id, leafletMarker);
    });

    // Re-apply weather data if any
    this._weatherData.forEach((bundle, farmId) => {
      this.addWeatherPin(farmId, bundle);
    });
  }

  setPolygons(polygons = []) {
    // Currently omitted, can use L.polygon in the future
  }

  setSelectedLocation(coord) {
    if (!this.map) return;
    this.selectedLocation = coord;
    
    if (this._selectionMarker) {
      this.map.removeLayer(this._selectionMarker);
    }
    
    if (coord) {
      this._selectionMarker = L.marker([coord.lat, coord.lon]).addTo(this.map);
    }
  }

  addWeatherPin(farmId, weatherBundle) {
    if (!weatherBundle || !weatherBundle.current) return;
    this._weatherData.set(farmId, weatherBundle);
    
    const leafletMarker = this.leafletMarkers.get(farmId);
    if (!leafletMarker) return;

    const temp = weatherBundle.current.temperature?.value;
    if (temp == null) return;

    const tempColor = temp >= 30 ? '#f43f5e' : temp >= 22 ? '#f59e0b' : '#10b981';

    // Update marker icon to include temperature badge
    const originalMarker = this.markers.find(m => m.id === farmId);
    const markerColor = originalMarker?.color || '#059669';
    
    const html = `
      <div style="position: relative;">
        <div style="
          width: 20px; 
          height: 20px; 
          background-color: ${markerColor}; 
          border-radius: 50%; 
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0,0,0,0.4);
        "></div>
        <div style="
          position: absolute;
          top: -24px;
          left: 5px;
          background-color: ${tempColor};
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          ${Math.round(temp)}°C
        </div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'custom-leaflet-marker-weather',
      html: html,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    leafletMarker.setIcon(icon);

    // Build the popup content
    const cc = weatherBundle.current;
    const condition = cc.weatherText || 'N/A';
    const popupContent = `
      <div style="min-width: 150px; font-family: 'Inter', sans-serif;">
        <strong style="color: #334155;">${originalMarker?.title || 'Farm'}</strong>
        <div style="font-size: 24px; font-weight: bold; color: ${tempColor}; margin: 5px 0;">
          ${Math.round(temp)}°C
        </div>
        <div style="color: #64748b; font-size: 12px;">${condition}</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
          <div>💧 ${cc.relativeHumidity ?? 'N/A'}%</div>
          <div>💨 ${cc.wind?.speed ? Math.round(cc.wind.speed) + 'km/h' : 'N/A'}</div>
        </div>
      </div>
    `;

    leafletMarker.bindPopup(popupContent);
  }

  removeWeatherPin(farmId) {
    this._weatherData.delete(farmId);
    
    const leafletMarker = this.leafletMarkers.get(farmId);
    if (!leafletMarker) return;
    
    // Reset icon
    const originalMarker = this.markers.find(m => m.id === farmId);
    if (originalMarker) {
      const html = `
        <div style="
          width: 20px; 
          height: 20px; 
          background-color: ${originalMarker.color || '#059669'}; 
          border-radius: 50%; 
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0,0,0,0.4);
        "></div>
      `;
      const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: html,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      leafletMarker.setIcon(icon);
      leafletMarker.unbindPopup();
    }
  }
}

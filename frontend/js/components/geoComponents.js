import { mapFactory } from '../geo/mapFactory.js';
import { ZIM_FARMS, ZIM_GEO_REGIONS } from '../geo/zimGeoData.js';

/**
 * Reusable Map UI Components
 * Exposes:
 * 1. FarmMapComponent: Markers, selection, farm details, coordinates, farm area, crop, risk status.
 * 2. RegionalMapComponent: Multiple farms, risk visualization, crop distribution, weather alerts, suitability status.
 * 3. FarmRegistrationMapComponent: Select location, latitude, longitude, map marker, confirmation.
 * 4. FarmDetailsMapComponent: Farm location, fields where available, crop information, weather context.
 *
 * Built strictly on top of the Map Abstraction Layer.
 */
export const geoComponents = {
  /**
   * 1. FARM MAP COMPONENT
   * Single or multi-farm inspection with detailed selection panel
   */
  createFarmMap({ containerId, farms = ZIM_FARMS, initialSelectedId = null, onSelect = null }) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return null;

    container.innerHTML = `
      <div class="farm-map-wrapper" style="display: flex; flex-direction: column; height: 100%; width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-card);">
        <!-- Top Toolbar with Filter & Provider Info -->
        <div style="padding: 12px 16px; background: var(--bg-primary); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <strong style="font-size: 0.95rem; color: var(--text-primary);">🗺️ Farm Geographic Explorer</strong>
            <span style="font-size: 0.78rem; color: var(--text-muted); margin-left: 8px;">Zimbabwe Agro-Ecological Coordinates (WGS84)</span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <select id="${container.id || 'farmMap'}_farmSelect" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; width: auto;">
              <option value="">-- Focus on Farm --</option>
              ${farms.map(f => `<option value="${f.id}" ${f.id === initialSelectedId ? 'selected' : ''}>${f.name} (${f.primaryCrop})</option>`).join('')}
            </select>
            <span class="badge badge-green" style="font-size: 0.7rem;">Spatial Provider: Canvas GIS</span>
          </div>
        </div>

        <!-- Main Map Area + Detail Sidebar -->
        <div style="display: grid; grid-template-columns: 1fr 320px; flex-grow: 1; min-height: 420px; position: relative;">
          <!-- Map Canvas Target -->
          <div id="${container.id || 'farmMap'}_canvasTarget" style="width: 100%; height: 100%; min-height: 420px; position: relative;"></div>

          <!-- Selected Farm Details Sidebar -->
          <div id="${container.id || 'farmMap'}_detailSidebar" style="background: var(--bg-secondary); border-left: 1px solid var(--border-color); padding: 18px; display: flex; flex-direction: column; justify-content: space-between; overflow-y: auto;">
            <div id="${container.id || 'farmMap'}_detailContent">
              <div style="text-align: center; color: var(--text-muted); padding: 40px 10px;">
                <span style="font-size: 2rem; display: block; margin-bottom: 8px;">📍</span>
                <strong>Select a Farm</strong>
                <p style="font-size: 0.78rem; margin-top: 4px;">Click any farm marker or use the dropdown above to view coordinates, crop, and risk status.</p>
              </div>
            </div>
            
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 12px; margin-top: 16px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted);">
                <span>Datum: WGS84 (EPSG:4326)</span>
                <span>Elevation: SRTM DEM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const canvasTargetId = `${container.id || 'farmMap'}_canvasTarget`;
    const mapInstance = mapFactory.create(canvasTargetId, {
      center: { lat: -18.5, lon: 31.0 },
      zoom: 7,
      interactive: true
    });

    // Format markers
    const markers = farms.map(f => ({
      id: f.id,
      lat: f.latitude,
      lon: f.longitude,
      title: f.name,
      crop: f.primaryCrop,
      areaHa: f.sizeHa,
      riskLevel: f.riskStatus || 'LOW',
      suitability: f.suitabilityClass || `${f.suitabilityScore || 85}%`,
      weatherAlert: f.weatherAlert,
      data: f
    }));
    mapInstance.setMarkers(markers);

    // Update detail sidebar when a farm is selected
    const renderFarmDetails = (farm) => {
      const detailContainer = document.getElementById(`${container.id || 'farmMap'}_detailContent`);
      if (!detailContainer || !farm) return;

      const riskBadgeClass = farm.riskStatus === 'HIGH' ? 'badge-rose' : farm.riskStatus === 'MEDIUM' ? 'badge-amber' : 'badge-green';

      detailContainer.innerHTML = `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <span class="badge ${riskBadgeClass}">${farm.riskStatus || 'OPTIMAL'} RISK</span>
            <span class="badge badge-blue">${farm.sizeHa} Hectares</span>
          </div>
          
          <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin: 6px 0 2px 0;">${farm.name}</h3>
          <span style="font-size: 0.78rem; font-weight: 700; color: var(--primary-dark);">${farm.region}</span>

          <!-- Coordinates Box -->
          <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-xs); padding: 10px; margin: 12px 0; font-family: monospace; font-size: 0.78rem;">
            <div><strong>Lat:</strong> ${farm.latitude.toFixed(4)}° S</div>
            <div><strong>Lon:</strong> ${farm.longitude.toFixed(4)}° E</div>
            <div><strong>Elevation:</strong> ${farm.elevationM || 1200}m AMSL</div>
          </div>

          <div style="font-size: 0.8125rem; display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
            <div>🌱 <strong>Primary Crop:</strong> ${farm.primaryCrop}</div>
            ${farm.secondaryCrop ? `<div>🌾 <strong>Rotation:</strong> ${farm.secondaryCrop}</div>` : ''}
            <div>🪨 <strong>Soil Type:</strong> ${farm.soilType}</div>
            <div>💧 <strong>Irrigation:</strong> ${farm.irrigationType}</div>
            <div>🧠 <strong>Suitability:</strong> <span style="color: var(--primary-dark); font-weight: 700;">${farm.suitabilityClass || 'Suitable'} (${farm.suitabilityScore || 85}%)</span></div>
            ${farm.weatherAlert ? `<div style="background: #fffbeb; border: 1px solid #fef08a; padding: 6px 8px; border-radius: 4px; color: #92400e; font-size: 0.75rem;">⚡ <strong>Alert:</strong> ${farm.weatherAlert}</div>` : ''}
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline" style="flex: 1; font-size: 0.75rem;" id="${container.id}_btnInspectFields">View Fields (${farm.fields?.length || 0})</button>
            <button class="btn btn-primary" style="flex: 1; font-size: 0.75rem;" id="${container.id}_btnViewTelemetry">Agromet Status</button>
          </div>
        </div>
      `;

      detailContainer.querySelector(`#${container.id}_btnInspectFields`)?.addEventListener('click', () => {
        geoComponents.showFarmDetailsModal(farm);
      });
      detailContainer.querySelector(`#${container.id}_btnViewTelemetry`)?.addEventListener('click', () => {
        alert(`Weather Telemetry for ${farm.name}:\nTemp: ${farm.weatherContext?.temp || 23.4}°C\nRainfall 24h: ${farm.weatherContext?.rain24h || 0}mm\nForecast 48h: ${farm.weatherContext?.forecastRain48h || 12}mm`);
      });

      if (onSelect) onSelect(farm);
    };

    mapInstance.onMarkerClick = (marker) => {
      renderFarmDetails(marker.data);
      const select = document.getElementById(`${container.id || 'farmMap'}_farmSelect`);
      if (select) select.value = marker.id;
    };

    // Dropdown handler
    const select = document.getElementById(`${container.id || 'farmMap'}_farmSelect`);
    select?.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      if (!selectedId) return;
      const farm = farms.find(f => f.id === selectedId);
      if (farm) {
        mapInstance.selectMarkerById(farm.id);
        renderFarmDetails(farm);
      }
    });

    // Auto-select initial if provided
    if (initialSelectedId) {
      const initial = farms.find(f => f.id === initialSelectedId);
      if (initial) {
        mapInstance.selectMarkerById(initial.id);
        renderFarmDetails(initial);
      }
    }

    return { mapInstance, renderFarmDetails };
  },

  /**
   * 2. REGIONAL MAP COMPONENT
   * Visualizes multiple farms with risk layers, crop distribution, weather alerts, and suitability
   */
  createRegionalMap({ containerId, farms = ZIM_FARMS, onFarmClick = null }) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return null;

    container.innerHTML = `
      <div class="regional-map-container" style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-card);">
        <!-- Regional Command Bar -->
        <div style="padding: 14px 20px; background: var(--bg-primary); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div>
            <h2 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0;">🌍 National Agricultural Regional Map</h2>
            <span style="font-size: 0.78rem; color: var(--text-muted);">Zimbabwe Natural Agro-Ecological Regions I through V</span>
          </div>

          <!-- Layer Switches -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <button class="btn btn-outline" id="${container.id || 'regMap'}_filterAll" style="font-size: 0.75rem; padding: 4px 10px;">All Farms (${farms.length})</button>
            <button class="btn btn-outline" id="${container.id || 'regMap'}_filterRisk" style="font-size: 0.75rem; padding: 4px 10px; color: var(--accent-rose);">⚠️ Pathogen Risk</button>
            <button class="btn btn-outline" id="${container.id || 'regMap'}_filterCereal" style="font-size: 0.75rem; padding: 4px 10px; color: var(--primary-dark);">🌾 Grains</button>
            <button class="btn btn-outline" id="${container.id || 'regMap'}_filterAlerts" style="font-size: 0.75rem; padding: 4px 10px; color: var(--accent-amber);">⚡ Weather Alerts</button>
          </div>
        </div>

        <!-- Metric Bar -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid var(--border-subtle); background: var(--bg-secondary); text-align: center; padding: 10px 0; font-size: 0.8rem;">
          <div><strong style="color: var(--primary-dark); font-size: 1rem;">${farms.length}</strong><br><span style="color: var(--text-muted); font-size: 0.72rem;">Commercial Holdings</span></div>
          <div><strong style="color: var(--accent-blue); font-size: 1rem;">${farms.reduce((sum, f) => sum + f.sizeHa, 0).toFixed(1)} ha</strong><br><span style="color: var(--text-muted); font-size: 0.72rem;">Cultivated Area</span></div>
          <div><strong style="color: var(--accent-amber); font-size: 1rem;">2 Active</strong><br><span style="color: var(--text-muted); font-size: 0.72rem;">Weather Advisories</span></div>
          <div><strong style="color: var(--accent-rose); font-size: 1rem;">1 Flagged</strong><br><span style="color: var(--text-muted); font-size: 0.72rem;">High Risk Cluster</span></div>
        </div>

        <!-- Canvas Target -->
        <div style="height: 480px; width: 100%; position: relative;">
          <div id="${container.id || 'regMap'}_canvasTarget" style="width: 100%; height: 100%; position: relative;"></div>
          
          <!-- Legend Box -->
          <div style="position: absolute; bottom: 14px; left: 14px; background: rgba(255, 255, 255, 0.95); border: 1px solid var(--border-color); border-radius: var(--radius-xs); padding: 10px 14px; font-size: 0.75rem; box-shadow: var(--shadow-sm); max-width: 280px; z-index: 20;">
            <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;">Regional Risk & Crop Legend:</strong>
            <div>🟢 <strong>Green Pin:</strong> Low Risk / Optimal Crop Vigor</div>
            <div>🟡 <strong>Amber Pin:</strong> Moderate Risk (Moisture Deficit / Cold)</div>
            <div>🔴 <strong>Rose Pin:</strong> High Risk (Stem Borer / Hail Cell)</div>
            <div style="border-top: 1px solid var(--border-subtle); margin-top: 6px; padding-top: 4px; font-size: 0.7rem; color: var(--text-muted);">
              Dashed contours show Natural Agro-Ecological Zones (NR I - V).
            </div>
          </div>
        </div>
      </div>
    `;

    const canvasTargetId = `${container.id || 'regMap'}_canvasTarget`;
    const mapInstance = mapFactory.create(canvasTargetId, {
      center: { lat: -19.0, lon: 30.5 },
      zoom: 7,
      interactive: true
    });

    const setFilteredMarkers = (filterFn = null) => {
      const filtered = filterFn ? farms.filter(filterFn) : farms;
      const markers = filtered.map(f => ({
        id: f.id,
        lat: f.latitude,
        lon: f.longitude,
        title: f.name,
        crop: f.primaryCrop,
        areaHa: f.sizeHa,
        riskLevel: f.riskStatus || 'LOW',
        suitability: f.suitabilityClass || `${f.suitabilityScore || 85}%`,
        weatherAlert: f.weatherAlert,
        data: f
      }));
      mapInstance.setMarkers(markers);
    };

    setFilteredMarkers();

    mapInstance.onMarkerClick = (marker) => {
      if (onFarmClick) {
        onFarmClick(marker.data);
      } else {
        geoComponents.showFarmDetailsModal(marker.data);
      }
    };

    // Bind Filter Buttons
    container.querySelector(`#${container.id || 'regMap'}_filterAll`)?.addEventListener('click', () => setFilteredMarkers());
    container.querySelector(`#${container.id || 'regMap'}_filterRisk`)?.addEventListener('click', () => setFilteredMarkers(f => f.riskStatus === 'HIGH' || f.riskStatus === 'MEDIUM'));
    container.querySelector(`#${container.id || 'regMap'}_filterCereal`)?.addEventListener('click', () => setFilteredMarkers(f => f.primaryCrop.includes('Maize') || f.primaryCrop.includes('Wheat')));
    container.querySelector(`#${container.id || 'regMap'}_filterAlerts`)?.addEventListener('click', () => setFilteredMarkers(f => !!f.weatherAlert));

    return mapInstance;
  },

  /**
   * 3. FARM REGISTRATION MAP COMPONENT
   * Interactive location picker: Click map to place marker, update lat/lon inputs, confirm position
   */
  createFarmRegistrationMap({ containerId, initialCoord = { lat: -17.5214, lon: 30.9721 }, onLocationConfirm = null }) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return null;

    let selectedCoord = { ...initialCoord };

    container.innerHTML = `
      <div class="farm-registration-map" style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-card);">
        <!-- Instructions & Location Confirmation Bar -->
        <div style="padding: 12px 16px; background: var(--bg-primary); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <strong style="font-size: 0.9rem; color: var(--text-primary);">📍 Pinpoint Farm Geographic Centroid</strong>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0 0;">Click anywhere on the Zimbabwe national territory map to set parcel centroid</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-outline" id="${container.id}_btnResetCoord" style="font-size: 0.75rem; padding: 4px 10px;">Reset to Mazowe</button>
            <button type="button" class="btn btn-primary" id="${container.id}_btnConfirmLocation" style="font-size: 0.75rem; padding: 4px 12px;">Confirm Location ✓</button>
          </div>
        </div>

        <!-- Coordinates Input Strip -->
        <div style="padding: 10px 16px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle); display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted);">Latitude:</label>
            <input type="number" step="0.0001" class="form-input" id="${container.id}_inputLat" value="${selectedCoord.lat}" style="width: 110px; padding: 4px 8px; font-size: 0.8rem; font-family: monospace;">
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted);">Longitude:</label>
            <input type="number" step="0.0001" class="form-input" id="${container.id}_inputLon" value="${selectedCoord.lon}" style="width: 110px; padding: 4px 8px; font-size: 0.8rem; font-family: monospace;">
          </div>
          <span id="${container.id}_regionBadge" class="badge badge-green" style="font-size: 0.72rem;">Natural Region II Detected</span>
        </div>

        <!-- Map Canvas Target -->
        <div style="height: 280px; width: 100%; position: relative;">
          <div id="${container.id}_canvasTarget" style="width: 100%; height: 100%; position: relative;"></div>
        </div>
      </div>
    `;

    const canvasTargetId = `${container.id}_canvasTarget`;
    const mapInstance = mapFactory.create(canvasTargetId, {
      center: selectedCoord,
      zoom: 7,
      interactive: true,
      allowLocationSelect: true
    });

    mapInstance.setSelectedLocation(selectedCoord);

    const updateInputs = (coord) => {
      selectedCoord = coord;
      const latInput = document.getElementById(`${container.id}_inputLat`);
      const lonInput = document.getElementById(`${container.id}_inputLon`);
      const badge = document.getElementById(`${container.id}_regionBadge`);

      if (latInput) latInput.value = coord.lat;
      if (lonInput) lonInput.value = coord.lon;

      if (badge) {
        if (coord.lat > -18.5 && coord.lon > 30.0 && coord.lon < 32.5) {
          badge.textContent = 'Natural Region II (Highveld)';
          badge.className = 'badge badge-green';
        } else if (coord.lon > 32.0) {
          badge.textContent = 'Natural Region I (Highlands)';
          badge.className = 'badge badge-blue';
        } else if (coord.lat < -20.0) {
          badge.textContent = 'Natural Region V (Lowveld Basin)';
          badge.className = 'badge badge-purple';
        } else {
          badge.textContent = 'Natural Region III / IV (Semi-Arable)';
          badge.className = 'badge badge-amber';
        }
      }
    };

    mapInstance.onLocationSelect = (coord) => {
      updateInputs(coord);
    };

    // Manual input typing handlers
    const latInp = document.getElementById(`${container.id}_inputLat`);
    const lonInp = document.getElementById(`${container.id}_inputLon`);
    const onManualInputChange = () => {
      const lat = parseFloat(latInp.value);
      const lon = parseFloat(lonInp.value);
      if (!isNaN(lat) && !isNaN(lon)) {
        selectedCoord = { lat, lon };
        mapInstance.setSelectedLocation(selectedCoord);
      }
    };
    latInp?.addEventListener('input', onManualInputChange);
    lonInp?.addEventListener('input', onManualInputChange);

    // Reset button
    container.querySelector(`#${container.id}_btnResetCoord`)?.addEventListener('click', () => {
      updateInputs(initialCoord);
      mapInstance.setSelectedLocation(initialCoord);
    });

    // Confirmation button
    container.querySelector(`#${container.id}_btnConfirmLocation`)?.addEventListener('click', () => {
      if (onLocationConfirm) {
        onLocationConfirm(selectedCoord);
      } else {
        alert(`Location Confirmed: POINT(${selectedCoord.lon} ${selectedCoord.lat}) registered into WGS84 spatial catalog.`);
      }
    });

    return { mapInstance, getSelectedCoord: () => selectedCoord };
  },

  /**
   * 4. FARM DETAILS MAP COMPONENT
   * Renders farm location, fields/boundaries where available, crop information, and weather context
   */
  createFarmDetailsMap({ containerId, farm }) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container || !farm) return null;

    const fields = farm.fields || [];

    container.innerHTML = `
      <div class="farm-details-map-card" style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-card);">
        <div style="padding: 14px 18px; background: var(--bg-primary); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <strong style="font-size: 1rem; color: var(--text-primary);">${farm.name} — Spatial Boundaries & Cadastral Fields</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
              📍 POINT(${farm.longitude.toFixed(4)} ${farm.latitude.toFixed(4)}) · ${farm.sizeHa} Hectares · ${fields.length} Mapped Fields
            </div>
          </div>
          <span class="badge ${farm.riskStatus === 'HIGH' ? 'badge-rose' : 'badge-green'}">${farm.riskStatus || 'OPTIMAL'} RISK STATUS</span>
        </div>

        <div style="height: 320px; width: 100%; position: relative;">
          <div id="${container.id}_canvasTarget" style="width: 100%; height: 100%; position: relative;"></div>
        </div>

        <!-- Weather Context & Crop Breakdown Strip -->
        <div style="padding: 14px 18px; background: var(--bg-secondary); border-top: 1px solid var(--border-color); display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; font-size: 0.8rem;">
          <div>
            <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;">🌤️ Weather Context (Live)</strong>
            <div>Temp: <strong>${farm.weatherContext?.temp || 22.4}°C</strong></div>
            <div>Humidity: <strong>${farm.weatherContext?.humidity || 65}%</strong></div>
            <div>24h Rain: <strong>${farm.weatherContext?.rain24h || 0} mm</strong></div>
            <div>48h Forecast: <strong>${farm.weatherContext?.forecastRain48h || 12} mm</strong></div>
          </div>
          <div>
            <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;">🌱 Crop & Soil Profile</strong>
            <div>Primary Crop: <strong>${farm.primaryCrop}</strong></div>
            <div>Secondary: <strong>${farm.secondaryCrop || 'None'}</strong></div>
            <div>Soil Type: <strong>${farm.soilType}</strong></div>
            <div>Irrigation: <strong>${farm.irrigationType}</strong></div>
          </div>
          <div>
            <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;">📐 Cadastral Fields (${fields.length})</strong>
            ${fields.length > 0 ? fields.map(fld => `
              <div style="margin-bottom: 2px;">• <strong>${fld.name}</strong> (${fld.areaHa} ha, ${fld.crop})</div>
            `).join('') : '<div style="color: var(--text-muted);">No sub-parcels partitioned.</div>'}
          </div>
        </div>
      </div>
    `;

    const canvasTargetId = `${container.id}_canvasTarget`;
    const mapInstance = mapFactory.create(canvasTargetId, {
      center: { lat: farm.latitude, lon: farm.longitude },
      zoom: 12,
      interactive: true
    });

    // Create marker for farm centroid
    const markers = [{
      id: farm.id,
      lat: farm.latitude,
      lon: farm.longitude,
      title: farm.name,
      crop: farm.primaryCrop,
      areaHa: farm.sizeHa,
      riskLevel: farm.riskStatus || 'LOW',
      suitability: farm.suitabilityClass || `${farm.suitabilityScore || 85}%`,
      weatherAlert: farm.weatherAlert,
      data: farm
    }];
    mapInstance.setMarkers(markers);
    mapInstance.selectMarkerById(farm.id);

    // Create polygons for fields if boundary offsets exist
    if (fields.length > 0) {
      const polygons = fields.map((fld, idx) => {
        const dLat = (idx + 1) * 0.008;
        const dLon = (idx + 1) * 0.008;
        return {
          id: fld.id,
          label: fld.name,
          strokeColor: '#059669',
          fillColor: idx % 2 === 0 ? 'rgba(5, 150, 105, 0.22)' : 'rgba(3, 105, 161, 0.22)',
          strokeWidth: 2,
          coordinates: [
            { lat: farm.latitude - 0.004 + (idx * 0.005), lon: farm.longitude - 0.006 + (idx * 0.005) },
            { lat: farm.latitude + 0.004 + (idx * 0.005), lon: farm.longitude - 0.006 + (idx * 0.005) },
            { lat: farm.latitude + 0.004 + (idx * 0.005), lon: farm.longitude + 0.006 + (idx * 0.005) },
            { lat: farm.latitude - 0.004 + (idx * 0.005), lon: farm.longitude + 0.006 + (idx * 0.005) }
          ]
        };
      });
      mapInstance.setPolygons(polygons);
    }

    return mapInstance;
  },

  /**
   * Modal dialog displaying Farm Details Map
   */
  showFarmDetailsModal(farm) {
    let overlay = document.getElementById('globalModalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'globalModalOverlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="modal-window" role="dialog" aria-modal="true" style="max-width: 780px; width: 95%;">
        <div class="modal-header">
          <div>
            <span class="badge badge-green">GEOSPATIAL CADASTRE</span>
            <h3 class="modal-title" style="margin-top: 4px;">${farm.name} — Full Farm & Fields Map</h3>
          </div>
          <button class="modal-close-btn" id="modalMapCloseBtn">&times;</button>
        </div>

        <div class="modal-body" style="padding: 16px;">
          <div id="modalFarmDetailsMapContainer"></div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" id="modalMapDoneBtn">Close Map</button>
        </div>
      </div>
    `;

    overlay.classList.add('active');

    const close = () => overlay.classList.remove('active');
    overlay.querySelector('#modalMapCloseBtn').onclick = close;
    overlay.querySelector('#modalMapDoneBtn').onclick = close;

    setTimeout(() => {
      geoComponents.createFarmDetailsMap({
        containerId: 'modalFarmDetailsMapContainer',
        farm
      });
    }, 60);
  }
};

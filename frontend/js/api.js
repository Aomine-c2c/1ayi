/**
 * AYIS Centralized API Client
 * Connects to the C# ASP.NET Core Minimal API backend.
 *
 * Error contract:
 *   - api.request() throws ApiError on non-2xx responses so callers can distinguish
 *     between "server error", "unauthorised", and "no data" without null-guessing.
 *   - Convenience methods (getFarms, getCrops, etc.) catch ApiError internally and
 *     re-throw so the service layer / views can handle them explicitly.
 *
 * Authentication:
 *   - Stores the JWT in localStorage under 'ayis_token'.
 *   - Attaches it as a Bearer header on every request.
 *   - On 401 responses it clears the stored token and emits a 'ayis:session-expired'
 *     custom event so the router can redirect to login.
 */

const API_BASE_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000/api/v1'
    : '/api/v1';

// ── Typed error class ─────────────────────────────────────────────────────────
export class ApiError extends Error {
  /**
   * @param {number}  status     HTTP status code
   * @param {string}  message    Human-readable message
   * @param {any}     [body]     Parsed JSON response body (if available)
   */
  constructor(status, message, body = null) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;
    this.body   = body;
  }

  get isUnauthorized()  { return this.status === 401; }
  get isForbidden()     { return this.status === 403; }
  get isNotFound()      { return this.status === 404; }
  get isServerError()   { return this.status >= 500; }
  get isNetworkError()  { return this.status === 0; }
}

// ── Core API client ───────────────────────────────────────────────────────────
export const api = {
  get token() {
    return localStorage.getItem('ayis_token') || null;
  },

  setToken(token) {
    if (token) localStorage.setItem('ayis_token', token);
    else       localStorage.removeItem('ayis_token');
  },

  /**
   * Core HTTP method — throws ApiError on any non-2xx response.
   * @param {string} endpoint  Path relative to API_BASE_URL (e.g. '/farms')
   * @param {RequestInit} [options]  fetch options
   * @returns {Promise<any>}  Parsed JSON response body
   */
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
    };

    let res;
    try {
      res = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'omit',
        ...options,
        headers: { ...headers, ...(options.headers || {}) }
      });
    } catch (networkErr) {
      // Network failure (server unreachable, CORS pre-flight blocked, etc.)
      throw new ApiError(0, `Network error: ${networkErr.message}`);
    }

    // Handle session expiry globally
    if (res.status === 401) {
      this.setToken(null);
      window.dispatchEvent(new CustomEvent('ayis:session-expired', { detail: { endpoint } }));
      let body = null;
      try { body = await res.json(); } catch (_) {}
      throw new ApiError(401, body?.message || 'Session expired. Please sign in again.', body);
    }

    if (!res.ok) {
      let body = null;
      try { body = await res.json(); } catch (_) {}
      const message = body?.message || body?.title || `HTTP ${res.status}`;
      throw new ApiError(res.status, message, body);
    }

    // 204 No Content
    if (res.status === 204) return null;

    return res.json();
  },

  // ── 1. Farms & Fields ──────────────────────────────────────────────────────

  async getFarms() {
    const data = await this.request('/farms');
    return Array.isArray(data) ? data : [];
  },

  async getFarmById(id) {
    return this.request(`/farms/${encodeURIComponent(id)}`);
  },

  async createFarm(farmData) {
    return this.request('/farms', { method: 'POST', body: JSON.stringify(farmData) });
  },

  async updateFarm(id, farmData) {
    return this.request(`/farms/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(farmData)
    });
  },

  async getFields(farmId = null) {
    const endpoint = farmId ? `/fields?farmId=${encodeURIComponent(farmId)}` : '/fields';
    const data = await this.request(endpoint);
    return Array.isArray(data) ? data : [];
  },

  async createField(fieldData) {
    return this.request('/fields', { method: 'POST', body: JSON.stringify(fieldData) });
  },

  // ── 2. Crops & Catalog ─────────────────────────────────────────────────────

  async getCrops() {
    const data = await this.request('/crops');
    return Array.isArray(data) ? data : [];
  },

  async getCropById(id) {
    return this.request(`/crops/${encodeURIComponent(id)}`);
  },

  // ── 3. Crop Cycles ─────────────────────────────────────────────────────────

  async getCycles(fieldId = null) {
    const endpoint = fieldId ? `/cycles?fieldId=${encodeURIComponent(fieldId)}` : '/cycles';
    const data = await this.request(endpoint);
    return Array.isArray(data) ? data : [];
  },

  async createCycle(cycleData) {
    return this.request('/cycles', { method: 'POST', body: JSON.stringify(cycleData) });
  },

  // ── 4. Weather Telemetry ───────────────────────────────────────────────────

  async getRecentWeather(stationId = null) {
    const endpoint = stationId ? `/weather/recent?stationId=${encodeURIComponent(stationId)}` : '/weather/recent';
    const data = await this.request(endpoint);
    return Array.isArray(data) ? data : [];
  },

  async getWeatherCurrent(lat, lon) {
    return this.request(`/weather/current?lat=${lat}&lon=${lon}`);
  },

  async getWeatherForecast(lat, lon) {
    return this.request(`/weather/forecast?lat=${lat}&lon=${lon}`);
  },

  async getWeatherAlerts(lat, lon) {
    const data = await this.request(`/weather/alerts?lat=${lat}&lon=${lon}`);
    return Array.isArray(data) ? data : [];
  },

  async getWeatherLocationKey(lat, lon) {
    return this.request(`/weather/location-key?lat=${lat}&lon=${lon}`);
  },

  // ── 5. Intelligence & Recommendations ─────────────────────────────────────

  async getFieldSuitability(fieldId) {
    return this.request(`/intelligence/suitability?fieldId=${encodeURIComponent(fieldId)}`);
  },

  async getYieldPredictions(cycleId) {
    return this.request(`/intelligence/yield-predictions?cycleId=${encodeURIComponent(cycleId)}`);
  },

  async getRecommendations(fieldId = null) {
    const endpoint = fieldId
      ? `/recommendations?fieldId=${encodeURIComponent(fieldId)}`
      : '/recommendations';
    const data = await this.request(endpoint);
    return Array.isArray(data) ? data : [];
  },

  async getPreSeasonCropRecommendations(params = {}) {
    return this.request(`/recommendations/pre-season-crops?${new URLSearchParams(params)}`);
  },

  async getDailyOperationalDirectives(params = {}) {
    return this.request(`/recommendations/daily-directives?${new URLSearchParams(params)}`);
  },

  // ── 6. Agronomic Rules ─────────────────────────────────────────────────────

  async getAgronomicRules(cropId = null) {
    const endpoint = cropId
      ? `/agronomic-rules?cropId=${encodeURIComponent(cropId)}`
      : '/agronomic-rules';
    const data = await this.request(endpoint);
    return Array.isArray(data) ? data : [];
  },

  async createAgronomicRule(ruleData) {
    return this.request('/agronomic-rules', { method: 'POST', body: JSON.stringify(ruleData) });
  },

  // ── 7. Field Operations ────────────────────────────────────────────────────

  async getInspections(params = {}) {
    const q = new URLSearchParams(params).toString();
    const data = await this.request(q ? `/inspections?${q}` : '/inspections');
    return Array.isArray(data) ? data : [];
  },

  async createInspection(inspectionData) {
    return this.request('/inspections', { method: 'POST', body: JSON.stringify(inspectionData) });
  },

  async getObservations(fieldId = null) {
    const endpoint = fieldId ? `/observations?fieldId=${encodeURIComponent(fieldId)}` : '/observations';
    const data = await this.request(endpoint);
    return Array.isArray(data) ? data : [];
  },

  async createObservation(observationData) {
    return this.request('/observations', { method: 'POST', body: JSON.stringify(observationData) });
  },

  async getTasks(params = {}) {
    const q = new URLSearchParams(params).toString();
    const data = await this.request(q ? `/tasks?${q}` : '/tasks');
    return Array.isArray(data) ? data : [];
  },

  async updateTaskStatus(taskId, status) {
    return this.request(`/tasks/${encodeURIComponent(taskId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  // ── 8. Reports ─────────────────────────────────────────────────────────────

  async getReports(params = {}) {
    const q = new URLSearchParams(params).toString();
    const data = await this.request(q ? `/reports?${q}` : '/reports');
    return Array.isArray(data) ? data : [];
  },

  async generateReport(reportData) {
    return this.request('/reports/generate', { method: 'POST', body: JSON.stringify(reportData) });
  },

  // ── 9. Notifications ───────────────────────────────────────────────────────

  async getNotifications(params = {}) {
    const q = new URLSearchParams(params).toString();
    const data = await this.request(q ? `/notifications?${q}` : '/notifications');
    return Array.isArray(data) ? data : [];
  },

  async markNotificationAsRead(id) {
    return this.request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
  },

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', { method: 'POST' });
  },

  // ── 10. User Management ────────────────────────────────────────────────────

  async getUsers(params = {}) {
    const q = new URLSearchParams(params).toString();
    const data = await this.request(q ? `/users?${q}` : '/users');
    return Array.isArray(data) ? data : [];
  },

  async createUser(userData) {
    return this.request('/users', { method: 'POST', body: JSON.stringify(userData) });
  },

  async updateUser(id, userData) {
    return this.request(`/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  async updateUserStatus(userId, isActive) {
    return this.request(`/users/${encodeURIComponent(userId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive })
    });
  },

  async changePassword(userId, currentPassword, newPassword) {
    return this.request(`/users/${encodeURIComponent(userId)}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  async deleteUser(id) {
    return this.request(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async getAuditLogs(params = {}) {
    const q = new URLSearchParams(params).toString();
    const data = await this.request(q ? `/audit-logs?${q}` : '/audit-logs');
    return Array.isArray(data) ? data : [];
  },

  async createAuditLog(logData) {
    return this.request('/audit-logs', { method: 'POST', body: JSON.stringify(logData) });
  }
};

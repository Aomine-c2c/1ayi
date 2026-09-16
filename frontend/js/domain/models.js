/**
 * AYIS Frontend Domain Models & TypeScript JSDoc Type Definitions
 * Establishes typed interfaces for all 17 specified core domains:
 * User, Role, Farm, Field, Crop, CropProfile, CropCycle, WeatherRecord,
 * WeatherForecast, WeatherSuitability, YieldEstimate, Recommendation,
 * WeatherAlert, FieldObservation, Inspection, Report, Notification
 */

/**
 * @typedef {'super_admin' | 'system_admin' | 'agronomist' | 'extension_officer' | 'field_officer' | 'weather_analyst' | 'farm_manager' | 'farmer'} Role
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {Role} role
 * @property {boolean} isActive
 * @property {string} [phoneNumber]
 * @property {string} [avatar]
 */

/**
 * @typedef {Object} Farm
 * @property {string} id
 * @property {string} name
 * @property {string} ownerId
 * @property {string} region
 * @property {number} sizeHa
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} [boundaryWkt]
 * @property {string} primaryCrop
 * @property {string} soilType
 * @property {string} irrigationType
 * @property {number} elevationM
 */

/**
 * @typedef {Object} Field
 * @property {string} id
 * @property {string} farmId
 * @property {string} name
 * @property {number} areaHa
 * @property {string} [boundaryWkt]
 * @property {number} soilPh
 * @property {number} organicMatterPct
 * @property {string} drainageClass
 * @property {number} slopePct
 */

/**
 * @typedef {Object} Crop
 * @property {string} id
 * @property {string} name
 * @property {string} scientificName
 * @property {string} category
 * @property {string} description
 * @property {number} growingDaysTypical
 * @property {string} optimalTemp
 * @property {string} typicalYield
 */

/**
 * @typedef {Object} CropProfile
 * @property {string} cropId
 * @property {number} growingDaysMin
 * @property {number} growingDaysMax
 * @property {number} optimalTempMin
 * @property {number} optimalTempMax
 * @property {number} rainfallMinMm
 * @property {number} rainfallOptimumMm
 * @property {number} rainfallMaxMm
 * @property {string[]} growthStages
 * @property {string[]} riskFactors
 */

/**
 * @typedef {Object} CropCycle
 * @property {string} id
 * @property {string} farm
 * @property {string} field
 * @property {string} crop
 * @property {string} variety
 * @property {string} seasonName
 * @property {string} startDate
 * @property {string} expectedHarvestDate
 * @property {string} stage
 * @property {string} targetYield
 * @property {'PLANNED' | 'ACTIVE' | 'HARVESTED' | 'FAILED' | 'CANCELLED'} status
 */

/**
 * @typedef {Object} WeatherRecord
 * @property {string} stationId
 * @property {string} time
 * @property {number} temp
 * @property {number} humidity
 * @property {number} rain
 * @property {number} wind
 * @property {number} solarRadiation
 */

/**
 * @typedef {Object} WeatherForecast
 * @property {string} date
 * @property {number} tempMax
 * @property {number} tempMin
 * @property {number} rainMm
 * @property {number} rainProbability
 * @property {string} condition
 */

/**
 * @typedef {Object} WeatherSuitability
 * @property {string} fieldId
 * @property {string} cropId
 * @property {number} overallScore
 * @property {'HIGHLY_SUITABLE' | 'MODERATELY_SUITABLE' | 'MARGINALLY_SUITABLE' | 'NOT_SUITABLE'} suitabilityClass
 * @property {number} thermalScore
 * @property {number} rainfallScore
 * @property {number} soilScore
 * @property {string} limitingFactors
 */

/**
 * @typedef {Object} YieldEstimate
 * @property {string} crop
 * @property {number} areaHa
 * @property {number} benchmarkKgHa
 * @property {number} projectedKgHa
 * @property {string} confidence
 * @property {number} variancePct
 */

/**
 * Recommendation Type Classification
 * @typedef {'Crop selection' | 'Planting' | 'Irrigation' | 'Monitoring' | 'Weather preparation' | 'Harvest' | 'Risk warning' | 'Crop suitability'} RecommendationType
 */

/**
 * Core Agricultural Intelligence Engine Recommendation Model
 * @typedef {Object} Recommendation
 * @property {string} id - Recommendation ID
 * @property {string} farm - Farm Name
 * @property {string} farmId - Farm Unique Identifier
 * @property {string} field - Field Name / Plot
 * @property {string} fieldId - Field Unique Identifier
 * @property {string} crop - Cultivated Crop Cultivar
 * @property {string} cropId - Crop Unique Identifier
 * @property {RecommendationType} recommendationType - Type of agronomic advisory
 * @property {string} recommendationMessage - Executive advisory message
 * @property {string} recommendationReason - Plain-language explanation ("Why?")
 * @property {number} confidenceScore - Model confidence score (0-100)
 * @property {number} suitabilityScore - Computed agro-climatic suitability score (0-100)
 * @property {number} riskScore - Computed agronomic risk score (0-100)
 * @property {Object} weatherFactors - Contributing meteorological parameters
 * @property {string} weatherFactors.recentRainfall - Recent precipitation assessment
 * @property {string} weatherFactors.temperature - Ambient temperature condition
 * @property {string} weatherFactors.forecastRainfall - Forecasted rainfall outlook
 * @property {string} weatherFactors.currentSeason - Seasonal suitability alignment
 * @property {string} suggestedAction - Concrete recommended action for producer
 * @property {string[]} riskFactors - Specific limiting factors or risks
 * @property {string} historicalComparison - Historical benchmark comparison notes
 * @property {string} createdDate - Date & time generated
 * @property {string} validUntil - Expiration date/time for validity period
 * @property {'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'DISMISSED'} status - Recommendation status
 */

/**
 * @typedef {Object} WeatherAlert
 * @property {string} id
 * @property {'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'} severity
 * @property {string} headline
 * @property {string} region
 * @property {string} effectiveUntil
 * @property {string} description
 */

/**
 * @typedef {Object} FieldObservation
 * @property {string} id
 * @property {string} field
 * @property {string} category
 * @property {'INFO' | 'WARNING' | 'CRITICAL'} severity
 * @property {string} text
 * @property {string} date
 * @property {boolean} followUpRequired
 */

/**
 * @typedef {Object} Inspection
 * @property {string} id
 * @property {string} farmName
 * @property {string} inspector
 * @property {string} inspectionDate
 * @property {'COMPLIANT' | 'NEEDS_ACTION' | 'NON_COMPLIANT'} status
 * @property {number} score
 * @property {string} findings
 */

/**
 * @typedef {Object} Report
 * @property {string} id
 * @property {string} title
 * @property {string} category
 * @property {string} region
 * @property {'PDF' | 'CSV' | 'GeoJSON'} format
 * @property {string} date
 */

/**
 * @typedef {'Weather' | 'Crop' | 'Farm' | 'Yield' | 'Recommendation' | 'Field operation' | 'System' | 'Administrative'} NotificationCategory
 */

/**
 * @typedef {'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'} NotificationSeverity
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {NotificationCategory} category
 * @property {NotificationSeverity} severity
 * @property {string} date
 * @property {string} [relatedFarm]
 * @property {string} [relatedCrop]
 * @property {boolean} isRead
 * @property {{ label: string, hash: string, primary?: boolean }} [action]
 * @property {string} [expiration]
 * @property {boolean} [isAgriculturalAlert]
 */

export const ROLE_CONFIG = {
  super_admin: {
    name: 'Super Administrator',
    badge: 'NATIONAL PLATFORM GOVERNANCE',
    title: 'Chief Agrotechnology Officer',
    subtitle: 'Global System & National Governance',
    mainPurpose: 'Entire platform configuration, executive analytics, and holistic oversight',
    navItems: [
      { hash: '#dashboard', label: 'Executive Dashboard', icon: '🏛️' },
      { hash: '#executive-analytics', label: 'Executive Analytics', icon: '📈' },
      { hash: '#geographic-risk', label: 'Geographic Risk Map', icon: '🌍' },
      { hash: '#users', label: 'All Users', icon: '👥' },
      { hash: '#farmers', label: 'All Farmers', icon: '🌾' },
      { hash: '#farms', label: 'All Farms', icon: '🏡' },
      { hash: '#crop-profiles', label: 'Crops & Profiles', icon: '🌱' },
      { hash: '#recommendations', label: 'All Recommendations', icon: '💡' },
      { hash: '#weather-intelligence', label: 'All Weather Data', icon: '⛅' },
      { hash: '#roles', label: 'Roles & Permissions', icon: '🔐' },
      { hash: '#system-configuration', label: 'System Configuration', icon: '⚙️' },
      { hash: '#system-monitoring', label: 'Platform Health', icon: '🖥️' },
      { hash: '#reports', label: 'All Reports', icon: '📄' },
      { hash: '#audit-logs', label: 'Audit Logs', icon: '📜' }
    ]
  },
  system_admin: {
    name: 'System Administrator',
    badge: 'SYSTEM GOVERNANCE',
    title: 'Alex Kipruto',
    subtitle: 'Infrastructure & Security Admin',
    mainPurpose: 'Users, farms, system operations and security configuration',
    navItems: [
      { hash: '#dashboard', label: 'Dashboard', icon: '📊' },
      { hash: '#users', label: 'Users', icon: '👥' },
      { hash: '#farmers', label: 'Farmers', icon: '🌾' },
      { hash: '#farms', label: 'Farms', icon: '🏡' },
      { hash: '#roles', label: 'Roles & Permissions', icon: '🔐' },
      { hash: '#crop-profiles', label: 'Crop Profiles', icon: '🌱' },
      { hash: '#weather-config', label: 'Weather Configuration', icon: '⛅' },
      { hash: '#system-monitoring', label: 'System Monitoring', icon: '🖥️' },
      { hash: '#notifications', label: 'Notifications', icon: '🔔' },
      { hash: '#reports', label: 'Reports', icon: '📄' },
      { hash: '#audit-logs', label: 'Audit Logs', icon: '📜' },
      { hash: '#settings', label: 'Settings', icon: '⚙️' }
    ]
  },
  agronomist: {
    name: 'Agronomist',
    badge: 'AGRONOMIC INTELLIGENCE',
    title: 'Dr. Sarah Mwangi',
    subtitle: 'Senior Crop Intelligence Specialist · KALRO',
    mainPurpose: 'Crop intelligence, suitability, recommendations, and phenology modeling',
    navItems: [
      { hash: '#dashboard', label: 'Dashboard', icon: '📊' },
      { hash: '#farms', label: 'Farms', icon: '🏡' },
      { hash: '#crop-intelligence', label: 'Crop Intelligence', icon: '🌾' },
      { hash: '#crop-profiles', label: 'Crop Profiles', icon: '🌱' },
      { hash: '#crop-suitability', label: 'Crop Suitability', icon: '🧠' },
      { hash: '#weather-intelligence', label: 'Weather Intelligence', icon: '⛅' },
      { hash: '#recommendations', label: 'Recommendations', icon: '💡' },
      { hash: '#yield-intelligence', label: 'Yield Intelligence', icon: '📈' },
      { hash: '#field-observations', label: 'Field Observations', icon: '🔍' },
      { hash: '#reports', label: 'Reports', icon: '📄' }
    ]
  },
  extension_officer: {
    name: 'Agricultural Extension Officer',
    badge: 'FIELD EXTENSION SERVICE',
    title: 'Grace Wanjiku',
    subtitle: 'Regional Agricultural Extension Officer · Nakuru Sub-zone 4',
    mainPurpose: 'Monitor farmers and provide field support',
    navItems: [
      { hash: '#dashboard', label: 'Dashboard', icon: '📊' },
      { hash: '#farmers', label: 'Farmers', icon: '👥' },
      { hash: '#farms', label: 'Farms', icon: '🏡' },
      { hash: '#field-visits', label: 'Field Visits', icon: '🚗' },
      { hash: '#observations', label: 'Observations', icon: '🔍' },
      { hash: '#cycles', label: 'Crop Cycles', icon: '🌱' },
      { hash: '#weather', label: 'Weather', icon: '⛅' },
      { hash: '#recommendations', label: 'Recommendations', icon: '💡' },
      { hash: '#alerts', label: 'Alerts', icon: '⚠️' },
      { hash: '#reports', label: 'Reports', icon: '📄' }
    ]
  },
  weather_analyst: {
    name: 'Weather/Data Analyst',
    badge: 'AGROMETEOROLOGY COMMAND',
    title: 'Daniel Kiprop',
    subtitle: 'Agrometeorological & Climate Analyst',
    mainPurpose: 'Weather trends, data quality, anomaly detection and analytics',
    navItems: [
      { hash: '#dashboard', label: 'Dashboard', icon: '📊' },
      { hash: '#weather-overview', label: 'Weather Overview', icon: '🌍' },
      { hash: '#live-weather', label: 'Live Weather', icon: '📡' },
      { hash: '#historical-weather', label: 'Historical Data', icon: '📅' },
      { hash: '#weather-trends', label: 'Weather Trends', icon: '📈' },
      { hash: '#data-quality', label: 'Data Quality', icon: '🛡️' },
      { hash: '#weather-alerts', label: 'Weather Alerts', icon: '⚠️' },
      { hash: '#analytics', label: 'Analytics', icon: '🔬' },
      { hash: '#reports', label: 'Reports', icon: '📄' }
    ]
  },
  farm_manager: {
    name: 'Farm Manager',
    badge: 'ESTATE OPERATIONS & PRODUCTION',
    title: 'David Mwangi',
    subtitle: 'Commercial Estate Operations Manager · 20.7 ha',
    mainPurpose: 'Manage one or more farms and production',
    navItems: [
      { hash: '#dashboard', label: 'Dashboard', icon: '📊' },
      { hash: '#farms', label: 'Farms', icon: '🏡' },
      { hash: '#fields', label: 'Fields', icon: '🗺️' },
      { hash: '#cycles', label: 'Crop Cycles', icon: '🔄' },
      { hash: '#weather', label: 'Weather', icon: '⛅' },
      { hash: '#recommendations', label: 'Recommendations', icon: '💡' },
      { hash: '#yield', label: 'Yield Intelligence', icon: '📈' },
      { hash: '#field-operations', label: 'Field Operations', icon: '🚜' },
      { hash: '#reports', label: 'Reports', icon: '📄' },
      { hash: '#notifications', label: 'Notifications', icon: '🔔' },
      { hash: '#profile', label: 'Profile', icon: '👤' }
    ]
  },
  farmer: {
    name: 'Farmer',
    badge: 'FARMER DECISION ASSISTANT',
    title: 'John Kamau',
    subtitle: 'Active Smallholder Farmer · Nakuru',
    mainPurpose: 'View their farm, crops, weather and recommendations',
    navItems: [
      { hash: '#dashboard', label: 'Dashboard', icon: '📊' },
      { hash: '#my-farms', label: 'My Farms', icon: '🏡' },
      { hash: '#crops', label: 'Crops', icon: '🌱' },
      { hash: '#weather', label: 'Weather', icon: '⛅' },
      { hash: '#recommendations', label: 'Recommendations', icon: '💡' },
      { hash: '#yield', label: 'Yield', icon: '📈' },
      { hash: '#alerts', label: 'Alerts', icon: '⚠️' },
      { hash: '#profile', label: 'Profile', icon: '👤' }
    ]
  },
  field_officer: {
    name: 'Field Officer',
    badge: 'PHYSICAL FIELD MONITORING & SCOUTING',
    title: 'Peter Koech',
    subtitle: 'Physical Field Monitoring & Scouting Specialist',
    mainPurpose: 'Field inspections, observations, and farmer assistance',
    navItems: [
      { hash: '#dashboard', label: 'Dashboard', icon: '📊' },
      { hash: '#assigned-farms', label: 'Assigned Farms', icon: '🏡' },
      { hash: '#fields', label: 'Fields', icon: '🌱' },
      { hash: '#inspections', label: 'Inspections', icon: '📋' },
      { hash: '#observations', label: 'Observations', icon: '🔍' },
      { hash: '#cycles', label: 'Crop Cycles', icon: '🔄' },
      { hash: '#weather', label: 'Weather', icon: '⛅' },
      { hash: '#alerts', label: 'Alerts', icon: '⚠️' },
      { hash: '#tasks', label: 'Tasks', icon: '✅' },
      { hash: '#reports', label: 'Reports', icon: '📄' }
    ]
  }
};

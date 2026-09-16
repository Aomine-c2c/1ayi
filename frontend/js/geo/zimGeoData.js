/**
 * Zimbabwe Agricultural Geospatial Reference Dataset (Zim Geographic Data)
 * Real-world Zimbabwean natural agricultural regions, major agro-ecological farming hubs,
 * smallholder irrigation schemes, and commercial estates.
 *
 * Natural Regions:
 * Region I: Specialized & Diversified Farming (Eastern Highlands - Nyanga, Chipinge)
 * Region II: Intensive Farming (Highveld - Mazowe, Bindura, Marondera, Chinhoyi)
 * Region III: Semi-Intensive Farming (Midlands - Kwekwe, Gweru, Kadoma)
 * Region IV: Semi-Extensive Farming (Lowveld / Marginal - Masvingo, Lupane, Gokwe)
 * Region V: Extensive Ranching / Irrigation (Lowveld - Chiredzi, Beitbridge, Triangle)
 */

export const ZIM_GEO_REGIONS = [
  {
    id: 'zim-reg-1',
    code: 'NR-I',
    name: 'Natural Region I: Eastern Highlands Specialty Belt',
    provinces: ['Manicaland'],
    altitudeRange: '1,500m - 2,590m AMSL',
    annualRainfallMm: '> 1,000mm (perennial mist & orographic)',
    typicalCrops: ['Tea', 'Coffee', 'Macadamia', 'Seed Potato', 'Timber / Pine'],
    soilTypes: 'Deep red humic fersiallitic clays and volcanic loams'
  },
  {
    id: 'zim-reg-2',
    code: 'NR-II',
    name: 'Natural Region II: Highveld Intensive Grain & Tobacco Basin',
    provinces: ['Mashonaland Central', 'Mashonaland West', 'Mashonaland East'],
    altitudeRange: '1,200m - 1,500m AMSL',
    annualRainfallMm: '750mm - 1,000mm (reliable summer precipitation)',
    typicalCrops: ['White Maize (SC719)', 'Flue-cured Tobacco', 'Soybeans', 'Wheat (Winter Irrigated)'],
    soilTypes: 'Moderately deep sandy clay loams (paraferrallitic)'
  },
  {
    id: 'zim-reg-3',
    code: 'NR-III',
    name: 'Natural Region III: Midlands Semi-Intensive Arable Agro-zone',
    provinces: ['Midlands', 'Mashonaland West (S)'],
    altitudeRange: '900m - 1,200m AMSL',
    annualRainfallMm: '650mm - 800mm (frequent mid-season dry spells)',
    typicalCrops: ['Maize (Drought Tolerant SC513)', 'Groundnuts', 'Cotton', 'Sunflower', 'Sorghum'],
    soilTypes: 'Granitic sandy loams and black vertisol patches'
  },
  {
    id: 'zim-reg-4',
    code: 'NR-IV',
    name: 'Natural Region IV: Masvingo & Matabeleland Semi-Extensive Buffer',
    provinces: ['Masvingo', 'Matabeleland North', 'Matabeleland South'],
    altitudeRange: '600m - 1,000m AMSL',
    annualRainfallMm: '450mm - 650mm (semi-arid, high seasonal variance)',
    typicalCrops: ['Pearl Millet (Mhunga)', 'Finger Millet (Rapoko)', 'Sorghum', 'Cowpeas', 'Beef Cattle'],
    soilTypes: 'Shallow sandveld and lithosols with localized alluvium'
  },
  {
    id: 'zim-reg-5',
    code: 'NR-V',
    name: 'Natural Region V: Lowveld Sugarcane & Commercial Irrigation Belt',
    provinces: ['Masvingo (Chiredzi)', 'Matabeleland South (Beitbridge)'],
    altitudeRange: '300m - 600m AMSL',
    annualRainfallMm: '< 450mm (arid, high evapotranspiration)',
    typicalCrops: ['Sugarcane (Canal Irrigated)', 'Citrus', 'Winter Wheat', 'Commercial Cattle'],
    soilTypes: 'Fertile basaltic clay loams and alluvial silt floodplains'
  }
];

export const ZIM_FARMS = [
  {
    id: 'zim-farm-001',
    name: 'Mazowe Citrus & Grain Valley Estate',
    region: 'Natural Region II (Mashonaland Central)',
    district: 'Mazowe District',
    province: 'Mashonaland Central',
    sizeHa: 145.0,
    latitude: -17.5214,
    longitude: 30.9721,
    elevationM: 1280,
    primaryCrop: 'White Maize (SC719)',
    secondaryCrop: 'Citrus & Winter Wheat',
    soilType: 'Fersiallitic Red Clay Loam (pH 6.2)',
    irrigationType: 'Center Pivot + Canal Weir from Mazowe Dam',
    riskStatus: 'LOW',
    suitabilityScore: 92,
    suitabilityClass: 'Highly Suitable (S1)',
    weatherAlert: 'Optimal Spray Window (Wind 5 km/h)',
    weatherContext: {
      temp: 24.2,
      humidity: 58,
      rain24h: 0.0,
      forecastRain48h: 14.5,
      windSpeed: 5.4
    },
    fields: [
      {
        id: 'zim-fld-001',
        name: 'Pivot 1 — Hybrid Maize Block',
        areaHa: 48.0,
        crop: 'Maize (SC719)',
        stage: 'Vegetative V6 (Knee High)',
        soilPh: 6.3,
        drainage: 'Well drained',
        risk: 'LOW',
        boundaryOffset: [-0.008, -0.008, 0.008, 0.008]
      },
      {
        id: 'zim-fld-002',
        name: 'Pivot 2 — Winter Wheat Stub / Soya Prep',
        areaHa: 42.0,
        crop: 'Soybeans (SC Squire)',
        stage: 'Soil Preparation & Liming',
        soilPh: 6.1,
        drainage: 'Well drained',
        risk: 'LOW',
        boundaryOffset: [0.009, -0.008, 0.025, 0.008]
      },
      {
        id: 'zim-fld-003',
        name: 'River Orchard — Valencia Orange Groves',
        areaHa: 35.0,
        crop: 'Citrus (Valencia)',
        stage: 'Fruit Setting / Cell Expansion',
        soilPh: 6.5,
        drainage: 'Deep Alluvial',
        risk: 'LOW',
        boundaryOffset: [-0.005, 0.010, 0.012, 0.024]
      }
    ]
  },
  {
    id: 'zim-farm-002',
    name: 'Marondera Evergreen Horticulture & Seed Farm',
    region: 'Natural Region II (Mashonaland East)',
    district: 'Marondera District',
    province: 'Mashonaland East',
    sizeHa: 82.5,
    latitude: -18.1872,
    longitude: 31.5518,
    elevationM: 1640,
    primaryCrop: 'Seed Potato (BP1)',
    secondaryCrop: 'Blueberries & Snowpeas',
    soilType: 'Weathered Granitic Sandveld Loam (pH 5.6)',
    irrigationType: 'High-efficiency Micro-Drip with Fertigation',
    riskStatus: 'MEDIUM',
    suitabilityScore: 86,
    suitabilityClass: 'Suitable (S1)',
    weatherAlert: 'Overnight Cold Inversion (Temp 7.8°C)',
    weatherContext: {
      temp: 20.5,
      humidity: 72,
      rain24h: 3.2,
      forecastRain48h: 22.0,
      windSpeed: 7.8
    },
    fields: [
      {
        id: 'zim-fld-004',
        name: 'North Terrace A — Foundation Seed Potato',
        areaHa: 30.0,
        crop: 'Seed Potato (BP1 Certified)',
        stage: 'Tuber Initiation (Hooking)',
        soilPh: 5.6,
        drainage: 'Rapid / Sloping',
        risk: 'MEDIUM',
        boundaryOffset: [-0.006, -0.007, 0.007, 0.007]
      },
      {
        id: 'zim-fld-005',
        name: 'Greenhouse Quad 1 — Export Blueberries',
        areaHa: 18.5,
        crop: 'Blueberries (Tunnel Cultivation)',
        stage: 'Berry Ripening',
        soilPh: 4.8,
        drainage: 'Substrate Pots',
        risk: 'LOW',
        boundaryOffset: [0.008, -0.005, 0.018, 0.009]
      }
    ]
  },
  {
    id: 'zim-farm-003',
    name: 'Chinhoyi Commercial Grain & Tobacco Hub',
    region: 'Natural Region II (Mashonaland West)',
    district: 'Makonde District',
    province: 'Mashonaland West',
    sizeHa: 110.0,
    latitude: -17.3667,
    longitude: 30.2000,
    elevationM: 1160,
    primaryCrop: 'Virginia Tobacco & Maize',
    secondaryCrop: 'Sunflowers',
    soilType: 'Heavy Dolomitic Red Clay Loam (pH 6.4)',
    irrigationType: 'Overhead Gun Sprinklers + Farm Dam',
    riskStatus: 'HIGH',
    suitabilityScore: 78,
    suitabilityClass: 'Moderately Suitable (S2)',
    weatherAlert: 'Hail Cell & Stem Borer Threat Warning',
    weatherContext: {
      temp: 27.8,
      humidity: 52,
      rain24h: 0.0,
      forecastRain48h: 35.0,
      windSpeed: 14.2
    },
    fields: [
      {
        id: 'zim-fld-006',
        name: 'Dolomite Ridge 1 — Flue-Cured Tobacco',
        areaHa: 45.0,
        crop: 'Tobacco (KRK26)',
        stage: 'Rapid Vegetative Expansion',
        soilPh: 6.4,
        drainage: 'Well drained',
        risk: 'HIGH',
        boundaryOffset: [-0.008, -0.008, 0.008, 0.008]
      },
      {
        id: 'zim-fld-007',
        name: 'Lower Flats — Commercial Grain Maize',
        areaHa: 55.0,
        crop: 'Maize (PAN 53)',
        stage: 'Vegetative V4',
        soilPh: 6.2,
        drainage: 'Moderate',
        risk: 'MEDIUM',
        boundaryOffset: [0.009, -0.008, 0.022, 0.010]
      }
    ]
  },
  {
    id: 'zim-farm-004',
    name: 'Kwekwe Grasslands Mixed Cattle & Grains',
    region: 'Natural Region III (Midlands)',
    district: 'Kwekwe District',
    province: 'Midlands',
    sizeHa: 160.0,
    latitude: -18.9281,
    longitude: 29.8149,
    elevationM: 1220,
    primaryCrop: 'Drought Tolerant Maize (SC513)',
    secondaryCrop: 'Sorghum (Macashia) & Rhodes Grass',
    soilType: 'Sandy Loam with Basement Schist Formations',
    irrigationType: 'Supplemental Gun from Sebakwe River',
    riskStatus: 'MEDIUM',
    suitabilityScore: 82,
    suitabilityClass: 'Moderately Suitable (S2)',
    weatherAlert: 'Mid-Season Moisture Deficit Expected',
    weatherContext: {
      temp: 26.1,
      humidity: 45,
      rain24h: 0.0,
      forecastRain48h: 6.0,
      windSpeed: 8.5
    },
    fields: [
      {
        id: 'zim-fld-008',
        name: 'Sebakwe Bank Block — Drought Maize',
        areaHa: 60.0,
        crop: 'Maize (SC513)',
        stage: 'Early Vegetative',
        soilPh: 6.0,
        drainage: 'Well drained',
        risk: 'MEDIUM',
        boundaryOffset: [-0.010, -0.010, 0.010, 0.010]
      }
    ]
  },
  {
    id: 'zim-farm-005',
    name: 'Mutare Nyanga Highland Tea & Macadamia',
    region: 'Natural Region I (Eastern Highlands)',
    district: 'Mutasa District',
    province: 'Manicaland',
    sizeHa: 95.0,
    latitude: -18.7833,
    longitude: 32.6667,
    elevationM: 1720,
    primaryCrop: 'Specialty Arabica Coffee',
    secondaryCrop: 'Macadamia Nut Orchards',
    soilType: 'Deep Humic Volcanic Loam (pH 5.2)',
    irrigationType: 'Perennial Gravity Stream Feed & Spring Irrigation',
    riskStatus: 'OPTIMAL',
    suitabilityScore: 95,
    suitabilityClass: 'Highly Suitable (S1)',
    weatherAlert: 'Orographic Mountain Rain (28mm expected)',
    weatherContext: {
      temp: 18.2,
      humidity: 86,
      rain24h: 12.0,
      forecastRain48h: 30.0,
      windSpeed: 4.1
    },
    fields: [
      {
        id: 'zim-fld-009',
        name: 'Cloud Mist Ridge — Specialty Arabica',
        areaHa: 40.0,
        crop: 'Coffee (SL28 / Catimor)',
        stage: 'Cherry Hardening / Sizing',
        soilPh: 5.1,
        drainage: 'Steep Escarpment Drainage',
        risk: 'LOW',
        boundaryOffset: [-0.007, -0.007, 0.007, 0.007]
      }
    ]
  },
  {
    id: 'zim-farm-006',
    name: 'Chiredzi Triangle Sugar Cane Syndicate',
    region: 'Natural Region V (Lowveld Basin)',
    district: 'Chiredzi District',
    province: 'Masvingo',
    sizeHa: 220.0,
    latitude: -21.0500,
    longitude: 31.6667,
    elevationM: 430,
    primaryCrop: 'Commercial Sugarcane (NCo376)',
    secondaryCrop: 'Citrus & Sunn Hemp Cover Crop',
    soilType: 'Basaltic Black Clay Loams (Vertisols, pH 7.2)',
    irrigationType: 'Mutirikwi-Chiredzi Canal Gravitational Flood / Siphon',
    riskStatus: 'OPTIMAL',
    suitabilityScore: 94,
    suitabilityClass: 'Highly Suitable (S1)',
    weatherAlert: 'Extreme Daytime Insolation (33°C Max)',
    weatherContext: {
      temp: 31.4,
      humidity: 38,
      rain24h: 0.0,
      forecastRain48h: 0.0,
      windSpeed: 6.0
    },
    fields: [
      {
        id: 'zim-fld-010',
        name: 'Canal Section 4 — Ratoon Sugarcane',
        areaHa: 110.0,
        crop: 'Sugarcane (NCo376)',
        stage: 'Grand Growth Stage (Stalk Elongation)',
        soilPh: 7.2,
        drainage: 'Engineered Sump & Tail Ditch',
        risk: 'LOW',
        boundaryOffset: [-0.012, -0.012, 0.012, 0.012]
      }
    ]
  }
];

"""
AYIS — Refined Multi-Factor Recommendation Engine (REFINE 09).

Replaces simplistic rules with configurable multi-factor suitability analysis.

Factors considered:
- Temperature (current, forecast, deviation from optimal)
- Rainfall (recent, forecast, accumulation vs. requirement)
- Humidity (average, deviation from optimal range)
- Wind (speed, impact on pollination/evaporation)
- Season (current month vs. suitable_months)
- Crop requirements (temperature, rainfall, humidity, sunlight, season)
- Crop growth period (growing_days, stage-specific needs)
- Farm location (latitude, climate zone, elevation proxy)
- Recent weather (last 7/14/30 days trends)
- Forecast conditions (next 7 days where available)
- Crop cycle stage (specific needs per growth stage)

Output:
- Suitability score (0-100)
- Suitability classification (Excellent/Good/Fair/Poor/Unsuitable)
- Recommendation (action text)
- Reasons (list of factor scores with explanation)
- Risks (list of identified risks)
- Warnings (list of conditions that could change result)
- Confidence/quality indicator (0-1)
"""

from datetime import datetime, timezone, date, timedelta
from decimal import Decimal
from typing import Any
from collections import defaultdict

from ayis.integrations.base import ObservationRecord

# NOTE: models must be imported lazily to avoid circular imports
# during Django app registry population.


class MultiFactorSuitabilityEngine:
    """
    Configurable multi-factor suitability engine.

    Each factor is scored 0-100, then weighted to produce overall score.
    Weights are configurable per crop type.
    """

    # Default factor weights (must sum to 1.0)
    DEFAULT_WEIGHTS = {
        'temperature': 0.25,
        'rainfall': 0.25,
        'humidity': 0.10,
        'wind': 0.05,
        'season': 0.15,
        'location': 0.10,
        'growth_stage': 0.10,
    }

    # Score classification thresholds
    CLASSIFICATIONS = {
        'excellent': (85, 100),
        'good': (70, 84),
        'fair': (50, 69),
        'poor': (30, 49),
        'unsuitable': (0, 29),
    }

    def __init__(self, weights=None):
        self.weights = weights or self.DEFAULT_WEIGHTS.copy()
        # Normalize weights to sum to 1.0
        total = sum(self.weights.values())
        if total > 0:
            for k in self.weights:
                self.weights[k] /= total

    def calculate(
        self,
        observations: list[ObservationRecord],
        forecast: list[ObservationRecord] | None = None,
        crop_requirements: dict | None = None,
        farm_location: tuple[float, float] | None = None,
        current_stage: str | None = None,
        growing_days_completed: int | None = None,
        growing_days_total: int | None = None,
        current_month: int | None = None,
    ) -> dict[str, Any]:
        """
        Calculate multi-factor suitability score.

        Returns complete analysis with score, classification, reasons, risks, warnings.
        """
        if current_month is None:
            current_month = datetime.now().month

        factors = {}
        total_weight = 0.0
        weighted_score = 0.0

        # 1. Temperature factor
        temp_result = self._calculate_temperature_factor(
            observations, crop_requirements
        )
        factors['temperature'] = temp_result
        w = self.weights.get('temperature', 0.25)
        weighted_score += temp_result['score'] * w
        total_weight += w

        # 2. Rainfall factor
        rain_result = self._calculate_rainfall_factor(
            observations, forecast, crop_requirements
        )
        factors['rainfall'] = rain_result
        w = self.weights.get('rainfall', 0.25)
        weighted_score += rain_result['score'] * w
        total_weight += w

        # 3. Humidity factor
        hum_result = self._calculate_humidity_factor(
            observations, crop_requirements
        )
        factors['humidity'] = hum_result
        w = self.weights.get('humidity', 0.10)
        weighted_score += hum_result['score'] * w
        total_weight += w

        # 4. Wind factor
        wind_result = self._calculate_wind_factor(observations)
        factors['wind'] = wind_result
        w = self.weights.get('wind', 0.05)
        weighted_score += wind_result['score'] * w
        total_weight += w

        # 5. Season factor
        season_result = self._calculate_season_factor(
            current_month, crop_requirements
        )
        factors['season'] = season_result
        w = self.weights.get('season', 0.15)
        weighted_score += season_result['score'] * w
        total_weight += w

        # 6. Location factor (latitude-based climate suitability)
        location_result = self._calculate_location_factor(
            farm_location, crop_requirements
        )
        factors['location'] = location_result
        w = self.weights.get('location', 0.10)
        weighted_score += location_result['score'] * w
        total_weight += w

        # 7. Growth stage factor
        stage_result = self._calculate_growth_stage_factor(
            current_stage, growing_days_completed, growing_days_total,
            observations
        )
        factors['growth_stage'] = stage_result
        w = self.weights.get('growth_stage', 0.10)
        weighted_score += stage_result['score'] * w
        total_weight += w

        # Calculate final score
        if total_weight > 0:
            final_score = (weighted_score / total_weight) * 100
        else:
            final_score = 50.0  # neutral if no factors scored

        final_score = max(0, min(100, final_score))

        # Classification
        classification = self._classify(final_score)

        # Build reasons, risks, warnings
        reasons = self._build_reasons(factors)
        risks = self._build_risks(factors, crop_requirements)
        warnings = self._build_warnings(factors, forecast)

        # Confidence based on data availability
        data_points = sum(
            1 for f in factors.values()
            if f.get('data_available', False)
        )
        confidence = min(1.0, data_points / max(len(factors), 1))

        return {
            'score': round(final_score, 1),
            'max_score': 100.0,
            'percentage': round(final_score, 1),
            'classification': classification,
            'factors': factors,
            'reasons': reasons,
            'risks': risks,
            'warnings': warnings,
            'confidence': round(confidence, 2),
            'data_classification': 'calculated',
            'explanation': self._build_explanation(
                final_score, classification, factors, reasons
            ),
        }

    def _calculate_temperature_factor(
        self, observations: list, crop_requirements: dict | None
    ) -> dict:
        """Score temperature suitability."""
        if not observations:
            return {
                'score': 50.0, 'max_score': 100,
                'data_available': False,
                'average_temp': None,
                'optimal_range': None,
                'deviation': None,
                'note': 'No temperature data available.',
            }

        temps = [o.temperature_celsius for o in observations
                 if o.temperature_celsius is not None]
        if not temps:
            return {
                'score': 50.0, 'max_score': 100,
                'data_available': False,
                'average_temp': None,
                'optimal_range': None,
                'deviation': None,
                'note': 'No temperature readings in observations.',
            }

        avg_temp = sum(temps) / len(temps)

        if crop_requirements:
            opt_min = crop_requirements.get('optimal_temp_min', 15)
            opt_max = crop_requirements.get('optimal_temp_max', 30)
        else:
            opt_min, opt_max = 15, 30

        if opt_min <= avg_temp <= opt_max:
            score = 100.0
            deviation = 0
        elif avg_temp < opt_min:
            # Below optimal: score drops 5 points per degree below min
            deviation = avg_temp - opt_min  # negative
            score = max(0, 100 + deviation * 8)  # harsh penalty
        else:
            # Above optimal: score drops 3 points per degree above max
            deviation = avg_temp - opt_max  # positive
            score = max(0, 100 - deviation * 5)

        return {
            'score': round(score, 1),
            'max_score': 100,
            'data_available': True,
            'average_temp': round(avg_temp, 1),
            'optimal_range': [opt_min, opt_max],
            'deviation': round(deviation, 1),
            'note': self._temp_note(avg_temp, opt_min, opt_max),
        }

    def _temp_note(self, avg_temp, opt_min, opt_max):
        if opt_min <= avg_temp <= opt_max:
            return f"Temperature ({avg_temp}°C) is within optimal range ({opt_min}-{opt_max}°C)."
        elif avg_temp < opt_min:
            return f"Temperature ({avg_temp}°C) is below optimal minimum ({opt_min}°C)."
        else:
            return f"Temperature ({avg_temp}°C) is above optimal maximum ({opt_max}°C)."

    def _calculate_rainfall_factor(
        self, observations: list, forecast: list | None, crop_requirements: dict | None
    ) -> dict:
        """Score rainfall suitability."""
        if not observations and not forecast:
            return {
                'score': 50.0, 'max_score': 100,
                'data_available': False,
                'total_rain_mm': None,
                'forecast_rain_mm': None,
                'requirement_mm': None,
                'note': 'No rainfall data available.',
            }

        obs_rain = sum(
            o.rainfall_mm for o in observations
            if o.rainfall_mm is not None
        )

        forecast_rain = None
        if forecast:
            forecast_rain = sum(
                o.rainfall_mm for o in forecast
                if o.rainfall_mm is not None
            )

        if crop_requirements:
            req_mm = crop_requirements.get('rainfall_min_mm', 500)
            opt_mm = crop_requirements.get('rainfall_optimum_mm', 750)
            max_mm = crop_requirements.get('rainfall_max_mm', 1500)
        else:
            req_mm, opt_mm, max_mm = 500, 750, 1500

        total = obs_rain + (forecast_rain or 0)

        if total >= opt_mm:
            score = 100.0
        elif total >= req_mm:
            # Between minimum and optimum
            score = 70 + (30 * (total - req_mm) / (opt_mm - req_mm)) if opt_mm > req_mm else 70
        elif total > 0:
            # Below minimum but some rain
            score = max(0, 70 * (total / req_mm))
        else:
            score = 10.0  # No rain at all

        # Cap if exceeding max
        if total > max_mm and max_mm > 0:
            score = max(0, score - 20)  # penalty for excessive rain

        return {
            'score': round(score, 1),
            'max_score': 100,
            'data_available': True,
            'total_rain_mm': round(total, 1),
            'observed_rain_mm': round(obs_rain, 1),
            'forecast_rain_mm': round(forecast_rain, 1) if forecast_rain else None,
            'requirement_mm': req_mm,
            'optimum_mm': opt_mm,
            'maximum_mm': max_mm,
            'note': self._rain_note(total, req_mm, opt_mm, max_mm),
        }

    def _rain_note(self, total, req, opt, max_mm):
        if total >= opt:
            return f"Rainfall ({total}mm) meets optimum requirement ({opt}mm)."
        elif total >= req:
            return f"Rainfall ({total}mm) meets minimum ({req}mm) but below optimum ({opt}mm)."
        elif total > 0:
            return f"Rainfall ({total}mm) is below minimum requirement ({req}mm)."
        else:
            return "No rainfall recorded."

    def _calculate_humidity_factor(
        self, observations: list, crop_requirements: dict | None
    ) -> dict:
        """Score humidity suitability."""
        if not observations:
            return {
                'score': 50.0, 'max_score': 100,
                'data_available': False,
                'average_humidity': None,
                'optimal_range': None,
                'note': 'No humidity data available.',
            }

        hums = [o.humidity_percent for o in observations
                if o.humidity_percent is not None]
        if not hums:
            return {
                'score': 50.0, 'max_score': 100,
                'data_available': False,
                'average_humidity': None,
                'optimal_range': None,
                'note': 'No humidity readings.',
            }

        avg_hum = sum(hums) / len(hums)

        if crop_requirements:
            opt_min = crop_requirements.get('optimal_humidity_min', 40)
            opt_max = crop_requirements.get('optimal_humidity_max', 80)
        else:
            opt_min, opt_max = 40, 80

        if opt_min <= avg_hum <= opt_max:
            score = 100.0
        elif avg_hum < opt_min:
            score = max(0, 100 - (opt_min - avg_hum) * 4)
        else:
            score = max(0, 100 - (avg_hum - opt_max) * 3)

        return {
            'score': round(score, 1),
            'max_score': 100,
            'data_available': True,
            'average_humidity': round(avg_hum, 1),
            'optimal_range': [opt_min, opt_max],
            'note': f"Humidity ({avg_hum}%) {'within' if opt_min <= avg_hum <= opt_max else 'outside'} optimal range ({opt_min}-{opt_max}%).",
        }

    def _calculate_wind_factor(self, observations: list) -> dict:
        """Score wind conditions."""
        if not observations:
            return {
                'score': 50.0, 'max_score': 100,
                'data_available': False,
                'average_wind_ms': None,
                'note': 'No wind data available.',
            }

        winds = [o.wind_speed_ms for o in observations
                 if o.wind_speed_ms is not None]
        if not winds:
            return {
                'score': 50.0, 'max_score': 100,
                'data_available': False,
                'average_wind_ms': None,
                'note': 'No wind readings.',
            }

        avg_wind = sum(winds) / len(winds)

        # Wind scoring: lower is generally better for most crops
        if avg_wind < 5:
            score = 100.0  # Calm
        elif avg_wind < 10:
            score = 80.0   # Moderate
        elif avg_wind < 20:
            score = 50.0   # Breezy - may affect some crops
        elif avg_wind < 30:
            score = 25.0   # Windy - stress risk
        else:
            score = 10.0   # Very windy - damage risk

        return {
            'score': score,
            'max_score': 100,
            'data_available': True,
            'average_wind_ms': round(avg_wind, 1),
            'note': f"Average wind speed: {avg_wind} m/s.",
        }

    def _calculate_season_factor(
        self, current_month: int, crop_requirements: dict | None
    ) -> dict:
        """Score seasonal appropriateness."""
        if crop_requirements:
            suitable_months = crop_requirements.get('suitable_months', [])
            planting_season = crop_requirements.get('planting_season', '')
            harvest_season = crop_requirements.get('harvest_season', '')
        else:
            suitable_months = []
            planting_season = ''
            harvest_season = ''

        if not suitable_months:
            # No seasonal data - neutral
            return {
                'score': 50.0, 'max_score': 100,
                'data_available': False,
                'current_month': current_month,
                'suitable_months': suitable_months,
                'note': 'No seasonal data available for this crop.',
            }

        is_suitable = current_month in suitable_months

        if is_suitable:
            score = 100.0
            note = f"Current month ({current_month}) is in the suitable planting window ({suitable_months})."
        else:
            score = 15.0  # Significant penalty for wrong season
            note = f"Current month ({current_month}) is NOT in the suitable planting window ({suitable_months})."

        return {
            'score': score,
            'max_score': 100,
            'data_available': True,
            'current_month': current_month,
            'suitable_months': suitable_months,
            'note': note,
        }

    def _calculate_location_factor(
        self, farm_location: tuple[float, float] | None, crop_requirements: dict | None
    ) -> dict:
        """Score based on farm latitude (climate zone proxy)."""
        if farm_location is None:
            return {
                'score': 50.0, 'max_score': 100,
                'data_available': False,
                'latitude': None,
                'longitude': None,
                'climate_zone': 'unknown',
                'note': 'No location data available.',
            }

        lat, lon = farm_location

        # Latitude-based climate zone approximation
        if -10 <= lat <= 10:
            zone = 'tropical'
        elif 10 < lat <= 23.5:
            zone = 'subtropical'
        elif 23.5 < lat <= 35:
            zone = 'warm_temperate'
        elif 35 < lat <= 50:
            zone = 'temperate'
        elif 50 < lat <= 60:
            zone = 'cool_temperate'
        elif lat > 60:
            zone = 'cold'
        elif lat < -10:
            zone = 'southern_tropical'
        else:
            zone = 'unknown'

        # Most crops can grow in a range of zones
        # This is a simplified check - real implementation would use crop-specific zones
        score = 80.0 if zone != 'unknown' else 50.0

        return {
            'score': score,
            'max_score': 100,
            'data_available': True,
            'latitude': round(lat, 4),
            'longitude': round(lon, 4),
            'climate_zone': zone,
            'note': f"Farm located at ({lat}, {lon}) in {zone} zone.",
        }

    def _calculate_growth_stage_factor(
        self, current_stage: str | None, days_completed: int | None,
        days_total: int | None, observations: list
    ) -> dict:
        """Score based on crop growth stage and progress."""
        if not current_stage:
            return {
                'score': 50.0, 'max_score': 100,
                'data_available': False,
                'current_stage': current_stage,
                'progress_pct': None,
                'note': 'No growth stage information.',
            }

        stage_scores = {
            'not_planted': 60.0,     # Can still plan
            'planned': 60.0,
            'planted': 80.0,         # Good - planted
            'germinated': 85.0,      # Good - germination successful
            'vegetative': 90.0,      # Good - active growth
            'reproductive': 90.0,    # Good - flowering
            'harvest_ready': 85.0,   # Good - ready to harvest
            'harvested': 70.0,       # Completed
            'failed': 5.0,           # Bad
            'cancelled': 5.0,        # Bad
        }

        score = stage_scores.get(current_stage, 50.0)

        # Calculate progress
        if days_completed is not None and days_total is not None and days_total > 0:
            progress = min(100, (days_completed / days_total) * 100)
        else:
            progress = None

        # Check for water stress during critical stages
        if current_stage in ('vegetative', 'reproductive') and observations:
            recent_rain = sum(
                o.rainfall_mm for o in observations[-7:]
                if o.rainfall_mm is not None
            )
            if recent_rain < 10:
                score = max(0, score - 15)
                note = f"Stage: {current_stage}. Low rainfall ({recent_rain}mm) in past 7 days - water stress risk."
            else:
                note = f"Stage: {current_stage}. Adequate moisture."
        else:
            note = f"Stage: {current_stage}."

        if progress is not None:
            note += f" Progress: {progress:.0f}%."

        return {
            'score': round(score, 1),
            'max_score': 100,
            'data_available': True,
            'current_stage': current_stage,
            'progress_pct': round(progress, 1) if progress else None,
            'note': note,
        }

    def _classify(self, score: float) -> str:
        """Classify score into category."""
        for class_name, (low, high) in self.CLASSIFICATIONS.items():
            if low <= score <= high:
                return class_name
        return 'unsuitable'

    def _build_reasons(self, factors: dict) -> list[str]:
        """Build human-readable reasons from factor scores."""
        reasons = []
        for name, data in factors.items():
            if data.get('data_available'):
                score = data.get('score', 50)
                note = data.get('note', '')
                if note:
                    reasons.append(f"{name.replace('_', ' ').title()}: {note}")
        return reasons

    def _build_risks(self, factors: dict, crop_requirements: dict | None) -> list[str]:
        """Identify potential risks from factor analysis."""
        risks = []

        # Temperature risks
        temp = factors.get('temperature', {})
        if temp.get('data_available'):
            dev = temp.get('deviation', 0)
            if abs(dev) > 5:
                risks.append(f"Temperature deviation of {dev:.1f}°C from optimal range — crop stress possible.")
            if temp.get('average_temp') and temp.get('average_temp') > 35:
                risks.append("High temperatures (>35°C) may cause heat stress and reduced pollination.")

        # Rainfall risks
        rain = factors.get('rainfall', {})
        if rain.get('data_available'):
            total = rain.get('total_rain_mm', 0)
            req = rain.get('requirement_mm', 500)
            if total < req * 0.5:
                risks.append(f"Rainfall severely below requirement ({total}mm vs {req}mm needed) — drought risk.")
            if rain.get('forecast_rain_mm') and rain.get('forecast_rain_mm', 0) > rain.get('requirement_mm', 1000):
                risks.append("Forecast rainfall may cause waterlogging or flooding.")

        # Humidity risks
        hum = factors.get('humidity', {})
        if hum.get('data_available'):
            avg_hum = hum.get('average_humidity', 0)
            if avg_hum and avg_hum > 85:
                risks.append("High humidity (>85%) increases fungal disease risk.")
            if avg_hum and avg_hum < 30:
                risks.append("Very low humidity (<30%) may cause desiccation stress.")

        # Wind risks
        wind = factors.get('wind', {})
        if wind.get('data_available'):
            avg_wind = wind.get('average_wind_ms', 0)
            if avg_wind and avg_wind > 20:
                risks.append(f"Strong winds ({avg_wind} m/s) may cause physical damage and increased evaporation.")

        # Seasonal risks
        season = factors.get('season', {})
        if season.get('data_available') and season.get('score', 100) < 50:
            risks.append("Current season is outside optimal planting window — reduced yield expected.")

        # Growth stage risks
        stage = factors.get('growth_stage', {})
        if stage.get('data_available'):
            s = stage.get('current_stage', '')
            if s == 'failed':
                risks.append("Previous cycle failed — investigate cause before replanting.")
            if s == 'cancelled':
                risks.append("Previous cycle was cancelled — review planning parameters.")

        if not risks:
            risks.append("No significant risks identified.")

        return risks

    def _build_warnings(self, factors: dict, forecast: list | None) -> list[str]:
        """Build warnings about conditions that could change the result."""
        warnings = []

        # Forecast availability
        if forecast:
            warnings.append("Forecast data included — actual conditions may differ.")
        else:
            warnings.append("No forecast data available — recommendation based on past observations only.")

        # Data quality
        for name, data in factors.items():
            if not data.get('data_available'):
                warnings.append(f"No {name.replace('_', ' ')} data — this factor was not scored.")

        # Confidence warning
        warnings.append("This is a calculated suitability score, not a guarantee. Actual results depend on many factors including management practices, pest/disease pressure, and unforeseen weather events.")

        return warnings

    def _build_explanation(
        self, score: float, classification: str, factors: dict, reasons: list
    ) -> str:
        """Build human-readable explanation."""
        parts = [f"Overall suitability: {score:.1f}% ({classification.title()})."]
        if reasons:
            parts.append("Key factors:")
            parts.extend(f"  • {r}" for r in reasons[:5])  # Top 5

        return "\n".join(parts)

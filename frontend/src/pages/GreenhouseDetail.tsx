import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, SproutIcon, CloudIcon, TrendingUpIcon, CalendarIcon, MapPinIcon, RefreshCwIcon } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface LocationAnalysis {
  province: string;
  region: string;
  climate_type: string;
  current_season: string;
  season_end_month: number;
}

interface WeatherForecast {
  current_month_rainfall_mm: number;
  next_3months_rainfall_mm: number;
  temperature_range_c: string;
  typhoon_risk: string;
  el_nino_la_nina: string;
}

interface MarketConditions {
  high_demand_crops: string[];
  price_trends: string;
  export_opportunities: string[];
  local_market_saturation: string[];
}

interface AgriculturalCalendar {
  optimal_planting_window: string;
  harvest_season_conflict: string;
  recommended_crop_cycles: string[];
}

interface RiskFactors {
  pest_disease_season: string[];
  water_availability: string;
  soil_degradation_risk: string;
}

interface ContextAnalysis {
  id: string;
  location_analysis: LocationAnalysis;
  weather_forecast: WeatherForecast;
  market_conditions: MarketConditions;
  agricultural_calendar: AgriculturalCalendar;
  risk_factors: RiskFactors;
}

export function GreenhouseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contextAnalysis, setContextAnalysis] = useState<ContextAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContextAnalysis = async (refresh: boolean = false) => {
    if (!id) return;
    
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const url = refresh 
        ? `${API_BASE_URL}/recommendations/${id}/context-analysis?refresh=true`
        : `${API_BASE_URL}/recommendations/${id}/context-analysis`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch context analysis');
      }
      const data = await response.json();
      setContextAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContextAnalysis();
  }, [id]);

  const handleRefresh = () => {
    fetchContextAnalysis(true);
  };

  if (loading) {
    return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading location analysis...</p>
        </div>
      </motion.div>;
  }

  if (error || !contextAnalysis) {
    return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white px-5 pt-12 pb-4">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate('/')} className="p-2 -ml-2">
              <ArrowLeftIcon className="w-6 h-6 text-gray-800" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Error</h2>
          </div>
        </div>
        <div className="flex-1 px-5 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p className="font-medium">Failed to load context analysis</p>
            <p className="text-sm mt-1">{error || 'Unknown error'}</p>
          </div>
        </div>
      </motion.div>;
  }

  return <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="w-full min-h-screen bg-gray-50 flex flex-col pb-32">
      <div className="bg-white px-5 pt-12 pb-4 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeftIcon className="w-6 h-6 text-gray-800" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Location Analysis</h2>
            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
              <MapPinIcon className="w-4 h-4" />
              <span>{contextAnalysis.location_analysis.province}, {contextAnalysis.location_analysis.region}</span>
            </div>
          </div>
          <button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className={`p-2 rounded-full transition-colors ${refreshing ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-lime-100'}`}
            title="Refresh analysis"
          >
            <RefreshCwIcon className={`w-6 h-6 text-gray-800 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 px-5 py-6 space-y-5">
        <div className="bg-green-600 rounded-3xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Climate: {contextAnalysis.location_analysis.climate_type}</span>
          </div>
          <h3 className="text-lg font-bold mb-2">Location Overview</h3>
          <p className="text-white/95 leading-relaxed">
            {contextAnalysis.location_analysis.current_season} season in {contextAnalysis.location_analysis.province}. 
            Season ends around month {contextAnalysis.location_analysis.season_end_month}.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <CloudIcon className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Weather Forecast</h3>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-700 mb-1">Current Month Rainfall</p>
                <p className="text-lg font-bold text-blue-900">{contextAnalysis.weather_forecast.current_month_rainfall_mm} mm</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-700 mb-1">Next 3 Months</p>
                <p className="text-lg font-bold text-blue-900">{contextAnalysis.weather_forecast.next_3months_rainfall_mm} mm</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3">
                <p className="text-xs text-orange-700 mb-1">Temperature Range</p>
                <p className="text-lg font-bold text-orange-900">{contextAnalysis.weather_forecast.temperature_range_c}°C</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3">
                <p className="text-xs text-yellow-700 mb-1">El Niño/La Niña</p>
                <p className="text-sm font-bold text-yellow-900">{contextAnalysis.weather_forecast.el_nino_la_nina}</p>
              </div>
            </div>
            <div className={`rounded-xl p-4 ${contextAnalysis.weather_forecast.typhoon_risk === 'High' ? 'bg-red-50 border border-red-200' : contextAnalysis.weather_forecast.typhoon_risk === 'Moderate' ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
              <p className="text-sm font-medium text-gray-700 mb-1">Typhoon Risk</p>
              <p className={`text-lg font-bold ${contextAnalysis.weather_forecast.typhoon_risk === 'High' ? 'text-red-700' : contextAnalysis.weather_forecast.typhoon_risk === 'Moderate' ? 'text-yellow-700' : 'text-green-700'}`}>
                {contextAnalysis.weather_forecast.typhoon_risk}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">Agricultural Calendar</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm font-medium text-green-700 mb-1">Optimal Planting Window</p>
              <p className="text-lg font-bold text-green-900">{contextAnalysis.agricultural_calendar.optimal_planting_window}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Harvest Season Conflict</p>
              <p className="text-gray-900 bg-gray-50 rounded-xl p-3">{contextAnalysis.agricultural_calendar.harvest_season_conflict}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Recommended Crop Cycles</p>
              <div className="flex flex-wrap gap-2">
                {contextAnalysis.agricultural_calendar.recommended_crop_cycles.map((cycle, index) => (
                  <span key={index} className="px-3 py-1 bg-lime-100 text-lime-800 rounded-full text-sm font-medium">
                    {cycle}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUpIcon className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900">Market Conditions</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">High Demand Crops</p>
              <div className="flex flex-wrap gap-2">
                {contextAnalysis.market_conditions.high_demand_crops.map((crop, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {crop}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Export Opportunities</p>
              <div className="flex flex-wrap gap-2">
                {contextAnalysis.market_conditions.export_opportunities.map((crop, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {crop}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Market Saturation (Avoid)</p>
              <div className="flex flex-wrap gap-2">
                {contextAnalysis.market_conditions.local_market_saturation.map((crop, index) => (
                  <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    {crop}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-sm font-medium text-purple-700 mb-1">Price Trends</p>
              <p className="text-gray-900">{contextAnalysis.market_conditions.price_trends}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <SproutIcon className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-bold text-gray-900">Risk Factors</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Pest & Disease Season</p>
              <div className="flex flex-wrap gap-2">
                {contextAnalysis.risk_factors.pest_disease_season.map((pest, index) => (
                  <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    {pest}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-xl p-4 ${contextAnalysis.risk_factors.water_availability === 'Abundant' ? 'bg-blue-50' : contextAnalysis.risk_factors.water_availability === 'Moderate' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                <p className="text-xs text-gray-600 mb-1">Water Availability</p>
                <p className={`text-lg font-bold ${contextAnalysis.risk_factors.water_availability === 'Abundant' ? 'text-blue-900' : contextAnalysis.risk_factors.water_availability === 'Moderate' ? 'text-yellow-900' : 'text-red-900'}`}>
                  {contextAnalysis.risk_factors.water_availability}
                </p>
              </div>
              <div className={`rounded-xl p-4 ${contextAnalysis.risk_factors.soil_degradation_risk === 'Low' ? 'bg-green-50' : contextAnalysis.risk_factors.soil_degradation_risk === 'Moderate' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                <p className="text-xs text-gray-600 mb-1">Soil Degradation Risk</p>
                <p className={`text-lg font-bold ${contextAnalysis.risk_factors.soil_degradation_risk === 'Low' ? 'text-green-900' : contextAnalysis.risk_factors.soil_degradation_risk === 'Moderate' ? 'text-yellow-900' : 'text-red-900'}`}>
                  {contextAnalysis.risk_factors.soil_degradation_risk}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>;
}
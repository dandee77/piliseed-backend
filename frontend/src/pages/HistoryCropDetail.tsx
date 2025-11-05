import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  SproutIcon,
  TrendingUpIcon,
  CalendarIcon,
  DollarSignIcon,
  AlertTriangleIcon,
  ThermometerIcon,
  DropletIcon,
  SunIcon,
  ShieldIcon,
  UsersIcon,
  BarChart3Icon,
  CheckCircleIcon
} from 'lucide-react';
import { API_BASE_URL } from '../config';

interface CropRecommendation {
  crop: string;
  searchable_name?: string;
  image_url?: string;
  scientific_name: string;
  category: string;
  planted?: boolean;
  scores: {
    overall_score: number;
    confidence_pct: number;
    env_score: number;
    econ_score: number;
    time_fit_score: number;
    season_score: number;
    labor_score: number;
    risk_score: number;
    market_score: number;
  };
  growth_requirements: {
    crop_cycle_days: number;
    water_requirement: string;
    sunlight_hours_daily: number;
    optimal_temp_range_c: string;
    soil_ph_range: string;
    soil_type_preferred: string;
  };
  tolerances: {
    drought_tolerance: string;
    flood_tolerance: string;
    salinity_tolerance: string;
    frost_tolerance: string;
    shade_tolerance: string;
    pest_disease_resistance: string;
  };
  management: {
    management_intensity: string;
    labor_hours_per_ha_per_week: number;
    organic_suitable: boolean;
    mechanization_possible: boolean;
    requires_irrigation: boolean;
    requires_trellising: boolean;
  };
  economics: {
    estimated_cost_php: number;
    cost_breakdown: {
      seeds_php: number;
      fertilizer_php: number;
      pesticides_php: number;
      labor_php: number;
      irrigation_php: number;
      others_php: number;
    };
    estimated_yield_kg_per_ha: number;
    estimated_revenue_php: number;
    profit_margin_pct: number;
    roi_pct: number;
    break_even_days: number;
  };
  market_strategy: {
    best_selling_locations: string[];
    current_market_price_php_per_kg: number;
    projected_harvest_price_php_per_kg: number;
    price_volatility: string;
    demand_level: string;
    export_potential: boolean;
    buyer_types: string[];
  };
  planting_schedule: {
    recommended_planting_date: string;
    expected_harvest_date: string;
    succession_planting_possible: boolean;
    intercropping_compatible_with: string[];
  };
  risk_assessment: {
    weather_risks: string[];
    pest_disease_risks: string[];
    market_risks: string[];
    mitigation_strategies: string[];
  };
  reasoning: string;
}

export function HistoryCropDetail() {
  const { sessionId, cropIndex } = useParams<{ sessionId: string; cropIndex: string }>();
  const navigate = useNavigate();
  const [crop, setCrop] = useState<CropRecommendation | null>(null);
  const [recommendationId, setRecommendationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingPlanted, setIsTogglingPlanted] = useState(false);

  useEffect(() => {
    fetchCropDetails();
  }, [sessionId, cropIndex]);

  const fetchCropDetails = async () => {
    if (!sessionId || cropIndex === undefined) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/recommendations/session/${sessionId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      const index = parseInt(cropIndex);
      
      if (data.recommendations && data.recommendations[index]) {
        setCrop(data.recommendations[index]);
        setRecommendationId(data.id);
      } else {
        navigate(`/history/${sessionId}`);
      }
    } catch (err) {
      console.error('Error fetching crop details:', err);
      navigate(`/history/${sessionId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePlanted = async () => {
    if (!recommendationId || cropIndex === undefined || !crop) return;

    try {
      setIsTogglingPlanted(true);
      const newPlantedStatus = !crop.planted;

      const response = await fetch(
        `${API_BASE_URL}/recommendations/${recommendationId}/crops/${cropIndex}/planted?planted=${newPlantedStatus}`,
        { method: 'PATCH' }
      );

      if (!response.ok) {
        throw new Error('Failed to update planted status');
      }

      setCrop({ ...crop, planted: newPlantedStatus });
    } catch (err) {
      console.error('Error toggling planted status:', err);
    } finally {
      setIsTogglingPlanted(false);
    }
  };

  const handleBack = () => {
    navigate(`/history/${sessionId}`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-lime-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100';
    if (score >= 0.6) return 'bg-lime-100';
    if (score >= 0.4) return 'bg-yellow-100';
    return 'bg-orange-100';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!crop) {
    return null;
  }

  return (
    <div className="min-h-screen bg-green-50 pb-32">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="px-5 py-4 flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{crop.crop}</h1>
            <p className="text-sm text-gray-500 italic">{crop.scientific_name}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative h-64 rounded-2xl overflow-hidden shadow-lg"
        >
          {crop.image_url ? (
            <img
              src={crop.image_url}
              alt={crop.crop}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-green-600 flex items-center justify-center">
              <SproutIcon className="w-24 h-24 text-white" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-block px-3 py-1 bg-white/90 rounded-full text-sm font-medium text-gray-800 mb-2">
                  {crop.category}
                </span>
                <h2 className="text-2xl font-bold text-white">{crop.crop}</h2>
              </div>
              <div className={`${getScoreBgColor(crop.scores.overall_score)} px-4 py-2 rounded-xl`}>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(crop.scores.overall_score)}`}>
                    {Math.round(crop.scores.overall_score * 100)}%
                  </div>
                  <div className="text-xs text-gray-600">Overall Score</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-lg p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <SproutIcon className="w-5 h-5 text-lime-600" />
            <h3 className="font-semibold text-gray-900">Why This Crop?</h3>
          </div>
          <p className="text-gray-700 leading-relaxed">{crop.reasoning}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangleIcon className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-900">Historical Data</h3>
          </div>
          <p className="text-sm text-amber-800">
            This is a past recommendation session. Data shown reflects conditions at the time of generation.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="fixed bottom-8 left-0 right-0 px-5 max-w-[430px] mx-auto"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTogglePlanted}
            disabled={isTogglingPlanted}
            className={`w-full py-4 rounded-xl shadow-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
              crop.planted
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-white hover:bg-gray-50 text-gray-900 border-2 border-green-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <CheckCircleIcon className={`w-5 h-5 ${crop.planted ? 'text-white' : 'text-green-600'}`} />
            {isTogglingPlanted ? (
              'Updating...'
            ) : crop.planted ? (
              'Marked as Planted'
            ) : (
              'Mark as Planted'
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

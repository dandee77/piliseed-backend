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

export function CropDetail() {
  const { id, cropIndex } = useParams<{ id: string; cropIndex: string }>();
  const navigate = useNavigate();
  const [crop, setCrop] = useState<CropRecommendation | null>(null);
  const [recommendationId, setRecommendationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingPlanted, setIsTogglingPlanted] = useState(false);

  useEffect(() => {
    fetchCropDetails();
  }, [id, cropIndex]);

  const fetchCropDetails = async () => {
    if (!id || cropIndex === undefined) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/recommendations/${id}/latest`);

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      const index = parseInt(cropIndex);
      
      if (data.recommendations && data.recommendations[index]) {
        setCrop(data.recommendations[index]);
        setRecommendationId(data.id);
      } else {
        navigate(`/greenhouse/${id}/crops`);
      }
    } catch (err) {
      console.error('Error fetching crop details:', err);
      navigate(`/greenhouse/${id}/crops`);
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
    navigate(`/greenhouse/${id}/crops`);
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
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3Icon className="w-5 h-5 text-lime-600" />
            <h3 className="font-semibold text-gray-900">Performance Scores</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ScoreItem label="Environment" value={crop.scores.env_score} />
            <ScoreItem label="Economics" value={crop.scores.econ_score} />
            <ScoreItem label="Time Fit" value={crop.scores.time_fit_score} />
            <ScoreItem label="Season" value={crop.scores.season_score} />
            <ScoreItem label="Labor" value={crop.scores.labor_score} />
            <ScoreItem label="Risk" value={crop.scores.risk_score} />
            <ScoreItem label="Market" value={crop.scores.market_score} />
            <div className="bg-green-50 p-3 rounded-xl border border-green-100">
              <div className="text-xs text-gray-600 mb-1">Confidence</div>
              <div className="text-lg font-bold text-green-700">{crop.scores.confidence_pct}%</div>
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
          className="bg-white rounded-2xl shadow-lg p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <ThermometerIcon className="w-5 h-5 text-lime-600" />
            <h3 className="font-semibold text-gray-900">Growth Requirements</h3>
          </div>
          <div className="space-y-3">
            <InfoRow
              icon={<CalendarIcon className="w-4 h-4" />}
              label="Crop Cycle"
              value={`${crop.growth_requirements.crop_cycle_days} days`}
            />
            <InfoRow
              icon={<DropletIcon className="w-4 h-4" />}
              label="Water"
              value={crop.growth_requirements.water_requirement}
            />
            <InfoRow
              icon={<SunIcon className="w-4 h-4" />}
              label="Sunlight"
              value={`${crop.growth_requirements.sunlight_hours_daily} hours/day`}
            />
            <InfoRow
              icon={<ThermometerIcon className="w-4 h-4" />}
              label="Temperature"
              value={`${crop.growth_requirements.optimal_temp_range_c}°C`}
            />
            <InfoRow label="Soil pH" value={crop.growth_requirements.soil_ph_range} />
            <InfoRow label="Soil Type" value={crop.growth_requirements.soil_type_preferred} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl shadow-lg p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <ShieldIcon className="w-5 h-5 text-lime-600" />
            <h3 className="font-semibold text-gray-900">Tolerances</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ToleranceItem label="Drought" value={crop.tolerances.drought_tolerance} />
            <ToleranceItem label="Flood" value={crop.tolerances.flood_tolerance} />
            <ToleranceItem label="Salinity" value={crop.tolerances.salinity_tolerance} />
            <ToleranceItem label="Frost" value={crop.tolerances.frost_tolerance} />
            <ToleranceItem label="Shade" value={crop.tolerances.shade_tolerance} />
            <ToleranceItem label="Pest/Disease" value={crop.tolerances.pest_disease_resistance} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <UsersIcon className="w-5 h-5 text-lime-600" />
            <h3 className="font-semibold text-gray-900">Management</h3>
          </div>
          <div className="space-y-3">
            <InfoRow label="Intensity" value={crop.management.management_intensity} />
            <InfoRow
              label="Labor Required"
              value={`${crop.management.labor_hours_per_ha_per_week} hrs/ha/week`}
            />
            <div className="flex gap-2 flex-wrap">
              {crop.management.organic_suitable && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Organic Suitable
                </span>
              )}
              {crop.management.mechanization_possible && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Mechanizable
                </span>
              )}
              {crop.management.requires_irrigation && (
                <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-medium rounded-full">
                  Needs Irrigation
                </span>
              )}
              {crop.management.requires_trellising && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                  Needs Trellising
                </span>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl shadow-lg p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <DollarSignIcon className="w-5 h-5 text-lime-600" />
            <h3 className="font-semibold text-gray-900">Economics</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 p-3 rounded-xl">
                <div className="text-xs text-red-600 mb-1">Total Cost</div>
                <div className="text-lg font-bold text-red-700">
                  {formatCurrency(crop.economics.estimated_cost_php)}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-xl">
                <div className="text-xs text-green-600 mb-1">Revenue</div>
                <div className="text-lg font-bold text-green-700">
                  {formatCurrency(crop.economics.estimated_revenue_php)}
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Profit Margin</div>
                  <div className="text-lg font-bold text-green-700">
                    {crop.economics.profit_margin_pct.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">ROI</div>
                  <div className="text-lg font-bold text-green-700">
                    {crop.economics.roi_pct.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Break Even</div>
                  <div className="text-lg font-bold text-green-700">
                    {crop.economics.break_even_days}d
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Cost Breakdown</div>
              <div className="space-y-2">
                <CostItem label="Seeds" amount={crop.economics.cost_breakdown.seeds_php} />
                <CostItem label="Fertilizer" amount={crop.economics.cost_breakdown.fertilizer_php} />
                <CostItem label="Pesticides" amount={crop.economics.cost_breakdown.pesticides_php} />
                <CostItem label="Labor" amount={crop.economics.cost_breakdown.labor_php} />
                <CostItem label="Irrigation" amount={crop.economics.cost_breakdown.irrigation_php} />
                <CostItem label="Others" amount={crop.economics.cost_breakdown.others_php} />
              </div>
            </div>

            <InfoRow
              label="Expected Yield"
              value={`${crop.economics.estimated_yield_kg_per_ha.toLocaleString()} kg/ha`}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUpIcon className="w-5 h-5 text-lime-600" />
            <h3 className="font-semibold text-gray-900">Market Strategy</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-xl">
                <div className="text-xs text-blue-600 mb-1">Current Price</div>
                <div className="text-sm font-bold text-blue-700">
                  {formatCurrency(crop.market_strategy.current_market_price_php_per_kg)}/kg
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-xl">
                <div className="text-xs text-green-600 mb-1">Projected Price</div>
                <div className="text-sm font-bold text-green-700">
                  {formatCurrency(crop.market_strategy.projected_harvest_price_php_per_kg)}/kg
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Demand" value={crop.market_strategy.demand_level} />
              <InfoRow label="Volatility" value={crop.market_strategy.price_volatility} />
            </div>

            {crop.market_strategy.export_potential && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-xl">
                <div className="text-sm font-medium text-purple-700">Export Potential</div>
              </div>
            )}

            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Best Selling Locations</div>
              <div className="flex flex-wrap gap-2">
                {crop.market_strategy.best_selling_locations.map((location, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-lime-100 text-lime-700 text-xs font-medium rounded-full"
                  >
                    {location}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Buyer Types</div>
              <div className="flex flex-wrap gap-2">
                {crop.market_strategy.buyer_types.map((buyer, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                  >
                    {buyer}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white rounded-2xl shadow-lg p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-5 h-5 text-lime-600" />
            <h3 className="font-semibold text-gray-900">Planting Schedule</h3>
          </div>
          <div className="space-y-3">
            <InfoRow label="Planting Date" value={crop.planting_schedule.recommended_planting_date} />
            <InfoRow label="Harvest Date" value={crop.planting_schedule.expected_harvest_date} />
            {crop.planting_schedule.succession_planting_possible && (
              <div className="bg-green-50 p-3 rounded-xl">
                <div className="text-sm font-medium text-green-700">Succession Planting Possible</div>
              </div>
            )}
            {crop.planting_schedule.intercropping_compatible_with.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Compatible with</div>
                <div className="flex flex-wrap gap-2">
                  {crop.planting_schedule.intercropping_compatible_with.map((crop, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-lime-100 text-lime-700 text-xs font-medium rounded-full"
                    >
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangleIcon className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Risk Assessment</h3>
          </div>
          <div className="space-y-4">
            {crop.risk_assessment.weather_risks.length > 0 && (
              <RiskSection title="Weather Risks" items={crop.risk_assessment.weather_risks} color="blue" />
            )}
            {crop.risk_assessment.pest_disease_risks.length > 0 && (
              <RiskSection
                title="Pest & Disease Risks"
                items={crop.risk_assessment.pest_disease_risks}
                color="red"
              />
            )}
            {crop.risk_assessment.market_risks.length > 0 && (
              <RiskSection title="Market Risks" items={crop.risk_assessment.market_risks} color="yellow" />
            )}
            {crop.risk_assessment.mitigation_strategies.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Mitigation Strategies</div>
                <div className="space-y-2">
                  {crop.risk_assessment.mitigation_strategies.map((strategy, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-green-50 p-3 rounded-xl">
                      <ShieldIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{strategy}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
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

function ScoreItem({ label, value }: { label: string; value: number }) {
  const percentage = Math.round(value * 100);
  const getColor = (val: number) => {
    if (val >= 0.8) return 'bg-green-500';
    if (val >= 0.6) return 'bg-lime-500';
    if (val >= 0.4) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="bg-gray-50 p-3 rounded-xl">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-sm font-bold text-gray-900">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full ${getColor(value)}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function ToleranceItem({ label, value }: { label: string; value: string }) {
  const getColor = (val: string) => {
    const lower = val.toLowerCase();
    if (lower === 'high') return 'bg-green-100 text-green-700';
    if (lower === 'moderate') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="bg-gray-50 p-3 rounded-xl">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getColor(value)}`}>
        {value}
      </span>
    </div>
  );
}

function CostItem({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">
        {new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
          minimumFractionDigits: 0,
        }).format(amount)}
      </span>
    </div>
  );
}

function RiskSection({ title, items, color }: { title: string; items: string[]; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  };

  return (
    <div>
      <div className="text-sm font-medium text-gray-700 mb-2">{title}</div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className={`p-3 rounded-xl border ${colorClasses[color as keyof typeof colorClasses]}`}>
            <span className="text-sm">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

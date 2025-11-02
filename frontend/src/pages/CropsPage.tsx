import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, SproutIcon } from 'lucide-react';
import { FarmerForm } from '../components/FarmerForm';
import { CropCard } from '../components/CropCard';
import { API_BASE_URL } from '../config';

interface CropRecommendation {
  crop: string;
  searchable_name?: string;
  image_url?: string;
  scientific_name: string;
  category: string;
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
  growth_requirements: any;
  tolerances: any;
  management: any;
  economics: any;
  market_strategy: any;
  planting_schedule: any;
  risk_assessment: any;
  reasoning: string;
}

interface FarmerFormData {
  crop_category: string;
  budget_php: number;
  waiting_tolerance_days: number;
  land_size_ha: number;
  manpower: number;
}

export function CropsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<CropRecommendation[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkExistingRecommendations();
  }, [id]);

  const checkExistingRecommendations = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/recommendations/${id}/latest`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations);
        } else {
          setRecommendations(null);
        }
      } else if (response.status === 404) {
        setRecommendations(null);
      } else {
        throw new Error('Failed to check recommendations');
      }
    } catch (err) {
      console.error('Error checking recommendations:', err);
      setRecommendations(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (formData: FarmerFormData) => {
    if (!id) return;

    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/recommendations/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sensor_id: id,
          farmer: formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCropClick = (index: number) => {
    navigate(`/greenhouse/${id}/crops/${index}`);
  };

  const handleBack = () => {
    navigate(`/greenhouse/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-lime-50 to-yellow-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-lime-50 to-yellow-50 pb-32">
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
            <h1 className="text-2xl font-bold text-gray-900">Crop Recommendations</h1>
            <p className="text-sm text-gray-500">
              {recommendations ? 'Select a crop to view details' : 'Tell us about your farm'}
            </p>
          </div>
          <div className="p-3 bg-lime-100 rounded-xl">
            <SproutIcon className="w-6 h-6 text-lime-600" />
          </div>
        </div>
      </div>

      <div className="px-5 py-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"
          >
            <p className="text-red-800 text-sm">{error}</p>
          </motion.div>
        )}

        {!recommendations ? (
          <FarmerForm onSubmit={handleFormSubmit} isLoading={isGenerating} />
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <p className="text-sm text-gray-600">
                Based on your location and preferences, we recommend these crops:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {recommendations.map((crop, index) => (
                <CropCard
                  key={index}
                  crop={crop.crop}
                  category={crop.category}
                  overallScore={crop.scores.overall_score}
                  imageUrl={crop.image_url}
                  onClick={() => handleCropClick(index)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

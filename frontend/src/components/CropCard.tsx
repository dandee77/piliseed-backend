import { motion } from 'framer-motion';
import { SproutIcon, CheckCircleIcon } from 'lucide-react';

interface CropCardProps {
  crop: string;
  category: string;
  overallScore: number;
  imageUrl?: string;
  planted?: boolean;
  onClick: () => void;
}

export function CropCard({ crop, category, overallScore, imageUrl, planted, onClick }: CropCardProps) {
  const scorePercentage = Math.round(overallScore * 100);
  
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

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer"
    >
      <div className="relative h-40 bg-green-50">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={crop}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <SproutIcon className="w-16 h-16 text-green-300" />
          </div>
        )}
        
        {planted && (
          <div className="absolute top-3 left-3 bg-green-600 p-2 rounded-full shadow-lg">
            <CheckCircleIcon className="w-5 h-5 text-white" />
          </div>
        )}
        
        <div className={`absolute top-3 right-3 ${getScoreBgColor(overallScore)} px-3 py-1.5 rounded-full`}>
          <span className={`text-sm font-bold ${getScoreColor(overallScore)}`}>
            {scorePercentage}%
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-1">{crop}</h3>
        <p className="text-sm text-gray-500">{category}</p>
      </div>
    </motion.div>
  );
}

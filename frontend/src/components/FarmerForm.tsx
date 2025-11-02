import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserIcon, DollarSignIcon, ClockIcon, MapIcon, UsersIcon, SproutIcon } from 'lucide-react';

interface FarmerFormData {
  crop_category: string;
  budget_php: number;
  waiting_tolerance_days: number;
  land_size_ha: number;
  manpower: number;
}

interface FarmerFormProps {
  onSubmit: (data: FarmerFormData) => void;
  isLoading: boolean;
}

const CROP_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Cereals',
  'Legumes',
  'Cash Crops',
  'Fodder',
  'Herbs',
  'Ornamentals'
];

export function FarmerForm({ onSubmit, isLoading }: FarmerFormProps) {
  const [formData, setFormData] = useState<FarmerFormData>({
    crop_category: 'Vegetables',
    budget_php: 50000,
    waiting_tolerance_days: 90,
    land_size_ha: 1.0,
    manpower: 3
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6 space-y-6"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-lime-100 rounded-xl">
          <UserIcon className="w-6 h-6 text-lime-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Farmer Profile</h2>
          <p className="text-sm text-gray-500">Fill in your farming details</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <SproutIcon className="w-4 h-4 text-green-600" />
            Crop Category
          </label>
          <select
            value={formData.crop_category}
            onChange={(e) => setFormData({ ...formData, crop_category: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            required
          >
            {CROP_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <DollarSignIcon className="w-4 h-4 text-green-600" />
            Budget (PHP)
          </label>
          <input
            type="number"
            value={formData.budget_php}
            onChange={(e) => setFormData({ ...formData, budget_php: Number(e.target.value) })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            min="1000"
            step="1000"
            required
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <ClockIcon className="w-4 h-4 text-green-600" />
            Waiting Tolerance (Days)
          </label>
          <input
            type="number"
            value={formData.waiting_tolerance_days}
            onChange={(e) => setFormData({ ...formData, waiting_tolerance_days: Number(e.target.value) })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            min="30"
            max="365"
            required
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <MapIcon className="w-4 h-4 text-green-600" />
            Land Size (Hectares)
          </label>
          <input
            type="number"
            value={formData.land_size_ha}
            onChange={(e) => setFormData({ ...formData, land_size_ha: Number(e.target.value) })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            min="0.1"
            step="0.1"
            required
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <UsersIcon className="w-4 h-4 text-green-600" />
            Available Manpower
          </label>
          <input
            type="number"
            value={formData.manpower}
            onChange={(e) => setFormData({ ...formData, manpower: Number(e.target.value) })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            min="1"
            required
          />
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        className="w-full bg-green-600 text-white font-semibold py-4 rounded-xl shadow-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
            Generating Recommendations...
          </span>
        ) : (
          'Generate Crop Recommendations'
        )}
      </motion.button>
    </motion.form>
  );
}

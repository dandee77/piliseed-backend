import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, ClockIcon, SproutIcon, CheckCircleIcon, MapPinIcon } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useUser } from '../contexts/UserContext';

interface HistorySession {
  id: string;
  timestamp: string;
  sensor_id: string;
  sensor_name: string;
  location: string;
  total_crops: number;
  planted_count: number;
  farmer_input: {
    crop_category: string;
    budget_php: number;
    waiting_tolerance_days: number;
    land_size_ha: number;
    manpower: number;
  };
}

export function HistoryPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/recommendations/history/all?user_id=${user.user_id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setHistory(data.history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleSessionClick = (sessionId: string) => {
    navigate(`/history/${sessionId}`);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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
            <h1 className="text-2xl font-bold text-gray-900">History</h1>
            <p className="text-sm text-gray-500">
              {history.length} {history.length === 1 ? 'session' : 'sessions'} found
            </p>
          </div>
          <div className="p-3 bg-lime-100 rounded-xl">
            <ClockIcon className="w-6 h-6 text-lime-600" />
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4"
          >
            <p className="text-red-800 text-sm">{error}</p>
          </motion.div>
        )}

        {history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 text-center"
          >
            <ClockIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No History Yet</h3>
            <p className="text-sm text-gray-600">
              Generate your first crop recommendations to see them here.
            </p>
          </motion.div>
        ) : (
          history.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSessionClick(session.id)}
              className="bg-white rounded-2xl shadow-lg p-5 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-lime-100 rounded-xl">
                    <SproutIcon className="w-6 h-6 text-lime-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{session.sensor_name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPinIcon className="w-3 h-3" />
                      <span>{session.location}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(session.timestamp)}</p>
                  </div>
                </div>
                {session.planted_count > 0 && (
                  <div className="flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full">
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">{session.planted_count}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <div className="text-xs text-gray-600 mb-1">Total Crops</div>
                  <div className="text-lg font-bold text-gray-900">{session.total_crops}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <div className="text-xs text-gray-600 mb-1">Category</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {session.farmer_input.crop_category}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Budget</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(session.farmer_input.budget_php)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Land Size</span>
                  <span className="font-medium text-gray-900">
                    {session.farmer_input.land_size_ha} ha
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Waiting Tolerance</span>
                  <span className="font-medium text-gray-900">
                    {session.farmer_input.waiting_tolerance_days} days
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UserIcon,
  ShieldIcon,
  BellIcon,
  InfoIcon,
  ChevronRightIcon,
  LogOutIcon,
  AlertCircleIcon,
} from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full min-h-screen bg-gray-50"
    >
      <div className="bg-white px-5 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleBack}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
          </motion.button>
          <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
        </div>

        <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-100">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Prototype User</h2>
            <p className="text-sm text-gray-600">Demo Account</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3"
        >
          <AlertCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-900 mb-1">Prototype Notice</h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              This project and account are created for prototyping purposes for the{' '}
              <span className="font-semibold">Live Pitch Competition of DAP - NextGenPh Competition</span>.
              All data and features are for demonstration only.
            </p>
          </div>
        </motion.div>
      </div>

      <div className="px-5 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
            Account
          </h3>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <SettingsItem
              icon={<UserIcon className="w-5 h-5 text-gray-600" />}
              title="Personal Information"
              subtitle="Update your account details"
              onClick={() => {}}
            />
            <SettingsItem
              icon={<ShieldIcon className="w-5 h-5 text-gray-600" />}
              title="Privacy & Security"
              subtitle="Manage your privacy settings"
              onClick={() => {}}
              showBorder
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
            Preferences
          </h3>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <SettingsItem
              icon={<BellIcon className="w-5 h-5 text-gray-600" />}
              title="Notifications"
              subtitle="Configure alert preferences"
              onClick={() => {}}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
            About
          </h3>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <SettingsItem
              icon={<InfoIcon className="w-5 h-5 text-gray-600" />}
              title="About PiliSeed"
              subtitle="Version 1.0.0 (Prototype)"
              onClick={() => {}}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-green-50 rounded-2xl p-6 border border-green-100"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-3">About This Project</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              <span className="font-semibold text-green-700">PiliSeed</span> is an AI-powered smart farming
              assistant designed to help Filipino farmers optimize their crop selection and farming practices.
            </p>
            <p>
              Using real-time sensor data and advanced AI analysis, PiliSeed provides personalized crop
              recommendations tailored to your specific location, resources, and environmental conditions.
            </p>
            <div className="pt-3 border-t border-green-200">
              <p className="text-xs text-gray-600">
                <span className="font-semibold">Competition:</span> DAP - NextGenPh Live Pitch Competition
              </p>
              <p className="text-xs text-gray-600 mt-1">
                <span className="font-semibold">Purpose:</span> Prototype & Demonstration
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center justify-center gap-2 text-red-600 font-semibold hover:bg-red-50 transition-colors"
          >
            <LogOutIcon className="w-5 h-5" />
            Log Out
          </motion.button>
        </motion.div>

        <div className="h-24" />
      </div>
    </motion.div>
  );
}

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  showBorder?: boolean;
}

function SettingsItem({ icon, title, subtitle, onClick, showBorder }: SettingsItemProps) {
  return (
    <motion.button
      whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full p-4 flex items-center gap-4 text-left transition-colors ${
        showBorder ? 'border-t border-gray-100' : ''
      }`}
    >
      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
        <p className="text-xs text-gray-500 truncate">{subtitle}</p>
      </div>
      <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
    </motion.button>
  );
}

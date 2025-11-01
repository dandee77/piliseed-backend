import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HomeIcon, MessageCircleIcon, SettingsIcon, BarChart3Icon, SproutIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
interface ExpandableNavBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isExpanded: boolean;
}
export function ExpandableNavBar({
  activeTab,
  setActiveTab,
  isExpanded
}: ExpandableNavBarProps) {
  const navigate = useNavigate();
  const handleHomeClick = () => {
    setActiveTab('home');
    navigate('/');
  };
  const handleChatClick = () => {
    setActiveTab('chat');
    if (isExpanded) {
      navigate('/');
    }
  };
  const handleSettingsClick = () => {
    setActiveTab('settings');
    if (isExpanded) {
      navigate('/');
    }
  };
  // Calculate position for yellow highlighter based on active tab and expansion state
  const getActivePosition = () => {
    if (!isExpanded) {
      // Collapsed state: home, chat, settings
      // Left padding is 12px, gap between buttons is 4px
      if (activeTab === 'home') return 12;
      if (activeTab === 'chat') return 64; // 12 + 48 + 4
      if (activeTab === 'settings') return 116; // 64 + 48 + 4
    } else {
      // Expanded state: home, data, plant, chat, settings
      if (activeTab === 'home') return 12;
      if (activeTab === 'data') return 64; // 12 + 48 + 4
      if (activeTab === 'plant') return 116; // 64 + 48 + 4
      if (activeTab === 'chat') return 168; // 116 + 48 + 4
      if (activeTab === 'settings') return 220; // 168 + 48 + 4
    }
    return 12;
  };
  return <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-8 px-5 pointer-events-none">
      <motion.div className="bg-gray-900 rounded-full shadow-2xl flex items-center justify-center gap-1 px-3 py-3 relative pointer-events-auto" initial={false} animate={{
      width: isExpanded ? '288px' : '192px'
    }} transition={{
      type: 'spring',
      stiffness: 300,
      damping: 30
    }}>
        {/* Dark background - only visible when expanded (greenhouse detail) */}
        <AnimatePresence>
          {isExpanded && <>
              {/* Darker circle around home icon */}
              <motion.div initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} className="absolute left-3 top-3 w-12 h-12 bg-black/40 rounded-full" />
              {/* Extended darker background covering home, data, and plant */}
              <motion.div className="absolute left-3 top-3 bottom-3 bg-black/20 rounded-full" initial={{
            width: 48
          }} animate={{
            width: 164
          }} exit={{
            width: 48
          }} transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30
          }} />
            </>}
        </AnimatePresence>
        {/* Sliding yellow highlight */}
        <motion.div className="absolute w-12 h-12 bg-lime-400 rounded-full" animate={{
        left: getActivePosition()
      }} transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30
      }} />
        {/* Home Icon - Always visible */}
        <button onClick={handleHomeClick} className="w-12 h-12 rounded-full flex items-center justify-center transition-colors relative z-10">
          <HomeIcon className={`w-6 h-6 ${activeTab === 'home' ? 'text-gray-900' : 'text-white'}`} />
        </button>
        {/* Data Icon - Only visible when expanded */}
        <AnimatePresence>
          {isExpanded && <motion.button initial={{
          opacity: 0,
          x: -10,
          width: 0
        }} animate={{
          opacity: 1,
          x: 0,
          width: 48
        }} exit={{
          opacity: 0,
          x: -10,
          width: 0
        }} transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }} onClick={() => setActiveTab('data')} className="h-12 rounded-full flex items-center justify-center relative z-10">
              <BarChart3Icon className={`w-6 h-6 ${activeTab === 'data' ? 'text-gray-900' : 'text-white'}`} />
            </motion.button>}
        </AnimatePresence>
        {/* Plant Icon - Only visible when expanded */}
        <AnimatePresence>
          {isExpanded && <motion.button initial={{
          opacity: 0,
          x: -10,
          width: 0
        }} animate={{
          opacity: 1,
          x: 0,
          width: 48
        }} exit={{
          opacity: 0,
          x: -10,
          width: 0
        }} transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          delay: 0.05
        }} onClick={() => setActiveTab('plant')} className="h-12 rounded-full flex items-center justify-center relative z-10">
              <SproutIcon className={`w-6 h-6 ${activeTab === 'plant' ? 'text-gray-900' : 'text-white'}`} />
            </motion.button>}
        </AnimatePresence>
        {/* Chat Icon - Always visible */}
        <button onClick={handleChatClick} className="w-12 h-12 rounded-full flex items-center justify-center transition-colors relative z-10">
          <MessageCircleIcon className={`w-6 h-6 ${activeTab === 'chat' ? 'text-gray-900' : 'text-white'}`} />
        </button>
        {/* Settings Icon - Always visible */}
        <button onClick={handleSettingsClick} className="w-12 h-12 rounded-full flex items-center justify-center transition-colors relative z-10">
          <SettingsIcon className={`w-6 h-6 ${activeTab === 'settings' ? 'text-gray-900' : 'text-white'}`} />
        </button>
      </motion.div>
    </div>;
}
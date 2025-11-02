import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { HomePage } from './pages/HomePage';
import { GreenhouseDetail } from './pages/GreenhouseDetail';
import { CropsPage } from './pages/CropsPage';
import { CropDetail } from './pages/CropDetail';
import { HistoryPage } from './pages/HistoryPage';
import { HistoryDetailPage } from './pages/HistoryDetailPage';
import { HistoryCropDetail } from './pages/HistoryCropDetail';
import { ExpandableNavBar } from './components/ExpandableNavBar';
function AnimatedRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const isDetailPage = location.pathname.includes('/greenhouse/');

  useEffect(() => {
    if (location.pathname === '/') {
      setActiveTab('home');
    } else if (location.pathname.includes('/crops')) {
      setActiveTab('plant');
    } else if (location.pathname.includes('/history')) {
      setActiveTab('history');
    } else if (location.pathname.includes('/greenhouse/')) {
      setActiveTab('data');
    }
  }, [location.pathname]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    if (tab === 'plant' && isDetailPage) {
      const match = location.pathname.match(/\/greenhouse\/([^\/]+)/);
      if (match) {
        navigate(`/greenhouse/${match[1]}/crops`);
      }
    } else if (tab === 'history') {
      navigate('/history');
    }
  };

  return <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/greenhouse/:id" element={<GreenhouseDetail />} />
          <Route path="/greenhouse/:id/crops" element={<CropsPage />} />
          <Route path="/greenhouse/:id/crops/:cropIndex" element={<CropDetail />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/:sessionId" element={<HistoryDetailPage />} />
          <Route path="/history/:sessionId/crops/:cropIndex" element={<HistoryCropDetail />} />
        </Routes>
      </AnimatePresence>
      {/* Navigation Bar - Outside page transitions */}
      <ExpandableNavBar activeTab={activeTab} setActiveTab={handleTabChange} isExpanded={isDetailPage} />
    </>;
}
export function App() {
  return <BrowserRouter>
      <div className="w-full min-h-screen bg-gray-50" style={{
      maxWidth: '430px',
      margin: '0 auto'
    }}>
        <AnimatedRoutes />
      </div>
    </BrowserRouter>;
}
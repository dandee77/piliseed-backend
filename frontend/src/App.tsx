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
import { SettingsPage } from './pages/SettingsPage';
import { ChatPage } from './pages/ChatPage';
import { ExpandableNavBar } from './components/ExpandableNavBar';
import { LoginScreen } from './components/LoginScreen';
import { UserProvider, useUser } from './contexts/UserContext';

function AnimatedRoutes() {
  const { user, setUser } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const isDetailPage = location.pathname.includes('/greenhouse/');
  
  // Hide navbar on crop detail pages and settings page
  const shouldHideNavbar = 
    location.pathname.match(/\/greenhouse\/[^\/]+\/crops\/\d+/) ||
    location.pathname.match(/\/history\/[^\/]+\/crops\/\d+/) ||
    location.pathname === '/settings';

  useEffect(() => {
    if (location.pathname === '/') {
      setActiveTab('home');
    } else if (location.pathname === '/chat') {
      setActiveTab('chat');
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
    
    if (tab === 'chat') {
      navigate('/chat');
    } else if (tab === 'data' && isDetailPage) {
      const match = location.pathname.match(/\/greenhouse\/([^\/]+)/);
      if (match) {
        navigate(`/greenhouse/${match[1]}`);
      }
    } else if (tab === 'plant' && isDetailPage) {
      const match = location.pathname.match(/\/greenhouse\/([^\/]+)/);
      if (match) {
        navigate(`/greenhouse/${match[1]}/crops`);
      }
    } else if (tab === 'history') {
      navigate('/history');
    } else if (tab === 'home') {
      navigate('/');
    }
  };
  
  // Show login screen if no user (after all hooks are called)
  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/greenhouse/:id" element={<GreenhouseDetail />} />
          <Route path="/greenhouse/:id/crops" element={<CropsPage />} />
          <Route path="/greenhouse/:id/crops/:cropIndex" element={<CropDetail />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/:sessionId" element={<HistoryDetailPage />} />
          <Route path="/history/:sessionId/crops/:cropIndex" element={<HistoryCropDetail />} />
        </Routes>
      </AnimatePresence>
      {/* Navigation Bar - Hidden on crop detail pages and settings */}
      {!shouldHideNavbar && (
        <ExpandableNavBar activeTab={activeTab} setActiveTab={handleTabChange} isExpanded={isDetailPage} />
      )}
    </>;
}
export function App() {
  return <BrowserRouter>
      <UserProvider>
        <div className="w-full min-h-screen bg-gray-50" style={{
        maxWidth: '430px',
        margin: '0 auto'
      }}>
          <AnimatedRoutes />
        </div>
      </UserProvider>
    </BrowserRouter>;
}
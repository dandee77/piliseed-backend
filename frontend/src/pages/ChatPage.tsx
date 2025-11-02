import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SendIcon, BotIcon, UserIcon, Loader2Icon, SproutIcon, AlertCircleIcon, ArrowRightIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useUser } from '../contexts/UserContext';

interface Sensor {
  sensor_id: string;
  name: string;
  location: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSensors, setLoadingSensors] = useState(true);
  const [errorState, setErrorState] = useState<{type: string; message: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSensors();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSensors = async () => {
    try {
      setLoadingSensors(true);
      const response = await fetch(`${API_BASE_URL}/sensors/locations`);
      if (!response.ok) {
        throw new Error('Failed to fetch sensors');
      }
      const data = await response.json();
      setSensors(data);
      if (data.length > 0) {
        setSelectedSensor(data[0].sensor_id);
      }
    } catch (err) {
      console.error('Error fetching sensors:', err);
    } finally {
      setLoadingSensors(false);
    }
  };

  const handleSensorChange = (sensorId: string) => {
    setSelectedSensor(sensorId);
    setMessages([]);
    setErrorState(null);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedSensor || !user) return;

    const userMessageId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setErrorState(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/recommendations/${selectedSensor}/chat?user_id=${user.user_id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: userMessage.content })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.detail || 'Failed to get response');
      }
      
      if (data.error) {
        setErrorState({ type: data.error, message: data.message });
        setMessages(prev => prev.slice(0, -1));
      } else {
        const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessageId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const errorMessage: Message = {
        id: errorMessageId,
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedSensorData = sensors.find(s => s.sensor_id === selectedSensor);

  if (loadingSensors) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sensors...</p>
        </div>
      </div>
    );
  }

  if (sensors.length === 0) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <AlertCircleIcon className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Sensors Available</h2>
          <p className="text-gray-600 mb-6">
            You need to connect to a sensor location to access the chatbot feature.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
          >
            Go to Home
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 flex flex-col pb-28">
      <div className="bg-green-600 px-5 pt-12 pb-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <BotIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">PiliSeed AI</h1>
            <p className="text-white/90 text-sm">Your Farming Assistant</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-white/90 text-sm font-medium">Select Sensor Location</label>
          <select
            value={selectedSensor}
            onChange={(e) => handleSensorChange(e.target.value)}
            className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white font-medium focus:outline-none focus:border-white/60 transition-colors"
          >
            {sensors.map((sensor) => (
              <option key={sensor.sensor_id} value={sensor.sensor_id} className="text-gray-900">
                {sensor.name} - {sensor.location}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 pb-40">
        <AnimatePresence>
          {errorState && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <AlertCircleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Action Required</h4>
                  <p className="text-sm text-gray-700 mb-3">{errorState.message}</p>
                  {errorState.type === 'no_context' && (
                    <button
                      onClick={() => navigate(`/greenhouse/${selectedSensor}`)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Generate Context Analysis
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  )}
                  {(errorState.type === 'no_recommendations' || errorState.type === 'no_data') && (
                    <button
                      onClick={() => navigate(`/greenhouse/${selectedSensor}/crops`)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Generate Recommendations
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {messages.length === 0 && !isLoading && !errorState && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="w-20 h-20 bg-green-600 rounded-3xl flex items-center justify-center mb-4">
                <SproutIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Start a Conversation</h3>
              <p className="text-gray-600 text-center max-w-sm px-4">
                Ask me anything about your crops, recommendations, or farming conditions for {selectedSensorData?.name}
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 w-full max-w-md px-4">
                <button
                  onClick={() => setInputMessage("What crops do you recommend for my farm?")}
                  className="px-4 py-3 bg-white rounded-xl text-left text-sm text-gray-700 hover:bg-green-50 transition-colors border border-green-100"
                >
                  What crops do you recommend for my farm?
                </button>
                <button
                  onClick={() => setInputMessage("What are the current weather conditions?")}
                  className="px-4 py-3 bg-white rounded-xl text-left text-sm text-gray-700 hover:bg-green-50 transition-colors border border-green-100"
                >
                  What are the current weather conditions?
                </button>
                <button
                  onClick={() => setInputMessage("What is the best time to plant?")}
                  className="px-4 py-3 bg-white rounded-xl text-left text-sm text-gray-700 hover:bg-green-50 transition-colors border border-green-100"
                >
                  What is the best time to plant?
                </button>
              </div>
            </motion.div>
          )}

          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-green-600' 
                  : 'bg-white border-2 border-green-100'
              }`}>
                {message.role === 'user' ? (
                  <UserIcon className="w-5 h-5 text-white" />
                ) : (
                  <BotIcon className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                <div className={`inline-block px-4 py-3 rounded-2xl max-w-[85%] ${
                  message.role === 'user'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-900 border border-green-100'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white border-2 border-green-100">
                <BotIcon className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="inline-block px-4 py-3 rounded-2xl bg-white border border-green-100">
                  <div className="flex items-center gap-2">
                    <Loader2Icon className="w-4 h-4 text-green-600 animate-spin" />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-green-100 pb-28 pt-4 px-5" style={{ maxWidth: '430px', margin: '0 auto' }}>
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your crops..."
              rows={1}
              className="w-full px-4 py-3 bg-green-50 border-2 border-green-100 rounded-xl focus:outline-none focus:border-green-600 resize-none text-gray-900 placeholder-gray-500 scrollbar-hide"
              style={{ maxHeight: '120px', minHeight: '48px' }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading || !selectedSensor}
            className="w-12 h-12 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <SendIcon className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

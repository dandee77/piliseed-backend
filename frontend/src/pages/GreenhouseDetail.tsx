import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, MoreVerticalIcon } from 'lucide-react';
import { TemperatureBar } from '../components/TemperatureBar';
import { MetricCard } from '../components/MetricCard';
import { ControlButton } from '../components/ControlButton';
export function GreenhouseDetail() {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const greenhouseData = {
    1: {
      name: 'Tomato Greenhouse',
      image: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=800&q=80',
      temperature: 70,
      humidity: 65,
      moisture: 45,
      nutrients: 78,
      light: 850,
      ph: 6.5
    },
    2: {
      name: 'Lettuce Greenhouse',
      image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=800&q=80',
      temperature: 68,
      humidity: 72,
      moisture: 52,
      nutrients: 82,
      light: 920,
      ph: 6.2
    }
  };
  const greenhouse = greenhouseData[id as keyof typeof greenhouseData];
  return <motion.div initial={{
    opacity: 0,
    x: 20
  }} animate={{
    opacity: 1,
    x: 0
  }} exit={{
    opacity: 0,
    x: -20
  }} transition={{
    duration: 0.3
  }} className="w-full min-h-screen bg-gray-50 flex flex-col pb-32">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/')} className="p-2 -ml-2">
            <ArrowLeftIcon className="w-6 h-6 text-gray-800" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {greenhouse.name}
          </h2>
          <button className="p-2">
            <MoreVerticalIcon className="w-6 h-6 text-gray-800" />
          </button>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 px-5 space-y-4">
        {/* Greenhouse Image */}
        <div className="rounded-3xl overflow-hidden h-56">
          <img src={greenhouse.image} alt={greenhouse.name} className="w-full h-full object-cover" />
        </div>
        {/* Temperature Bar */}
        <TemperatureBar temperature={greenhouse.temperature} />
        {/* Control Buttons */}
        <div className="flex items-center justify-between gap-3 py-2">
          <ControlButton icon="💧" label="Sprinkler" />
          <ControlButton icon="💡" label="UV Lights" />
          <ControlButton icon="🌫️" label="CO2 Controller" />
        </div>
        {/* Data Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard title="Moisture" value={greenhouse.moisture} unit="%" color="blue" />
          <MetricCard title="Nutrients" value={greenhouse.nutrients} unit="%" color="green" />
          <MetricCard title="Humidity" value={greenhouse.humidity} unit="%" color="cyan" />
          <MetricCard title="Light" value={greenhouse.light} unit="lux" color="yellow" />
          <MetricCard title="pH Level" value={greenhouse.ph} unit="" color="purple" />
        </div>
      </div>
    </motion.div>;
}
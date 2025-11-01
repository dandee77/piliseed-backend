import React from 'react';
import { motion } from 'framer-motion';
import { GreenhouseCard } from '../components/GreenhouseCard';
import { SearchIcon, BellIcon } from 'lucide-react';
export function HomePage() {
  const greenhouses = [{
    id: 1,
    name: 'Tomato Greenhouse',
    image: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=800&q=80',
    temperature: 75,
    humidity: 65,
    soilMoisture: 45
  }, {
    id: 2,
    name: 'Lettuce Greenhouse',
    image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=800&q=80',
    temperature: 68,
    humidity: 72,
    soilMoisture: 52
  }];
  return <motion.div initial={{
    opacity: 0,
    x: -20
  }} animate={{
    opacity: 1,
    x: 0
  }} exit={{
    opacity: 0,
    x: 20
  }} transition={{
    duration: 0.3
  }} className="w-full min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-6">
          <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80" alt="Profile" className="w-10 h-10 rounded-full object-cover" />
          <div className="flex items-center gap-4">
            <button className="p-2">
              <SearchIcon className="w-5 h-5 text-gray-800" />
            </button>
            <button className="p-2">
              <BellIcon className="w-5 h-5 text-gray-800" />
            </button>
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          Your Greenhouses
        </h1>
        {/* Filter Buttons */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 whitespace-nowrap flex items-center gap-1">
            Crops
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 whitespace-nowrap">
            Water Control
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 whitespace-nowrap">
            Temperature
          </button>
        </div>
      </div>
      {/* Greenhouse Cards */}
      <div className="flex-1 px-5 py-4 space-y-4 pb-32">
        {greenhouses.map(greenhouse => <GreenhouseCard key={greenhouse.id} {...greenhouse} />)}
      </div>
    </motion.div>;
}
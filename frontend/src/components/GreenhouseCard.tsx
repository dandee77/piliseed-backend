import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, ThermometerIcon, DropletIcon, SproutIcon } from 'lucide-react';
interface GreenhouseCardProps {
  id: number;
  name: string;
  image: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
}
export function GreenhouseCard({
  id,
  name,
  image,
  temperature,
  humidity,
  soilMoisture
}: GreenhouseCardProps) {
  const navigate = useNavigate();
  return <div onClick={() => navigate(`/greenhouse/${id}`)} className="relative rounded-3xl overflow-hidden h-64 shadow-lg cursor-pointer">
      {/* Background Image */}
      <img src={image} alt={name} className="absolute inset-0 w-full h-full object-cover" />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60" />
      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-5">
        {/* Title and Arrow */}
        <div className="flex items-center justify-between">
          <h3 className="text-white text-lg font-semibold">{name}</h3>
          <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
            <ArrowRightIcon className="w-5 h-5 text-gray-800" />
          </button>
        </div>
        {/* Metrics */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-lime-400 rounded-full flex items-center justify-center mb-2">
              <ThermometerIcon className="w-6 h-6 text-gray-900" />
            </div>
            <div className="text-white text-lg font-bold">{temperature}°F</div>
            <div className="text-white/80 text-xs">Temperature</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-lime-400 rounded-full flex items-center justify-center mb-2">
              <DropletIcon className="w-6 h-6 text-gray-900" />
            </div>
            <div className="text-white text-lg font-bold">{humidity}%</div>
            <div className="text-white/80 text-xs">Humidity</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-lime-400 rounded-full flex items-center justify-center mb-2">
              <SproutIcon className="w-6 h-6 text-gray-900" />
            </div>
            <div className="text-white text-lg font-bold">{soilMoisture}%</div>
            <div className="text-white/80 text-xs">Soil Moisture</div>
          </div>
        </div>
      </div>
    </div>;
}
import React from 'react';
interface TemperatureBarProps {
  temperature: number;
}
export function TemperatureBar({
  temperature
}: TemperatureBarProps) {
  const minTemp = 32;
  const maxTemp = 100;
  const percentage = (temperature - minTemp) / (maxTemp - minTemp) * 100;
  return <div className="bg-gray-900 rounded-3xl p-5">
      <div className="text-white text-sm font-medium mb-3">Temperature</div>
      {/* Temperature Value */}
      <div className="text-white text-5xl font-bold text-center mb-4">
        {temperature}°
      </div>
      {/* Temperature Bar */}
      <div className="relative">
        {/* Gradient Bar */}
        <div className="h-2 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-green-400 via-yellow-400 to-red-500">
          {/* White Indicator */}
          <div className="absolute top-0 h-2 w-1 bg-white rounded-full" style={{
          left: `${percentage}%`,
          transform: 'translateX(-50%)'
        }} />
        </div>
        {/* Time Labels */}
        <div className="flex justify-between mt-2">
          <span className="text-white/60 text-xs">08:25AM</span>
          <span className="text-white/60 text-xs">08:25AM</span>
        </div>
      </div>
    </div>;
}
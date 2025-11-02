import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  color: 'blue' | 'green' | 'cyan' | 'yellow' | 'purple';
}
export function MetricCard({
  title,
  value,
  unit,
  color
}: MetricCardProps) {
  const colorMap = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    cyan: 'bg-cyan-500',
    yellow: 'bg-yellow-400',
    purple: 'bg-purple-500'
  };
  const chartColorMap = {
    blue: '#3b82f6',
    green: '#22c55e',
    cyan: '#06b6d4',
    yellow: '#facc15',
    purple: '#a855f7'
  };
  const data = [{
    value: value - 10
  }, {
    value: value - 5
  }, {
    value: value - 8
  }, {
    value: value - 3
  }, {
    value: value
  }, {
    value: value + 2
  }, {
    value: value - 1
  }];
  return <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="text-gray-600 text-sm font-medium mb-2">{title}</div>
      {/* Value */}
      <div className="text-3xl font-bold text-gray-900 mb-3">
        {value}
        <span className="text-lg text-gray-500 ml-1">{unit}</span>
      </div>
      {/* Mini Chart */}
      <div className="h-12 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey="value" stroke={chartColorMap[color]} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Progress Bar */}
      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${colorMap[color]} rounded-full`} style={{
        width: `${Math.min(value, 100)}%`
      }} />
      </div>
    </div>;
}
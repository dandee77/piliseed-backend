import React from 'react';
interface ControlButtonProps {
  icon: string;
  label: string;
}
export function ControlButton({
  icon,
  label
}: ControlButtonProps) {
  return <button className="flex flex-col items-center gap-2 flex-1">
      <div className="w-16 h-16 bg-lime-400 rounded-full flex items-center justify-center text-2xl">
        {icon}
      </div>
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </button>;
}
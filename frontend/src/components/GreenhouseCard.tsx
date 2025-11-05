import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, MapPinIcon } from 'lucide-react';

interface GreenhouseCardProps {
  id: string;
  name: string;
  location: string;
  description: string;
  image: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
}

export function GreenhouseCard({
  id,
  name,
  location,
  description,
  image
}: GreenhouseCardProps) {
  const navigate = useNavigate();
  
  return <div onClick={() => navigate(`/greenhouse/${id}`)} className="relative rounded-3xl overflow-hidden h-64 shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
      <img src={image} alt={name} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />
      <div className="relative h-full flex flex-col justify-between p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-white text-xl font-bold mb-2">{name}</h3>
            <div className="flex items-center gap-1 text-white/90 text-sm mb-3">
              <MapPinIcon className="w-4 h-4" />
              <span>{location}</span>
            </div>
          </div>
          <button className="w-10 h-10 bg-lime-400 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-lime-300 transition-colors">
            <ArrowRightIcon className="w-5 h-5 text-gray-900" />
          </button>
        </div>
        <div>
          <p className="text-white/90 text-sm leading-relaxed line-clamp-3">
            {description}
          </p>
        </div>
      </div>
    </div>;
}
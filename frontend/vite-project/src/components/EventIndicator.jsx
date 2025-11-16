/**
 * EventIndicator.jsx
 * Componente para mostrar eventos de progreso del WebSocket
 */

import { Loader2, Brain, FileSearch, Cog, Database } from 'lucide-react';

function EventIndicator({ event }) {
  if (!event) return null;

  // Mapear tipos de eventos a iconos y colores
  const eventConfig = {
    analyzing: {
      icon: Brain,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      label: 'Analizando'
    },
    planning: {
      icon: FileSearch,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      label: 'Planificando'
    },
    executing: {
      icon: Cog,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50',
      label: 'Ejecutando'
    },
    processing: {
      icon: Brain,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      label: 'Procesando'
    },
    saving: {
      icon: Database,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      label: 'Guardando'
    }
  };

  const config = eventConfig[event.type] || {
    icon: Loader2,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    label: 'Procesando'
  };

  const Icon = config.icon;

  return (
    <div className="flex justify-start animate-fade-in">
      <div className={`${config.bgColor} rounded-2xl px-4 py-3 max-w-[70%]`}>
        <div className="flex items-center gap-3">
          {/* Icono animado */}
          <Icon 
            className={`${config.color} animate-pulse`} 
            size={20} 
          />
          
          {/* Mensaje */}
          <div className="flex flex-col gap-1">
            <p className={`text-sm font-medium ${config.color}`}>
              {config.label}
            </p>
            <p className="text-xs text-gray-600">
              {event.message}
            </p>
            
            {/* Mostrar progreso si es "executing" */}
            {event.type === 'executing' && event.step && event.total && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-cyan-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(event.step / event.total) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {event.step}/{event.total}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventIndicator;
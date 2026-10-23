import React from 'react';
import { Star } from 'lucide-react';

const Estrellas = ({ calificacion = 0, totalResenas = 0, mostrarTexto = true, size = 16 }) => {
  const promedio = Number(calificacion) || 0;
  const redondeado = Math.round(promedio);

  return (
    <div className="inline-flex items-center gap-1.5" aria-label={`Calificación: ${promedio.toFixed(1)} de 5 estrellas`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((estrella) => (
          <Star
            key={estrella}
            size={size}
            className={
              estrella <= redondeado
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300 fill-gray-100'
            }
          />
        ))}
      </div>
      {mostrarTexto && (
        <span className="text-xs font-semibold text-gray-700">
          {promedio > 0 ? promedio.toFixed(1) : 'Nuevo'}{' '}
          <span className="text-gray-400 font-normal">
            ({totalResenas} {totalResenas === 1 ? 'reseña' : 'reseñas'})
          </span>
        </span>
      )}
    </div>
  );
};

export default Estrellas;
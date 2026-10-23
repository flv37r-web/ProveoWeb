import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, Wrench, ShieldAlert,
  Trash2, Edit3, CheckCircle2, ExternalLink
} from 'lucide-react';
import api from '../services/api';

const imageUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${new URL(api.defaults.baseURL).origin}${path}`;
};

const MiCuenta = () => {
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    api.get('/auth/mi-cuenta')
      .then(({ data }) => setDatos(data))
      .catch((err) => {
        setError(err.response?.data?.error || 'No se pudo cargar la información de tu perfil.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleEliminarCuenta = async () => {
    setBorrando(true);
    try {
      await api.delete('/auth/mi-cuenta');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/register');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al intentar eliminar la cuenta.');
      setBorrando(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto p-8 text-center text-gray-500">Cargando tu perfil...</div>;
  }

  if (error || !datos?.usuario) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
        <p className="text-red-700 font-medium mb-4">{error || 'Sesión no disponible'}</p>
        <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Iniciar sesión nuevamente
        </Link>
      </div>
    );
  }

  const { usuario, perfil_proveedor: p } = datos;
  const esProveedor = usuario.rol === 'proveedor';

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      {/* Contenedor Maestro con Flexbox vertical para asegurar que nada quede oculto */}
      <div className="max-w-4xl mx-auto flex flex-col gap-6">

        {/* TARJETA PRINCIPAL DE IDENTIDAD */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
            <div className="flex items-center gap-4">
              {esProveedor && p?.foto_perfil_url ? (
                <img
                  src={imageUrl(p.foto_perfil_url)}
                  alt={usuario.nombre}
                  className="w-20 h-20 rounded-full object-cover border-2 border-blue-600"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
                  {usuario.nombre.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase px-3 py-1 rounded-full ${
                  esProveedor ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {esProveedor ? '🛠️ Cuenta de Proveedor' : '👤 Cuenta de Cliente'}
                </span>
                <h1 className="text-2xl font-extrabold text-gray-900 mt-1">{usuario.nombre}</h1>
                <p className="text-sm text-gray-500">{usuario.email}</p>
              </div>
            </div>

            {esProveedor && (
              <Link
                to="/perfil"
                className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition"
              >
                <Edit3 className="w-4 h-4" /> Editar formulario de perfil
              </Link>
            )}
          </div>

          {/* DATOS GENERALES DEL USUARIO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-sm">
            <div className="bg-gray-50 p-4 rounded-xl border">
              <span className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                <Mail className="w-3.5 h-3.5" /> Correo electrónico
              </span>
              <span className="font-semibold text-gray-800 break-all">{usuario.email}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border">
              <span className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                <Phone className="w-3.5 h-3.5" /> Teléfono registrado
              </span>
              <span className="font-semibold text-gray-800">{usuario.telefono || 'No especificado'}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border">
              <span className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Estado de cuenta
              </span>
              <span className="font-semibold text-green-700 capitalize">{usuario.estatus || 'Activo'}</span>
            </div>
          </div>
        </div>

        {/* SECCIÓN EXCLUSIVA SI ES PROVEEDOR: VISTA DE ESCAPARATE */}
        {esProveedor && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-blue-600" /> Información Pública de Servicios
                </h2>
                <p className="text-xs text-gray-500">Así es como los clientes ven tus datos en el catálogo.</p>
              </div>
              {!p?.tipo_servicio && (
                <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-semibold">
                  Perfil incompleto
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold block">Nombre del negocio</span>
                <p className="font-semibold text-gray-900 mt-0.5">{p?.nombre_negocio || 'Sin nombre comercial'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold block">Oficio o servicio principal</span>
                <p className="font-semibold text-blue-700 mt-0.5">{p?.tipo_servicio || 'Aún no especificado'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold block">Ubicación</span>
                <p className="font-semibold text-gray-900 mt-0.5">
                  {p?.colonia ? `Col. ${p.colonia}, CP ${p.codigo_postal || ''}` : 'Sin ubicación registrada'}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold block">Tarifa / Modalidad</span>
                <p className="font-semibold text-gray-900 mt-0.5">
                  {p?.solo_cotizacion
                    ? 'Bajo cotización'
                    : p?.costo_aproximado
                    ? `$${Number(p.costo_aproximado).toFixed(2)} MXN`
                    : 'No especificado'}
                </p>
              </div>
              <div className="md:col-span-2">
                <span className="text-xs text-gray-400 uppercase font-semibold block">Estudios o experiencia</span>
                <p className="text-gray-700 mt-0.5">{p?.formacion || 'Sin información registrada.'}</p>
              </div>
              <div className="md:col-span-2">
                <span className="text-xs text-gray-400 uppercase font-semibold block">Descripción de servicios</span>
                <p className="text-gray-700 mt-0.5 whitespace-pre-line">{p?.descripcion || 'Sin descripción.'}</p>
              </div>
            </div>

            {p?.fotos_trabajo?.length > 0 && (
              <div className="pt-2 border-t">
                <span className="text-xs text-gray-400 uppercase font-semibold block mb-3">
                  Galería de trabajos ({p.fotos_trabajo.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {p.fotos_trabajo.map((foto, i) => (
                    <img
                      key={i}
                      src={imageUrl(foto)}
                      alt={`Trabajo ${i + 1}`}
                      className="h-24 w-full object-cover rounded-lg border"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ZONA DE PELIGRO: ELIMINAR PERFIL Y USUARIO */}
        <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-red-700 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Eliminar perfil y cuenta
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Esta acción borrará permanentemente tu usuario ({usuario.rol}) y todos tus datos de la base de datos MySQL.
              </p>
            </div>

            {!confirmarBorrado ? (
              <button
                onClick={() => setConfirmarBorrado(true)}
                className="inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-red-100 transition shrink-0"
              >
                <Trash2 className="w-4 h-4" /> Eliminar mi perfil
              </button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleEliminarCuenta}
                  disabled={borrando}
                  className="bg-red-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-red-700 transition"
                >
                  {borrando ? 'Eliminando...' : 'Sí, borrar definitivamente'}
                </button>
                <button
                  onClick={() => setConfirmarBorrado(false)}
                  className="border border-gray-300 text-gray-700 text-sm font-medium px-3 py-2.5 rounded-xl hover:bg-gray-100"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MiCuenta;
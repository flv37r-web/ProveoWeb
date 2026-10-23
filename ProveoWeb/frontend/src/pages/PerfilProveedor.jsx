import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Phone, Home as HomeIcon, ExternalLink, ArrowLeft,
  Briefcase, MessageSquare, CheckCircle2, Calendar
} from 'lucide-react';
import api from '../services/api';
import Estrellas from '../components/Estrellas';

const imageUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${new URL(api.defaults.baseURL).origin}${path}`;
};

const PerfilProveedor = () => {
  const { id } = useParams();
  const [proveedor, setProveedor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/proveedores/${id}`)
      .then(({ data }) => {
        setProveedor(data.datos);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'No se encontró el perfil del proveedor.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="max-w-5xl mx-auto p-12 text-center text-gray-500">Cargando perfil del especialista...</div>;
  }

  if (error || !proveedor) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-8 bg-white border rounded-2xl text-center shadow-sm">
        <p className="text-red-600 font-semibold mb-4">{error || 'Proveedor no disponible'}</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Volver al directorio
        </Link>
      </div>
    );
  }

  const servicios = proveedor.servicios || [];
  const resenas = proveedor.resenas || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Regresar a resultados de búsqueda
        </Link>

        {/* CABECERA DEL PERFIL PÚBLICO (HU 07) */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <img
                src={imageUrl(proveedor.foto_perfil_url) || '/img/logo_proveo.png'}
                alt={proveedor.nombre}
                className="w-24 h-24 rounded-full object-cover border-2 border-blue-600 bg-gray-100 shrink-0"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                    {proveedor.tipo_servicio}
                  </span>
                  {proveedor.servicio_domicilio && (
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      <HomeIcon className="w-3.5 h-3.5" /> Servicio a domicilio
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                  {proveedor.nombre_negocio || proveedor.nombre}
                </h1>
                <p className="text-sm text-gray-500 mb-2">Especialista titular: {proveedor.nombre}</p>
                <Estrellas
                  calificacion={proveedor.promedio_calificacion}
                  totalResenas={proveedor.total_resenas}
                  size={18}
                />
              </div>
            </div>

            {/* BOTONES DE CONTACTO DIRECTO / SOLICITUD (HU 07) */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto">
              {proveedor.telefono && (
                <a
                  href={`tel:${proveedor.telefono}`}
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-5 py-3 rounded-xl hover:bg-blue-700 transition text-sm"
                >
                  <Phone className="w-4 h-4" /> Contactar / Solicitar ({proveedor.telefono})
                </a>
              )}
              {proveedor.direccion_maps && (
                <a
                  href={proveedor.direccion_maps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 border border-gray-300 text-gray-700 font-medium px-4 py-2.5 rounded-xl hover:bg-gray-50 transition text-xs"
                >
                  <ExternalLink className="w-4 h-4 text-blue-600" /> Ver zona en Google Maps
                </a>
              )}
            </div>
          </div>

          {/* ZONA DE OPERACIÓN Y DESCRIPCIÓN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t text-sm">
            <div className="bg-gray-50 p-4 rounded-xl border">
              <span className="text-xs text-gray-400 uppercase font-semibold block mb-1">Zona de Cobertura</span>
              <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                Col. {proveedor.colonia}, CP {proveedor.codigo_postal}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border">
              <span className="text-xs text-gray-400 uppercase font-semibold block mb-1">Tarifa General</span>
              <span className="font-semibold text-gray-900">
                {proveedor.solo_cotizacion
                  ? 'Bajo cotización según el trabajo'
                  : `Desde $${Number(proveedor.costo_aproximado).toFixed(2)} MXN`}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border">
              <span className="text-xs text-gray-400 uppercase font-semibold block mb-1">Formación / Experiencia</span>
              <span className="font-medium text-gray-800">
                {proveedor.formacion || 'Especialista verificado en Proveo'}
              </span>
            </div>
          </div>

          {proveedor.descripcion && (
            <div className="mt-6">
              <h2 className="text-base font-bold text-gray-900 mb-2">Acerca del proveedor</h2>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {proveedor.descripcion}
              </p>
            </div>
          )}

          {/* GALERÍA DE TRABAJOS REALIZADOS */}
          {proveedor.fotos_trabajo?.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h2 className="text-base font-bold text-gray-900 mb-3">Portafolio de trabajos realizados</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {proveedor.fotos_trabajo.map((foto, index) => (
                  <a key={index} href={imageUrl(foto)} target="_blank" rel="noopener noreferrer">
                    <img
                      src={imageUrl(foto)}
                      alt={`Trabajo ${index + 1}`}
                      className="h-32 w-full object-cover rounded-xl border hover:opacity-90 transition"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* CATÁLOGO DE SERVICIOS OFRECIDOS (HU 07 y HU 08) */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Catálogo de Servicios y Tarifas</h2>
          </div>

          {servicios.length === 0 ? (
            <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border">
              Este proveedor realiza presupuestos directos según las necesidades de tu servicio ({proveedor.tipo_servicio}).
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {servicios.map((srv) => (
                <div
                  key={srv.id}
                  className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between bg-gray-50/60"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900 text-base">{srv.titulo}</h3>
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg shrink-0">
                        {srv.precio_referencia === null
                          ? 'Cotizable'
                          : `$${Number(srv.precio_referencia).toFixed(2)} MXN`}
                      </span>
                    </div>
                    {srv.descripcion && (
                      <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{srv.descripcion}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECCIÓN DE RESEÑAS Y COMENTARIOS PREVIOS (HU 07) */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Reseñas y opiniones de clientes ({resenas.length})
              </h2>
            </div>
            <Estrellas
              calificacion={proveedor.promedio_calificacion}
              totalResenas={proveedor.total_resenas}
            />
          </div>

          {resenas.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border">
              <CheckCircle2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Aún no hay reseñas registradas</p>
              <p className="text-xs text-gray-500 mt-1">
                Las valoraciones aparecerán aquí conforme los clientes finalicen servicios con este proveedor.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {resenas.map((resena) => (
                <article key={resena.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/40">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-bold text-sm text-gray-900">{resena.cliente_nombre}</span>
                      <div className="mt-0.5">
                        <Estrellas calificacion={resena.calificacion} mostrarTexto={false} size={14} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(resena.creado_en).toLocaleDateString('es-MX')}
                    </span>
                  </div>
                  {resena.comentario && (
                    <p className="text-sm text-gray-700 mt-2">{resena.comentario}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PerfilProveedor;
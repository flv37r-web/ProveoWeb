import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapPin, Phone, Star, Home as HomeIcon, Wrench, ExternalLink } from 'lucide-react';
import api from '../services/api';

const categoriasPopulares = [
  'Todos', 'Plomería', 'Electricidad', 'Carpintería', 'Pintura', 'Albañilería', 'Limpieza', 'Jardinería'
];

const imageUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${new URL(api.defaults.baseURL).origin}${path}`;
};

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);

  const catActual = searchParams.get('cat') || '';
  const zonaActual = searchParams.get('zona') || '';

  useEffect(() => {
    setLoading(true);
    api.get('/proveedores/buscar', {
      params: { cat: catActual, zona: zonaActual }
    })
      .then(({ data }) => {
        setProveedores(data.datos || []);
      })
      .catch((err) => {
        console.error('Error al cargar proveedores:', err);
        setProveedores([]);
      })
      .finally(() => setLoading(false));
  }, [catActual, zonaActual]);

  const filtrarCategoria = (categoria) => {
    const params = new URLSearchParams(searchParams);
    if (categoria === 'Todos') {
      params.delete('cat');
    } else {
      params.set('cat', categoria);
    }
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* BANNER PRINCIPAL */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <span className="inline-block bg-blue-600/50 border border-blue-400/30 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              ✨ Expertos verificados cerca de ti
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Encuentra al profesional ideal para tu hogar o negocio
            </h1>
            <p className="text-blue-100 text-base">
              Conecta directamente con plomeros, electricistas, carpinteros y más especialistas en tu código postal sin intermediarios.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-sm max-w-sm w-full">
            <h3 className="font-bold text-white text-base mb-1">¿Ofreces algún oficio o servicio?</h3>
            <p className="text-blue-100 text-xs mb-4">
              Crea una cuenta como Proveedor, edita tu perfil y aparece en este catálogo gratis.
            </p>
            <Link
              to="/perfil"
              className="block text-center bg-white text-blue-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-50 transition"
            >
              Ir a mi perfil de proveedor
            </Link>
          </div>
        </div>
      </section>

      {/* FILTROS RÁPIDOS DE CATEGORÍA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categoriasPopulares.map((cat) => {
            const activo = (cat === 'Todos' && !catActual) || catActual.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => filtrarCategoria(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium shrink-0 transition ${
                  activo
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* LISTADO DE PROVEEDORES */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {catActual || zonaActual
              ? `Resultados de búsqueda ${catActual ? `para "${catActual}"` : ''} ${zonaActual ? `en "${zonaActual}"` : ''}`
              : 'Proveedores disponibles'}
          </h2>
          {(catActual || zonaActual) && (
            <button
              onClick={() => setSearchParams({})}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Cargando especialistas...</div>
        ) : proveedores.length === 0 ? (
          <div className="bg-white border rounded-2xl p-12 text-center max-w-xl mx-auto my-8 shadow-sm">
            <Wrench className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Aún no hay proveedores publicados con estos filtros
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Asegúrate de que el campo <strong>"Tipo de servicio u oficio"</strong> esté guardado en <Link to="/perfil" className="text-blue-600 underline">Mi perfil</Link> para que tu tarjeta aparezca aquí.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proveedores.map((prov) => (
              <article
                key={prov.proveedor_id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Cabecera de la tarjeta */}
                  <div className="p-6 flex items-start gap-4">
                    <img
                      src={imageUrl(prov.foto_perfil_url) || '/img/logo_proveo.png'}
                      alt={prov.nombre}
                      className="w-16 h-16 rounded-full object-cover border shrink-0 bg-gray-100"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-1">
                        {prov.tipo_servicio}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {prov.nombre_negocio || prov.nombre}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">Por {prov.nombre}</p>
                    </div>
                  </div>

                  {/* Descripción y etiquetas */}
                  <div className="px-6 pb-4 space-y-3">
                    {prov.descripcion && (
                      <p className="text-sm text-gray-600 line-clamp-2">{prov.descripcion}</p>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs text-gray-600 pt-1">
                      <span className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-md">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        {prov.colonia}, CP {prov.codigo_postal}
                      </span>
                      {prov.servicio_domicilio && (
                        <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-md font-medium">
                          <HomeIcon className="w-3.5 h-3.5" /> A domicilio
                        </span>
                      )}
                    </div>

                    {/* Mini galería de trabajos */}
                    {prov.fotos_trabajo?.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs font-medium text-gray-400 mb-1.5">Trabajos realizados:</p>
                        <div className="grid grid-cols-4 gap-1.5">
                          {prov.fotos_trabajo.slice(0, 4).map((foto, i) => (
                            <img
                              key={i}
                              src={imageUrl(foto)}
                              alt="Trabajo"
                              className="h-14 w-full object-cover rounded border"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pie de tarjeta: Precio y botón de contacto */}
                <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] text-gray-400 uppercase font-semibold">Precio</span>
                    <span className="text-sm font-bold text-gray-900">
                      {prov.solo_cotizacion
                        ? 'Bajo cotización'
                        : `$${Number(prov.costo_aproximado).toFixed(2)} MXN`}
                    </span>
                  </div>
                  <button
                    onClick={() => setProveedorSeleccionado(prov)}
                    className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Ver datos y contactar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* VENTANA EMERGENTE (MODAL) DE DETALLE DEL PROVEEDOR */}
      {proveedorSeleccionado && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b pb-4">
              <div className="flex items-center gap-4">
                <img
                  src={imageUrl(proveedorSeleccionado.foto_perfil_url) || '/img/logo_proveo.png'}
                  alt={proveedorSeleccionado.nombre}
                  className="w-20 h-20 rounded-full object-cover border"
                />
                <div>
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                    {proveedorSeleccionado.tipo_servicio}
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">
                    {proveedorSeleccionado.nombre_negocio || proveedorSeleccionado.nombre}
                  </h3>
                  <p className="text-sm text-gray-500">Especialista: {proveedorSeleccionado.nombre}</p>
                </div>
              </div>
              <button
                onClick={() => setProveedorSeleccionado(null)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="py-6 space-y-4 text-sm text-gray-700">
              {proveedorSeleccionado.formacion && (
                <div>
                  <h4 className="font-bold text-gray-900">Formación y experiencia:</h4>
                  <p>{proveedorSeleccionado.formacion}</p>
                </div>
              )}
              {proveedorSeleccionado.descripcion && (
                <div>
                  <h4 className="font-bold text-gray-900">Descripción del servicio:</h4>
                  <p className="whitespace-pre-line">{proveedorSeleccionado.descripcion}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border">
                <div>
                  <span className="text-xs text-gray-400 block">Ubicación</span>
                  <span className="font-semibold">
                    Col. {proveedorSeleccionado.colonia}, CP {proveedorSeleccionado.codigo_postal}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Modalidad de precio</span>
                  <span className="font-semibold">
                    {proveedorSeleccionado.solo_cotizacion
                      ? 'Bajo cotización según el trabajo'
                      : `Costo aprox: $${Number(proveedorSeleccionado.costo_aproximado).toFixed(2)} MXN`}
                  </span>
                </div>
              </div>

              {proveedorSeleccionado.fotos_trabajo?.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Galería de trabajos:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {proveedorSeleccionado.fotos_trabajo.map((foto, idx) => (
                      <img
                        key={idx}
                        src={imageUrl(foto)}
                        alt={`Trabajo ${idx + 1}`}
                        className="h-32 w-full object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4 flex flex-wrap items-center justify-between gap-3">
              {proveedorSeleccionado.direccion_maps ? (
                <a
                  href={proveedorSeleccionado.direccion_maps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:underline"
                >
                  <ExternalLink className="w-4 h-4" /> Ver ubicación en Google Maps
                </a>
              ) : <span />}

              <div className="flex gap-3">
                {proveedorSeleccionado.telefono && (
                  <a
                    href={`tel:${proveedorSeleccionado.telefono}`}
                    className="inline-flex items-center gap-2 bg-green-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-green-700 transition"
                  >
                    <Phone className="w-4 h-4" /> Llamar al {proveedorSeleccionado.telefono}
                  </a>
                )}
                <button
                  onClick={() => setProveedorSeleccionado(null)}
                  className="border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-100"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
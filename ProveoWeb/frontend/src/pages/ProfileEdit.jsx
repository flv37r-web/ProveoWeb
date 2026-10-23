import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, Edit2, Briefcase, ExternalLink } from 'lucide-react';
import api from '../services/api';

const emptyProfile = {
  nombre: '',
  nombre_negocio: '',
  tipo_servicio: '',
  formacion: '',
  servicio_domicilio: null,
  colonia: '',
  codigo_postal: '',
  foto_perfil_url: '',
  fotos_trabajo: [],
  solo_cotizacion: null,
  costo_aproximado: '',
  direccion_maps: '',
  descripcion: '',
  telefono: '',
};

const emptyService = {
  titulo: '',
  descripcion: '',
  es_cotizable: false,
  precio_referencia: '',
};

const imageUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${new URL(api.defaults.baseURL).origin}${path}`;
};

const ProfileEdit = () => {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(emptyProfile);
  const [servicios, setServicios] = useState([]);
  const [servicioForm, setServicioForm] = useState(emptyService);
  const [editandoServicioId, setEditandoServicioId] = useState(null);
  const [guardandoServicio, setGuardandoServicio] = useState(false);

  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [fotosTrabajoNuevas, setFotosTrabajoNuevas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    currentUser = null;
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    if (currentUser?.rol !== 'proveedor') {
      navigate('/', { replace: true });
      return;
    }

    api.get('/proveedores/perfil')
      .then(({ data }) => {
        const { servicios: listaServicios, ...datosPerfil } = data;
        setPerfil({ ...emptyProfile, ...datosPerfil });
        setServicios(listaServicios || []);
      })
      .catch((requestError) => {
        if (requestError.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login', { replace: true });
          return;
        }
        setError(requestError.response?.data?.error || 'No fue posible cargar tu perfil.');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setPerfil((current) => ({ ...current, [name]: value }));
  };

  const handleGalleryChange = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (perfil.fotos_trabajo.length + fotosTrabajoNuevas.length + selected.length > 5) {
      setError('Puedes tener hasta cinco fotos de tus trabajos.');
      return;
    }
    setError('');
    setFotosTrabajoNuevas((current) => [
      ...current,
      ...selected.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  };

  const removeExistingGalleryImage = (image) => {
    setPerfil((current) => ({
      ...current,
      fotos_trabajo: current.fotos_trabajo.filter((url) => url !== image),
    }));
  };

  const removeNewGalleryImage = (preview) => {
    setFotosTrabajoNuevas((current) => {
      const removed = current.find((item) => item.preview === preview);
      if (removed) URL.revokeObjectURL(removed.preview);
      return current.filter((item) => item.preview !== preview);
    });
  };

  const uploadImages = async () => {
    if (!fotoPerfil && fotosTrabajoNuevas.length === 0) return {};
    const body = new FormData();
    if (fotoPerfil) body.append('foto_perfil', fotoPerfil);
    fotosTrabajoNuevas.forEach(({ file }) => body.append('fotos_trabajo', file));
    const { data } = await api.post('/proveedores/perfil/imagenes', body);
    return data;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMensaje('');

    try {
      const uploaded = await uploadImages();
      const nuevasFotos = [...perfil.fotos_trabajo, ...(uploaded.fotos_trabajo || [])];
      const nuevaFotoPerfil = uploaded.foto_perfil_url || perfil.foto_perfil_url;

      const payload = {
        ...perfil,
        foto_perfil_url: nuevaFotoPerfil,
        fotos_trabajo: nuevasFotos,
        costo_aproximado: perfil.solo_cotizacion ? null : Number(perfil.costo_aproximado) || 0,
      };

      const { data } = await api.put('/proveedores/perfil', payload);
      const { servicios: listaServicios, ...datosPerfil } = data;
      setPerfil({ ...emptyProfile, ...datosPerfil });
      if (listaServicios) setServicios(listaServicios);

      setFotoPerfil(null);
      fotosTrabajoNuevas.forEach(({ preview }) => URL.revokeObjectURL(preview));
      setFotosTrabajoNuevas([]);
      setMensaje('Perfil actualizado correctamente y publicado en el directorio.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No fue posible guardar tu perfil.');
    } finally {
      setSaving(false);
    }
  };

  // Funciones CRUD para HU 08: Catálogo de servicios del proveedor
  const handleGuardarServicio = async (e) => {
    e.preventDefault();
    setGuardandoServicio(true);
    setError('');
    try {
      const payload = {
        titulo: servicioForm.titulo,
        descripcion: servicioForm.descripcion,
        es_cotizable: servicioForm.es_cotizable,
        precio_referencia: servicioForm.es_cotizable ? null : Number(servicioForm.precio_referencia || 0),
      };

      if (editandoServicioId) {
        const { data } = await api.put(`/proveedores/servicios/${editandoServicioId}`, payload);
        setServicios((prev) => prev.map((s) => (s.id === editandoServicioId ? data.datos : s)));
      } else {
        const { data } = await api.post('/proveedores/servicios', payload);
        setServicios((prev) => [...prev, data.datos]);
      }

      setServicioForm(emptyService);
      setEditandoServicioId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el servicio del catálogo.');
    } finally {
      setGuardandoServicio(false);
    }
  };

  const iniciarEdicionServicio = (srv) => {
    setEditandoServicioId(srv.id);
    setServicioForm({
      titulo: srv.titulo,
      descripcion: srv.descripcion || '',
      es_cotizable: srv.precio_referencia === null,
      precio_referencia: srv.precio_referencia ?? '',
    });
  };

  const handleEliminarServicio = async (servicioId) => {
    try {
      await api.delete(`/proveedores/servicios/${servicioId}`);
      setServicios((prev) => prev.filter((s) => s.id !== servicioId));
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar el servicio.');
    }
  };

  if (loading) return <div className="text-center p-12">Cargando perfil...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* FORMULARIO PRINCIPAL DEL PERFIL (HU 03) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Mi perfil profesional de proveedor</h2>
              <p className="text-sm text-gray-500">Los cambios que guardes se reflejan al instante en tu vista pública.</p>
            </div>
            {currentUser?.id && (
              <Link
                to={`/proveedores/${currentUser.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-100"
              >
                <ExternalLink className="w-4 h-4" /> Ver mi perfil público
              </Link>
            )}
          </div>

          {error && <div role="alert" className="p-4 mb-4 rounded-xl bg-red-100 text-red-700 text-sm">{error}</div>}
          {mensaje && <div role="status" className="p-4 mb-4 rounded-xl bg-green-100 text-green-700 text-sm">{mensaje}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre completo *</label>
              <input id="nombre" name="nombre" required maxLength="100" value={perfil.nombre} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 outline-none focus:border-blue-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nombre_negocio" className="block text-sm font-medium text-gray-700">Nombre del negocio (opcional)</label>
                <input id="nombre_negocio" name="nombre_negocio" maxLength="150" value={perfil.nombre_negocio || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="tipo_servicio" className="block text-sm font-medium text-gray-700">Categoría o servicio principal *</label>
                <input id="tipo_servicio" name="tipo_servicio" required maxLength="150" placeholder="Ej. Plomería, Electricidad..." value={perfil.tipo_servicio || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 outline-none focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label htmlFor="formacion" className="block text-sm font-medium text-gray-700">Título, estudios o experiencia relacionada (opcional)</label>
              <textarea id="formacion" name="formacion" maxLength="500" rows="2" value={perfil.formacion || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 outline-none focus:border-blue-500" />
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-gray-700">¿Ofreces servicio a domicilio? *</legend>
              <div className="mt-2 flex gap-6">
                {[['true', 'Sí'], ['false', 'No']].map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm">
                    <input type="radio" name="servicio_domicilio" required checked={perfil.servicio_domicilio === (value === 'true')} onChange={() => setPerfil((current) => ({ ...current, servicio_domicilio: value === 'true' }))} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="colonia" className="block text-sm font-medium text-gray-700">Colonia de cobertura *</label>
                <input id="colonia" name="colonia" required maxLength="150" value={perfil.colonia || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="codigo_postal" className="block text-sm font-medium text-gray-700">Código postal *</label>
                <input id="codigo_postal" name="codigo_postal" required inputMode="numeric" pattern="[0-9]{5}" maxLength="5" value={perfil.codigo_postal || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 outline-none focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Teléfono de contacto</label>
              <input id="telefono" type="tel" name="telefono" maxLength="20" value={perfil.telefono || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 outline-none focus:border-blue-500" />
            </div>

            <div>
              <label htmlFor="foto_perfil" className="block text-sm font-medium text-gray-700">Foto de perfil *</label>
              <input id="foto_perfil" type="file" accept="image/jpeg,image/png,image/webp" required={!perfil.foto_perfil_url && !fotoPerfil} onChange={(event) => setFotoPerfil(event.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-gray-700" />
              {!fotoPerfil && perfil.foto_perfil_url && <img src={imageUrl(perfil.foto_perfil_url)} alt="Foto de perfil" className="mt-3 h-24 w-24 rounded-full object-cover border" />}
            </div>

            <div>
              <label htmlFor="fotos_trabajo" className="block text-sm font-medium text-gray-700">Fotos de tus trabajos (hasta 5)</label>
              <input id="fotos_trabajo" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleGalleryChange} className="mt-1 block w-full text-sm text-gray-700" />
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-3">
                {perfil.fotos_trabajo.map((image) => (
                  <div key={image}>
                    <img src={imageUrl(image)} alt="Trabajo realizado" className="h-24 w-full rounded object-cover border" />
                    <button type="button" onClick={() => removeExistingGalleryImage(image)} className="mt-1 text-xs text-red-600 hover:underline">Quitar foto</button>
                  </div>
                ))}
                {fotosTrabajoNuevas.map(({ preview }, index) => (
                  <div key={preview}>
                    <img src={preview} alt={`Nueva foto ${index + 1}`} className="h-24 w-full rounded object-cover border" />
                    <button type="button" onClick={() => removeNewGalleryImage(preview)} className="mt-1 text-xs text-red-600 hover:underline">Quitar foto</button>
                  </div>
                ))}
              </div>
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-gray-700">Tarifa base de referencia *</legend>
              <div className="mt-2 space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" name="solo_cotizacion" required checked={perfil.solo_cotizacion === true} onChange={() => setPerfil((current) => ({ ...current, solo_cotizacion: true, costo_aproximado: '' }))} />
                  Bajo cotización según el trabajo
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="solo_cotizacion" required checked={perfil.solo_cotizacion === false} onChange={() => setPerfil((current) => ({ ...current, solo_cotizacion: false }))} />
                  Mostrar un costo aproximado
                </label>
              </div>
              {perfil.solo_cotizacion === false && (
                <div className="mt-3">
                  <label htmlFor="costo_aproximado" className="block text-sm font-medium text-gray-700">Costo aproximado en MXN *</label>
                  <input id="costo_aproximado" type="number" name="costo_aproximado" required min="0.01" step="0.01" value={perfil.costo_aproximado || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 outline-none focus:border-blue-500" />
                </div>
              )}
            </fieldset>

            <div>
              <label htmlFor="direccion_maps" className="block text-sm font-medium text-gray-700">Enlace de Google Maps (opcional)</label>
              <input id="direccion_maps" type="url" name="direccion_maps" value={perfil.direccion_maps || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 outline-none focus:border-blue-500" placeholder="https://maps.google.com/..." />
            </div>

            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción general de tus servicios *</label>
              <textarea id="descripcion" name="descripcion" required value={perfil.descripcion || ''} onChange={handleChange} maxLength="5000" rows="4" className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 outline-none focus:border-blue-500" />
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button type="submit" disabled={saving} className="bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-blue-700 disabled:opacity-60">
                {saving ? 'Guardando...' : 'Guardar datos del perfil'}
              </button>
            </div>
          </form>
        </div>

        {/* GESTIÓN DEL CATÁLOGO DE SERVICIOS Y TARIFAS (HU 08) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Catálogo de Servicios y Tarifas (HU 08)</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Agrega servicios específicos con su tarifa estimada o márcalos como cotizables para que aparezcan en tu perfil público.
          </p>

          <form onSubmit={handleGuardarServicio} className="bg-gray-50 p-5 rounded-xl border space-y-4 mb-6">
            <h4 className="text-sm font-bold text-gray-800">
              {editandoServicioId ? '✏️ Editando servicio' : '➕ Agregar nuevo servicio al catálogo'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase">Título del servicio *</label>
                <input
                  type="text"
                  required
                  maxLength="150"
                  placeholder="Ej. Reparación de fuga de agua en lavabo"
                  value={servicioForm.titulo}
                  onChange={(e) => setServicioForm({ ...servicioForm, titulo: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase">Descripción breve</label>
                <textarea
                  rows="2"
                  maxLength="1000"
                  placeholder="Incluye revisión y mano de obra básica..."
                  value={servicioForm.descripcion}
                  onChange={(e) => setServicioForm({ ...servicioForm, descripcion: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="es_cotizable"
                  type="checkbox"
                  checked={servicioForm.es_cotizable}
                  onChange={(e) => setServicioForm({ ...servicioForm, es_cotizable: e.target.checked, precio_referencia: '' })}
                />
                <label htmlFor="es_cotizable" className="text-sm text-gray-700">
                  Servicio bajo cotización (sin precio fijo)
                </label>
              </div>
              {!servicioForm.es_cotizable && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Precio estimado (MXN) *</label>
                  <input
                    type="number"
                    required={!servicioForm.es_cotizable}
                    min="1"
                    step="0.01"
                    placeholder="350.00"
                    value={servicioForm.precio_referencia}
                    onChange={(e) => setServicioForm({ ...servicioForm, precio_referencia: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={guardandoServicio}
                className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                {editandoServicioId ? 'Actualizar servicio' : 'Agregar al catálogo'}
              </button>
              {editandoServicioId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditandoServicioId(null);
                    setServicioForm(emptyService);
                  }}
                  className="text-sm text-gray-600 hover:underline"
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>

          {/* LISTA DE SERVICIOS DEL PROVEEDOR */}
          {servicios.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Aún no has agregado servicios individuales a tu catálogo.
            </p>
          ) : (
            <div className="space-y-3">
              {servicios.map((srv) => (
                <div
                  key={srv.id}
                  className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 text-sm">{srv.titulo}</h4>
                      <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {srv.precio_referencia === null
                          ? 'Cotizable'
                          : `$${Number(srv.precio_referencia).toFixed(2)} MXN`}
                      </span>
                    </div>
                    {srv.descripcion && <p className="text-xs text-gray-600 mt-1">{srv.descripcion}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => iniciarEdicionServicio(srv)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarServicio(srv.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
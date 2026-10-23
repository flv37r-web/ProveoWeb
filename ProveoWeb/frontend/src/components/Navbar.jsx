import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [servicio, setServicio] = useState(searchParams.get('cat') || '');
  const [zona, setZona] = useState(searchParams.get('zona') || '');

  useEffect(() => {
    setServicio(searchParams.get('cat') || '');
    setZona(searchParams.get('zona') || '');
  }, [searchParams]);

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    localStorage.removeItem('user');
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (servicio.trim()) params.set('cat', servicio.trim());
    if (zona.trim()) params.set('zona', zona.trim());
    navigate(`/?${params.toString()}`);
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-blue-700 shrink-0">
            <img
              src="/img/logo_proveo_transparente.png"
              alt="Proveo Logo"
              className="h-9 w-auto object-contain"
            />
            <span>Proveo</span>
          </Link>

          {/* BARRA DE BÚSQUEDA EN ESCRITORIO */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-2xl mx-4 items-center bg-gray-50 rounded-full border px-4 py-1.5"
          >
            <div className="flex-1 flex items-center border-r px-2">
              <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                value={servicio}
                onChange={(e) => setServicio(e.target.value)}
                placeholder="¿Qué servicio buscas? (Ej. Plomero)"
                className="bg-transparent outline-none w-full text-sm text-gray-700"
              />
            </div>
            <div className="flex-1 flex items-center px-4">
              <MapPin className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                value={zona}
                onChange={(e) => setZona(e.target.value)}
                placeholder="Colonia o Código Postal"
                className="bg-transparent outline-none w-full text-sm text-gray-700"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition"
            >
              Buscar
            </button>
          </form>

          {/* BOTONES DE SESIÓN Y PERFIL */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {!user ? (
              <>
                <Link to="/login" className="text-xs sm:text-sm font-medium text-gray-600 hover:text-blue-600">
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="text-xs sm:text-sm font-medium border border-blue-600 text-blue-600 px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  Regístrate gratis
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden lg:inline text-sm font-medium text-gray-700">
                  Hola, {user.nombre}
                </span>
                <Link
                  to="/mi-cuenta"
                  className="text-xs sm:text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-md hover:bg-blue-100 transition"
                >
                  👤 Mi perfil
                </Link>
                {user.rol === 'proveedor' && (
                  <Link
                    to="/perfil"
                    className="text-xs sm:text-sm font-medium bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-md hover:bg-amber-100 transition"
                  >
                    🛠️ Editar datos
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-xs sm:text-sm font-medium text-red-600 hover:text-red-800 ml-1"
                >
                  Salir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA ADAPTATIVA EN MÓVILES (HU 04) */}
        <form
          onSubmit={handleSearch}
          className="mt-3 flex md:hidden flex-col sm:flex-row gap-2 bg-gray-50 p-2.5 rounded-2xl border"
        >
          <div className="flex items-center bg-white rounded-xl border px-3 py-2 flex-1">
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              value={servicio}
              onChange={(e) => setServicio(e.target.value)}
              placeholder="Servicio u oficio (Ej. Plomería)"
              className="bg-transparent outline-none w-full text-sm text-gray-700"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white rounded-xl border px-3 py-2 flex-1">
              <MapPin className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                value={zona}
                onChange={(e) => setZona(e.target.value)}
                placeholder="Colonia o CP"
                className="bg-transparent outline-none w-full text-sm text-gray-700"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition shrink-0"
            >
              Buscar
            </button>
          </div>
        </form>
      </div>
    </header>
  );
};

export default Navbar;
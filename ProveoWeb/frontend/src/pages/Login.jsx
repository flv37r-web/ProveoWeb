import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import {
  User,
  Wrench,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import api from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.state?.rol === 'proveedor' ? 'proveedor' : 'cliente'
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isProveedor = activeTab === 'proveedor';

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setSubmitting(true);
    try {
      const response = await api.post('/auth/google', {
        idToken: credentialResponse.credential,
        rol: activeTab,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate(response.data.user.rol === 'proveedor' ? '/perfil' : '/');
    } catch (requestError) {
      setError(
        requestError.response?.data?.error || 'No fue posible iniciar sesión con Google.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setError('No se pudo completar la verificación con Google. Intenta de nuevo.');
  };

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] bg-slate-50/80 flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      {/* Destellos ambientales sutiles que cambian con el rol */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl transition-colors duration-500 ${
          isProveedor ? 'bg-emerald-200/35' : 'bg-blue-200/40'
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl transition-colors duration-500 ${
          isProveedor ? 'bg-lime-200/35' : 'bg-sky-200/35'
        }`}
      />

      <div className="relative w-full max-w-md">
        {/* Tarjeta principal */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.14)] overflow-hidden">
          {/* Franja superior minimalista con color del rol */}
          <div
            className={`h-1.5 w-full bg-gradient-to-r transition-all duration-300 ${
              isProveedor
                ? 'from-emerald-600 via-emerald-500 to-lime-400'
                : 'from-blue-700 via-blue-600 to-sky-400'
            }`}
          />

          <div className="p-7 sm:p-9">
            {/* Encabezado con logotipo */}
            <div className="flex flex-col items-center text-center mb-7">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-center mb-4 shadow-xs">
                <img
                  src="/img/logo_proveo_transparente.png"
                  alt="Proveo"
                  className="h-7 w-auto object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Iniciar sesión
              </h1>
              <p className="text-sm text-slate-500 mt-1.5">
                Selecciona tu perfil y accede con tu cuenta de Google
              </p>
            </div>

            {/* Alertas */}
            {location.state?.mensaje && (
              <div
                role="status"
                className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{location.state.mensaje}</span>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-sm"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Selector segmentado de rol */}
            <div
              role="tablist"
              aria-label="Tipo de cuenta"
              className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60 mb-4"
            >
              <button
                type="button"
                role="tab"
                aria-selected={!isProveedor}
                disabled={submitting}
                onClick={() => {
                  setError('');
                  setActiveTab('cliente');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  !isProveedor
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-600/15'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <User
                  className={`w-4 h-4 ${
                    !isProveedor ? 'text-blue-600' : 'text-slate-400'
                  }`}
                />
                <span>Cliente</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={isProveedor}
                disabled={submitting}
                onClick={() => {
                  setError('');
                  setActiveTab('proveedor');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isProveedor
                    ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-600/15'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Wrench
                  className={`w-4 h-4 ${
                    isProveedor ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                />
                <span>Proveedor</span>
              </button>
            </div>

            {/* Aviso contextual con color acorde al rol */}
            <div
              className={`rounded-xl px-3.5 py-2.5 text-xs text-center border mb-6 transition-colors duration-200 ${
                isProveedor
                  ? 'bg-emerald-50/70 border-emerald-200/60 text-emerald-800'
                  : 'bg-blue-50/70 border-blue-200/60 text-blue-800'
              }`}
            >
              {isProveedor
                ? 'Entrarás a tu panel profesional para administrar tus servicios y perfil.'
                : 'Entrarás para buscar especialistas verificados cerca de tu código postal.'}
            </div>

            {/* Botón de Google */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text="signin_with"
                  shape="pill"
                  theme="outline"
                  size="large"
                />
              </div>

              {submitting && (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader2
                    className={`w-4 h-4 animate-spin ${
                      isProveedor ? 'text-emerald-600' : 'text-blue-600'
                    }`}
                  />
                  <span>Verificando tu cuenta...</span>
                </div>
              )}
            </div>

            {/* Enlace de registro */}
            <div className="mt-7 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
              ¿Aún no tienes cuenta?{' '}
              <Link
                to="/register"
                className={`inline-flex items-center gap-1 font-semibold transition-colors ${
                  isProveedor
                    ? 'text-emerald-600 hover:text-emerald-700'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                Regístrate gratis
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Sello discreto de seguridad */}
        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Acceso seguro autenticado mediante Google</span>
        </p>
      </div>
    </div>
  );
};

export default Login;

// Actuailizacion Google Auth.
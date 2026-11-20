import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Briefcase, Wrench } from 'lucide-react';
import api from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [rol, setRol] = useState('cliente');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setSubmitting(true);
    try {
      const response = await api.post('/auth/google', {
        idToken: credentialResponse.credential,
        rol,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate(response.data.user.rol === 'proveedor' ? '/perfil' : '/');
    } catch (requestError) {
      setError(
        requestError.response?.data?.error || 'No fue posible completar el registro con Google.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setError('No se pudo completar la verificación con Google. Intenta de nuevo.');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-2xl w-full bg-white p-8 rounded-xl shadow-sm border">
        <div className="text-center mb-8">
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Registro de usuario</h2>
          <p className="mt-2 text-sm text-gray-500">
            Elige tu tipo de cuenta y regístrate con tu correo de Google.
          </p>
        </div>

        {error && (
          <div role="alert" className="p-4 mb-4 rounded bg-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selecciona tu tipo de cuenta *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => !submitting && setRol('cliente')}
                className={`cursor-pointer border-2 rounded-lg p-4 flex gap-3 ${
                  rol === 'cliente'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div
                  className={`p-2 rounded-full ${
                    rol === 'cliente' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    Busco proveedores y servicios
                  </h4>
                </div>
              </div>

              <div
                onClick={() => !submitting && setRol('proveedor')}
                className={`cursor-pointer border-2 rounded-lg p-4 flex gap-3 ${
                  rol === 'proveedor'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div
                  className={`p-2 rounded-full ${
                    rol === 'proveedor' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    Ofrezco mis servicios
                  </h4>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-4">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signup_with"
                shape="rectangular"
                theme="outline"
                size="large"
              />
            </div>

            {submitting && (
              <p className="text-center text-sm text-gray-500">Creando tu cuenta...</p>
            )}
          </div>

          <div className="pt-4 border-t text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

// Actualizacion Google Auth.
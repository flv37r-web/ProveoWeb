
// Actualizacion Auth.
const { OAuth2Client } = require('google-auth-library');

let client = null;

const getClient = () => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('La variable GOOGLE_CLIENT_ID no está configurada.');
  }
  if (!client) {
    client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return client;
};

const verifyGoogleIdToken = async (idToken) => {
  const oauthClient = getClient();
  const ticket = await oauthClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    const error = new Error('Token de Google inválido.');
    error.statusCode = 401;
    throw error;
  }

  const nombreBase = payload.name || payload.email.split('@')[0];

  return {
    googleId: payload.sub,
    email: String(payload.email).trim().toLowerCase(),
    emailVerified: Boolean(payload.email_verified),
    nombre: String(nombreBase).trim().slice(0, 100),
  };
};

module.exports = {
  verifyGoogleIdToken,
};
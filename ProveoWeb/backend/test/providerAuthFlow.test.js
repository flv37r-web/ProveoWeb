// Actualacion Google Auth.
const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const express = require('express');
const jwt = require('jsonwebtoken');

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalJwtSecret = process.env.JWT_SECRET;
const originalGoogleClientId = process.env.GOOGLE_CLIENT_ID;

process.env.DATABASE_URL ||= 'mysql://root:@127.0.0.1:3306/proveo_test';
process.env.JWT_SECRET = 'test-provider-auth-flow-secret';
process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';

const db = require('../src/db');
const googleAuthService = require('../src/services/googleAuthService');
const authRoutes = require('../src/routes/authRoutes');

test('registers a provider via Google Auth and lets that provider log in again', async () => {
  const originalQuery = db.query;
  const originalTransaction = db.transaction;
  const originalVerifyGoogleIdToken = googleAuthService.verifyGoogleIdToken;

  let user;
  let providerProfile;

  googleAuthService.verifyGoogleIdToken = async (idToken) => {
    assert.equal(idToken, 'valid-google-id-token');
    return {
      googleId: 'google-sub-12345',
      email: 'proveedor@gmail.com',
      emailVerified: true,
      nombre: 'Proveedor de Prueba',
    };
  };

  db.query = async (sql, params) => {
    if (sql.includes('FROM usuarios')) {
      if (user && (params[0] === user.google_id || params[1] === user.email)) {
        return { rows: [{ ...user, estatus: 'activo' }] };
      }
      return { rows: [] };
    }
    throw new Error(`Unexpected database query: ${sql}`);
  };

  db.transaction = async (callback) =>
    callback({
      query: async (sql, params) => {
        if (sql.includes('INSERT INTO usuarios')) {
          user = {
            id: params[0],
            nombre: params[1],
            email: params[2],
            google_id: params[3],
            telefono: null,
            rol: params[4],
          };
          return { rows: [] };
        }
        if (sql.includes('INSERT INTO perfiles_proveedor')) {
          providerProfile = {
            usuario_id: params[0],
            telefono: null,
            fotos_trabajo: params[1],
          };
          return { rows: [] };
        }
        throw new Error(`Unexpected transaction query: ${sql}`);
      },
    });

  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);
  const server = app.listen(0, '127.0.0.1');

  try {
    await once(server, 'listening');
    const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1/auth`;

    const firstResponse = await fetch(`${baseUrl}/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: 'valid-google-id-token',
        rol: 'proveedor',
      }),
    });
    const firstData = await firstResponse.json();

    assert.equal(firstResponse.status, 201);
    assert.equal(typeof firstData.token, 'string');
    assert.deepEqual(firstData.user, {
      id: user.id,
      nombre: 'Proveedor de Prueba',
      email: 'proveedor@gmail.com',
      telefono: null,
      rol: 'proveedor',
    });
    assert.deepEqual(providerProfile, {
      usuario_id: user.id,
      telefono: null,
      fotos_trabajo: '[]',
    });

    const secondResponse = await fetch(`${baseUrl}/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: 'valid-google-id-token',
        rol: 'proveedor',
      }),
    });
    const secondData = await secondResponse.json();

    assert.equal(secondResponse.status, 200);
    assert.deepEqual(secondData.user, firstData.user);
    const tokenPayload = jwt.verify(secondData.token, process.env.JWT_SECRET);
    assert.equal(tokenPayload.rol, 'proveedor');
    assert.equal(tokenPayload.sub, user.id);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    db.query = originalQuery;
    db.transaction = originalTransaction;
    googleAuthService.verifyGoogleIdToken = originalVerifyGoogleIdToken;
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
    if (originalGoogleClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = originalGoogleClientId;
  }
});
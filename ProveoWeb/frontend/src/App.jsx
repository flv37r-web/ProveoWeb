import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import ProfileEdit from './pages/ProfileEdit';
import MiCuenta from './pages/MiCuenta';
import PerfilProveedor from './pages/PerfilProveedor';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Navbar />
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/mi-cuenta" element={<MiCuenta />} />
          <Route path="/perfil" element={<ProfileEdit />} />
          <Route path="/proveedores/:id" element={<PerfilProveedor />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
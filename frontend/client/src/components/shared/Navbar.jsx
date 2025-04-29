import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="w-full py-4 px-8 flex items-center justify-between bg-white shadow-md">
      <div className="text-2xl font-bold text-primary">ChatWave 🌊</div>
      <div className="flex gap-6">
        <Link to="/" className={`text-lg ${isActive('/') ? 'text-primary font-semibold' : 'text-gray-600'}`}>Home</Link>
        <Link to="/login" className={`text-lg ${isActive('/login') ? 'text-primary font-semibold' : 'text-gray-600'}`}>Login</Link>
        <Link to="/signup" className={`text-lg ${isActive('/signup') ? 'text-primary font-semibold' : 'text-gray-600'}`}>Signup</Link>
      </div>
    </nav>
  );
};

export default Navbar;

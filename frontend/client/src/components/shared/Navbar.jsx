// src/components/shared/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="flex items-center justify-between p-4 shadow-md bg-white fixed w-full top-0 z-10">
      <Link to="/" className="text-2xl font-bold text-blue-500">ChatWave 🌊</Link>
      <div className="flex items-center gap-4">
        {localStorage.getItem('token') ? (
          <>
            <Link to="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <button onClick={handleLogout} className="text-red-500 hover:text-red-600">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-blue-600">Login</Link>
            <Link to="/signup" className="hover:text-blue-600">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

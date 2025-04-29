import React from 'react';
import Navbar from '../components/shared/Navbar';
import Button from '../components/shared/Button';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <>
      <Navbar />
      <section className="flex flex-col items-center justify-center h-[90vh] text-center px-6">
        <h1 className="text-5xl font-bold mb-6 text-primary">Welcome to ChatWave 🌊</h1>
        <p className="text-gray-600 text-lg mb-8 max-w-2xl">Connect. Chat. Share moments. A beautiful real-time chat app experience built for you.</p>
        <div className="flex gap-6">
          <Link to="/login">
            <Button>Login</Button>
          </Link>
          <Link to="/signup">
            <Button>Signup</Button>
          </Link>
        </div>
      </section>
    </>
  );
};

export default HomePage;

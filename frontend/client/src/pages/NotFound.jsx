import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/shared/Button';

const NotFound = () => {
  return (
    <div className="h-screen flex flex-col justify-center items-center text-center px-4">
      <h1 className="text-5xl font-bold text-primary mb-4">404</h1>
      <p className="text-gray-600 mb-6 text-lg">Oops! The page you're looking for doesn't exist.</p>
      <Link to="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
};

export default NotFound;

import React from 'react';
import Navbar from '../components/shared/Navbar';
import LoginForm from '../components/forms/LoginForm';

const LoginPage = () => {
  return (
    <>
      <Navbar />
      <div className="flex justify-center items-center h-[90vh]">
        <LoginForm />
      </div>
    </>
  );
};

export default LoginPage;

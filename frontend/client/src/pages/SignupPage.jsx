import React from 'react';
import Navbar from '../components/shared/Navbar';
import SignupForm from '../components/forms/SignupForm';

const SignupPage = () => {
  return (
    <>
      <Navbar />
      <div className="flex justify-center items-center h-[90vh]">
        <SignupForm />
      </div>
    </>
  );
};

export default SignupPage;

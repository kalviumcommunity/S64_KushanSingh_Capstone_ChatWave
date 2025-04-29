import React from 'react';

const Button = ({ children, onClick, type = 'button', className = '' }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-2xl transition-all duration-300 ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;

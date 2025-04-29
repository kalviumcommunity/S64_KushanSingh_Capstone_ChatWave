import React, { useState } from 'react';
import Button from '../shared/Button';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    console.log('Login:', { email, password });
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-sm">
      <input
        type="email"
        placeholder="Email"
        className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" className="w-full">Login</Button>
    </form>
  );
};

export default LoginForm;

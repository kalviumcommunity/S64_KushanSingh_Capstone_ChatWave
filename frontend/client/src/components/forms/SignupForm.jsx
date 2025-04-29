import React, { useState } from 'react';
import Button from '../shared/Button';

const SignupForm = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = (e) => {
    e.preventDefault();
    console.log('Signup:', { name, email, password });
  };

  return (
    <form onSubmit={handleSignup} className="flex flex-col gap-4 w-full max-w-sm">
      <input
        type="text"
        placeholder="Name"
        className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
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
      <Button type="submit" className="w-full">Signup</Button>
    </form>
  );
};

export default SignupForm;

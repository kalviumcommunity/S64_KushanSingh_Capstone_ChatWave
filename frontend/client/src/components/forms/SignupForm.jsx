// src/components/forms/SignupForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../../utils/api';

const SignupForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await signup(formData);
      if (res.token) {
        localStorage.setItem('token', res.token);
        navigate('/dashboard');
      } else {
        setError(res.message || 'Signup failed');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="text" name="name" placeholder="Name" onChange={handleChange} className="input" required />
      <input type="email" name="email" placeholder="Email" onChange={handleChange} className="input" required />
      <input type="password" name="password" placeholder="Password" onChange={handleChange} className="input" required />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit" className="btn-primary w-full">Signup</button>
    </form>
  );
};

export default SignupForm;

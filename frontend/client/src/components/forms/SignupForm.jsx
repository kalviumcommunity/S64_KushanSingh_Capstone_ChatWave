// src/components/forms/SignupForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../../utils/api';
import { uploadFile } from '../../utils/api';

const SignupForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '',
    profilePic: ''
  });
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await uploadFile(formData);
        setFormData(prev => ({ ...prev, profilePic: response.url }));
      } catch (err) {
        console.error('File upload error:', err);
        setError('Failed to upload profile picture');
      }
    }
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
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl max-w-md mx-auto p-8 mt-8 border border-gray-100 transition-all duration-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Sign Up</h2>
      <div className="mb-4">
        <label htmlFor="username" className="block text-gray-700 font-semibold mb-2">Username</label>
        <input
          id="username"
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm ${error ? 'border-red-400' : 'border-gray-300'}`}
          aria-label="Username"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm ${error ? 'border-red-400' : 'border-gray-300'}`}
          aria-label="Email"
          required
        />
      </div>
      <div className="mb-6">
        <label htmlFor="password" className="block text-gray-700 font-semibold mb-2">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm ${error ? 'border-red-400' : 'border-gray-300'}`}
          aria-label="Password"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Profile Picture
        </label>
        <input 
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
        />
        {selectedFile && (
          <div className="mt-2">
            <img 
              src={URL.createObjectURL(selectedFile)} 
              alt="Preview" 
              className="h-20 w-20 rounded-full object-cover"
            />
          </div>
        )}
      </div>
      {error && <div className="mb-4 text-red-500 text-sm text-center">{error}</div>}
      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Sign Up"
      >
        Sign Up
      </button>
    </form>
  );
};

export default SignupForm;

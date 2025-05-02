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
    <form onSubmit={handleSubmit} className="space-y-4">
      <input 
        type="text" 
        name="username" 
        placeholder="Username" 
        onChange={handleChange} 
        className="input" 
        required 
      />
      <input 
        type="email" 
        name="email" 
        placeholder="Email" 
        onChange={handleChange} 
        className="input" 
        required 
      />
      <input 
        type="password" 
        name="password" 
        placeholder="Password" 
        onChange={handleChange} 
        className="input" 
        required 
      />
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
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit" className="btn-primary w-full">Signup</button>
    </form>
  );
};

export default SignupForm;

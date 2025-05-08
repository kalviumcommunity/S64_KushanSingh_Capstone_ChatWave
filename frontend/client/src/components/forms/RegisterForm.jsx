import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, Eye, EyeOff, Image } from 'lucide-react';
import axios from 'axios';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    profilePic: null
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }

      setFormData(prev => ({ ...prev, profilePic: file }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      let profilePicUrl = null;
      
      // Upload profile picture if selected
      if (formData.profilePic) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', formData.profilePic);
        
        const uploadResponse = await axios.post('/api/upload', formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        profilePicUrl = uploadResponse.data.url;
      }

      // Register user with profile picture
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        profilePic: profilePicUrl
      });
      
      toast.success('Account created successfully');
      navigate('/chat');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl max-w-md mx-auto p-8 mt-8 border border-gray-100 transition-all duration-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Register</h2>
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
          type={showPassword ? 'text' : 'password'}
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm ${error ? 'border-red-400' : 'border-gray-300'}`}
          aria-label="Password"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="confirmPassword" className="block text-gray-700 font-semibold mb-2">Confirm Password</label>
        <input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm ${error ? 'border-red-400' : 'border-gray-300'}`}
          aria-label="Confirm Password"
          required
        />
      </div>
      {error && <div className="mb-4 text-red-500 text-sm text-center">{error}</div>}
      <div className="flex flex-col items-center space-y-4 mb-6">
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-200 shadow-md bg-gray-100 flex items-center justify-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile preview"
              className="w-full h-full object-cover rounded-full ring-2 ring-blue-400 shadow"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Image className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>
        <label className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <span>Choose Profile Picture</span>
        </label>
      </div>
      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Register"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating account...
            </div>
          ) : (
            'Create account'
          )}
        </button>
      </div>
    </form>
  );
};

export default RegisterForm; 
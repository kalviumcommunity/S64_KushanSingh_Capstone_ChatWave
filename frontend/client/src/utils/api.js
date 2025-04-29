import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    // Handle the response (store token, etc.)
  } catch (error) {
    console.error(error);
  }
};

export const signup = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/auth/signup`, data);
    // Handle the response (store token, etc.)
  } catch (error) {
    console.error(error);
  }
};

export const getConversations = async () => {
  try {
    const response = await axios.get(`${API_URL}/conversations`);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

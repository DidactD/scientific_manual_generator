import axios from 'axios';

const apiClient = axios.create({
  // Il backend è assunto essere servito dalla stessa origine.
  // CAMBIA QUESTO: Usa l'URL completo del tuo Virtual Host.
  baseURL: 'http://api.scientific-manual-generator.com', 
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


export default apiClient;
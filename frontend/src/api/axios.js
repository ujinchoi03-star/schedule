// src/api/axios.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'https://time-table-4qlh.onrender.com',
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청을 보낼 때마다 자동으로 '입장권(Token)'을 헤더에 붙여주는 설정
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
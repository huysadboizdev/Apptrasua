import axios from 'axios';

// Sử dụng địa chỉ IP thực tế của máy tính của bạn
const API_URL = 'http://localhost:4000/api'; // Thay đổi IP này theo địa chỉ IP của máy tính của bạn

// Tạo instance axios với cấu hình mặc định
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // Timeout sau 10 giây
});

export const userService = {
    register: async (userData) => {
        try {
            console.log('Sending request to:', `${API_URL}/user/register`);
            console.log('Request data:', userData);
            const response = await api.post('/user/register', userData);
            console.log('Response:', response.data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('API Error:', error);
            if (error.code === 'ECONNABORTED') {
                return {
                    success: false,
                    error: 'Kết nối đến server bị timeout'
                };
            }
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    },

    login: async (credentials) => {
        try {
            console.log('Sending request to:', `${API_URL}/user/login`);
            console.log('Request data:', credentials);
            const response = await api.post('/user/login', credentials);
            console.log('Response:', response.data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('API Error:', error);
            if (error.code === 'ECONNABORTED') {
                return {
                    success: false,
                    error: 'Kết nối đến server bị timeout'
                };
            }
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }
}; 
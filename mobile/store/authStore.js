import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Bạn import đúng thế này nhé

export const useAuthStore = create((set) => ({
    user: null,
    token: null,
    isLoading: false,
    error: null,
    role: null, // Thêm role vào state

    register: async (name, email, password, role = 'user') => {
        try {
            set({ isLoading: true, error: null });
            const response = await fetch('http://192.168.19.104:4000/api/user/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, role }),
            });

            const data = await response.json();
            console.log('Server response:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // Lưu thông tin user và role
            await AsyncStorage.setItem('user', JSON.stringify(data.user));
            await AsyncStorage.setItem('role', data.user.role);
            
            set({ user: data.user, role: data.user.role, isLoading: false });
            return { success: true, data };
        } catch (error) {
            console.error('Registration error:', error);
            set({ error: error.message, isLoading: false });
            return { success: false, error: error.message };
        }
    },

    login: async (email, password) => {
        try {
            set({ isLoading: true, error: null });
            const response = await fetch('http://192.168.19.104:4000/api/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log('Server response:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Lưu thông tin user, token và role
            await AsyncStorage.setItem('token', data.token);
            await AsyncStorage.setItem('user', JSON.stringify(data.user));
            await AsyncStorage.setItem('role', data.user.role);
            
            set({ 
                user: data.user, 
                token: data.token, 
                role: data.user.role,
                isLoading: false 
            });
            return { success: true, data };
        } catch (error) {
            console.error('Login error:', error);
            set({ error: error.message, isLoading: false });
            return { success: false, error: error.message };
        }
    },

    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('role');
        set({ user: null, token: null, role: null });
    },

    clearError: () => {
        set({ error: null });
    },

    checkAuth: async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userJson = await AsyncStorage.getItem('user');
            const role = await AsyncStorage.getItem('role');
            const user = userJson ? JSON.parse(userJson) : null;

            set({ user, token, role });
        } catch (error) {
            console.error('Error checking auth:', error);
        }
    },

    // Hàm kiểm tra quyền
    isAdmin: () => {
        const state = useAuthStore.getState();
        return state.role === 'admin';
    },

    isUser: () => {
        const state = useAuthStore.getState();
        return state.role === 'user';
    }
}));

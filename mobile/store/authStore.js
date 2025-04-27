import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const ADMIN_EMAIL = "admin@gmail.com"; // thêm email admin
const ADMIN_PASSWORD = "admin123";     // thêm password admin

export const useAuthStore = create((set) => ({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    role: null, // Thêm role vào state

    initialize: async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            console.log('Initializing with stored token:', storedToken);
            
            if (storedToken) {
                // Kiểm tra token với server
                try {
                    const response = await axios.get('http://192.168.19.104:4000/api/user/get-profile', {
                        headers: {
                            'Authorization': `Bearer ${storedToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.data.success) {
                        set({ 
                            token: storedToken,
                            user: response.data.userData,
                            isAuthenticated: true
                        });
                        return storedToken;
                    } else {
                        console.log('Token validation failed');
                        await AsyncStorage.removeItem('token');
                        await AsyncStorage.removeItem('user');
                        await AsyncStorage.removeItem('role');
                        set({ token: null, user: null, isAuthenticated: false });
                        return null;
                    }
                } catch (error) {
                    console.error('Error validating token:', error);
                    await AsyncStorage.removeItem('token');
                    await AsyncStorage.removeItem('user');
                    await AsyncStorage.removeItem('role');
                    set({ token: null, user: null, isAuthenticated: false });
                    return null;
                }
            }
            return null;
        } catch (error) {
            console.error('Error initializing auth:', error);
            return null;
        }
    },

    setToken: async (newToken) => {
        try {
            console.log('Setting new token:', newToken);
            await AsyncStorage.setItem('token', newToken);
            set({ token: newToken, isAuthenticated: true });
        } catch (error) {
            console.error('Error setting token:', error);
        }
    },

    removeToken: async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('role');
            set({ token: null, user: null, isAuthenticated: false, role: null });
        } catch (error) {
            console.error('Error removing token:', error);
        }
    },

    setUser: (userData) => set({ user: userData }),

    logout: async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('role');
            set({ token: null, user: null, isAuthenticated: false, role: null });
        } catch (error) {
            console.error('Error during logout:', error);
        }
    },

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

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Registration failed');
            }

            if (data.success && data.token) {
                const userData = {
                    name,
                    email,
                    role,
                    isLoggedIn: true,
                    lastLogin: new Date().toISOString()
                };

                await AsyncStorage.setItem('token', data.token);
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                await AsyncStorage.setItem('role', role);
                
                set({ 
                    user: userData, 
                    token: data.token, 
                    role: role,
                    isLoading: false 
                });
                
                return { success: true, data };
            } else {
                throw new Error('Registration failed: Invalid server response');
            }
        } catch (error) {
            console.error('Registration error:', error);
            set({ error: error.message, isLoading: false });
            return { success: false, error: error.message };
        }
    },

    login: async (email, password) => {
        try {
            set({ isLoading: true, error: null });
            const response = await axios.post('http://192.168.19.104:4000/api/user/login', {
                email,
                password
            });

            console.log('Login response:', response.data);

            if (response.data.success && response.data.token) {
                const token = response.data.token;
                await AsyncStorage.setItem('token', token);
                
                // Xác định role
                let role = 'user';
                if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
                    role = 'admin';
                }
                
                await AsyncStorage.setItem('role', role);
                
                set({ 
                    token,
                    isAuthenticated: true,
                    role,
                    isLoading: false 
                });
                
                return { success: true, data: response.data };
            } else {
                throw new Error(response.data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            set({ error: error.message, isLoading: false });
            return { success: false, error: error.message };
        }
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

    isAdmin: () => {
        const state = useAuthStore.getState();
        return state.role === 'admin';
    },

    isUser: () => {
        const state = useAuthStore.getState();
        return state.role === 'user';
    }
}));

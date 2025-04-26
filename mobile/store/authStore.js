import {create} from 'zustand';
import AsyncStorage from './../node_modules/@react-native-async-storage/async-storage/lib/module/AsyncStorage.native';

export const useAuthStore = create((set) => ({
    user: null,
    token:null,
    isLoading: false,
    register:  async(name, email, password) =>{
        try{
            const response= await fetch('https://localhost:4000/api/user/register', {
                method: 'POST',
                headers: {
                        
                        'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                        name,
                        email,
                        password
                }),
        })

        const data = await response.json();

        if (response.ok) throw new Error(data.message || 'Registration failed');

        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        await AsyncStorage.setItem('token', data.token)

        set({token: data.token, user: data.user, isLoading: false});

        return{ success: true}
        
    } catch (error) {
        set({isLoading: false});
        return { success: false, error: error.message || 'Registration failed' };
            
        }
    }

}));
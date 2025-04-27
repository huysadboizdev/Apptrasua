import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const useCartStore = create((set, get) => ({
  cart: [],
  totalAmount: 0,
  loading: false,
  error: null,

  // Lấy giỏ hàng từ server
  fetchCart: async () => {
    try {
      set({ loading: true, error: null });
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        set({ loading: false, error: 'Vui lòng đăng nhập' });
        return;
      }

      const response = await axios.get('http://192.168.19.104:4000/api/user/get-cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        set({ 
          cart: response.data.cart.items || [],
          totalAmount: response.data.cart.totalAmount || 0,
          loading: false 
        });
      } else {
        set({ error: response.data.message, loading: false });
      }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Lỗi khi lấy giỏ hàng',
        loading: false 
      });
    }
  },

  // Thêm sản phẩm vào giỏ hàng
  addToCart: async (productId) => {
    try {
      set({ loading: true, error: null });
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        set({ loading: false, error: 'Vui lòng đăng nhập' });
        return;
      }

      const response = await axios.post('http://192.168.19.104:4000/api/user/add-to-cart',
        { productId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Cập nhật giỏ hàng sau khi thêm thành công
        get().fetchCart();
      } else {
        set({ error: response.data.message, loading: false });
      }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Lỗi khi thêm vào giỏ hàng',
        loading: false 
      });
    }
  },

  // Cập nhật số lượng sản phẩm
  updateQuantity: async (productId, quantity) => {
    try {
      set({ loading: true, error: null });
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        set({ loading: false, error: 'Vui lòng đăng nhập' });
        return;
      }

      const response = await axios.put('http://192.168.19.104:4000/api/user/edit-cart',
        { productId, quantity },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        get().fetchCart();
      } else {
        set({ error: response.data.message, loading: false });
      }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Lỗi khi cập nhật số lượng',
        loading: false 
      });
    }
  },

  // Xóa sản phẩm khỏi giỏ hàng
  removeFromCart: async (productId) => {
    try {
      set({ loading: true, error: null });
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        set({ loading: false, error: 'Vui lòng đăng nhập' });
        return;
      }

      const response = await axios.post('http://192.168.19.104:4000/api/user/remove-from-cart',
        { productId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        get().fetchCart();
      } else {
        set({ error: response.data.message, loading: false });
      }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Lỗi khi xóa khỏi giỏ hàng',
        loading: false 
      });
    }
  },

  // Đặt hàng
  checkout: async (orderData) => {
    try {
      set({ loading: true, error: null });
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        set({ loading: false, error: 'Vui lòng đăng nhập' });
        return;
      }

      const response = await axios.post('http://192.168.19.104:4000/api/user/checkout',
        orderData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Xóa giỏ hàng sau khi đặt hàng thành công
        set({ cart: [], totalAmount: 0, loading: false });
        return { success: true, order: response.data.order };
      } else {
        set({ error: response.data.message, loading: false });
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Lỗi khi đặt hàng',
        loading: false 
      });
      return { 
        success: false, 
        message: error.response?.data?.message || 'Lỗi khi đặt hàng' 
      };
    }
  },

  // Xóa lỗi
  clearError: () => set({ error: null })
}));

export default useCartStore; 
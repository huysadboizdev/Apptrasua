import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, Modal, TextInput, SafeAreaView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [note, setNote] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const router = useRouter();
  const { user } = useAuthStore();

  // Format currency
  const formatCurrency = (amount) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + 'đ';
  };

  // Calculate total amount
  const calculateTotalAmount = (items) => {
    return items.reduce((total, item) => {
      return total + (item.productId.price * item.quantity);
    }, 0);
  };

  // Fetch user info
  const fetchUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('http://192.168.19.104:4000/api/user/get-profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setUserInfo(response.data.userData);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  // Fetch cart items
  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để xem giỏ hàng');
        router.replace('/login');
        return;
      }

      const response = await axios.get('http://192.168.19.104:4000/api/user/get-cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const cartData = response.data.cart;
        setCart(cartData.items || []);
        const total = calculateTotalAmount(cartData.items || []);
        setTotalAmount(total);
      } else {
        Alert.alert('Lỗi', response.data.message || 'Không thể lấy thông tin giỏ hàng');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (error.response?.status === 401) {
        Alert.alert('Thông báo', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
        router.replace('/login');
      } else {
        Alert.alert('Lỗi', 'Không thể lấy thông tin giỏ hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchCartItems();
      fetchUserInfo();
    }, [])
  );

  // Remove item from cart
  const handleRemoveItem = async (productId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để thực hiện thao tác này');
        router.replace('/login');
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
        // Update local cart state
        const updatedCart = cart.filter(item => item.productId._id !== productId);
        setCart(updatedCart);
        // Recalculate total amount
        const total = calculateTotalAmount(updatedCart);
        setTotalAmount(total);
        Alert.alert('Thông báo', 'Đã xóa sản phẩm khỏi giỏ hàng');
      }
    } catch (error) {
      console.error('Error removing item:', error.response?.data || error.message);
      Alert.alert('Lỗi', 'Không thể xóa sản phẩm khỏi giỏ hàng');
    }
  };

  // Update quantity
  const handleUpdateQuantity = async (productId, newQuantity) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để thực hiện thao tác này');
        router.replace('/login');
        return;
      }

      const response = await axios.put('http://192.168.19.104:4000/api/user/edit-cart',
        { productId, quantity: newQuantity },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Update local cart state
        const updatedCart = cart.map(item => {
          if (item.productId._id === productId) {
            return { ...item, quantity: newQuantity };
          }
          return item;
        });
        setCart(updatedCart);
        // Recalculate total amount
        const total = calculateTotalAmount(updatedCart);
        setTotalAmount(total);
      }
    } catch (error) {
      console.error('Error updating quantity:', error.response?.data || error.message);
      Alert.alert('Lỗi', 'Không thể cập nhật số lượng sản phẩm');
    }
  };

  // Update handleCheckout to use userInfo
  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Thông báo', 'Giỏ hàng trống');
      return;
    }

    // Kiểm tra thông tin giao hàng từ userInfo
    if (!userInfo?.address || !userInfo?.phone) {
      Alert.alert(
        'Thông báo',
        'Vui lòng cập nhật đầy đủ thông tin cá nhân (số điện thoại và địa chỉ) trước khi đặt hàng',
        [
          {
            text: 'Hủy',
            style: 'cancel'
          },
          {
            text: 'Cập nhật',
            onPress: () => router.push('/profile')
          }
        ]
      );
      return;
    }

    setShowPaymentModal(true);
  };

  // Update handleConfirmOrder to use userInfo
  const handleConfirmOrder = async () => {
    try {
      setLoading(true);
      const storedToken = await AsyncStorage.getItem('token');
      
      if (!storedToken) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để đặt hàng');
        router.replace('/login');
        return;
      }

      const orderData = {
        items: cart.map(item => ({
          productId: item.productId._id,
          quantity: item.quantity,
          price: item.productId.price
        })),
        totalAmount: totalAmount,
        paymentMethod: paymentMethod,
        address: userInfo.address,
        phone: userInfo.phone,
        note: note
      };

      console.log('Order data:', orderData);

      const response = await axios.post('http://192.168.19.104:4000/api/user/checkout', orderData, {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setCart([]);
        setTotalAmount(0);
        setShowPaymentModal(false);
        setNote('');
        router.push('/order');
      } else {
        Alert.alert('Lỗi', response.data.message || 'Đặt hàng thất bại');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      if (error.response?.status === 401) {
        Alert.alert('Thông báo', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
        router.replace('/login');
      } else {
        Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  // Render cart item
  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Image source={{ uri: item.productId.image }} style={styles.image} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.productId.name}</Text>
        <Text style={styles.itemPrice}>{formatCurrency(item.productId.price)}</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => handleUpdateQuantity(item.productId._id, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Ionicons 
              name="remove-circle-outline" 
              size={24} 
              color={item.quantity <= 1 ? '#ccc' : '#4CAF50'} 
            />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => handleUpdateQuantity(item.productId._id, item.quantity + 1)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleRemoveItem(item.productId._id)}
      >
        <Ionicons name="trash-outline" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.navbar}>
            <Text style={styles.navbarTitle}>Giỏ Hàng</Text>
          </View>
          <ActivityIndicator size="large" color="#4CAF50" style={styles.loading} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.navbar}>
          <Text style={styles.navbarTitle}>Giỏ Hàng</Text>
        </View>
        <FlatList
          data={cart}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.emptyCart}>Giỏ hàng trống</Text>}
          contentContainerStyle={styles.listContent}
        />
        {cart.length > 0 && (
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutText}>Đặt Hàng</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={showPaymentModal}
          onRequestClose={() => setShowPaymentModal(false)}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContainer}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Thông tin đặt hàng</Text>
                  
                  {/* Thông tin giao hàng */}
                  <View style={styles.deliveryInfo}>
                    <Text style={styles.deliveryTitle}>Thông tin giao hàng</Text>
                    <View style={styles.deliveryDetail}>
                      <Text style={styles.deliveryLabel}>Địa chỉ:</Text>
                      <Text style={styles.deliveryValue}>{userInfo?.address}</Text>
                    </View>
                    <View style={styles.deliveryDetail}>
                      <Text style={styles.deliveryLabel}>Số điện thoại:</Text>
                      <Text style={styles.deliveryValue}>{userInfo?.phone}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.updateProfileButton}
                      onPress={() => {
                        setShowPaymentModal(false);
                        router.push('/profile');
                      }}
                    >
                      <Text style={styles.updateProfileText}>Cập nhật thông tin</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Ghi chú */}
                  <Text style={styles.noteLabel}>Ghi chú cho đơn hàng:</Text>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Nhập ghi chú (nếu có)"
                    placeholderTextColor="#666"
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={4}
                  />

                  <Text style={styles.modalTitle}>Chọn phương thức thanh toán</Text>
                  <View style={styles.paymentOptions}>
                    <TouchableOpacity
                      style={[styles.paymentOption, paymentMethod === 'COD' && styles.selectedPayment]}
                      onPress={() => setPaymentMethod('COD')}
                    >
                      <Text style={styles.paymentText}>Thanh toán khi nhận hàng</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.paymentOption, paymentMethod === 'QR' && styles.selectedPayment]}
                      onPress={() => setPaymentMethod('QR')}
                    >
                      <Text style={styles.paymentText}>Thanh toán qua QR Code</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => {
                        setShowPaymentModal(false);
                        setNote('');
                      }}
                    >
                      <Text style={styles.buttonText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.confirmButton]}
                      onPress={handleConfirmOrder}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Xác nhận đặt hàng</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default Cart;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  navbar: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    height: 44,
  },
  navbarTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContent: {
    padding: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  image: {
    width: 80,
    height: 80,
    marginRight: 10,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  itemPrice: {
    color: '#4CAF50',
    fontSize: 16,
    marginBottom: 5,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  quantityButton: {
    padding: 5,
  },
  quantityText: {
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 8,
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'white',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyCart: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: '#777',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  deliveryInfo: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  deliveryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  deliveryDetail: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  deliveryLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
    fontWeight: '500',
  },
  deliveryValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  updateProfileButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    alignItems: 'center',
  },
  updateProfileText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  paymentOptions: {
    marginBottom: 20,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedPayment: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f9f0',
  },
  paymentText: {
    marginLeft: 10,
    fontSize: 16,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

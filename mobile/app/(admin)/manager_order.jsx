import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, Alert, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Manager_order() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(null);

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get('http://192.168.19.104:4000/api/admin/get-all-orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        const sortedOrders = response.data.orders.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrders(sortedOrders);
        if (sortedOrders.length > 0) {
          setLastOrderId(sortedOrders[0]._id);
        }
      }
    } catch (error) {
      console.log('Error fetching orders:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    const interval = setInterval(() => {
      checkNewOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, [lastOrderId]);

  const checkNewOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get('http://192.168.19.104:4000/api/admin/get-all-orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success && response.data.orders.length > 0) {
        const latestOrder = response.data.orders[0];
        
        if (!lastOrderId || latestOrder._id !== lastOrderId) {
          setLastOrderId(latestOrder._id);
          setOrders(response.data.orders);
          
          Alert.alert(
            'Thông báo',
            'Có đơn hàng mới!',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.log('Error checking new orders:', error);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Updating order status:', { orderId, newStatus });
      
      const response = await axios.post('http://192.168.19.104:4000/api/admin/update-order-status', 
        { orderId, status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Update status response:', response.data);

      if (response.data.success) {
        // Cập nhật trạng thái đơn hàng trong danh sách
        setOrders(orders.map(order => 
          order._id === orderId 
            ? { ...order, status: newStatus }
            : order
        ));

        // Hiển thị thông báo khi đơn hàng được xác nhận
        if (newStatus === 'Accepted') {
          Alert.alert(
            'Thông báo',
            'Đơn hàng đã được xác nhận',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Gửi thông báo đến user
                  axios.post('http://192.168.19.104:4000/api/admin/notify-user', 
                    { orderId, message: 'Đơn hàng của bạn đã được xác nhận' },
                    {
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    }
                  ).then(res => {
                    console.log('Notification sent:', res.data);
                  }).catch(err => {
                    console.error('Error sending notification:', err);
                  });
                }
              }
            ]
          );
        } else {
          Alert.alert('Thành công', 'Đã cập nhật trạng thái đơn hàng');
        }
      } else {
        Alert.alert('Lỗi', response.data.message || 'Không thể cập nhật trạng thái');
      }
    } catch (error) {
      console.log('Error updating order status:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const handleViewDetails = async (orderId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`http://192.168.19.104:4000/api/admin/get-order-by-id/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        const order = response.data.order;
        console.log('Full order data:', JSON.stringify(order, null, 2));
        console.log('Raw note value:', order.note);
        console.log('Note exists:', order.hasOwnProperty('note'));
        console.log('Note is string:', typeof order.note === 'string');
        console.log('Note is not empty:', order.note && order.note.trim().length > 0);
        
        setSelectedOrder(order);
        setModalVisible(true);
      }
    } catch (error) {
      console.log('Error fetching order details:', error);
      Alert.alert('Lỗi', 'Không thể xem chi tiết đơn hàng');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Deleting order:', orderId);
      console.log('Using token:', token);

      const response = await axios.post('http://192.168.19.104:4000/api/admin/delete-order', 
        { orderId },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Delete order response:', response.data);

      if (response.data.success) {
        // Cập nhật danh sách đơn hàng sau khi xóa
        const updatedOrders = orders.filter(order => order._id !== orderId);
        console.log('Updated orders list:', updatedOrders);
        setOrders(updatedOrders);
        Alert.alert('Thành công', 'Đã xóa đơn hàng thành công');
      } else {
        Alert.alert('Lỗi', response.data.message || 'Không thể xóa đơn hàng');
      }
    } catch (error) {
      console.log('Error deleting order:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 401) {
        Alert.alert('Lỗi', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
      } else if (error.response?.status === 404) {
        Alert.alert('Lỗi', 'Không tìm thấy đơn hàng');
      } else {
        Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi xóa đơn hàng');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return COLORS.orange;
      case 'Accepted':
        return COLORS.blue;
      case 'Delivery':
        return COLORS.primary;
      case 'Successful':
        return COLORS.green;
      case 'Cancelled':
        return COLORS.red;
      default:
        return COLORS.gray;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Pending':
        return 'Chờ xác nhận';
      case 'Accepted':
        return 'Xác nhận đơn hàng';
      case 'Delivery':
        return 'Đơn hàng đang giao';
      case 'Successful':
        return 'Đã giao hàng thành công';
      case 'Cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Đơn hàng #{item._id.slice(-6)}</Text>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          {getStatusText(item.status)}
        </Text>
      </View>
      
      <View style={styles.orderInfo}>
        <Text style={styles.infoText}>
          Ngày đặt: {new Date(item.createdAt).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
        <Text style={styles.infoText}>Tổng tiền: {item.totalAmount.toLocaleString()}đ</Text>
        <Text style={styles.infoText}>Phương thức: {item.paymentMethod}</Text>
        <View style={styles.noteContainer}>
          <Text style={styles.noteLabel}>Ghi chú:</Text>
          <Text style={styles.noteText}>
            {item.note && item.note.trim().length > 0 
              ? item.note 
              : 'Không có ghi chú'}
          </Text>
        </View>
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewDetails(item._id)}
        >
          <Ionicons name="eye-outline" size={24} color={COLORS.primary} />
          <Text style={styles.actionText}>Chi tiết</Text>
        </TouchableOpacity>

        {item.status === 'Pending' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleUpdateStatus(item._id, 'Accepted')}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.blue} />
            <Text style={[styles.actionText, { color: COLORS.blue }]}>Xác nhận đơn hàng</Text>
          </TouchableOpacity>
        )}

        {item.status === 'Accepted' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.deliverButton]}
            onPress={() => handleUpdateStatus(item._id, 'Delivery')}
          >
            <Ionicons name="bicycle-outline" size={24} color={COLORS.primary} />
            <Text style={[styles.actionText, { color: COLORS.primary }]}>Đơn hàng đang giao</Text>
          </TouchableOpacity>
        )}

        {item.status === 'Delivery' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleUpdateStatus(item._id, 'Successful')}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.green} />
            <Text style={[styles.actionText, { color: COLORS.green }]}>Đã giao hàng thành công</Text>
          </TouchableOpacity>
        )}

        {(item.status === 'Pending' || item.status === 'Accepted') && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleUpdateStatus(item._id, 'Cancelled')}
          >
            <Ionicons name="close-circle-outline" size={24} color={COLORS.red} />
            <Text style={[styles.actionText, { color: COLORS.red }]}>Hủy</Text>
          </TouchableOpacity>
        )}

        {item.status === 'Cancelled' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => {
              Alert.alert(
                'Xác nhận xóa',
                'Bạn có chắc chắn muốn xóa đơn hàng này?',
                [
                  {
                    text: 'Hủy',
                    style: 'cancel'
                  },
                  {
                    text: 'Xóa',
                    onPress: () => handleDeleteOrder(item._id)
                  }
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={24} color={COLORS.red} />
            <Text style={[styles.actionText, { color: COLORS.red }]}>Xóa</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản Lý Đơn Hàng</Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chi tiết đơn hàng</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailsContainer}>
                  <Text style={styles.detailTitle}>Thông tin khách hàng</Text>
                  {selectedOrder.userId && (
                    <>
                      <Text style={styles.detailText}>Tên: {selectedOrder.userId.name}</Text>
                      <Text style={styles.detailText}>Email: {selectedOrder.userId.email}</Text>
                    </>
                  )}
                  <Text style={styles.detailText}>Địa chỉ: {selectedOrder.address}</Text>
                  <Text style={styles.detailText}>SĐT: {selectedOrder.phone}</Text>
                  
                  <Text style={styles.detailTitle}>Ghi chú đơn hàng</Text>
                  <View style={styles.noteContainer}>
                    <Text style={styles.noteText}>
                      {selectedOrder?.note && selectedOrder.note.trim().length > 0 
                        ? selectedOrder.note 
                        : 'Không có ghi chú'}
                    </Text>
                  </View>

                  <Text style={styles.detailTitle}>Sản phẩm</Text>
                  {selectedOrder.items.map((item, index) => (
                    <View key={index} style={styles.productItem}>
                      <Text style={styles.productName}>{item.productId.name}</Text>
                      <Text style={styles.productQuantity}>x{item.quantity}</Text>
                      <Text style={styles.productPrice}>
                        {(item.price * item.quantity).toLocaleString()}đ
                      </Text>
                    </View>
                  ))}

                  <View style={styles.totalContainer}>
                    <Text style={styles.totalText}>Tổng cộng:</Text>
                    <Text style={styles.totalAmount}>
                      {selectedOrder.totalAmount.toLocaleString()}đ
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  orderItem: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  orderInfo: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    marginLeft: 4,
    color: COLORS.primary,
  },
  completeButton: {
    backgroundColor: COLORS.lightGreen,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.lightRed,
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  detailsContainer: {
    marginTop: 16,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  productQuantity: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginHorizontal: 16,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  acceptButton: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 8,
  },
  deliverButton: {
    backgroundColor: COLORS.lightPrimary,
    borderRadius: 8,
  },
  noteContainer: {
    backgroundColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: COLORS.textPrimary,
  },
  noteText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  deleteButton: {
    backgroundColor: COLORS.lightRed,
    borderRadius: 8,
  },
});
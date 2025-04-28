import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Manager_user() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get('http://192.168.19.104:4000/api/admin/get-all-user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setUsers(response.data.users);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.log('Error fetching users:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const checkForUpdates = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get('http://192.168.19.104:4000/api/admin/get-all-user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const newUsers = response.data.users;
        const currentUserIds = users.map(user => user._id);
        const newUserIds = newUsers.map(user => user._id);

        // Kiểm tra xem có người dùng mới hoặc cập nhật không
        if (newUserIds.length !== currentUserIds.length || 
            newUserIds.some(id => !currentUserIds.includes(id)) ||
            newUsers.some((user, index) => {
              const currentUser = users.find(u => u._id === user._id);
              return currentUser && JSON.stringify(currentUser) !== JSON.stringify(user);
            })) {
          setUsers(newUsers);
          setLastUpdate(new Date());
        }
      }
    } catch (error) {
      console.log('Error checking for updates:', error);
    }
  };

  const fetchUserOrders = async (userId) => {
    try {
      setLoadingOrders(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`http://192.168.19.104:4000/api/admin/get-user-orders/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setTotalOrders(response.data.orders.length);
        setTotalAmount(response.data.totalAmount);
      }
    } catch (error) {
      console.log('Error fetching user orders:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin đơn hàng');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Kiểm tra cập nhật mỗi 30 giây
    intervalRef.current = setInterval(checkForUpdates, 30000);

    // Cleanup interval khi component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleDeleteUser = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post('http://192.168.19.104:4000/api/admin/delete-user', 
        { userId },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setUsers(users.filter(user => user._id !== userId));
        Alert.alert('Thành công', 'Đã xóa người dùng thành công');
      }
    } catch (error) {
      console.log('Error deleting user:', error);
      Alert.alert('Lỗi', 'Không thể xóa người dùng');
    }
  };

  const handleViewDetails = async (user) => {
    setSelectedUser(user);
    setModalVisible(true);
    await fetchUserOrders(user._id);
  };

  const renderUser = ({ item }) => (
    <View style={styles.userItem}>
      <View style={styles.userHeader}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={[styles.role, { color: item.role === 'admin' ? COLORS.primary : COLORS.blue }]}>
          {item.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
        </Text>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.infoText}>Email: {item.email}</Text>
        <Text style={styles.infoText}>SĐT: {item.phone}</Text>
        <Text style={styles.infoText}>Địa chỉ: {item.address}</Text>
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewDetails(item)}
        >
          <Ionicons name="eye-outline" size={24} color={COLORS.primary} />
          <Text style={styles.actionText}>Chi tiết</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => {
            Alert.alert(
              'Xác nhận xóa',
              'Bạn có chắc chắn muốn xóa người dùng này?',
              [
                {
                  text: 'Hủy',
                  style: 'cancel'
                },
                {
                  text: 'Xóa',
                  onPress: () => handleDeleteUser(item._id)
                }
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={24} color={COLORS.red} />
          <Text style={[styles.actionText, { color: COLORS.red }]}>Xóa</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Quản Lý Người Dùng</Text>
        {lastUpdate && (
          <Text style={styles.lastUpdate}>
            Cập nhật lần cuối: {lastUpdate.toLocaleTimeString('vi-VN')}
          </Text>
        )}
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
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
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chi tiết người dùng</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailsContainer}>
                  <Text style={styles.detailTitle}>Thông tin cá nhân</Text>
                  <Text style={styles.detailText}>Tên: {selectedUser.name}</Text>
                  <Text style={styles.detailText}>Email: {selectedUser.email}</Text>
                  <Text style={styles.detailText}>SĐT: {selectedUser.phone}</Text>
                  <Text style={styles.detailText}>Địa chỉ: {selectedUser.address}</Text>
                  <Text style={styles.detailText}>Vai trò: {selectedUser.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}</Text>
                </View>

                <View style={styles.ordersContainer}>
                  <Text style={styles.detailTitle}>Thống kê đơn hàng</Text>
                  
                  {loadingOrders ? (
                    <View style={styles.loadingOrders}>
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    </View>
                  ) : (
                    <>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Tổng số đơn hàng:</Text>
                        <Text style={styles.statValue}>{totalOrders}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Tổng tiền:</Text>
                        <Text style={styles.statValue}>{totalAmount.toLocaleString('vi-VN')}đ</Text>
                      </View>
                    </>
                  )}
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
  userItem: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  role: {
    fontSize: 14,
    fontWeight: '500',
  },
  userInfo: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  userActions: {
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
  deleteButton: {
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
  ordersContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  loadingOrders: {
    padding: 16,
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
  },
});
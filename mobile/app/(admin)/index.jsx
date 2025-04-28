import { View, Text, StyleSheet, ScrollView, ActivityIndicator, FlatList } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ThongKe() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0,
    recentOrders: [],
    recentUsers: [],
    recentProducts: []
  });

  const fetchStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await axios.get('http://192.168.19.104:4000/api/admin/get-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setStats({
          totalOrders: response.data.totalOrders,
          totalRevenue: response.data.totalRevenue,
          totalUsers: response.data.totalUsers,
          totalProducts: response.data.totalProducts,
          recentOrders: response.data.recentOrders || [],
          recentUsers: response.data.recentUsers || [],
          recentProducts: response.data.recentProducts || []
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>Đơn hàng #{item._id.slice(-6)}</Text>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          {getStatusText(item.status)}
        </Text>
      </View>
      <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      <Text style={styles.amount}>{formatCurrency(item.totalAmount)}</Text>
    </View>
  );

  const renderUserItem = ({ item }) => (
    <View style={styles.listItem}>
      <Text style={styles.itemTitle}>{item.name}</Text>
      <Text style={styles.date}>Đăng ký: {formatDate(item.createdAt)}</Text>
      <Text style={styles.email}>{item.email}</Text>
    </View>
  );

  const renderProductItem = ({ item }) => (
    <View style={styles.listItem}>
      <Text style={styles.itemTitle}>{item.name}</Text>
      <Text style={styles.price}>{formatCurrency(item.price)}</Text>
      <Text style={styles.stock}>Tồn kho: {item.stock}</Text>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#FFA500';
      case 'Accepted': return '#4CAF50';
      case 'Delivery': return '#2196F3';
      case 'Successful': return '#4CAF50';
      case 'Cancelled': return '#FF5252';
      default: return '#000000';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Pending': return 'Đang chờ xác nhận';
      case 'Accepted': return 'Đã xác nhận';
      case 'Delivery': return 'Đang giao hàng';
      case 'Successful': return 'Đã giao hàng thành công';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trang Quản Trị</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsItem}>
          <Ionicons name="stats-chart-outline" size={24} color={COLORS.primary} />
          <Text style={styles.statsText}>Tổng số đơn hàng</Text>
          <Text style={styles.statsNumber}>{stats.totalOrders}</Text>
        </View>
        <View style={styles.statsItem}>
          <Ionicons name="cash-outline" size={24} color={COLORS.primary} />
          <Text style={styles.statsText}>Doanh thu</Text>
          <Text style={styles.statsNumber}>{formatCurrency(stats.totalRevenue)}</Text>
        </View>
        <View style={styles.statsItem}>
          <Ionicons name="people-outline" size={24} color={COLORS.primary} />
          <Text style={styles.statsText}>Người dùng</Text>
          <Text style={styles.statsNumber}>{stats.totalUsers}</Text>
        </View>
        <View style={styles.statsItem}>
          <Ionicons name="fast-food-outline" size={24} color={COLORS.primary} />
          <Text style={styles.statsText}>Sản phẩm</Text>
          <Text style={styles.statsNumber}>{stats.totalProducts}</Text>
        </View>
      </View>

      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  statsContainer: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsItem: {
    width: '48%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  statsNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 4,
  },
  section: {
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    marginBottom: 16,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
  listItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  amount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  email: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  stock: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
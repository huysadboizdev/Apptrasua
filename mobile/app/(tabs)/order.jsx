import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, Alert, TouchableOpacity, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/formatCurrency';
import axios from 'axios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';
import { SIZES } from '../../constants/sizes';

// Hàm format ngày tháng
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const OrderScreen = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuthStore();
    const router = useRouter();

    const fetchOrders = async () => {
        try {
            setLoading(true);
            
            // Lấy token từ AsyncStorage
            const storedToken = await AsyncStorage.getItem('token');
            console.log('Stored token:', storedToken);
            
            if (!storedToken) {
                Alert.alert('Thông báo', 'Vui lòng đăng nhập để xem đơn hàng');
                router.replace('/login');
                return;
            }

            // Gọi API lấy danh sách đơn hàng
            console.log('Calling API to get orders...');
            const response = await axios.get('http://192.168.19.104:4000/api/user/get-orders', {
                headers: {
                    'Authorization': `Bearer ${storedToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log('Full API response:', response);
            console.log('Orders data:', response.data);

            if (response.data.success) {
                // Lọc bỏ các đơn hàng đã hủy và sắp xếp theo thời gian mới nhất
                const filteredOrders = response.data.orders
                    .filter(order => order.status !== 'Cancelled')
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                console.log('Filtered orders:', filteredOrders);
                setOrders(filteredOrders);
            } else {
                console.error('Error fetching orders:', response.data.message);
                Alert.alert('Lỗi', response.data.message || 'Không thể lấy danh sách đơn hàng');
            }
        } catch (error) {
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            });

            if (error.response?.status === 401) {
                Alert.alert('Thông báo', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
                router.replace('/login');
            } else if (error.message === 'Network Error') {
                Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng');
            } else {
                Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi lấy danh sách đơn hàng');
            }
        } finally {
            setLoading(false);
        }
    };

    // Kiểm tra token khi component mount
    React.useEffect(() => {
        const checkToken = async () => {
            const storedToken = await AsyncStorage.getItem('token');
            console.log('Initial token check:', storedToken);
            if (!storedToken) {
                Alert.alert('Thông báo', 'Vui lòng đăng nhập để xem đơn hàng');
                router.replace('/login');
            }
        };
        checkToken();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            fetchOrders();
        }, [])
    );

    // Thêm hàm kiểm tra trạng thái đơn hàng
    const checkOrderStatus = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            if (!storedToken) return;

            console.log('Checking order status...');
            
            const response = await axios.get('http://192.168.19.104:4000/api/user/get-orders', {
                headers: {
                    'Authorization': `Bearer ${storedToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.data.success) {
                const newOrders = response.data.orders;
                const oldOrders = orders;

                console.log('Current orders:', oldOrders);
                console.log('New orders:', newOrders);

                // Kiểm tra từng đơn hàng để xem trạng thái có thay đổi không
                newOrders.forEach(newOrder => {
                    const oldOrder = oldOrders.find(o => o._id === newOrder._id);
                    
                    if (oldOrder) {
                        console.log('Comparing order:', {
                            orderId: newOrder._id,
                            oldStatus: oldOrder.status,
                            newStatus: newOrder.status
                        });

                        if (oldOrder.status !== newOrder.status) {
                            console.log('Status changed:', {
                                orderId: newOrder._id,
                                from: oldOrder.status,
                                to: newOrder.status
                            });

                            // Hiển thị thông báo tương ứng với trạng thái mới
                            switch (newOrder.status) {
                                case 'Accepted':
                                    Alert.alert(
                                        'Thông báo',
                                        'Đơn hàng của bạn đã được xác nhận',
                                        [{ text: 'OK' }]
                                    );
                                    break;
                                case 'Delivery':
                                    Alert.alert(
                                        'Thông báo',
                                        'Đơn hàng của bạn đang được giao',
                                        [{ text: 'OK' }]
                                    );
                                    break;
                                case 'Successful':
                                    Alert.alert(
                                        'Thông báo',
                                        'Đơn hàng của bạn đã được giao thành công',
                                        [{ text: 'OK' }]
                                    );
                                    break;
                                case 'Cancelled':
                                    Alert.alert(
                                        'Thông báo',
                                        'Đơn hàng của bạn đã bị hủy',
                                        [{ text: 'OK' }]
                                    );
                                    break;
                            }
                        }
                    }
                });

                setOrders(newOrders);
            }
        } catch (error) {
            console.error('Error checking order status:', error);
        }
    };

    // Thêm interval để kiểm tra trạng thái đơn hàng mỗi 10 giây
    useEffect(() => {
        const interval = setInterval(() => {
            checkOrderStatus();
        }, 10000); // Giảm thời gian kiểm tra xuống 10 giây

        return () => clearInterval(interval);
    }, [orders]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
                return '#FFA500';
            case 'Completed':
                return '#4CAF50';
            case 'Cancelled':
                return '#FF0000';
            default:
                return '#000000';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'Pending':
                return 'Đang chờ xác nhận';
            case 'Accepted':
                return 'Đã xác nhận';
            case 'Delivery':
                return 'Đang giao hàng';
            case 'Successful':
                return 'Đã giao hàng thành công';
            case 'Cancelled':
                return 'Đã hủy';
            default:
                return status;
        }
    };

    const handleCancelOrder = async (orderId) => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            if (!storedToken) {
                Alert.alert('Thông báo', 'Vui lòng đăng nhập để thực hiện thao tác này');
                router.replace('/login');
                return;
            }

            console.log('Attempting to cancel order:', orderId);
            console.log('Using token:', storedToken);

            const response = await axios.post(
                `http://192.168.19.104:4000/api/user/cancel-order/${orderId}`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${storedToken}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('Cancel order response:', response.data);

            if (response.data.success) {
                // Cập nhật trạng thái đơn hàng trong state
                setOrders(orders.map(order => 
                    order._id === orderId 
                        ? { ...order, status: 'Cancelled' }
                        : order
                ));
                Alert.alert('Thông báo', 'Đã hủy đơn hàng thành công');
            } else {
                Alert.alert('Lỗi', response.data.message || 'Không thể hủy đơn hàng');
            }
        } catch (error) {
            console.error('Cancel order error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            });

            if (error.response?.status === 404) {
                Alert.alert('Lỗi', 'Không tìm thấy đơn hàng hoặc không thể hủy đơn hàng này');
            } else if (error.response?.status === 400) {
                Alert.alert('Lỗi', error.response.data.message || 'Đơn hàng này đã được hủy trước đó');
            } else if (error.response?.status === 500) {
                Alert.alert('Lỗi', 'Lỗi máy chủ. Vui lòng thử lại sau');
            } else {
                Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn hàng');
            }
        }
    };

    const handleReorder = async (order) => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            if (!storedToken) {
                Alert.alert('Thông báo', 'Vui lòng đăng nhập để thực hiện thao tác này');
                router.replace('/login');
                return;
            }

            console.log('Attempting to reorder:', order._id);
            console.log('Order items:', order.items);

            // Thêm từng sản phẩm vào giỏ hàng
            for (const item of order.items) {
                console.log('Adding item to cart:', item.productId._id);
                
                const response = await axios.post(
                    'http://192.168.19.104:4000/api/user/add-to-cart',
                    { productId: item.productId._id },
                    {
                        headers: {
                            'Authorization': `Bearer ${storedToken}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    }
                );

                console.log('Add to cart response:', response.data);

                if (!response.data.success) {
                    throw new Error(response.data.message || 'Không thể thêm sản phẩm vào giỏ hàng');
                }

                // Nếu số lượng > 1, cập nhật số lượng
                if (item.quantity > 1) {
                    const editResponse = await axios.put(
                        'http://192.168.19.104:4000/api/user/edit-cart',
                        { 
                            productId: item.productId._id,
                            quantity: item.quantity 
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${storedToken}`,
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            }
                        }
                    );

                    console.log('Edit cart response:', editResponse.data);

                    if (!editResponse.data.success) {
                        throw new Error(editResponse.data.message || 'Không thể cập nhật số lượng sản phẩm');
                    }
                }
            }

            Alert.alert(
                'Thông báo',
                'Đã thêm sản phẩm vào giỏ hàng',
                [
                    {
                        text: 'Xem giỏ hàng',
                        onPress: () => router.push('/cart')
                    },
                    {
                        text: 'Tiếp tục mua sắm',
                        style: 'cancel'
                    }
                ]
            );
        } catch (error) {
            console.error('Reorder error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            });

            if (error.response?.status === 401) {
                Alert.alert('Thông báo', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
                router.replace('/login');
            } else if (error.response?.status === 400) {
                Alert.alert('Lỗi', error.response.data.message || 'Không thể thêm sản phẩm vào giỏ hàng');
            } else if (error.response?.status === 500) {
                Alert.alert('Lỗi', 'Lỗi máy chủ. Vui lòng thử lại sau');
            } else {
                Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi đặt lại đơn hàng');
            }
        }
    };

    const renderOrderItem = ({ item }) => {
        console.log('Rendering order item:', item);
        console.log('Delivery info:', {
            address: item.address,
            phone: item.phone,
            note: item.note
        });
        
        return (
            <View style={styles.orderItem}>
                <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>Đơn hàng #{item._id.slice(-6)}</Text>
                    <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
                        {getStatusText(item.status)}
                    </Text>
                </View>
                
                <Text style={styles.date}>Ngày đặt: {formatDate(item.createdAt)}</Text>
                
                <View style={styles.itemsContainer}>
                    {item.items.map((orderItem, index) => {
                        console.log('Order item details:', orderItem);
                        return (
                            <View key={index} style={styles.itemRow}>
                                <Image 
                                    source={{ uri: orderItem.productId?.image }} 
                                    style={styles.itemImage}
                                />
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{orderItem.productId?.name}</Text>
                                    <View style={styles.itemDetails}>
                                        <Text style={styles.itemQuantity}>x{orderItem.quantity}</Text>
                                        <Text style={styles.itemPrice}>{formatCurrency(orderItem.price * orderItem.quantity)}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>

                <View style={styles.orderFooter}>
                    <Text style={styles.totalLabel}>Tổng tiền:</Text>
                    <Text style={styles.totalAmount}>{formatCurrency(item.totalAmount)}</Text>
                </View>

                <View style={styles.paymentInfo}>
                    <Text style={styles.paymentMethod}>
                        Phương thức thanh toán: {item.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Thanh toán qua QR Code'}
                    </Text>
                    
                    {/* Thông tin giao hàng */}
                    <View style={styles.deliveryInfo}>
                        <Text style={styles.deliveryTitle}>Thông tin giao hàng</Text>
                        <View style={styles.deliveryDetail}>
                            <Text style={styles.deliveryLabel}>Địa chỉ:</Text>
                            <Text style={styles.deliveryValue}>{item.address || 'Chưa có địa chỉ'}</Text>
                        </View>
                        <View style={styles.deliveryDetail}>
                            <Text style={styles.deliveryLabel}>Số điện thoại:</Text>
                            <Text style={styles.deliveryValue}>{item.phone || 'Chưa có số điện thoại'}</Text>
                        </View>
                    </View>

                    {/* Ghi chú đơn hàng */}
                    <View style={styles.noteContainer}>
                        <Text style={styles.noteLabel}>Ghi chú:</Text>
                        <Text style={styles.noteText}>
                            {item.note && item.note.trim().length > 0 
                                ? item.note 
                                : 'Không có ghi chú'}
                        </Text>
                    </View>
                </View>

                {/* Nút hủy đơn hàng và đặt lại */}
                {item.status === 'Pending' && (
                    <View style={styles.orderActions}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={() => {
                                Alert.alert(
                                    'Xác nhận',
                                    'Bạn có chắc chắn muốn hủy đơn hàng này?',
                                    [
                                        {
                                            text: 'Hủy',
                                            style: 'cancel'
                                        },
                                        {
                                            text: 'Xác nhận',
                                            onPress: () => handleCancelOrder(item._id)
                                        }
                                    ]
                                );
                            }}
                        >
                            <Text style={styles.actionButtonText}>Hủy đơn hàng</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.reorderButton]}
                            onPress={() => handleReorder(item)}
                        >
                            <Text style={styles.actionButtonText}>Đặt lại</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Navigation Bar */}
            <View style={styles.navbar}>
                <View style={styles.navbarLeft}>
                    <Ionicons name="list" size={28} color="#fff" />
                    <Text style={styles.navbarTitle}>Đơn hàng của tôi</Text>
                </View>
                <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={fetchOrders}
                    disabled={loading}
                >
                    <Ionicons 
                        name="refresh" 
                        size={24} 
                        color="#fff" 
                    />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                </View>
            ) : orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="cart-outline" size={64} color="#CCCCCC" />
                    <Text style={styles.emptyText}>Bạn chưa có đơn hàng nào</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContainer}
                    refreshing={loading}
                    onRefresh={fetchOrders}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.lightWhite,
    },
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.medium,
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: SIZES.medium,
        backgroundColor: COLORS.primary,
        borderBottomLeftRadius: SIZES.radius,
        borderBottomRightRadius: SIZES.radius,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        height: 150,
    },
    navbarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SIZES.small,
    },
    navbarTitle: {
        fontSize: SIZES.h3,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    refreshButton: {
        padding: SIZES.small,
        backgroundColor: 'transparent',
        borderRadius: SIZES.radius,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#666666',
        marginTop: 16,
        textAlign: 'center',
    },
    listContainer: {
        padding: 16,
    },
    orderItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
    },
    status: {
        fontSize: 14,
        fontWeight: '500',
    },
    date: {
        fontSize: 12,
        color: '#666',
        marginBottom: 12,
    },
    itemsContainer: {
        marginBottom: 12,
    },
    itemRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    itemDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemQuantity: {
        fontSize: 14,
        color: '#666',
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4CAF50',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 12,
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    paymentInfo: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    paymentMethod: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    deliveryInfo: {
        backgroundColor: '#f8f8f8',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
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
    noteContainer: {
        backgroundColor: '#f8f8f8',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    noteLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
    },
    noteText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    orderActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    actionButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    cancelButton: {
        backgroundColor: '#FF5252',
    },
    reorderButton: {
        backgroundColor: '#4CAF50',
    },
    actionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default OrderScreen;
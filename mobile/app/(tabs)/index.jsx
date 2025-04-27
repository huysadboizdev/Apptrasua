import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, Alert, SafeAreaView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from '../../store/authStore';
import COLORS from '../../constants/colors';
import { STRINGS } from '../../constants/strings';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORIES = [
  {
    id: 'all',
    name: STRINGS.CATEGORIES.ALL,
    icon: 'apps-outline',
    subcategories: []
  },
  {
    id: 'coffee',
    name: STRINGS.CATEGORIES.COFFEE,
    icon: 'cafe-outline',
    subcategories: [
      STRINGS.SUB_CATEGORIES.COFFEE.BLACK,
      STRINGS.SUB_CATEGORIES.COFFEE.MILK,
      STRINGS.SUB_CATEGORIES.COFFEE.EGG,
      STRINGS.SUB_CATEGORIES.COFFEE.COCONUT
    ]
  },
  {
    id: 'milk-tea',
    name: STRINGS.CATEGORIES.MILK_TEA,
    icon: 'water-outline',
    subcategories: [
      STRINGS.SUB_CATEGORIES.MILK_TEA.PEARL,
      STRINGS.SUB_CATEGORIES.MILK_TEA.THAI,
      STRINGS.SUB_CATEGORIES.MILK_TEA.MATCHA,
      STRINGS.SUB_CATEGORIES.MILK_TEA.OOLONG
    ]
  },
  {
    id: 'cakes',
    name: STRINGS.CATEGORIES.CAKES,
    icon: 'restaurant-outline',
    subcategories: [
      STRINGS.SUB_CATEGORIES.CAKES.SWEET,
      STRINGS.SUB_CATEGORIES.CAKES.CREAM,
      STRINGS.SUB_CATEGORIES.CAKES.BREAD,
      STRINGS.SUB_CATEGORIES.CAKES.COOKIES
    ]
  }
];

export default function Home() {
  const { token, initialize } = useAuthStore();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [cartItems, setCartItems] = useState({});

  useEffect(() => {
    const init = async () => {
      await initialize();
    };
    init();
  }, []);

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      if (!token) {
        console.log('No token available, redirecting to login');
        router.push('/login');
        return;
      }

      const response = await axios.get('http://192.168.19.104:4000/api/user/get-all-products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setProducts(response.data.products);
        setFilteredProducts(response.data.products);
      } else {
        console.error(STRINGS.ERRORS.SERVER_ERROR, response.data.message);
        if (response.data.message === 'Not Authorized Login Again') {
          Alert.alert(
            'Phiên đăng nhập hết hạn',
            'Vui lòng đăng nhập lại',
            [
              {
                text: 'Đăng nhập',
                onPress: () => router.push('/login')
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error(STRINGS.ERRORS.NETWORK_ERROR, error);
      if (error.response?.status === 401) {
        Alert.alert(
          'Phiên đăng nhập hết hạn',
          'Vui lòng đăng nhập lại',
          [
            {
              text: 'Đăng nhập',
              onPress: () => router.push('/login')
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (selectedCategory && selectedCategory !== 'all') {
      // Lọc theo category
      switch (selectedCategory) {
        case 'coffee':
          filtered = filtered.filter(product => 
            product.name.toLowerCase().includes('cà phê') || 
            product.name.toLowerCase().includes('coffee')
          );
          break;
        case 'milk-tea':
          filtered = filtered.filter(product => 
            product.name.toLowerCase().includes('trà sữa') || 
            product.name.toLowerCase().includes('trà')
          );
          break;
        case 'cakes':
          filtered = filtered.filter(product => 
            product.name.toLowerCase().includes('bánh') || 
            product.name.toLowerCase().includes('cake')
          );
          break;
        default:
          filtered = filtered.filter(product => product.category === selectedCategory);
      }

      // Lọc theo subcategory nếu có
      if (selectedSubcategory) {
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(selectedSubcategory.toLowerCase())
        );
      }
    }

    setFilteredProducts(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [selectedCategory, selectedSubcategory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleAddToCart = async (productId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
        return;
      }

      const response = await axios.post(
        'http://192.168.19.104:4000/api/user/add-to-cart',
        { productId, quantity: 1 },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        Alert.alert('Thông báo', 'Đã thêm sản phẩm vào giỏ hàng');
      } else {
        Alert.alert('Lỗi', response.data.message);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể thêm sản phẩm vào giỏ hàng');
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const response = await axios.put('http://192.168.19.104:4000/api/user/edit-cart', {
        productId,
        quantity: (cartItems[productId] || 1) - 1
      }, {
        headers: {
          token: token
        }
      });

      if (response.data.success) {
        // Cập nhật UI
        setCartItems(prev => {
          const newItems = { ...prev };
          if (newItems[productId] > 0) {
            newItems[productId] -= 1;
            if (newItems[productId] === 0) {
              delete newItems[productId];
            }
          }
          return newItems;
        });
      } else {
        console.error('Failed to update cart:', response.data.message);
      }
    } catch (error) {
      console.error('Error updating cart:', error.response?.data || error.message);
    }
  };

  const renderProductItem = ({ item }) => {
    return (
      <View style={styles.productCard}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.cartControls}>
            <TouchableOpacity 
              style={styles.addToCartButton}
              onPress={() => handleAddToCart(item._id)}
            >
              <Ionicons name="cart-outline" size={20} color="#fff" />
              <Text style={styles.addToCartText}>Thêm vào giỏ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Menu</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')} 
              style={styles.viewButton}
            >
              <Ionicons 
                name={viewMode === 'list' ? 'grid-outline' : 'list-outline'} 
                size={24} 
                color={COLORS.primary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item._id}
          ListHeaderComponent={() => (
            <View style={styles.categoriesContainer}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryCard, selectedCategory === category.id && styles.selectedCategoryCard]}
                  onPress={() => {
                    setSelectedCategory(category.id);
                    setSelectedSubcategory('');
                  }}
                >
                  <Ionicons 
                    name={category.icon} 
                    size={32} 
                    color={selectedCategory === category.id ? COLORS.white : COLORS.primary} 
                  />
                  <Text style={[styles.categoryName, selectedCategory === category.id && styles.selectedCategoryName]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    backgroundColor: '#E8F5E9',
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
    height: 36,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E7D32',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButton: {
    padding: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    margin: 4,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedCategoryCard: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  selectedCategoryName: {
    color: COLORS.white,
  },
  productCard: {
    flexDirection: 'row',
    margin: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 120,
    height: 120,
  },
  productInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  cartControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addToCartText: {
    color: COLORS.white,
    marginLeft: 4,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 16
  }
});

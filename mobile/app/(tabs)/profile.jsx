import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [image, setImage] = useState(null);
  const { user, token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      fetchProfileData();
    }
  }, [token]);

  const fetchProfileData = async () => {
    try {
      if (!token) {
        console.log('No token available');
        return;
      }

      console.log('Fetching profile with token:', token);
      
      const response = await axios.get('http://192.168.19.104:4000/api/user/get-profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // Thêm timeout 10 giây
      });

      if (response.data.success) {
        console.log('Profile data:', response.data.userData);
        setUserData(response.data.userData);
        setName(response.data.userData.name || '');
        setPhone(response.data.userData.phone || '');
        setAddress(response.data.userData.address || '');
      } else {
        console.error('Failed to load user data:', response.data.message);
        alert('Không thể tải thông tin người dùng');
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      
      if (error.code === 'ECONNABORTED') {
        alert('Kết nối quá lâu. Vui lòng kiểm tra lại mạng');
      } else if (error.response) {
        // Server trả về lỗi
        if (error.response.status === 401) {
          alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
          router.replace('/login');
        } else {
          alert('Lỗi server: ' + error.response.data?.message || 'Không thể kết nối đến server');
        }
      } else if (error.request) {
        // Không nhận được response từ server
        alert('Không thể kết nối đến server. Vui lòng kiểm tra lại mạng');
      } else {
        // Lỗi khác
        alert('Có lỗi xảy ra: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Có lỗi xảy ra khi chọn ảnh');
    }
  };

  const handleSubmit = async () => {
    try {
      if (!token) {
        alert('Vui lòng đăng nhập lại');
        router.replace('/login');
        return;
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('address', address);

      if (image) {
        const uriParts = image.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('image', {
          uri: image,
          name: `photo.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      const response = await axios({
        method: 'PUT',
        url: 'http://192.168.19.104:4000/api/user/update-profile',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        data: formData,
      });

      if (response.data.success) {
        alert('Cập nhật thành công!');
        setIsEditing(false);
        setImage(null);
        fetchProfileData();
      } else {
        alert(response.data.message || 'Đã có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Update error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
        router.replace('/login');
      } else {
        alert('Cập nhật thất bại: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    fetchProfileData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Thông Tin Cá Nhân</Text>
      </View>

      {userData ? (
        <View style={styles.profileContainer}>
          <View style={styles.infoContainer}>
            {isEditing ? (
              <>
                <TextInput
                  placeholder="Name"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Phone"
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Address"
                  value={address}
                  onChangeText={setAddress}
                  style={styles.input}
                />
              </>
            ) : (
              <>
                <Text style={styles.name}>{userData.name}</Text>
                <Text style={styles.email}>{userData.email}</Text>
                
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={24} color="#666" />
                  <Text style={styles.value}>{userData.phone || 'N/A'}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={24} color="#666" />
                  <Text style={styles.value}>{userData.address || 'N/A'}</Text>
                </View>
              </>
            )}
          </View>

          <TouchableOpacity 
            style={styles.editButton}
            onPress={isEditing ? handleSubmit : handleEditProfile}
          >
            <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit Profile'}</Text>
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelEdit}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No profile data available</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingVertical: 40,
    paddingHorizontal: 16,
    backgroundColor: '#E8F5E9',
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
    position: 'absolute',
    top: '110%',
    transform: [{ translateY: -12 }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContainer: {
    padding: 20,
    alignItems: 'center',
  },
  infoContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 16,
    borderColor: '#ddd',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#999',
    textDecorationLine: 'underline',
  },
  noDataContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
  },
});

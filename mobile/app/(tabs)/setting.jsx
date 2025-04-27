import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native'
import React from 'react'
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTACTS = [
  {
    name: 'Facebook',
    icon: <FontAwesome name="facebook-square" size={32} color="#1877F3" />, // Facebook blue
    url: 'https://www.facebook.com/share/1AWegqNmKP/',
  },
  {
    name: 'Zalo',
    icon: <FontAwesome name="comment" size={32} color="#0088FF" />, // Zalo blue
    url: 'https://zalo.me/0858798206',
  },
  {
    name: 'Telegram',
    icon: <FontAwesome name="telegram" size={32} color="#229ED9" />, // Telegram blue
    url: 'https://t.me/huydev204',
  },
];

export default function Setting() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const handleContact = async (url) => {
    // Try to open the app, fallback to browser
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        alert('Không thể mở liên kết này!');
      }
    } catch (e) {
      alert('Có lỗi xảy ra khi mở liên kết!');
    }
  };

  const handleLogout = async () => {
    try {
      // Clear token from AsyncStorage
      await AsyncStorage.removeItem('token');
      
      // Clear user state
      setUser(null);
      
      // Navigate to login screen
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng xuất');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Cài Đặt</Text>
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Liên hệ với Admin</Text>
        <View style={styles.buttonsContainer}>
          {CONTACTS.map((item) => (
            <TouchableOpacity
              key={item.name}
              style={styles.button}
              onPress={() => handleContact(item.url)}
            >
              {item.icon}
              <Text style={styles.buttonText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={32} color="#FF5252" />
            <Text style={[styles.buttonText, styles.logoutText]}>Đăng Xuất</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 12,
    marginBottom: 18,
    width: '100%',
    maxWidth: 300,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    color: '#333',
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: '#FFEBEE',
  },
  logoutText: {
    color: '#FF5252',
  },
});
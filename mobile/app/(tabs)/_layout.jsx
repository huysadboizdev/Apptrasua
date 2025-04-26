import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import COLORS from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { isAdmin } = useAuthStore();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        headerTitleStyle:{
          color: COLORS.textPrimary,
          fontWeight: 600,
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor : COLORS.cardBackground,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingTop: 5,
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
        },
      }}
    >
      <Tabs.Screen 
        name="index"
        options={{ 
          title: "Home",
          tabBarIcon: ({color, size}) => (
            <Ionicons name="home-outline" size={size} color={color}/>
          ),
        }} 
      />
      
      {/* Tab chỉ hiển thị cho admin */}
      {isAdmin() && (
        <Tabs.Screen 
          name="admin"
          options={{ 
            title: "Admin",
            tabBarIcon: ({color, size}) => (
              <Ionicons name="shield-outline" size={size} color={color}/>
            ),
          }}
        />
      )}

      <Tabs.Screen 
        name="cart"
        options={{ 
          title: "Cart",
          tabBarIcon: ({color, size}) => (
            <Ionicons name="cart-outline" size={size} color={color}/>
          ),
        }}
      />
      
      <Tabs.Screen 
        name="profile"
        options={{ 
          title: "Profile",
          tabBarIcon: ({color, size}) => (
            <Ionicons name="person-outline" size={size} color={color}/>
          ),
        }}
      />
      
      <Tabs.Screen
        name="setting"
        options={{ 
          title: "Setting",
          tabBarIcon: ({color, size}) => (
            <Ionicons name="settings-outline" size={size} color={color}/>
          ),
        }}
      />
    </Tabs>
  )
}

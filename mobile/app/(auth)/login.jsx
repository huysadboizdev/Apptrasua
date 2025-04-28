import { View, Text, Image, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons } from "@expo/vector-icons";
import COLORS from '../../constants/colors';
import { Link, useRouter } from "expo-router";
import styles from "../../assets/styles/login.styles";
import { useAuthStore } from "../../store/authStore";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  // Check if there is any stored login info
  useEffect(() => {
    const loadStoredData = async () => {
      const storedEmail = await AsyncStorage.getItem('email');
      const storedPassword = await AsyncStorage.getItem('password');
      if (storedEmail && storedPassword) {
        setEmail(storedEmail);
        setPassword(storedPassword);
        setRememberMe(true);
      }
    };

    loadStoredData();
  }, []);

  const handleLogin = async () => {
    const result = await login(email, password);
    if (!result.success) {
      Alert.alert("Lỗi", result.error);
      return;
    }

    // Save the login details if 'remember me' is checked
    if (rememberMe) {
      await AsyncStorage.setItem('email', email);
      await AsyncStorage.setItem('password', password);
    } else {
      // Clear storage if 'remember me' is not checked
      await AsyncStorage.removeItem('email');
      await AsyncStorage.removeItem('password');
    }

    const { role } = useAuthStore.getState();

    if (role === 'admin') {
      router.replace('/(admin)');
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.topIllustration}>
          <Image
            source={require("../../assets/images/1.png")}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.formContainer}>
            {/* EMAIL */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: '#333' }]}
                  placeholder="Nhập email của bạn"
                  placeholderTextColor="#555"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: '#333' }]}
                  placeholder="Nhập mật khẩu của bạn"
                  placeholderTextColor="#555"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember me checkbox */}
            <View style={styles.inputGroup}>
              <TouchableOpacity
                onPress={() => setRememberMe(!rememberMe)}
                style={styles.rememberMeContainer}
              >
                <Ionicons
                  name={rememberMe ? "checkbox" : "checkbox-outline"}
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.rememberMeText}>Lưu mật khẩu</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Chưa có tài khoản?</Text>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>Đăng ký</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

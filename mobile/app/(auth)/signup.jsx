import { View, Text, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, ActivityIndicator, Alert, Animated } from 'react-native';
import React, { useState } from 'react';
import styles from './../../assets/styles/signup.styles';
import { Ionicons } from "@expo/vector-icons";
import COLORS from '../../constants/colors';
import { Link, useRouter } from "expo-router";
import { useAuthStore } from '../../store/authStore';

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuthStore();
  const router = useRouter();

  const fadeAnim = useState(new Animated.Value(1))[0];

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleSignup = async () => {
    try {
      if (!name || !email || !password) {
        Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
        return;
      }

      if (!validateEmail(email)) {
        Alert.alert("Lỗi", "Vui lòng nhập email hợp lệ");
        return;
      }

      if (!validatePassword(password)) {
        Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 8 ký tự");
        return;
      }

      setIsLoading(true);

      const result = await register(name, email, password);

      if (result.success) {
        Alert.alert(
          "Thành công",
          "Tạo tài khoản thành công!",
          [
            {
              text: "OK",
              onPress: () => {
                Animated.timing(fadeAnim, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }).start(() => {
                  router.replace('/(auth)/login');
                });
              },
            }
          ]
        );
      } else {
        Alert.alert("Lỗi", result.error || "Đăng ký thất bại");
      }
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      Alert.alert("Lỗi", error.message || "Có lỗi xảy ra trong quá trình đăng ký");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.container}>
          <View style={styles.card}>
            {/* Header Section */}
            <View style={styles.header}>
              <Text style={styles.title}>Coffee Dino☕</Text>
              <Text style={styles.subtitle}>Nơi Tình Yêu Bắt Đầu</Text>
            </View>

            <View style={styles.formContainer}>
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tên</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={COLORS.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: '#333' }]} // chữ nhập sẽ đậm
                    placeholder="Nhập tên của bạn"
                    placeholderTextColor="#555" // placeholder rõ hơn
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Email */}
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

              {/* Password */}
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

              {/* Sign Up Button */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color='#fff' />
                ) : (
                  <Text style={styles.buttonText}>Đăng ký</Text>
                )}
              </TouchableOpacity>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Đã có tài khoản?</Text>
                <Link href="/(auth)/login">
                  <Text style={styles.link}>Đăng nhập</Text>
                </Link>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

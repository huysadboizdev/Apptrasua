import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="index"
        options={{
          title: 'Login',
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="signup"
        options={{
          title: 'Signup',
          headerShown: false
        }}
      />
    </Stack>
  );
}
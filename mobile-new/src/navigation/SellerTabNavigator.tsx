import React from 'react';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

// Import screens
import SellerDashboardScreen from '../screens/SellerDashboardScreenMejor';
import SellerProductsScreen from '../screens/SellerProductsScreenMejorado';
import SellerOrdersScreen from '../screens/SellerOrdersScreenMejorado';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Dashboard Stack
function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DashboardMain" 
        component={SellerDashboardScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Products Stack
function ProductsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProductsMain" 
        component={SellerProductsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Orders Stack
function OrdersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="OrdersMain" 
        component={SellerOrdersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="OrderDetail" 
        component={OrderDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Profile Stack
function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Main Seller Tab Navigator
export default function SellerTabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          borderTopWidth: 1,
          height: 60 + (Platform.OS === 'android' ? Math.max(insets.bottom, 8) : 0),
          paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 8) : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#34C759',
        tabBarInactiveTintColor: '#888',
        headerStyle: {
          backgroundColor: '#1a1a2e',
          borderBottomColor: 'rgba(255, 255, 255, 0.1)',
          borderBottomWidth: 1,
        },
        headerTintColor: '#fff',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStack}
        options={{ 
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name="stats-chart" 
              size={size} 
              color={color} 
            />
          )
        }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsStack}
        options={{ 
          tabBarLabel: 'Productos',
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialIcons 
              name="inventory" 
              size={size} 
              color={color} 
            />
          )
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersStack}
        options={{ 
          tabBarLabel: 'Órdenes',
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialIcons 
              name="shopping-cart" 
              size={size} 
              color={color} 
            />
          )
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ 
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialIcons 
              name="person" 
              size={size} 
              color={color} 
            />
          )
        }}
      />
    </Tab.Navigator>
  );
}


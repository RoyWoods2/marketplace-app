import React from 'react';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

// Import screens - Seller
import SellerDashboardScreen from '../screens/SellerDashboardScreenMejor';
import SellerProductsScreen from '../screens/SellerProductsScreenMejorado';
import SellerOrdersScreen from '../screens/SellerOrdersScreenMejorado';

// Import screens - Buyer
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import BuyerOrdersScreen from '../screens/BuyerOrdersScreen';

// Import shared screens
import OrderDetailScreen from '../screens/OrderDetailScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CreateOrderScreen from '../screens/CreateOrderScreen';

// Import new seller screens
import SalesHistoryScreen from '../screens/SalesHistoryScreen';
import IncomeScreen from '../screens/IncomeScreen';
import PendingOrdersScreen from '../screens/PendingOrdersScreen';
import LowStockProductsScreen from '../screens/LowStockProductsScreen';
import ReportsScreen from '../screens/ReportsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Seller Dashboard Stack
function SellerDashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DashboardMain" 
        component={SellerDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SalesHistory"
        component={SalesHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Income"
        component={IncomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PendingOrders"
        component={PendingOrdersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LowStockProducts"
        component={LowStockProductsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Seller Products Stack
function SellerProductsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProductsMain" 
        component={SellerProductsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Products" 
        component={SellerProductsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Seller Orders Stack (orders they receive as seller)
function SellerOrdersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="OrdersMain" 
        component={SellerOrdersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Orders" 
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

// Buyer Home Stack (browse products/reels)
function BuyerHomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CreateOrder" 
        component={CreateOrderScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Buyer Search Stack
function BuyerSearchStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Search" 
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CreateOrder" 
        component={CreateOrderScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Buyer Orders Stack (orders they made as buyer)
function BuyerOrdersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="BuyerOrdersMain" 
        component={BuyerOrdersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="OrderDetail" 
        component={OrderDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
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
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ title: 'Notificaciones' }}
      />
    </Stack.Navigator>
  );
}

// Unified Tab Navigator - Combines Seller and Buyer functions
export default function UnifiedTabNavigator() {
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
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      {/* Seller Functions */}
      <Tab.Screen 
        name="SellerDashboard" 
        component={SellerDashboardStack}
        options={{ 
          tabBarLabel: 'Vender',
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
        name="SellerProducts" 
        component={SellerProductsStack}
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
        name="SellerOrders" 
        component={SellerOrdersStack}
        options={{ 
          tabBarLabel: 'Ventas',
          tabBarIcon: ({ focused, color, size }) => (
            <FontAwesome5
              name="dollar-sign" 
              size={size} 
              color={color} 
            />
          )
        }}
      />
      
      {/* Buyer Functions */}
      <Tab.Screen 
        name="BuyerHome" 
        component={BuyerHomeStack}
        options={{ 
          tabBarLabel: 'Explorar',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name="home" 
              size={size} 
              color={color} 
            />
          )
        }}
      />
      <Tab.Screen 
        name="BuyerSearch" 
        component={BuyerSearchStack}
        options={{ 
          tabBarLabel: 'Buscar',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name="search" 
              size={size} 
              color={color} 
            />
          )
        }}
      />
      <Tab.Screen 
        name="BuyerOrders" 
        component={BuyerOrdersStack}
        options={{ 
          tabBarLabel: 'Mis Compras',
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



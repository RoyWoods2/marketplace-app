import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

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
        options={{ title: 'Detalles del Producto' }}
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
        options={{ title: 'Detalles del Producto' }}
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
        options={{ title: 'Detalles del Producto' }}
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
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
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
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Text style={{ fontSize: 22 }}>
                📊
              </Text>
            </View>
          )
        }}
      />
      <Tab.Screen 
        name="SellerProducts" 
        component={SellerProductsStack}
        options={{ 
          tabBarLabel: 'Productos',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Text style={{ fontSize: 22 }}>
                📦
              </Text>
            </View>
          )
        }}
      />
      <Tab.Screen 
        name="SellerOrders" 
        component={SellerOrdersStack}
        options={{ 
          tabBarLabel: 'Ventas',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Text style={{ fontSize: 22 }}>
                💰
              </Text>
            </View>
          )
        }}
      />
      
      {/* Buyer Functions */}
      <Tab.Screen 
        name="BuyerHome" 
        component={BuyerHomeStack}
        options={{ 
          tabBarLabel: 'Explorar',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Text style={{ fontSize: 22 }}>
                🏠
              </Text>
            </View>
          )
        }}
      />
      <Tab.Screen 
        name="BuyerSearch" 
        component={BuyerSearchStack}
        options={{ 
          tabBarLabel: 'Buscar',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Text style={{ fontSize: 22 }}>
                🔍
              </Text>
            </View>
          )
        }}
      />
      <Tab.Screen 
        name="BuyerOrders" 
        component={BuyerOrdersStack}
        options={{ 
          tabBarLabel: 'Mis Compras',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Text style={{ fontSize: 22 }}>
                🛒
              </Text>
            </View>
          )
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ 
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Text style={{ fontSize: 22 }}>
                👤
              </Text>
            </View>
          )
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tabIconActive: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
  },
});


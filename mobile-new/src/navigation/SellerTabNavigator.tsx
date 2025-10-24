import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

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
        name="Products" 
        component={ProductsStack}
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
        name="Orders" 
        component={OrdersStack}
        options={{ 
          tabBarLabel: 'Órdenes',
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

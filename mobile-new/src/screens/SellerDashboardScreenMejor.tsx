import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  todaySales: number;
  todayRevenue: number;
}

interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  isActive: boolean;
  orders: any[];
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
  product: {
    title: string;
  };
}

export default function SellerDashboardScreen({ navigation }: any) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { token, user } = useAuth();

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      // Animar entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        Alert.alert('Error', 'Usuario no autenticado');
        return;
      }

      // Fetch stats
      const statsResponse = await fetch(`${API_ENDPOINTS.SELLER_DASHBOARD}?userId=${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      // Fetch products
      const productsResponse = await fetch(`${API_ENDPOINTS.SELLER_PRODUCTS}?userId=${user.id}&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setRecentProducts(productsData.products || []);
      }

      // Fetch orders
      const ordersResponse = await fetch(`${API_ENDPOINTS.SELLER_ORDERS}?userId=${user.id}&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setRecentOrders(ordersData.orders || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string[] } = {
      PENDING: ['#FF9800', '#FB8C00'],
      PAYMENT_CONFIRMED: ['#2196F3', '#1976D2'],
      PREPARING: ['#9C27B0', '#7B1FA2'],
      READY_FOR_PICKUP: ['#4CAF50', '#388E3C'],
    };
    return colors[status] || ['#666', '#555'];
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      PENDING: 'Pendiente',
      PAYMENT_CONFIRMED: 'Pago Confirmado',
      PREPARING: 'Preparando',
      READY_FOR_PICKUP: 'Listo',
    };
    return texts[status] || status;
  };

  const renderStatCard = (title: string, value: string | number, icon: string, gradientColors: string[]) => (
    <Animated.View 
      style={[
        styles.statCardContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statCard}
      >
        <View style={styles.statHeader}>
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>{icon}</Text>
          </View>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <Text style={styles.statValue}>{value}</Text>
      </LinearGradient>
    </Animated.View>
  );

  const renderProductCard = (item: Product) => (
    <TouchableOpacity 
      key={item.id}
      style={styles.productCard}
      onPress={() => navigation.navigate('Products')}
      activeOpacity={0.7}
    >
      <Card style={styles.cardInner}>
        <View style={styles.productRow}>
          <Image
            source={{ uri: item.images[0] || 'https://via.placeholder.com/60' }}
            style={styles.productImage}
          />
          <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.productPrice}>${item.price}</Text>
            <View style={styles.productMeta}>
              <View style={[
                styles.stockBadge,
                item.stock <= 5 && styles.lowStockBadge
              ]}>
                <Text style={styles.stockText}>Stock: {item.stock}</Text>
              </View>
              <Text style={styles.ordersCount}>
                {item.orders?.length || 0} órdenes
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderOrderCard = (item: Order) => (
    <TouchableOpacity 
      key={item.id}
      style={styles.orderCardContainer}
      onPress={() => navigation.navigate('Orders')}
      activeOpacity={0.7}
    >
      <Card style={styles.orderCard}>
        <View style={styles.orderContent}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderProduct} numberOfLines={1}>{item.product.title}</Text>
            <Text style={styles.orderCustomer}>
              {item.user.firstName} {item.user.lastName}
            </Text>
            <Text style={styles.orderTotal}>${item.total}</Text>
          </View>
          <LinearGradient
            colors={getStatusColor(item.status)}
            style={styles.statusBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </LinearGradient>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#34C759', '#30B350', '#2A9F47']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>¡Hola, {user?.firstName}! 👋</Text>
            <Text style={styles.subtitle}>Aquí está tu negocio hoy</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View style={styles.bellContainer}>
              <Text style={styles.notificationIcon}>🔔</Text>
              {stats?.pendingOrders && stats.pendingOrders > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{stats.pendingOrders}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34C759" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats del Día */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Hoy</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Ventas', stats?.todaySales || 0, '📈', ['#34C759', '#30B350'])}
            {renderStatCard('Ingresos', `$${stats?.todayRevenue || 0}`, '💰', ['#FFD60A', '#FFA500'])}
          </View>
          <View style={[styles.statsGrid, { marginTop: 12 }]}>
            {renderStatCard('Pendientes', stats?.pendingOrders || 0, '⏳', ['#FF9800', '#FB8C00'])}
            {renderStatCard('Stock Bajo', stats?.lowStockProducts || 0, '⚠️', ['#FF3B30', '#FF2D20'])}
          </View>
        </View>

        {/* Totales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Totales</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Ventas Totales', stats?.totalSales || 0, '🛒', ['#667eea', '#764ba2'])}
            {renderStatCard('Ingresos Totales', `$${stats?.totalRevenue || 0}`, '💵', ['#f093fb', '#f5576c'])}
          </View>
        </View>

        {/* Acciones Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Products')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(52, 199, 89, 0.1)', 'rgba(52, 199, 89, 0.2)']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>📦</Text>
                <Text style={styles.actionText}>Productos</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Orders')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(102, 126, 234, 0.1)', 'rgba(102, 126, 234, 0.2)']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>🛒</Text>
                <Text style={styles.actionText}>Órdenes</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Reportes', 'Próximamente')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(255, 215, 10, 0.1)', 'rgba(255, 215, 10, 0.2)']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>📊</Text>
                <Text style={styles.actionText}>Reportes</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Ajustes', 'Próximamente')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(240, 147, 251, 0.1)', 'rgba(240, 147, 251, 0.2)']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>⚙️</Text>
                <Text style={styles.actionText}>Ajustes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Productos Recientes */}
        {recentProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📦 Productos Recientes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Products')}>
                <Text style={styles.seeAllText}>Ver todos →</Text>
              </TouchableOpacity>
            </View>
            {recentProducts.slice(0, 3).map(renderProductCard)}
          </View>
        )}

        {/* Órdenes Recientes */}
        {recentOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🛒 Órdenes Recientes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
                <Text style={styles.seeAllText}>Ver todas →</Text>
              </TouchableOpacity>
            </View>
            {recentOrders.slice(0, 3).map(renderOrderCard)}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Última actualización: {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  notificationButton: {
    padding: 8,
  },
  bellContainer: {
    position: 'relative',
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 22,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#34C759',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#34C759',
    fontWeight: '600',
    fontSize: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCardContainer: {
    flex: 1,
  },
  statCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statIcon: {
    fontSize: 18,
  },
  statTitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: (SCREEN_WIDTH - 64) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  actionIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  productCard: {
    marginBottom: 12,
  },
  cardInner: {
    padding: 0,
  },
  productRow: {
    flexDirection: 'row',
    padding: 16,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  lowStockBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  stockText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  ordersCount: {
    fontSize: 12,
    color: '#888',
  },
  orderCardContainer: {
    marginBottom: 12,
  },
  orderCard: {
    padding: 0,
  },
  orderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  orderInfo: {
    flex: 1,
    marginRight: 12,
  },
  orderProduct: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  orderCustomer: {
    fontSize: 14,
    color: '#888',
    marginBottom: 6,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#666',
  },
});


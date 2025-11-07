import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';

interface BuyerStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  completedOrders: number;
  thisMonthOrders: number;
  thisMonthSpent: number;
}

interface RecentOrder {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
  createdAt: string;
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
    category: string;
  };
  product: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      whatsapp?: string;
      instagram?: string;
    };
  };
}

interface OrderStatus {
  PENDING: number;
  CONFIRMED: number;
  SHIPPED: number;
  DELIVERED: number;
  CANCELLED: number;
}

export default function BuyerDashboardScreen() {
  const [stats, setStats] = useState<BuyerStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [orderStatusCounts, setOrderStatusCounts] = useState<OrderStatus>({
    PENDING: 0,
    CONFIRMED: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch buyer stats
      const statsResponse = await fetch(API_ENDPOINTS.BUYER_DASHBOARD, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      // Fetch recent orders
      const ordersResponse = await fetch(`${API_ENDPOINTS.BUYER_ORDERS}?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setRecentOrders(ordersData.orders);
        
        // Calculate status counts
        const statusCounts = ordersData.orders.reduce((acc: OrderStatus, order: RecentOrder) => {
          acc[order.status]++;
          return acc;
        }, { PENDING: 0, CONFIRMED: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 });
        setOrderStatusCounts(statusCounts);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del dashboard');
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
    switch (status) {
      case 'PENDING': return '#FF9500';
      case 'CONFIRMED': return '#007AFF';
      case 'SHIPPED': return '#5856D6';
      case 'DELIVERED': return '#34C759';
      case 'CANCELLED': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'CONFIRMED': return 'Confirmada';
      case 'SHIPPED': return 'Enviada';
      case 'DELIVERED': return 'Entregada';
      case 'CANCELLED': return 'Cancelada';
      default: return status;
    }
  };

  const handleContactSeller = (whatsapp?: string, instagram?: string, productTitle?: string) => {
    if (whatsapp) {
      const message = productTitle
        ? `Hola! Me interesa el producto "${productTitle}". ¿Podrías darme más información?`
        : 'Hola! Me interesa contactarte sobre tu producto.';
      
      const whatsappUrl = `whatsapp://send?phone=${whatsapp}&text=${encodeURIComponent(message)}`;
      
      Linking.openURL(whatsappUrl).catch(() => {
        Alert.alert('Error', 'No se pudo abrir WhatsApp');
      });
    } else if (instagram) {
      const instagramUrl = `https://instagram.com/${instagram}`;
      
      Linking.openURL(instagramUrl).catch(() => {
        Alert.alert('Error', 'No se pudo abrir Instagram');
      });
    } else {
      Alert.alert('Información', 'No hay información de contacto disponible');
    }
  };

  const renderStatsCard = (title: string, value: string | number, subtitle?: string, color: string = '#007AFF') => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsTitle}>{title}</Text>
      {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderStatusCard = (status: string, count: number) => {
    const label = getStatusLabel(status);
    const color = getStatusColor(status);
    
    return (
      <View key={status} style={[styles.statusCard, { borderLeftColor: color }]}>
        <Text style={styles.statusCount}>{count}</Text>
        <Text style={styles.statusLabel}>{label}</Text>
      </View>
    );
  };

  const renderRecentOrder = (order: RecentOrder) => (
    <View key={order.id} style={styles.recentOrderItem}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{order.id.slice(-8)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
        </View>
      </View>

      <View style={styles.orderContent}>
        <Text style={styles.productTitle}>{order.product.title}</Text>
        <Text style={styles.orderTotal}>Total: ${order.total}</Text>
        <Text style={styles.orderDate}>
          {new Date(order.createdAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => handleContactSeller(
            order.product.user.whatsapp,
            order.product.user.instagram,
            order.product.title
          )}
        >
          <Text style={styles.contactButtonText}>Contactar Vendedor</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Dashboard</Text>
        <Text style={styles.headerSubtitle}>Resumen de tus compras</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          {renderStatsCard('Compras Hoy', stats?.thisMonthOrders || 0, 'este mes', '#34C759')}
          {renderStatsCard('Gastado Hoy', `$${stats?.thisMonthSpent || 0}`, 'este mes', '#34C759')}
        </View>
        <View style={styles.statsRow}>
          {renderStatsCard('Total Compras', stats?.totalOrders || 0, 'todas las compras', '#007AFF')}
          {renderStatsCard('Total Gastado', `$${stats?.totalSpent || 0}`, 'en total', '#007AFF')}
        </View>
        <View style={styles.statsRow}>
          {renderStatsCard('Pendientes', stats?.pendingOrders || 0, 'por confirmar', '#FF9500')}
          {renderStatsCard('Completadas', stats?.completedOrders || 0, 'entregadas', '#34C759')}
        </View>
      </View>

      {/* Order Status Overview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📊 Estado de Órdenes</Text>
        </View>
        <View style={styles.statusCardsContainer}>
          {Object.entries(orderStatusCounts).map(([status, count]) => 
            renderStatusCard(status, count)
          )}
        </View>
      </View>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📦 Compras Recientes</Text>
          </View>
          {recentOrders.map(renderRecentOrder)}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>
        </View>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionIcon}>🛍️</Text>
            <Text style={styles.quickActionText}>Ver Todos los Productos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionIcon}>📋</Text>
            <Text style={styles.quickActionText}>Mis Órdenes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionIcon}>🔔</Text>
            <Text style={styles.quickActionText}>Notificaciones</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tips Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💡 Consejos</Text>
        </View>
        <View style={styles.tipsContainer}>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>📱</Text>
            <Text style={styles.tipText}>
              Contacta al vendedor por WhatsApp para consultas rápidas
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>⏰</Text>
            <Text style={styles.tipText}>
              Las órdenes pendientes requieren confirmación del vendedor
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>📦</Text>
            <Text style={styles.tipText}>
              Recibirás notificaciones cuando cambie el estado de tu orden
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E5F4FF',
    marginTop: 4,
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 4,
  },
  statsSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  section: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    alignItems: 'center',
  },
  statusCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  recentOrderItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderContent: {
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  contactButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    minWidth: 80,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  tipsContainer: {
    marginTop: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

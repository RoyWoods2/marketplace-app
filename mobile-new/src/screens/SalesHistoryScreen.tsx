import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { formatCurrency, formatCurrencyShort } from '../utils/currency';

interface Order {
  id: string;
  quantity: number;
  total: number;
  status: string;
  createdAt: string;
  product: {
    title: string;
    price: number;
  };
  user: {
    firstName: string;
    lastName: string;
  };
}

type Timeframe = 'today' | 'week' | 'month' | 'year' | 'all';

export default function SalesHistoryScreen({ route, navigation }: any) {
  const initialTimeframe = route?.params?.timeframe || 'all';
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
  const { token, user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrdersByTimeframe();
  }, [orders, timeframe]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const response = await fetch(`${API_ENDPOINTS.SELLER_ORDERS}?userId=${user.id}&limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrdersByTimeframe = () => {
    if (timeframe === 'all') {
      setFilteredOrders(orders);
      return;
    }

    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        setFilteredOrders(orders);
        return;
    }

    const filtered = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate;
    });

    setFilteredOrders(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const totalSales = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const totalQuantity = filteredOrders.reduce((sum, order) => sum + order.quantity, 0);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string[] } = {
      PENDING: ['#FF9800', '#FB8C00'],
      PAYMENT_CONFIRMED: ['#2196F3', '#1976D2'],
      PREPARING: ['#9C27B0', '#7B1FA2'],
      READY_FOR_PICKUP: ['#4CAF50', '#388E3C'],
      DELIVERED: ['#34C759', '#30B350'],
      CANCELLED: ['#FF3B30', '#FF2D20'],
    };
    return colors[status] || ['#666', '#555'];
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      PENDING: 'Pendiente',
      PAYMENT_CONFIRMED: 'Pago Confirmado',
      PREPARING: 'Preparando',
      READY_FOR_PICKUP: 'Listo',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado',
    };
    return texts[status] || status;
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      activeOpacity={0.7}
    >
      <Card style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderTitle}>{item.product.title}</Text>
            <Text style={styles.orderCustomer}>
              Cliente: {item.user.firstName} {item.user.lastName}
            </Text>
            <Text style={styles.orderDate}>
              {new Date(item.createdAt).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <Text style={styles.orderQuantity}>Cantidad: {item.quantity}</Text>
          </View>
          <View style={styles.orderRight}>
            <Text style={styles.orderTotal}>{formatCurrencyShort(item.total)}</Text>
            <LinearGradient
              colors={getStatusColor(item.status)}
              style={styles.statusBadge}
            >
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </LinearGradient>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const TimeframeButton = ({ value, label }: { value: Timeframe; label: string }) => (
    <TouchableOpacity
      style={[styles.timeframeButton, timeframe === value && styles.timeframeButtonActive]}
      onPress={() => setTimeframe(value)}
    >
      {timeframe === value ? (
        <LinearGradient colors={['#34C759', '#30B350']} style={styles.timeframeGradient}>
          <Text style={styles.timeframeTextActive}>{label}</Text>
        </LinearGradient>
      ) : (
        <Text style={styles.timeframeText}>{label}</Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.loadingText}>Cargando historial...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#34C759', '#30B350']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historial de Ventas</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34C759" />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryGrid}>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Ventas</Text>
              <Text style={styles.summaryValue}>{totalSales}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Ingresos</Text>
              <Text style={[styles.summaryValue, styles.summaryRevenue]}>
                {formatCurrency(totalRevenue)}
              </Text>
            </Card>
          </View>
          <Card style={styles.summaryCardFull}>
            <Text style={styles.summaryLabel}>Productos Vendidos</Text>
            <Text style={styles.summaryValue}>{totalQuantity}</Text>
          </Card>
        </View>

        {/* Timeframe Filters */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Período:</Text>
          <View style={styles.filtersRow}>
            <TimeframeButton value="today" label="Hoy" />
            <TimeframeButton value="week" label="Semana" />
            <TimeframeButton value="month" label="Mes" />
            <TimeframeButton value="year" label="Año" />
            <TimeframeButton value="all" label="Todo" />
          </View>
        </View>

        {/* Orders List */}
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Ventas ({filteredOrders.length})</Text>
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>No hay ventas en este período</Text>
              <Text style={styles.emptySubtitle}>Las ventas aparecerán aquí cuando tengas órdenes</Text>
            </View>
          ) : (
            <FlatList
              data={filteredOrders}
              renderItem={renderOrder}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListFooterComponent={<View style={styles.footer} />}
            />
          )}
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  summaryContainer: {
    padding: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  summaryCardFull: {
    padding: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryRevenue: {
    color: '#34C759',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeframeButton: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#444',
  },
  timeframeButtonActive: {
    borderColor: '#34C759',
  },
  timeframeGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timeframeText: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  timeframeTextActive: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  orderCard: {
    marginBottom: 12,
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderInfo: {
    flex: 1,
    marginRight: 12,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  orderCustomer: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  orderQuantity: {
    fontSize: 12,
    color: '#666',
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  footer: {
    height: 20,
  },
});


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
  total: number;
  createdAt: string;
  product: {
    title: string;
  };
  user: {
    firstName: string;
    lastName: string;
  };
}

type Timeframe = 'today' | 'week' | 'month' | 'year' | 'all';

export default function IncomeScreen({ route, navigation }: any) {
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

  const totalIncome = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const orderCount = filteredOrders.length;

  const renderOrder = ({ item }: { item: Order }) => (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderTitle}>{item.product.title}</Text>
          <Text style={styles.orderCustomer}>
            {item.user.firstName} {item.user.lastName}
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
        </View>
        <Text style={styles.orderTotal}>{formatCurrencyShort(item.total)}</Text>
      </View>
    </Card>
  );

  const TimeframeButton = ({ value, label }: { value: Timeframe; label: string }) => (
    <TouchableOpacity
      style={[styles.timeframeButton, timeframe === value && styles.timeframeButtonActive]}
      onPress={() => setTimeframe(value)}
    >
      {timeframe === value ? (
        <LinearGradient colors={['#FFD60A', '#FFA500']} style={styles.timeframeGradient}>
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
        <ActivityIndicator size="large" color="#FFD60A" />
        <Text style={styles.loadingText}>Cargando ingresos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFD60A', '#FFA500']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ingresos</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD60A" />
        }
      >
        {/* Summary Card */}
        <View style={styles.summaryContainer}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total de Ingresos</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalIncome)}</Text>
            <Text style={styles.summaryCount}>{orderCount} {orderCount === 1 ? 'orden' : 'órdenes'}</Text>
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
          <Text style={styles.listTitle}>Historial de Ingresos</Text>
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💰</Text>
              <Text style={styles.emptyTitle}>No hay ingresos en este período</Text>
              <Text style={styles.emptySubtitle}>Las órdenes completadas aparecerán aquí</Text>
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
  summaryCard: {
    padding: 24,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD60A',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 14,
    color: '#888',
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
    borderColor: '#FFD60A',
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
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD60A',
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


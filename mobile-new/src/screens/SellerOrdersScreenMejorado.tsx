import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import GradientButton from '../components/GradientButton';
import QRCodeSimple from '../components/QRCodeSimple';
import { formatCurrencyShort } from '../utils/currency';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Order {
  id: string;
  quantity: number;
  total: number;
  status: string;
  paymentMethod: string;
  notes?: string;
  qrCode?: string;
  pickupCode?: string;
  deliveryType?: 'PICKUP' | 'DELIVERY';
  deliveryAddress?: string;
  createdAt: string;
  updatedAt?: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    whatsapp?: string;
    instagram?: string;
    email?: string;
  };
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
  };
  branch?: {
    name: string;
    address: string;
  };
}

type FilterType = 'all' | 'pending' | 'preparing' | 'ready' | 'delivered';
type SortType = 'date_new' | 'date_old' | 'total_high' | 'total_low' | 'status';

const STATUS_LABELS: { [key: string]: string } = {
  PENDING: 'Pendiente',
  PAYMENT_CONFIRMED: 'Pago Confirmado',
  PREPARING: 'Preparando',
  READY_FOR_PICKUP: 'Listo',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: { [key: string]: string[] } = {
  PENDING: ['#FF9800', '#FB8C00'],
  PAYMENT_CONFIRMED: ['#2196F3', '#1976D2'],
  PREPARING: ['#9C27B0', '#7B1FA2'],
  READY_FOR_PICKUP: ['#4CAF50', '#388E3C'],
  DELIVERED: ['#34C759', '#30B350'],
  CANCELLED: ['#FF3B30', '#FF2D20'],
};

export default function SellerOrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('date_new');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showQuickActionModal, setShowQuickActionModal] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<Order | null>(null);
  const [showSummary, setShowSummary] = useState(true);
  const { token, user } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('up');

  useEffect(() => {
    fetchOrders();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        Alert.alert('Error', 'Usuario no autenticado');
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.SELLER_ORDERS}?userId=${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        Alert.alert('Error', 'No se pudieron cargar las órdenes');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const diff = currentScrollY - lastScrollY.current;
        
        // Determine scroll direction
        if (diff > 0 && currentScrollY > 50) {
          // Scrolling down and past threshold - hide header
          if (scrollDirection.current !== 'down') {
            scrollDirection.current = 'down';
            Animated.parallel([
              Animated.timing(headerOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(headerTranslateY, {
                toValue: -150,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start();
          }
        } else if (diff < 0 || currentScrollY <= 10) {
          // Scrolling up or at top - show header
          if (scrollDirection.current !== 'up') {
            scrollDirection.current = 'up';
            Animated.parallel([
              Animated.timing(headerOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(headerTranslateY, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start();
          }
        }
        
        lastScrollY.current = currentScrollY;
      },
    }
  );

  const getFilteredAndSortedOrders = () => {
    let filtered = orders;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.product.title.toLowerCase().includes(query) ||
        `${o.user.firstName} ${o.user.lastName}`.toLowerCase().includes(query) ||
        o.user.username.toLowerCase().includes(query) ||
        o.id.toLowerCase().includes(query) ||
        o.pickupCode?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    switch (filter) {
      case 'pending':
        filtered = filtered.filter(o => o.status === 'PENDING' || o.status === 'PAYMENT_CONFIRMED');
        break;
      case 'preparing':
        filtered = filtered.filter(o => o.status === 'PREPARING');
        break;
      case 'ready':
        filtered = filtered.filter(o => o.status === 'READY_FOR_PICKUP');
        break;
      case 'delivered':
        filtered = filtered.filter(o => o.status === 'DELIVERED');
        break;
      default:
        break;
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date_new':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date_old':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'total_high':
          return b.total - a.total;
        case 'total_low':
          return a.total - b.total;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return sorted;
  };

  const calculateStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);

    const todayPending = todayOrders.filter(o => 
      o.status === 'PENDING' || o.status === 'PAYMENT_CONFIRMED'
    ).length;
    const todayRevenue = todayOrders
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + o.total, 0);
    const todayCompleted = todayOrders.filter(o => o.status === 'DELIVERED').length;
    const totalPending = orders.filter(o => 
      o.status === 'PENDING' || o.status === 'PAYMENT_CONFIRMED'
    ).length;
    const totalRevenue = orders
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + o.total, 0);

    return {
      todayPending,
      todayRevenue,
      todayCompleted,
      totalPending,
      totalRevenue,
      totalOrders: orders.length,
    };
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const orderDate = new Date(date);
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Hace ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} h`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else {
      return orderDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
  };

  const isUrgent = (order: Order) => {
    const orderDate = new Date(order.createdAt);
    const hoursAgo = (new Date().getTime() - orderDate.getTime()) / 3600000;
    return (order.status === 'PENDING' || order.status === 'PAYMENT_CONFIRMED') && hoursAgo > 24;
  };

  const isNew = (order: Order) => {
    const orderDate = new Date(order.createdAt);
    const minutesAgo = (new Date().getTime() - orderDate.getTime()) / 60000;
    return minutesAgo < 30;
  };

  const handleQuickStatusChange = async (order: Order, newStatus: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SELLER_ORDERS}/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: newStatus,
          userId: user?.id
        }),
      });

      if (response.ok) {
        setShowQuickActionModal(false);
        setSelectedOrderForAction(null);
        fetchOrders();
      } else {
        Alert.alert('Error', 'No se pudo actualizar el estado');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Error al actualizar el estado');
    }
  };

  const getSortLabel = () => {
    const labels: { [key: string]: string } = {
      date_new: 'Más Recientes',
      date_old: 'Más Antiguas',
      total_high: 'Mayor Monto',
      total_low: 'Menor Monto',
      status: 'Por Estado',
    };
    return labels[sortBy] || 'Ordenar';
  };

  const FilterButton = ({ type, label, icon, count }: { type: FilterType; label: string; icon: string; count?: number }) => {
    const isActive = filter === type;
    return (
      <TouchableOpacity
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setFilter(type)}
        activeOpacity={0.7}
      >
        {isActive ? (
          <LinearGradient
            colors={['#34C759', '#30B350']}
            style={styles.filterGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.filterIcon}>{icon}</Text>
            <Text style={styles.filterTextActive}>{label}</Text>
            {count !== undefined && count > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{count}</Text>
              </View>
            )}
          </LinearGradient>
        ) : (
          <View style={styles.filterInactive}>
            <Text style={styles.filterIcon}>{icon}</Text>
            <Text style={styles.filterText}>{label}</Text>
            {count !== undefined && count > 0 && (
              <View style={[styles.filterBadge, styles.filterBadgeInactive]}>
                <Text style={styles.filterBadgeText}>{count}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const statusColors = STATUS_COLORS[item.status] || ['#666', '#555'];
    const statusLabel = STATUS_LABELS[item.status] || item.status;
    const urgent = isUrgent(item);
    const newOrder = isNew(item);

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          style={styles.orderCard}
          onPress={() => {
            navigation.navigate('OrderDetail', { order: item });
          }}
          activeOpacity={0.8}
        >
          <Card style={styles.orderCardInner}>
            <View style={styles.orderRow}>
              {/* Product Image */}
              <View style={styles.orderImageContainer}>
                <Image
                  source={{ uri: item.product.images[0] || 'https://via.placeholder.com/80' }}
                  style={styles.orderImage}
                />
                {newOrder && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NUEVO</Text>
                  </View>
                )}
              </View>

              {/* Order Info */}
              <View style={styles.orderInfo}>
                {/* Header: Title + Status */}
                <View style={styles.orderHeader}>
                  <View style={styles.orderTitleSection}>
                    <Text style={styles.orderProduct} numberOfLines={2}>
                      {item.product.title}
                    </Text>
                    {item.deliveryType && (
                      <View style={styles.deliveryTypeContainer}>
                        <Text style={styles.deliveryTypeIcon}>
                          {item.deliveryType === 'PICKUP' ? '📦' : '🚚'}
                        </Text>
                        <Text style={styles.deliveryTypeText}>
                          {item.deliveryType === 'PICKUP' ? 'Retiro' : 'Delivery'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.statusContainer}>
                    <LinearGradient
                      colors={statusColors}
                      style={styles.statusBadge}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.statusText}>{statusLabel}</Text>
                    </LinearGradient>
                    {urgent && (
                      <View style={styles.urgentIndicator}>
                        <Text style={styles.urgentIndicatorText}>⚠️</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Customer Info */}
                <View style={styles.customerRow}>
                  <Text style={styles.customerIcon}>👤</Text>
                  <Text style={styles.orderCustomer} numberOfLines={1}>
                    {item.user.firstName} {item.user.lastName}
                  </Text>
                </View>

                {/* Meta Info: Quantity + Price */}
                <View style={styles.orderMeta}>
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantityLabel}>Cantidad:</Text>
                    <Text style={styles.orderQuantity}>{item.quantity}</Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.orderTotal}>{formatCurrencyShort(item.total)}</Text>
                  </View>
                </View>

                {/* Footer: Time + Quick Action */}
                <View style={styles.orderFooter}>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeIcon}>🕐</Text>
                    <Text style={styles.orderDate}>{getTimeAgo(item.createdAt)}</Text>
                  </View>
                  {(item.status === 'PENDING' || item.status === 'PAYMENT_CONFIRMED' || item.status === 'PREPARING') && (
                    <TouchableOpacity
                      style={styles.quickActionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedOrderForAction(item);
                        setShowQuickActionModal(true);
                      }}
                    >
                      <Text style={styles.quickActionText}>⚡ Acción Rápida</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.loadingText}>Cargando órdenes...</Text>
      </View>
    );
  }

  const filteredOrders = getFilteredAndSortedOrders();
  const stats = calculateStats();
  const pendingCount = orders.filter(o => o.status === 'PENDING' || o.status === 'PAYMENT_CONFIRMED').length;
  const preparingCount = orders.filter(o => o.status === 'PREPARING').length;
  const readyCount = orders.filter(o => o.status === 'READY_FOR_PICKUP').length;
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;


  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[
          styles.headerContainer,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <LinearGradient
          colors={['#34C759', '#30B350']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>🛒 Mis Órdenes</Text>
              <Text style={styles.headerSubtitle}>{orders.length} orden{orders.length !== 1 ? 'es' : ''} total{orders.length !== 1 ? 'es' : ''}</Text>
            </View>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => setShowStatsModal(true)}
            >
              <Text style={styles.headerActionIcon}>📊</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por cliente, producto, código..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}
          >
            <Text style={styles.sortButtonIcon}>🔀</Text>
            <Text style={styles.sortButtonText}>{getSortLabel()}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Today's Summary Card */}
      {(stats.todayPending > 0 || stats.todayRevenue > 0 || stats.todayCompleted > 0) && showSummary ? (
        <View style={styles.summaryContainer}>
          <Card style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>📊 Resumen de Hoy</Text>
              <TouchableOpacity
                style={styles.summaryCloseButton}
                onPress={() => setShowSummary(false)}
              >
                <Text style={styles.summaryCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{stats.todayPending}</Text>
                <Text style={styles.summaryLabel}>Pendientes</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, styles.summaryValueGreen]}>
                  {formatCurrencyShort(stats.todayRevenue)}
                </Text>
                <Text style={styles.summaryLabel}>Ingresos</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{stats.todayCompleted}</Text>
                <Text style={styles.summaryLabel}>Completadas</Text>
              </View>
            </View>
          </Card>
        </View>
      ) : (stats.todayPending > 0 || stats.todayRevenue > 0 || stats.todayCompleted > 0) && !showSummary ? (
        <View style={styles.summaryContainer}>
          <TouchableOpacity
            style={styles.summaryShowButton}
            onPress={() => setShowSummary(true)}
          >
            <Text style={styles.summaryShowIcon}>📊</Text>
            <Text style={styles.summaryShowText}>Mostrar Resumen de Hoy</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Filters */}
      <Animated.View
        style={[
          styles.filtersContainer,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          <FilterButton type="all" label="Todas" icon="📋" count={orders.length} />
          <FilterButton type="pending" label="Pendientes" icon="⏳" count={pendingCount} />
          <FilterButton type="preparing" label="Preparando" icon="📦" count={preparingCount} />
          <FilterButton type="ready" label="Listas" icon="✅" count={readyCount} />
          <FilterButton type="delivered" label="Entregadas" icon="✅" count={deliveredCount} />
        </ScrollView>
      </Animated.View>

      {/* Orders List */}
      <Animated.FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#34C759"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No tienes órdenes' : 'No hay órdenes en esta categoría'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' 
                ? 'Las órdenes de tus clientes aparecerán aquí' 
                : searchQuery.trim()
                ? 'No se encontraron órdenes con esa búsqueda'
                : 'Cambia el filtro para ver otras órdenes'}
            </Text>
          </View>
        }
      />
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
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    marginRight: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginRight: 8,
  },
  filtersContainer: {
    backgroundColor: '#0a0a0f',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 8,
  },
  filterGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  filterInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    gap: 6,
  },
  filterButtonActive: {
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterIcon: {
    fontSize: 14,
  },
  filterText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterBadge: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeInactive: {
    backgroundColor: '#34C759',
  },
  filterBadgeText: {
    color: '#34C759',
    fontSize: 11,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingTop: 280,
  },
  orderCard: {
    marginBottom: 12,
  },
  orderCardInner: {
    padding: 0,
    overflow: 'hidden',
  },
  orderRow: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  orderImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  orderImage: {
    width: 85,
    height: 85,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  orderInfo: {
    flex: 1,
    minWidth: 0,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  orderTitleSection: {
    flex: 1,
    minWidth: 0,
  },
  orderProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
    lineHeight: 20,
  },
  deliveryTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  deliveryTypeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  deliveryTypeText: {
    fontSize: 11,
    color: '#bbb',
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  urgentIndicator: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  urgentIndicatorText: {
    fontSize: 10,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  orderCustomer: {
    fontSize: 14,
    color: '#bbb',
    flex: 1,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quantityLabel: {
    fontSize: 12,
    color: '#888',
  },
  orderQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalLabel: {
    fontSize: 12,
    color: '#888',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeIcon: {
    fontSize: 12,
  },
  orderDate: {
    fontSize: 12,
    color: '#888',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
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
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalStatus: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  productInfo: {
    flexDirection: 'row',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 14,
    color: '#888',
    marginBottom: 6,
  },
  productTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
  },
  customerCard: {
    padding: 16,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  customerUsername: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  customerDetail: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  contactButton: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  contactGradient: {
    padding: 12,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  detailsCard: {
    padding: 16,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#fff',
  },
  actionBtn: {
    marginBottom: 12,
  },
  // QR Modal Styles
  qrOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'flex-end',
  },
  qrContainer: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  qrCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCloseText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  qrContent: {
    padding: 24,
    alignItems: 'center',
  },
  qrLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  qrCodeBox: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    minWidth: 280,
    alignItems: 'center',
  },
  qrCode: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#34C759',
    letterSpacing: 2,
  },
  qrInstructions: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    marginBottom: 20,
  },
  qrInstructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  qrInstructionsText: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 8,
    lineHeight: 20,
  },
  qrDoneButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  qrDoneGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  qrDoneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingRight: 0,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  headerActionIcon: {
    fontSize: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#0a0a0f',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  clearIcon: {
    color: '#888',
    fontSize: 18,
    padding: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  sortButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  sortButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  summaryContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  summaryCard: {
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCloseIcon: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryShowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  summaryShowIcon: {
    fontSize: 16,
  },
  summaryShowText: {
    fontSize: 14,
    color: '#bbb',
    fontWeight: '500',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  summaryValueGreen: {
    color: '#34C759',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888',
  },
  newBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: '#34C759',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 1,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  quickActionButton: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  quickActionText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  statCard: {
    marginBottom: 16,
    padding: 20,
  },
  statCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sortOptionActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderColor: '#667eea',
  },
  sortOptionText: {
    fontSize: 15,
    color: '#fff',
  },
  sortOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  sortOptionCheck: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: 'bold',
  },
  quickActionProduct: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  quickActionCustomer: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  quickActionOption: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  quickActionOptionText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  quickActionViewDetail: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  quickActionViewDetailText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
});


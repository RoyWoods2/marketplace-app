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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import GradientButton from '../components/GradientButton';
import QRCodeSimple from '../components/QRCodeSimple';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Order {
  id: string;
  quantity: number;
  total: number;
  status: string;
  paymentMethod: string;
  notes?: string;
  qrCode?: string;
  createdAt: string;
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

type FilterType = 'all' | 'pending' | 'preparing' | 'ready';

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
  const { token, user } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const getFilteredOrders = () => {
    switch (filter) {
      case 'pending':
        return orders.filter(o => o.status === 'PENDING' || o.status === 'PAYMENT_CONFIRMED');
      case 'preparing':
        return orders.filter(o => o.status === 'PREPARING');
      case 'ready':
        return orders.filter(o => o.status === 'READY_FOR_PICKUP');
      default:
        return orders;
    }
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

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          style={styles.orderCard}
          onPress={() => {
            console.log('🔍 Navegando a OrderDetail');
            navigation.navigate('OrderDetail', { order: item });
          }}
          activeOpacity={0.7}
        >
          <Card style={styles.orderCardInner}>
            <View style={styles.orderRow}>
              <Image
                source={{ uri: item.product.images[0] || 'https://via.placeholder.com/70' }}
                style={styles.orderImage}
              />
              <View style={styles.orderInfo}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderProduct} numberOfLines={1}>
                    {item.product.title}
                  </Text>
                  <LinearGradient
                    colors={statusColors}
                    style={styles.statusBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.statusText}>{statusLabel}</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.orderCustomer}>
                  {item.user.firstName} {item.user.lastName}
                </Text>
                <View style={styles.orderMeta}>
                  <Text style={styles.orderQuantity}>Cant: {item.quantity}</Text>
                  <Text style={styles.orderTotal}>${item.total}</Text>
                </View>
                <Text style={styles.orderDate}>
                  {new Date(item.createdAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
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

  const filteredOrders = getFilteredOrders();
  const pendingCount = orders.filter(o => o.status === 'PENDING' || o.status === 'PAYMENT_CONFIRMED').length;
  const preparingCount = orders.filter(o => o.status === 'PREPARING').length;
  const readyCount = orders.filter(o => o.status === 'READY_FOR_PICKUP').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#34C759', '#30B350']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🛒 Mis Órdenes</Text>
        <Text style={styles.headerSubtitle}>{orders.length} orden{orders.length !== 1 ? 'es' : ''} total{orders.length !== 1 ? 'es' : ''}</Text>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          <FilterButton type="all" label="Todas" icon="📋" count={orders.length} />
          <FilterButton type="pending" label="Pendientes" icon="⏳" count={pendingCount} />
          <FilterButton type="preparing" label="Preparando" icon="📦" count={preparingCount} />
          <FilterButton type="ready" label="Listas" icon="✅" count={readyCount} />
        </ScrollView>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
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
  },
  orderCard: {
    marginBottom: 16,
  },
  orderCardInner: {
    padding: 0,
  },
  orderRow: {
    flexDirection: 'row',
    padding: 16,
  },
  orderImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  orderProduct: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  orderCustomer: {
    fontSize: 14,
    color: '#888',
    marginBottom: 6,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 12,
  },
  orderQuantity: {
    fontSize: 13,
    color: '#888',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
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
});


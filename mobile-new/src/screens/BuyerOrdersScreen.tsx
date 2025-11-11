import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Linking,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Card from '../components/Card';
import { formatCurrencyShort } from '../utils/currency';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';

interface Order {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
    category: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      whatsapp?: string;
      instagram?: string;
    };
  };
}

interface OrderFilters {
  status: string;
  dateRange: string;
  search: string;
}

type SummaryCard = {
  key: string;
  label: string;
  value: string | number;
  icon: React.ReactNode;
};

type ContactItem = {
  key: string;
  icon: React.ReactNode;
  text: string;
};

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'CONFIRMED', label: 'Confirmadas' },
  { value: 'SHIPPED', label: 'Enviadas' },
  { value: 'DELIVERED', label: 'Entregadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
];

const DATE_RANGE_OPTIONS = [
  { value: 'ALL', label: 'Siempre' },
  { value: 'TODAY', label: 'Hoy' },
  { value: 'WEEK', label: 'Semana' },
  { value: 'MONTH', label: 'Mes' },
];

const STATUS_COPY: Record<Order['status'], { label: string; description: string }> = {
  PENDING: {
    label: 'Pendiente',
    description: 'Esperando confirmación del vendedor',
  },
  CONFIRMED: {
    label: 'Confirmada',
    description: 'Orden confirmada, preparando envío',
  },
  SHIPPED: {
    label: 'Enviada',
    description: 'Producto enviado, en tránsito',
  },
  DELIVERED: {
    label: 'Entregada',
    description: 'Producto entregado exitosamente',
  },
  CANCELLED: {
    label: 'Cancelada',
    description: 'Orden cancelada',
  },
};

const STATUS_COLORS: Record<Order['status'], string> = {
  PENDING: '#FF9500',
  CONFIRMED: '#007AFF',
  SHIPPED: '#756BFF',
  DELIVERED: '#34C759',
  CANCELLED: '#FF3B30',
};

export default function BuyerOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({
    status: 'ALL',
    dateRange: 'ALL',
    search: '',
  });
  const { token, user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      if (!user) {
        Alert.alert('Error', 'Usuario no autenticado');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.BUYER_ORDERS}?userId=${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('Error response:', errorData);
        Alert.alert('Error', errorData.error || 'No se pudieron cargar las órdenes');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Error al cargar las órdenes. Verifica tu conexión a internet.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...orders];

    if (filters.status !== 'ALL') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    const now = new Date();
    switch (filters.dateRange) {
      case 'TODAY': {
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.toDateString() === now.toDateString();
        });
        break;
      }
      case 'WEEK': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(order => new Date(order.createdAt) >= weekAgo);
        break;
      }
      case 'MONTH': {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(order => new Date(order.createdAt) >= monthAgo);
        break;
      }
    }

    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(order =>
        order.product.title.toLowerCase().includes(searchLower) ||
        order.product.user.firstName.toLowerCase().includes(searchLower) ||
        order.product.user.lastName.toLowerCase().includes(searchLower) ||
        order.product.category.toLowerCase().includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower)
      );
    }

    setFilteredOrders(filtered);
  };

  const handleContactSeller = (whatsapp?: string, instagram?: string, productTitle?: string) => {
    if (whatsapp) {
      const message = productTitle
        ? `Hola! Tengo una consulta sobre mi orden del producto "${productTitle}". ¿Podrías ayudarme?`
        : 'Hola! Tengo una consulta sobre mi orden. ¿Podrías ayudarme?';
      const whatsappUrl = `whatsapp://send?phone=${whatsapp}&text=${encodeURIComponent(message)}`;

      Linking.openURL(whatsappUrl).catch(() => {
        Alert.alert('Error', 'No se pudo abrir WhatsApp');
      });
      return;
    }

    if (instagram) {
      const instagramUrl = `https://instagram.com/${instagram}`;
      Linking.openURL(instagramUrl).catch(() => {
        Alert.alert('Error', 'No se pudo abrir Instagram');
      });
      return;
    }

    Alert.alert('Información', 'No hay información de contacto disponible');
  };

  const summaryCards: SummaryCard[] = useMemo(() => {
    const deliveredOrders = orders.filter(order => order.status === 'DELIVERED');
    const activeOrders = orders.filter(order => order.status !== 'DELIVERED' && order.status !== 'CANCELLED');
    const cancelledOrders = orders.filter(order => order.status === 'CANCELLED');

    const totalSpent = deliveredOrders.reduce((sum, order) => sum + order.total, 0);
    const lastOrder = orders[0] || null;

    return [
      {
        key: 'spent',
        label: 'Total gastado',
        value: formatCurrencyShort(totalSpent),
        icon: <Ionicons name="wallet" size={18} color="#34C759" />,
      },
      {
        key: 'delivered',
        label: 'Entregadas',
        value: deliveredOrders.length,
        icon: <Ionicons name="checkmark-done" size={18} color="#34C759" />,
      },
      {
        key: 'active',
        label: 'En progreso',
        value: activeOrders.length,
        icon: <Ionicons name="time-outline" size={18} color="#FFD60A" />,
      },
      {
        key: 'last',
        label: 'Última compra',
        value: lastOrder
          ? new Date(lastOrder.createdAt).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
            })
          : '—',
        icon: <MaterialIcons name="history" size={18} color="#667eea" />,
      },
      {
        key: 'cancelled',
        label: 'Canceladas',
        value: cancelledOrders.length,
        icon: <Ionicons name="close-circle" size={18} color="#FF6B6B" />,
      },
    ];
  }, [orders]);

  const renderFilterChip = (option: { label: string; value: string }, currentValue: string, onPress: () => void) => {
    const isActive = currentValue === option.value;
    return (
      <TouchableOpacity
        key={option.value}
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{option.label}</Text>
      </TouchableOpacity>
    );
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusMeta = STATUS_COPY[item.status];

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.85}
        onPress={() => {
          setSelectedOrder(item);
          setModalVisible(true);
        }}
      >
        <Card style={styles.orderCardInner}>
          <View style={styles.orderHeader}>
            <View style={styles.orderIdRow}>
              <MaterialIcons name="receipt-long" size={18} color="#8b8fa1" />
              <Text style={styles.orderId}>#{item.id.slice(-8)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
              <Text style={styles.statusText}>{statusMeta.label}</Text>
            </View>
          </View>

          <View style={styles.orderBody}>
            <Text style={styles.productTitle}>{item.product.title}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="storefront-outline" size={14} color="#8b8fa1" />
              <Text style={styles.metaText}>
                {item.product.user.firstName} {item.product.user.lastName}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="pricetag-outline" size={14} color="#8b8fa1" />
              <Text style={styles.metaText}>{item.product.category}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color="#8b8fa1" />
              <Text style={styles.metaText}>
                {new Date(item.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <Text style={styles.statusDescription}>{statusMeta.description}</Text>
          </View>

          <View style={styles.orderFooter}>
            <View style={styles.totalBadge}>
              <Ionicons name="cash-outline" size={16} color="#34C759" />
              <Text style={styles.totalText}>{formatCurrencyShort(item.total)}</Text>
            </View>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleContactSeller(
                item.product.user.whatsapp,
                item.product.user.instagram,
                item.product.title
              )}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-ellipses" size={16} color="#0a0a0f" />
              <Text style={styles.contactButtonText}>Contactar</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderListHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.summaryGrid}>
        {summaryCards.map(card => (
          <View key={card.key} style={styles.summaryCard}>
            <View style={styles.summaryIcon}>{card.icon}</View>
            <Text style={styles.summaryValue}>{card.value}</Text>
            <Text style={styles.summaryLabel}>{card.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por producto, vendedor o ID"
            placeholderTextColor="rgba(255,255,255,0.45)"
            value={filters.search}
            onChangeText={(text) => setFilters(prev => ({ ...prev, search: text }))}
            returnKeyType="search"
          />
          {filters.search.length > 0 && (
            <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, search: '' }))}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterSection}>
        <View style={styles.filterSectionHeader}>
          <Ionicons name="funnel" size={16} color="#8b8fa1" />
          <Text style={styles.filterSectionTitle}>Estado</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
          {STATUS_OPTIONS.map(option =>
            renderFilterChip(option, filters.status, () => setFilters(prev => ({ ...prev, status: option.value })))
          )}
        </ScrollView>
      </View>

      <View style={styles.filterSection}>
        <View style={styles.filterSectionHeader}>
          <Ionicons name="calendar" size={16} color="#8b8fa1" />
          <Text style={styles.filterSectionTitle}>Período</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
          {DATE_RANGE_OPTIONS.map(option =>
            renderFilterChip(option, filters.dateRange, () => setFilters(prev => ({ ...prev, dateRange: option.value })))
          )}
        </ScrollView>
      </View>
    </View>
  );

  const contactItems: ContactItem[] = useMemo(() => {
    if (!selectedOrder?.product.user) return [];
    const seller = selectedOrder.product.user;
    return (
      [
        seller.phone && {
          key: 'phone',
          icon: <Ionicons name="call" size={18} color="#34C759" style={styles.modalContactIcon} />,
          text: seller.phone,
        },
        seller.whatsapp && {
          key: 'whatsapp',
          icon: <Ionicons name="logo-whatsapp" size={18} color="#25D366" style={styles.modalContactIcon} />,
          text: seller.whatsapp,
        },
        seller.instagram && {
          key: 'instagram',
          icon: <Ionicons name="logo-instagram" size={18} color="#E4405F" style={styles.modalContactIcon} />,
          text: `@${seller.instagram}`,
        },
      ] as (ContactItem | null)[]
    ).filter((item): item is ContactItem => Boolean(item));
  }, [selectedOrder]);

  const renderOrderDetailModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient colors={['#34C759', '#30B350']} style={styles.modalHeader}>
            <View style={styles.modalHeaderInfo}>
              <MaterialIcons name="receipt-long" size={20} color="#FFFFFF" />
              <Text style={styles.modalTitle}>Detalle de la compra</Text>
            </View>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>

          {selectedOrder && (
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Resumen</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ID de Orden</Text>
                  <Text style={styles.detailValue}>#{selectedOrder.id.slice(-8)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Producto</Text>
                  <Text style={styles.detailValue}>{selectedOrder.product.title}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Categoría</Text>
                  <Text style={styles.detailValue}>{selectedOrder.product.category}</Text>
                </View>
                <View style={[styles.detailRow, styles.detailRowSplit]}>
                  <View>
                    <Text style={styles.detailLabel}>Total</Text>
                    <Text style={[styles.detailValue, styles.detailValueAccent]}>
                      {formatCurrencyShort(selectedOrder.total)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Estado</Text>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[selectedOrder.status] }]}>
                      <Text style={styles.statusText}>{STATUS_COPY[selectedOrder.status].label}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Fechas</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Creada</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedOrder.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                {selectedOrder.updatedAt !== selectedOrder.createdAt && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Actualización</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedOrder.updatedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Vendedor</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nombre</Text>
                  <Text style={styles.detailValue}>
                    {selectedOrder.product.user.firstName} {selectedOrder.product.user.lastName}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Correo</Text>
                  <Text style={styles.detailValue}>{selectedOrder.product.user.email}</Text>
                </View>
                {contactItems.map(item => (
                  <View key={item.key} style={styles.detailRow}>
                    <View style={styles.contactIconWrapper}>{item.icon}</View>
                    <Text style={[styles.detailValue, styles.detailValueFull]}>{item.text}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalContactButton}
              onPress={() => {
                setModalVisible(false);
                if (!selectedOrder) return;
                handleContactSeller(
                  selectedOrder.product.user.whatsapp,
                  selectedOrder.product.user.instagram,
                  selectedOrder.product.title
                );
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color="#0a0a0f" />
              <Text style={styles.modalContactButtonText}>Contactar vendedor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && orders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.loadingText}>Cargando compras...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#34C759', '#30B350']} style={styles.hero}>
        <View style={styles.heroContent}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>Mis compras</Text>
            <Text style={styles.heroSubtitle}>Historial y seguimiento de tus pedidos</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="bag-handle" size={18} color="#FFFFFF" />
            <Text style={styles.heroBadgeText}>{filteredOrders.length} orden{filteredOrders.length === 1 ? '' : 'es'}</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34C759" colors={["#34C759"]} />
        }
        ListHeaderComponent={renderListHeader}
        ListHeaderComponentStyle={styles.listHeaderComponent}
        contentContainerStyle={filteredOrders.length === 0 ? styles.listContentEmpty : styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bag-handle" size={64} color="#2f3144" />
            <Text style={styles.emptyTitle}>Sin compras registradas</Text>
            <Text style={styles.emptySubtitle}>
              {filters.status !== 'ALL' || filters.dateRange !== 'ALL' || filters.search.trim()
                ? 'Prueba ajustando los filtros o limpiando la búsqueda'
                : 'Cuando realices compras, verás el detalle aquí'}
            </Text>
            {(filters.status !== 'ALL' || filters.dateRange !== 'ALL' || filters.search.trim()) && (
              <TouchableOpacity
                style={styles.resetFiltersButton}
                onPress={() => setFilters({ status: 'ALL', dateRange: 'ALL', search: '' })}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh" size={16} color="#0a0a0f" />
                <Text style={styles.resetFiltersText}>Restablecer filtros</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {renderOrderDetailModal()}
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
    fontSize: 15,
    color: '#8b8fa1',
  },
  hero: {
    paddingTop: 60,
    paddingBottom: 36,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTextBlock: {
    flex: 1,
    marginRight: 16,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginTop: 6,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  listHeaderComponent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  listContent: {
    paddingBottom: 40,
  },
  listContentEmpty: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  listHeader: {
    gap: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    flexBasis: '48%',
    backgroundColor: '#151527',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    gap: 10,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8b8fa1',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  filterSection: {
    gap: 12,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterSectionTitle: {
    color: '#8b8fa1',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(52,199,89,0.2)',
    borderColor: '#34C759',
  },
  filterChipText: {
    color: '#8b8fa1',
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#34C759',
    fontWeight: '700',
  },
  orderCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  orderCardInner: {
    padding: 0,
    backgroundColor: '#151527',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b8fa1',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  orderBody: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 8,
  },
  productTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#8b8fa1',
    fontSize: 13,
  },
  statusDescription: {
    color: '#cfd2dc',
    fontSize: 12,
    lineHeight: 18,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52,199,89,0.15)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  totalText: {
    color: '#34C759',
    fontWeight: '700',
    fontSize: 13,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#34C759',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  contactButtonText: {
    color: '#0a0a0f',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#8b8fa1',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  resetFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#34C759',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
  },
  resetFiltersText: {
    color: '#0a0a0f',
    fontWeight: '700',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#151527',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalSection: {
    marginBottom: 20,
    gap: 12,
  },
  modalSectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  detailRowSplit: {
    alignItems: 'flex-start',
  },
  detailLabel: {
    color: '#8b8fa1',
    fontSize: 13,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    flexShrink: 1,
    textAlign: 'right',
  },
  detailValueAccent: {
    color: '#34C759',
    fontWeight: '700',
  },
  detailValueFull: {
    flex: 1,
    textAlign: 'left',
  },
  contactIconWrapper: {
    width: 24,
    alignItems: 'center',
  },
  modalContactIcon: {
    width: 24,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#151527',
  },
  modalContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#34C759',
    borderRadius: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  modalContactButtonText: {
    color: '#0a0a0f',
    fontWeight: '700',
    fontSize: 15,
  },
});

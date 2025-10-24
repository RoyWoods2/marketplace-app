import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useAuth } from '../context/AuthContext';

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
  const { token } = useAuth();

  const statusOptions = [
    { value: 'ALL', label: 'Todas' },
    { value: 'PENDING', label: 'Pendientes' },
    { value: 'CONFIRMED', label: 'Confirmadas' },
    { value: 'SHIPPED', label: 'Enviadas' },
    { value: 'DELIVERED', label: 'Entregadas' },
    { value: 'CANCELLED', label: 'Canceladas' },
  ];

  const dateRangeOptions = [
    { value: 'ALL', label: 'Todas las fechas' },
    { value: 'TODAY', label: 'Hoy' },
    { value: 'WEEK', label: 'Esta semana' },
    { value: 'MONTH', label: 'Este mes' },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/buyer/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
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

  const applyFilters = () => {
    let filtered = [...orders];

    // Filter by status
    if (filters.status !== 'ALL') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Filter by date range
    const now = new Date();
    switch (filters.dateRange) {
      case 'TODAY':
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.toDateString() === now.toDateString();
        });
        break;
      case 'WEEK':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(order => new Date(order.createdAt) >= weekAgo);
        break;
      case 'MONTH':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(order => new Date(order.createdAt) >= monthAgo);
        break;
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(order =>
        order.product.title.toLowerCase().includes(searchLower) ||
        order.product.user.firstName.toLowerCase().includes(searchLower) ||
        order.product.user.lastName.toLowerCase().includes(searchLower) ||
        order.product.category.toLowerCase().includes(searchLower)
      );
    }

    setFilteredOrders(filtered);
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

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Esperando confirmación del vendedor';
      case 'CONFIRMED': return 'Orden confirmada, preparando envío';
      case 'SHIPPED': return 'Producto enviado, en tránsito';
      case 'DELIVERED': return 'Producto entregado exitosamente';
      case 'CANCELLED': return 'Orden cancelada';
      default: return '';
    }
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
    } else if (instagram) {
      const instagramUrl = `https://instagram.com/${instagram}`;
      
      Linking.openURL(instagramUrl).catch(() => {
        Alert.alert('Error', 'No se pudo abrir Instagram');
      });
    } else {
      Alert.alert('Información', 'No hay información de contacto disponible');
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() => {
        setSelectedOrder(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item.id.slice(-8)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderContent}>
        <Text style={styles.productTitle}>{item.product.title}</Text>
        <Text style={styles.sellerName}>
          Vendedor: {item.product.user.firstName} {item.product.user.lastName}
        </Text>
        <Text style={styles.orderTotal}>Total: ${item.total}</Text>
        <Text style={styles.statusDescription}>
          {getStatusDescription(item.status)}
        </Text>
        <Text style={styles.orderDate}>
          {new Date(item.createdAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => handleContactSeller(
            item.product.user.whatsapp,
            item.product.user.instagram,
            item.product.title
          )}
        >
          <Text style={styles.contactButtonText}>Contactar Vendedor</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (label: string, value: string, currentValue: string, onPress: () => void) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        currentValue === value && styles.filterButtonActive
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.filterButtonText,
        currentValue === value && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderOrderDetailModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {selectedOrder && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detalles de la Orden</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ID de Orden:</Text>
                  <Text style={styles.detailValue}>#{selectedOrder.id.slice(-8)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Producto:</Text>
                  <Text style={styles.detailValue}>{selectedOrder.product.title}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Categoría:</Text>
                  <Text style={styles.detailValue}>{selectedOrder.product.category}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Vendedor:</Text>
                  <Text style={styles.detailValue}>
                    {selectedOrder.product.user.firstName} {selectedOrder.product.user.lastName}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email del Vendedor:</Text>
                  <Text style={styles.detailValue}>{selectedOrder.product.user.email}</Text>
                </View>

                {selectedOrder.product.user.phone && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Teléfono:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.product.user.phone}</Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total:</Text>
                  <Text style={[styles.detailValue, styles.totalValue]}>${selectedOrder.total}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Estado:</Text>
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) }]}>
                      <Text style={styles.statusText}>{getStatusLabel(selectedOrder.status)}</Text>
                    </View>
                    <Text style={styles.statusDescriptionText}>
                      {getStatusDescription(selectedOrder.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fecha de Compra:</Text>
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
                    <Text style={styles.detailLabel}>Última Actualización:</Text>
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

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => {
                    setModalVisible(false);
                    handleContactSeller(
                      selectedOrder.product.user.whatsapp,
                      selectedOrder.product.user.instagram,
                      selectedOrder.product.title
                    );
                  }}
                >
                  <Text style={styles.contactButtonText}>Contactar Vendedor</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Compras</Text>
        <Text style={styles.headerSubtitle}>{filteredOrders.length} órdenes encontradas</Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Estado:</Text>
          <View style={styles.filterButtons}>
            {statusOptions.map(option => (
              <View key={option.value} style={styles.filterButtonContainer}>
                {renderFilterButton(
                  option.label,
                  option.value,
                  filters.status,
                  () => setFilters({ ...filters, status: option.value })
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Período:</Text>
          <View style={styles.filterButtons}>
            {dateRangeOptions.map(option => (
              <View key={option.value} style={styles.filterButtonContainer}>
                {renderFilterButton(
                  option.label,
                  option.value,
                  filters.dateRange,
                  () => setFilters({ ...filters, dateRange: option.value })
                )}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {renderOrderDetailModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButtonContainer: {
    marginRight: 8,
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  orderItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderContent: {
    marginBottom: 12,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  contactButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  modalBody: {
    padding: 20,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusDescriptionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

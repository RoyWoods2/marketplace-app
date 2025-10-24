import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import { API_ENDPOINTS } from '../config/api';

interface Order {
  id: string;
  status: string;
  total: number;
  quantity: number;
  paymentMethod?: string;
  notes?: string;
  qrCode: string;
  pickupCode?: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
    category: string;
    user: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      whatsapp?: string;
      instagram?: string;
      facebook?: string;
      phone?: string;
    };
  };
  branch?: {
    id: string;
    name: string;
    address: string;
    phone?: string;
  };
}

const ClientOrdersEnhancedScreen: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_ENDPOINTS.BUYER_ORDERS}?userId=client_user_id`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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

  useEffect(() => {
    fetchOrders();
  }, []);

  const contactSeller = (seller: Order['product']['user'], orderId: string) => {
    Alert.alert(
      'Contactar Vendedor',
      'Elige cómo contactar al vendedor:',
      [
        {
          text: 'WhatsApp',
          onPress: () => {
            if (seller.whatsapp) {
              const whatsappUrl = `whatsapp://send?phone=${seller.whatsapp}&text=Hola! Tengo una consulta sobre mi pedido #${orderId}`;
              Linking.openURL(whatsappUrl).catch(() => {
                Alert.alert('Error', 'No se pudo abrir WhatsApp');
              });
            } else {
              Alert.alert('Error', 'El vendedor no tiene WhatsApp configurado');
            }
          },
        },
        {
          text: 'Instagram',
          onPress: () => {
            if (seller.instagram) {
              const instagramUrl = `https://instagram.com/${seller.instagram}`;
              Linking.openURL(instagramUrl).catch(() => {
                Alert.alert('Error', 'No se pudo abrir Instagram');
              });
            } else {
              Alert.alert('Error', 'El vendedor no tiene Instagram configurado');
            }
          },
        },
        {
          text: 'Facebook',
          onPress: () => {
            if (seller.facebook) {
              const facebookUrl = `https://facebook.com/${seller.facebook}`;
              Linking.openURL(facebookUrl).catch(() => {
                Alert.alert('Error', 'No se pudo abrir Facebook');
              });
            } else {
              Alert.alert('Error', 'El vendedor no tiene Facebook configurado');
            }
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FF9800';
      case 'PAYMENT_PENDING':
        return '#FF5722';
      case 'PAYMENT_CONFIRMED':
        return '#2196F3';
      case 'PREPARING':
        return '#9C27B0';
      case 'READY_FOR_PICKUP':
        return '#4CAF50';
      case 'PICKED_UP':
        return '#8BC34A';
      case 'DELIVERED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'PAYMENT_PENDING':
        return 'Esperando Pago';
      case 'PAYMENT_CONFIRMED':
        return 'Pago Confirmado';
      case 'PREPARING':
        return 'Preparando';
      case 'READY_FOR_PICKUP':
        return '¡Listo para Retiro!';
      case 'PICKED_UP':
        return 'Retirado';
      case 'DELIVERED':
        return 'Entregado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Contacta al vendedor para coordinar el pago';
      case 'PAYMENT_PENDING':
        return 'El vendedor está esperando tu pago';
      case 'PAYMENT_CONFIRMED':
        return 'Pago confirmado, el vendedor está preparando tu producto';
      case 'PREPARING':
        return 'Tu producto está siendo preparado y será entregado en la sucursal';
      case 'READY_FOR_PICKUP':
        return '¡Tu producto está listo! Puedes retirarlo de la sucursal';
      case 'PICKED_UP':
        return 'Producto retirado exitosamente';
      case 'DELIVERED':
        return 'Producto entregado';
      case 'CANCELLED':
        return 'Pedido cancelado';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const shouldShowContactButton = (status: string) => {
    return status === 'PENDING' || status === 'PAYMENT_PENDING';
  };

  const shouldShowPickupInfo = (status: string) => {
    return status === 'READY_FOR_PICKUP' || status === 'PICKED_UP';
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(item);
        setShowOrderModal(true);
      }}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.productTitle}>{item.product.title}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <Text style={styles.statusDescription}>
          {getStatusDescription(item.status)}
        </Text>
        <Text style={styles.orderTotal}>Total: ${item.total}</Text>
        <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
      </View>

      <View style={styles.orderActions}>
        {shouldShowContactButton(item.status) && (
          <TouchableOpacity
            style={[styles.actionButton, styles.contactButton]}
            onPress={() => contactSeller(item.product.user, item.id)}
          >
            <Text style={styles.actionButtonText}>📱 Contactar Vendedor</Text>
          </TouchableOpacity>
        )}
        
        {shouldShowPickupInfo(item.status) && (
          <View style={styles.pickupInfo}>
            <Text style={styles.pickupText}>
              {item.status === 'READY_FOR_PICKUP' ? '🚚 Listo para retiro' : '✅ Retirado'}
            </Text>
            {item.pickupCode && (
              <Text style={styles.pickupCode}>Código: {item.pickupCode}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Cargando órdenes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Pedidos</Text>
        <Text style={styles.subtitle}>
          Seguimiento de tus compras
        </Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tienes pedidos aún</Text>
            <Text style={styles.emptySubtext}>
              Explora productos y haz tu primera compra
            </Text>
          </View>
        }
      />

      {/* Order Detail Modal */}
      <Modal
        visible={showOrderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOrderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <>
                <Text style={styles.modalTitle}>Detalles del Pedido</Text>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Producto</Text>
                  <Text style={styles.modalText}>{selectedOrder.product.title}</Text>
                  <Text style={styles.modalText}>Precio: ${selectedOrder.product.price}</Text>
                  <Text style={styles.modalText}>Cantidad: {selectedOrder.quantity}</Text>
                  <Text style={styles.modalText}>Total: ${selectedOrder.total}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Estado</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(selectedOrder.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusText(selectedOrder.status)}
                    </Text>
                  </View>
                  <Text style={styles.statusDescription}>
                    {getStatusDescription(selectedOrder.status)}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Vendedor</Text>
                  <Text style={styles.modalText}>
                    {selectedOrder.product.user.firstName} {selectedOrder.product.user.lastName}
                  </Text>
                  <Text style={styles.modalText}>@{selectedOrder.product.user.username}</Text>
                </View>

                {selectedOrder.branch && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Sucursal de Retiro</Text>
                    <Text style={styles.modalText}>{selectedOrder.branch.name}</Text>
                    <Text style={styles.modalText}>{selectedOrder.branch.address}</Text>
                    {selectedOrder.branch.phone && (
                      <Text style={styles.modalText}>📞 {selectedOrder.branch.phone}</Text>
                    )}
                  </View>
                )}

                {selectedOrder.pickupCode && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Código de Retiro</Text>
                    <Text style={styles.pickupCodeModal}>{selectedOrder.pickupCode}</Text>
                    <Text style={styles.pickupCodeNote}>
                      Muestra este código al retirar tu producto
                    </Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  {shouldShowContactButton(selectedOrder.status) && (
                    <TouchableOpacity
                      style={[styles.modalActionButton, styles.contactButton]}
                      onPress={() => {
                        contactSeller(selectedOrder.product.user, selectedOrder.id);
                        setShowOrderModal(false);
                      }}
                    >
                      <Text style={styles.modalActionButtonText}>📱 Contactar Vendedor</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.closeButton]}
                    onPress={() => setShowOrderModal(false)}
                  >
                    <Text style={styles.modalActionButtonText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

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
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: 'white',
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
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  orderDetails: {
    marginBottom: 12,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  orderActions: {
    gap: 8,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactButton: {
    backgroundColor: '#25D366',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pickupInfo: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  pickupText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  pickupCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    maxWidth: '90%',
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  pickupCodeModal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 8,
  },
  pickupCodeNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalActions: {
    marginTop: 20,
    gap: 12,
  },
  modalActionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#757575',
  },
  modalActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ClientOrdersEnhancedScreen;

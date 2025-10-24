import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import GradientButton from '../components/GradientButton';

interface Order {
  id: string;
  quantity: number;
  total: number;
  status: string;
  paymentMethod: string;
  notes?: string;
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
}

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

export default function OrderDetailScreen({ route, navigation }: any) {
  const { order: initialOrder } = route.params;
  const [order, setOrder] = useState<Order>(initialOrder);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const { token } = useAuth();

  const loadQRCode = async () => {
    try {
      setLoadingQR(true);
      const response = await fetch(`http://192.168.1.120:3001/api/orders/${order.id}/qr`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setQrImage(data.qrCode);
      }
    } catch (error) {
      console.error('Error loading QR:', error);
    } finally {
      setLoadingQR(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.SELLER_ORDER_STATUS(order.id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrder({ ...order, status: newStatus });
        Alert.alert('Éxito', 'Estado actualizado correctamente');
      } else {
        Alert.alert('Error', 'No se pudo actualizar el estado');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Error al actualizar');
    }
  };

  const handleContactWhatsApp = () => {
    if (!order.user.whatsapp) {
      Alert.alert('Error', 'Cliente no tiene WhatsApp');
      return;
    }

    const cleanPhone = order.user.whatsapp.replace(/\D/g, '');
    const message = `Hola ${order.user.firstName}! Te contacto sobre tu orden de ${order.product.title}.`;
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    
    Linking.openURL(url).catch(() => {
      const webUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      Linking.openURL(webUrl).catch(() => {
        Alert.alert('Error', 'No se pudo abrir WhatsApp');
      });
    });
  };

  const statusColors = STATUS_COLORS[order.status] || ['#666', '#555'];
  const statusLabel = STATUS_LABELS[order.status] || order.status;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={statusColors}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Orden #{order.id.slice(-6)}</Text>
          <Text style={styles.headerStatus}>{statusLabel}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContent}>
        {/* Product Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Producto</Text>
          <View style={styles.productInfo}>
            <Image
              source={{ uri: order.product.images[0] }}
              style={styles.productImage}
            />
            <View style={styles.productDetails}>
              <Text style={styles.productTitle}>{order.product.title}</Text>
              <Text style={styles.productPrice}>${order.product.price} × {order.quantity}</Text>
              <Text style={styles.productTotal}>Total: ${order.total}</Text>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Cliente</Text>
          <Card style={styles.customerCard}>
            <Text style={styles.customerName}>
              {order.user.firstName} {order.user.lastName}
            </Text>
            <Text style={styles.customerUsername}>@{order.user.username}</Text>
            {order.user.email && (
              <Text style={styles.customerDetail}>📧 {order.user.email}</Text>
            )}
            {order.user.whatsapp && (
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleContactWhatsApp}
              >
                <LinearGradient
                  colors={['#25D366', '#128C7E']}
                  style={styles.contactGradient}
                >
                  <Text style={styles.contactButtonText}>💬 WhatsApp</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </Card>
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Detalles</Text>
          <Card style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Método de pago:</Text>
              <Text style={styles.detailValue}>{order.paymentMethod || 'No especificado'}</Text>
            </View>
            {order.notes && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Notas:</Text>
                <Text style={styles.detailValue}>{order.notes}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fecha:</Text>
              <Text style={styles.detailValue}>
                {new Date(order.createdAt).toLocaleString('es-ES')}
              </Text>
            </View>
          </Card>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Acciones</Text>
          
          {/* Botón QR - Siempre visible */}
          <GradientButton
            title="📱 Mostrar Código QR"
            onPress={() => {
              console.log('🔍 Cargando código QR');
              loadQRCode();
              setShowQRModal(true);
            }}
            loading={loadingQR}
            gradient={['#667eea', '#764ba2']}
            style={styles.actionBtn}
          />

          {order.status === 'PENDING' && (
            <GradientButton
              title="✅ Confirmar Pago"
              onPress={() => updateOrderStatus('PAYMENT_CONFIRMED')}
              gradient={['#2196F3', '#1976D2']}
              style={styles.actionBtn}
            />
          )}

          {order.status === 'PAYMENT_CONFIRMED' && (
            <GradientButton
              title="📦 Marcar como Preparando"
              onPress={() => updateOrderStatus('PREPARING')}
              gradient={['#9C27B0', '#7B1FA2']}
              style={styles.actionBtn}
            />
          )}

          {order.status === 'PREPARING' && (
            <GradientButton
              title="✅ Marcar como Listo"
              onPress={() => updateOrderStatus('READY_FOR_PICKUP')}
              gradient={['#4CAF50', '#388E3C']}
              style={styles.actionBtn}
            />
          )}

          {order.status === 'READY_FOR_PICKUP' && (
            <GradientButton
              title="🎉 Marcar como Entregado"
              onPress={() => updateOrderStatus('DELIVERED')}
              gradient={['#34C759', '#30B350']}
              style={styles.actionBtn}
            />
          )}
        </View>
      </ScrollView>

      {/* QR Modal - Ahora SÍ funcionará */}
      <Modal
        visible={showQRModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.qrOverlay}>
          <View style={styles.qrContainer}>
            <LinearGradient
              colors={['#34C759', '#30B350']}
              style={styles.qrHeader}
            >
              <Text style={styles.qrTitle}>Código de la Orden</Text>
              <TouchableOpacity style={styles.qrCloseButton} onPress={() => setShowQRModal(false)}>
                <Text style={styles.qrCloseText}>✕</Text>
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.qrContent}>
              <Text style={styles.qrLabel}>Escanea este código QR</Text>
              
              {loadingQR ? (
                <View style={styles.qrCodeBox}>
                  <ActivityIndicator size="large" color="#34C759" />
                  <Text style={styles.loadingText}>Generando QR...</Text>
                </View>
              ) : qrImage ? (
                <View style={styles.qrCodeBox}>
                  <Image 
                    source={{ uri: qrImage }} 
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <View style={styles.qrCodeBox}>
                  <Text style={styles.qrCodeLarge}>#{order.id.slice(-8).toUpperCase()}</Text>
                </View>
              )}
              
              <Text style={styles.orderCodeText}>Orden #{order.id.slice(-8).toUpperCase()}</Text>

              <View style={styles.qrInstructions}>
                <Text style={styles.qrInstructionsTitle}>📱 Instrucciones</Text>
                <Text style={styles.qrInstructionsText}>
                  1. El cliente debe mostrar este QR al recoger
                </Text>
                <Text style={styles.qrInstructionsText}>
                  2. El administrador escaneará con su app
                </Text>
                <Text style={styles.qrInstructionsText}>
                  3. La orden cambiará automáticamente a "Listo"
                </Text>
              </View>

              <TouchableOpacity
                style={styles.qrDoneButton}
                onPress={() => setShowQRModal(false)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#34C759', '#30B350']}
                  style={styles.qrDoneGradient}
                >
                  <Text style={styles.qrDoneText}>Entendido</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerStatus: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  productInfo: {
    flexDirection: 'row',
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 16,
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  productTotal: {
    fontSize: 20,
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
    paddingBottom: 40,
  },
  qrLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  qrCodeBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    alignItems: 'center',
  },
  qrCodeLarge: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#34C759',
    letterSpacing: 4,
  },
  qrImage: {
    width: 250,
    height: 250,
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
    fontSize: 14,
  },
  orderCodeText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
    textAlign: 'center',
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
    paddingVertical: 16,
    alignItems: 'center',
  },
  qrDoneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';

interface OrderDetails {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  product: {
    title: string;
    price: number;
    images: string[];
  };
  branch: {
    name: string;
    address: string;
  };
}

export default function AdminQRScannerScreen({ navigation }: any) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = async ({ type, data }: any) => {
    if (scanned) return;
    
    setScanned(true);
    setLoading(true);

    try {
      // Extract order ID from QR data
      const orderId = data;
      
      // Verify QR code and get order details
      const response = await fetch(`${API_ENDPOINTS.ADMIN_SCAN_QR}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ qrCode: data }),
      });

      if (response.ok) {
        const result = await response.json();
        setOrderDetails(result.order);
        setShowOrderModal(true);
      } else {
        Alert.alert('Error', 'QR code inválido o orden no encontrada');
        setScanned(false);
      }
    } catch (error) {
      console.error('Error scanning QR:', error);
      Alert.alert('Error', 'Error al escanear el código QR');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPickup = async () => {
    if (!orderDetails) return;

    try {
      setLoading(true);
      
      const response = await fetch(API_ENDPOINTS.ADMIN_CONFIRM_PICKUP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: orderDetails.id }),
      });

      if (response.ok) {
        Alert.alert(
          'Éxito', 
          'Orden marcada como entregada',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowOrderModal(false);
                setOrderDetails(null);
                setScanned(false);
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo actualizar la orden');
      }
    } catch (error) {
      console.error('Error confirming pickup:', error);
      Alert.alert('Error', 'Error al confirmar la entrega');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowOrderModal(false);
    setOrderDetails(null);
    setScanned(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PREPARING': return '#9C27B0';
      case 'READY_FOR_PICKUP': return '#4CAF50';
      case 'PICKED_UP': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PREPARING': return 'Preparando';
      case 'READY_FOR_PICKUP': return 'Listo para Retiro';
      case 'PICKED_UP': return 'Entregado';
      default: return status;
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Solicitando permisos de cámara...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No se otorgaron permisos de cámara</Text>
        <TouchableOpacity style={styles.button} onPress={getCameraPermissions}>
          <Text style={styles.buttonText}>Solicitar Permisos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escanear QR</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={styles.camera}
        />
        
        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={styles.corner} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Coloca el código QR dentro del marco para escanear
          </Text>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Procesando...</Text>
            </View>
          )}
        </View>
      </View>

      {/* Order Details Modal */}
      <Modal
        visible={showOrderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles de la Orden</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {orderDetails && (
              <View style={styles.orderDetails}>
                {/* Order Info */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📦 Información del Pedido</Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.label}>Producto:</Text> {orderDetails.product.title}
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.label}>Total:</Text> ${orderDetails.total}
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.label}>Estado:</Text> 
                    <Text style={[styles.statusText, { color: getStatusColor(orderDetails.status) }]}>
                      {getStatusText(orderDetails.status)}
                    </Text>
                  </Text>
                </View>

                {/* Customer Info */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>👤 Cliente</Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.label}>Nombre:</Text> {orderDetails.user.firstName} {orderDetails.user.lastName}
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.label}>Email:</Text> {orderDetails.user.email}
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.label}>Teléfono:</Text> {orderDetails.user.phone}
                  </Text>
                </View>

                {/* Branch Info */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🏪 Sucursal</Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.label}>Nombre:</Text> {orderDetails.branch.name}
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.label}>Dirección:</Text> {orderDetails.branch.address}
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.cancelButton,
                      (orderDetails.status === 'PICKED_UP' || loading) && styles.disabledButton
                    ]}
                    onPress={handleCloseModal}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.confirmButton,
                      (orderDetails.status === 'PICKED_UP' || loading) && styles.disabledButton
                    ]}
                    onPress={handleConfirmPickup}
                    disabled={orderDetails.status === 'PICKED_UP' || loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.confirmButtonText}>
                        {orderDetails.status === 'PICKED_UP' ? 'Ya Entregado' : 'Confirmar Entrega'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#4CAF50',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#4CAF50',
    borderWidth: 3,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    top: 'auto',
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionsText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    margin: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    margin: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
    width: '90%',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  orderDetails: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
  },
  statusText: {
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

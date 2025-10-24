import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { API_ENDPOINTS } from '../config/api';

interface QRScanResult {
  orderId: string;
  productTitle: string;
  clientName: string;
  branchName: string;
  pickupCode: string;
}

const QRScannerScreen: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<QRScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Simulated QR scan function (in real app, use react-native-camera or expo-camera)
  const simulateQRScan = () => {
    setScanning(true);
    setLoading(true);
    
    // Simulate scanning delay
    setTimeout(() => {
      // This would be the actual QR code data from camera
      const mockQRData = 'eyJvcmRlcklkIjoiY3VpZF8xMjM0NTY3ODkwIiwidG9rZW4iOiJhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejEyMzQ1Njc4OTBhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5eiIsInRpbWVzdGFtcCI6MTcwNDYwOTIwMDAwMH0=';
      
      handleQRScan(mockQRData);
      setScanning(false);
    }, 2000);
  };

  const handleQRScan = async (qrData: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_SCAN_QR, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scannedQR: qrData,
          userId: 'admin_user_id', // This should come from auth context
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult({
          orderId: data.order.id,
          productTitle: data.order.product.title,
          clientName: `${data.order.user.firstName} ${data.order.user.lastName}`,
          branchName: data.order.branch?.name || 'Sucursal Principal',
          pickupCode: data.pickupCode,
        });
        setShowResult(true);
        Alert.alert(
          '¡Éxito!',
          `Producto confirmado como listo para retiro.\nCódigo de retiro: ${data.pickupCode}`,
          [{ text: 'OK', onPress: () => setShowResult(true) }]
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Error al escanear el código QR');
      }
    } catch (error) {
      console.error('QR scan error:', error);
      Alert.alert('Error', 'No se pudo procesar el código QR');
    } finally {
      setLoading(false);
    }
  };

  const confirmPickup = async () => {
    if (!result) return;

    try {
      setLoading(true);
      
      const response = await fetch(API_ENDPOINTS.ADMIN_CONFIRM_PICKUP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: result.orderId,
          pickupCode: result.pickupCode,
          userId: 'admin_user_id', // This should come from auth context
        }),
      });

      if (response.ok) {
        Alert.alert('¡Éxito!', 'Retiro del producto confirmado exitosamente');
        setShowResult(false);
        setResult(null);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Error al confirmar el retiro');
      }
    } catch (error) {
      console.error('Confirm pickup error:', error);
      Alert.alert('Error', 'No se pudo confirmar el retiro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Escanear Código QR</Text>
        <Text style={styles.subtitle}>
          Escanea el código QR del producto para confirmar que está listo para retiro
        </Text>
      </View>

      <View style={styles.scannerContainer}>
        {!scanning && !loading && (
          <View style={styles.scannerPlaceholder}>
            <Text style={styles.scannerIcon}>📱</Text>
            <Text style={styles.scannerText}>
              Aquí aparecerá la cámara para escanear el código QR
            </Text>
            <Text style={styles.scannerNote}>
              En una implementación real, aquí se usaría la cámara del dispositivo
            </Text>
          </View>
        )}

        {scanning && (
          <View style={styles.scannerActive}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.scanningText}>Escaneando código QR...</Text>
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerFrame} />
            </View>
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Procesando código QR...</Text>
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        {!scanning && !loading && (
          <TouchableOpacity
            style={styles.scanButton}
            onPress={simulateQRScan}
          >
            <Text style={styles.scanButtonText}>🔍 Simular Escaneo</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setScanning(false);
            setLoading(false);
          }}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      {/* Result Modal */}
      <Modal
        visible={showResult}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowResult(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Producto Listo para Retiro</Text>
            
            {result && (
              <View style={styles.resultContainer}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Producto:</Text>
                  <Text style={styles.resultValue}>{result.productTitle}</Text>
                </View>
                
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Cliente:</Text>
                  <Text style={styles.resultValue}>{result.clientName}</Text>
                </View>
                
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Sucursal:</Text>
                  <Text style={styles.resultValue}>{result.branchName}</Text>
                </View>
                
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Código de Retiro:</Text>
                  <Text style={[styles.resultValue, styles.pickupCode]}>
                    {result.pickupCode}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmPickup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmar Retiro</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowResult(false)}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
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
  scannerContainer: {
    flex: 1,
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  scannerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  scannerIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  scannerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  scannerNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  scannerActive: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    position: 'relative',
  },
  scanningText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  actionsContainer: {
    padding: 20,
    gap: 12,
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  resultContainer: {
    marginBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  resultValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  pickupCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modalActions: {
    gap: 12,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#757575',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QRScannerScreen;

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface QRCodeSimpleProps {
  visible: boolean;
  orderId: string;
  qrData: string;
  onClose: () => void;
}

export default function QRCodeSimple({ visible, orderId, qrData, onClose }: QRCodeSimpleProps) {
  
  console.log('🔍 QRCodeSimple - visible:', visible);
  console.log('🔍 QRCodeSimple - orderId:', orderId);

  const shareQRCode = async () => {
    try {
      await Share.share({
        message: `Código de Orden: ${orderId}\n\nDatos: ${qrData}\n\nMuestra este código al administrador para recoger tu pedido.`,
        title: 'Código de Orden',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#34C759', '#30B350']}
            style={styles.header}
          >
            <Text style={styles.title}>Código de la Orden</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.content}>
            <Text style={styles.orderIdLabel}>Número de Orden</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.orderCode}>#{orderId.slice(-8).toUpperCase()}</Text>
            </View>

            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>📱 Instrucciones</Text>
              <Text style={styles.instructionsText}>
                1. Muestra este código al administrador
              </Text>
              <Text style={styles.instructionsText}>
                2. El administrador lo ingresará en su sistema
              </Text>
              <Text style={styles.instructionsText}>
                3. Tu orden cambiará a "Listo para Retiro"
              </Text>
            </View>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={shareQRCode}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.shareButtonGradient}
              >
                <Text style={styles.shareButtonText}>📤 Compartir Código</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  container: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    zIndex: 10000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  orderIdLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  codeContainer: {
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
  orderCode: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#34C759',
    letterSpacing: 2,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 8,
    lineHeight: 20,
  },
  shareButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  shareButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  doneButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  doneButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
});


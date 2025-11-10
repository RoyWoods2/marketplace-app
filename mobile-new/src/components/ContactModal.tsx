import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  whatsapp?: string;
  instagram?: string;
}

interface ContactModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
}

export default function ContactModal({ visible, user, onClose }: ContactModalProps) {
  if (!user) return null;

  const handleContactWhatsApp = (phoneNumber: string) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Número de WhatsApp no disponible');
      return;
    }

    // Limpiar el número de teléfono (remover espacios, guiones, etc.)
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    const message = `Hola! Me interesa contactarte sobre tu contenido en el marketplace.`;
    
    // Intentar abrir WhatsApp directamente
    const whatsappUrl = `whatsapp://send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.openURL(whatsappUrl).catch(() => {
      // Si WhatsApp no está instalado, intentar con la versión web
      const webWhatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
      Linking.openURL(webWhatsappUrl).catch(() => {
        Alert.alert('Error', 'No se pudo abrir WhatsApp. Asegúrate de tener WhatsApp instalado.');
      });
    });
    onClose();
  };

  const handleContactInstagram = (username: string) => {
    if (!username) {
      Alert.alert('Error', 'Usuario de Instagram no disponible');
      return;
    }

    const instagramUrl = `https://instagram.com/${username}`;
    
    Linking.openURL(instagramUrl).catch(() => {
      Alert.alert('Error', 'No se pudo abrir Instagram');
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Contactar a {user.firstName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.username}>@{user.username}</Text>
            <Text style={styles.fullName}>
              {user.firstName} {user.lastName}
            </Text>
            {user.bio && (
              <Text style={styles.bio}>{user.bio}</Text>
            )}
          </View>

          <View style={styles.contactOptions}>
            {user.whatsapp ? (
              <TouchableOpacity
                style={styles.whatsappButton}
                onPress={() => handleContactWhatsApp(user.whatsapp)}
              >
                <FontAwesome5 name="whatsapp" size={32} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>WhatsApp</Text>
                <Text style={styles.buttonSubtext}>{user.whatsapp}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.unavailableButton}>
                <FontAwesome5 name="whatsapp" size={32} color="#999" style={styles.unavailableIcon} />
                <Text style={styles.unavailableText}>WhatsApp no disponible</Text>
              </View>
            )}

            {user.instagram ? (
              <TouchableOpacity
                style={styles.instagramButton}
                onPress={() => handleContactInstagram(user.instagram)}
              >
                <FontAwesome5 name="instagram" size={32} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Instagram</Text>
                <Text style={styles.buttonSubtext}>@{user.instagram}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.unavailableButton}>
                <FontAwesome5 name="instagram" size={32} color="#999" style={styles.unavailableIcon} />
                <Text style={styles.unavailableText}>Instagram no disponible</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  username: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  fullName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 5,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  contactOptions: {
    marginBottom: 20,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  instagramButton: {
    backgroundColor: '#E4405F',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonIcon: {
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  buttonSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  unavailableButton: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  unavailableIcon: {
    marginBottom: 10,
    opacity: 0.5,
  },
  unavailableText: {
    color: '#666',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
});

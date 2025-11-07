import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useAuth } from '../context/AuthContext';
import { formatCurrencyShort } from '../utils/currency';
import ContactModal from '../components/ContactModal';
import { API_ENDPOINTS } from '../config/api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface Reel {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnail?: string;
  views: number;
  likes: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    whatsapp?: string;
    instagram?: string;
  };
  product?: {
    id: string;
    title: string;
    price: number;
    images: string[];
    category: string;
  };
}

export default function HomeScreen({ navigation }: any) {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const videoRefs = useRef<{ [key: string]: Video }>({});
  const { token } = useAuth();

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      console.log('📡 Fetching reels...');
      const response = await fetch(API_ENDPOINTS.REELS, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Reels fetched:', data.reels.length);
        setReels(data.reels);
      } else {
        console.error('❌ Error fetching reels:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching reels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (reelId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.REEL_LIKE(reelId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'like' }),
      });

      if (response.ok) {
        // Update local state
        setReels(prevReels =>
          prevReels.map(reel =>
            reel.id === reelId
              ? { ...reel, likes: reel.likes + 1 }
              : reel
          )
        );
      }
    } catch (error) {
      console.error('Error liking reel:', error);
    }
  };

  const handleContactWhatsApp = (phoneNumber: string, product?: any) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Número de WhatsApp no disponible');
      return;
    }

    // Limpiar el número de teléfono (remover espacios, guiones, etc.)
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    const message = product
      ? `Hola! Me interesa el producto "${product.title}" que vi en tu reel. ¿Podrías darme más información?`
      : 'Hola! Me interesa contactarte sobre tu contenido.';

    // Intentar abrir WhatsApp directamente
    const whatsappUrl = `whatsapp://send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.openURL(whatsappUrl).catch(() => {
      // Si WhatsApp no está instalado, intentar con la versión web
      const webWhatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
      Linking.openURL(webWhatsappUrl).catch(() => {
        Alert.alert('Error', 'No se pudo abrir WhatsApp. Asegúrate de tener WhatsApp instalado.');
      });
    });
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
  };

  const handleUserPress = (user: any) => {
    setSelectedUser(user);
    setContactModalVisible(true);
  };

  const handleProductPress = (product: any) => {
    console.log('🔍 Navigating to ProductDetail with productId:', product.id);
    
    try {
      // Navegar directamente al ProductDetail en el mismo stack
      navigation.navigate('ProductDetail', { productId: product.id });
    } catch (error) {
      console.error('❌ Navigation error:', error);
      // Si falla, intentar con el parent navigator
      try {
        navigation.getParent()?.navigate('ProductDetail', { productId: product.id });
      } catch (parentError) {
        console.error('❌ Parent navigation error:', parentError);
        Alert.alert('Error', 'No se pudo navegar a los detalles del producto');
      }
    }
  };

  const renderReel = ({ item, index }: { item: Reel; index: number }) => (
    <View style={[styles.reelContainer, { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }]}>
      <Video
        ref={(ref) => {
          if (ref) {
            videoRefs.current[item.id] = ref;
          }
        }}
        source={{ uri: item.videoUrl }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={index === currentIndex}
        isLooping
        onPlaybackStatusUpdate={(status) => {
          if (status.isLoaded && !status.isPlaying && index === currentIndex) {
            videoRefs.current[item.id]?.playAsync();
          }
        }}
      />
      
      {/* Left Side - User Info & Description */}
      <View style={styles.leftOverlay}>
        {/* User Info */}
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => handleUserPress(item.user)}
        >
          <Image
            source={{ uri: item.user.avatar || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.username}>@{item.user.username}</Text>
            <Text style={styles.userName}>
              {item.user.firstName} {item.user.lastName}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Description */}
        <Text style={styles.description} numberOfLines={4}>{item.description}</Text>

        {/* Product Info */}
        {item.product && (
          <TouchableOpacity 
            style={styles.productInfo}
            onPress={() => handleProductPress(item.product)}
          >
            <Text style={styles.productTitle}>{item.product.title}</Text>
            <Text style={styles.productPrice}>{formatCurrencyShort(item.product.price)}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Right Side - Action Buttons (TikTok/Instagram Style) */}
      <View style={styles.rightOverlay}>
        {/* Like Button */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <View style={styles.actionButtonContainer}>
            <Text style={styles.actionIcon}>❤️</Text>
            <Text style={styles.actionText}>{item.likes}</Text>
          </View>
        </TouchableOpacity>

        {/* Views Counter */}
        <View style={styles.actionButton}>
          <View style={styles.actionButtonContainer}>
            <Text style={styles.actionIcon}>👁️</Text>
            <Text style={styles.actionText}>{item.views}</Text>
          </View>
        </View>

        {/* WhatsApp Contact */}
        {item.user.whatsapp && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleContactWhatsApp(item.user.whatsapp || '', item.product)}
          >
            <View style={styles.actionButtonContainer}>
              <Text style={styles.actionIcon}>💬</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Instagram Contact */}
        {item.user.instagram && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleContactInstagram(item.user.instagram || '')}
          >
            <View style={styles.actionButtonContainer}>
              <Text style={styles.actionIcon}>📷</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Share Button */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Compartir', 'Función de compartir próximamente')}
        >
          <View style={styles.actionButtonContainer}>
            <Text style={styles.actionIcon}>📤</Text>
          </View>
        </TouchableOpacity>

        {/* Profile Follow Button */}
        <TouchableOpacity 
          style={styles.followButton}
          onPress={() => handleUserPress(item.user)}
        >
          <Text style={styles.followButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando reels...</Text>
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>📱 No hay reels disponibles</Text>
        <Text style={styles.emptySubtitle}>Próximamente más contenido</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
      />
      
      <ContactModal
        visible={contactModalVisible}
        user={selectedUser}
        onClose={() => setContactModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  reelContainer: {
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  
  // Left Overlay - User Info & Description
  leftOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 80, // Leave space for right buttons
    paddingBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  userName: {
    color: '#fff',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  description: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  productInfo: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#007AFF',
  },

  // Right Overlay - Action Buttons (TikTok/Instagram Style)
  rightOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: SCREEN_HEIGHT * 0.6,
  },
  actionButton: {
    marginBottom: 20,
    alignItems: 'center',
  },
  actionButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  actionText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  followButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});


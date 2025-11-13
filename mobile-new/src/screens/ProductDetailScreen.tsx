import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { formatCurrencyShort } from '../utils/currency';
import { API_ENDPOINTS } from '../config/api';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
    whatsapp?: string;
    instagram?: string;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    user: {
      username: string;
      firstName: string;
      lastName: string;
    };
  }>;
  averageRating: number;
}

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PRODUCT_BY_ID(productId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactWhatsApp = (phoneNumber: string) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Número de WhatsApp no disponible');
      return;
    }

    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const message = `Hola! Me interesa el producto "${product?.title}" que vi en el marketplace. ¿Podrías darme más información?`;
    const whatsappUrl = `whatsapp://send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;

    Linking.openURL(whatsappUrl).catch(() => {
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

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color="#FFD60A"
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.loadingText}>Cargando producto...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={32} color="#FF453A" />
        <Text style={styles.errorText}>Producto no encontrado</Text>
      </View>
    );
  }

  const secondaryImages = product.images.slice(1);
  const sellerName = `${product.user.firstName} ${product.user.lastName}`.trim();
  const sellerBadge = product.user.bio || 'Vendedor confiable';
  const whatsappAvailable = Boolean(product.user.whatsapp);
  const instagramAvailable = Boolean(product.user.instagram);
  const ratingRounded = Number.isFinite(product.averageRating) ? product.averageRating.toFixed(1) : 'N/A';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.heroSection}>
        <LinearGradient
          colors={['#34C759', '#2AA94B', '#070810']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        />

        <View style={styles.heroHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#0a1a10" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Detalle del producto</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.mainImageWrapper, { height: screenWidth * 0.8 }]}>
          <Image
            source={{ uri: product.images[0] || 'https://via.placeholder.com/400x300' }}
            style={styles.mainImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(7,8,16,0.8)']}
            style={styles.imageOverlay}
          />
          <View style={styles.categoryChip}>
            <MaterialIcons name="category" size={16} color="#E9FCEF" />
            <Text style={styles.categoryChipText}>{product.category || 'Sin categoría'}</Text>
          </View>
          <View style={styles.pricePill}>
            <Text style={styles.pricePillText}>{formatCurrencyShort(product.price)}</Text>
          </View>
          <View style={styles.stockBadge}>
            <Ionicons
              name={product.stock > 0 ? 'pricetag' : 'close-circle'}
              size={14}
              color={product.stock > 0 ? '#34C759' : '#FF453A'}
            />
            <Text
              style={[
                styles.stockBadgeText,
                product.stock === 0 && styles.stockBadgeTextDanger,
              ]}
            >
              {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
            </Text>
          </View>
        </View>

        {secondaryImages.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.secondaryImagesRow}
          >
            {secondaryImages.map((image, index) => (
              <Image
                key={`${image}-${index}`}
                source={{ uri: image }}
                style={styles.secondaryImage}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.productTitle}>{product.title}</Text>
        <Text style={styles.productDescription}>{product.description}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Ionicons name="sparkles-outline" size={16} color="#34C759" />
            <Text style={styles.statChipText}>Nuevo</Text>
          </View>

          <View style={styles.statChip}>
            <Ionicons name="time-outline" size={16} color="#8b8fa1" />
            <Text style={styles.statChipText}>Publicado {new Date(product.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.ratingRow}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={16} color="#FFD60A" />
            <Text style={styles.ratingBadgeText}>{ratingRounded}</Text>
          </View>
          <Text style={styles.ratingLabel}>
            {product.reviews.length > 0 ? `${product.reviews.length} reseñas` : 'Sin reseñas aún'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Información del vendedor</Text>
        <View style={styles.sellerRow}>
          <Image
            source={{ uri: product.user.avatar || 'https://i.pravatar.cc/150?img=56' }}
            style={styles.sellerAvatar}
          />
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>{sellerName}</Text>
            <Text style={styles.sellerHandle}>@{product.user.username}</Text>
            <Text style={styles.sellerBadge}>{sellerBadge}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {whatsappAvailable && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => handleContactWhatsApp(product.user.whatsapp!)}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#04100a" />
              <Text style={styles.actionButtonPrimaryText}>Contactar</Text>
            </TouchableOpacity>
          )}

          {instagramAvailable && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleContactInstagram(product.user.instagram!)}
            >
              <Ionicons name="logo-instagram" size={18} color="#E8E8EE" />
              <Text style={styles.actionButtonSecondaryText}>Ver Instagram</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {product.reviews.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Reseñas</Text>
          {product.reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View>
                  <Text style={styles.reviewUser}>{review.user.firstName} {review.user.lastName}</Text>
                  <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.reviewStars}>
                  {renderStars(review.rating)}
                </View>
              </View>
              {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070810',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070810',
  },
  loadingText: {
    fontSize: 15,
    color: '#8b8fa1',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070810',
  },
  errorText: {
    fontSize: 16,
    color: '#8b8fa1',
    marginTop: 8,
  },
  heroSection: {
    position: 'relative',
    paddingBottom: 24,
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 220,
  },
  heroHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(9,14,22,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#F4F6FF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  mainImageWrapper: {
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0b0e1c',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  categoryChip: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(7,8,16,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryChipText: {
    color: '#E9FCEF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  pricePill: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E9FCEF',
    shadowColor: '#34C759',
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  pricePillText: {
    color: '#0a1b11',
    fontSize: 16,
    fontWeight: '700',
  },
  stockBadge: {
    position: 'absolute',
    bottom: 18,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(233,252,239,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(233,252,239,0.18)',
  },
  stockBadgeText: {
    color: '#E9FCEF',
    fontSize: 13,
    fontWeight: '600',
  },
  stockBadgeTextDanger: {
    color: '#FF8A80',
  },
  secondaryImagesRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  secondaryImage: {
    width: 90,
    height: 90,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0b0e1c',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 20,
    backgroundColor: 'rgba(15,17,36,0.92)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 14,
  },
  productTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  productDescription: {
    color: 'rgba(233,235,248,0.82)',
    fontSize: 14,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(233,252,239,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderColor: 'rgba(233,252,239,0.12)',
    borderWidth: 1,
  },
  statChipText: {
    color: '#C9EED2',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,214,10,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  ratingBadgeText: {
    color: '#FFD60A',
    fontSize: 13,
    fontWeight: '700',
  },
  ratingLabel: {
    color: '#9ea2ba',
    fontSize: 13,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sellerRow: {
    flexDirection: 'row',
    gap: 16,
  },
  sellerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
  },
  sellerInfo: {
    flex: 1,
    gap: 4,
  },
  sellerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sellerHandle: {
    color: '#8b8fa1',
    fontSize: 13,
  },
  sellerBadge: {
    color: '#C7CAD8',
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonPrimary: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  actionButtonPrimaryText: {
    color: '#04100a',
    fontSize: 14,
    fontWeight: '700',
  },
  actionButtonSecondaryText: {
    color: '#E9EAF8',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginTop: 12,
    gap: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewUser: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewDate: {
    color: '#8b8fa1',
    fontSize: 12,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    color: '#C7CAD8',
    fontSize: 13,
    lineHeight: 19,
  },
});

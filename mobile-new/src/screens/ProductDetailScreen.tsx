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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { formatCurrencyShort } from '../utils/currency';

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
  const { token, user } = useAuth();

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`http://192.168.1.120:3001/api/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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

    // Limpiar el número de teléfono (remover espacios, guiones, etc.)
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    const message = `Hola! Me interesa el producto "${product?.title}" que vi en el marketplace. ¿Podrías darme más información?`;
    
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


  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= rating ? '⭐' : '☆'}
        </Text>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando producto...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Producto no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Product Images */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.images[0] || 'https://via.placeholder.com/400x300' }}
          style={styles.mainImage}
        />
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.title}>{product.title}</Text>
        
        <View style={styles.priceRatingContainer}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatCurrencyShort(product.price)}</Text>
            <Text style={styles.currencyLabel}>CLP</Text>
          </View>
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {renderStars(Math.round(product.averageRating))}
            </View>
            <Text style={styles.ratingText}>
              {product.averageRating.toFixed(1)} ({product.reviews.length})
            </Text>
          </View>
        </View>

        {/* Stock Badge */}
        <View style={styles.stockBadge}>
          <Text style={styles.stockText}>
            {product.stock > 0 
              ? `✓ En stock (${product.stock} disponibles)`
              : '✗ Agotado'
            }
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Descripción del producto</Text>
        <Text style={styles.description}>{product.description}</Text>
      </View>

      {/* Seller Info */}
      <View style={styles.sellerContainer}>
        <Text style={styles.sectionTitle}>Vendedor</Text>
        <View style={styles.sellerCard}>
          <View style={styles.sellerInfo}>
            <Image
              source={{ uri: product.user.avatar || 'https://via.placeholder.com/50' }}
              style={styles.sellerAvatar}
            />
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>
                {product.user.firstName} {product.user.lastName}
              </Text>
              <Text style={styles.sellerUsername}>@{product.user.username}</Text>
              {product.user.bio && (
                <Text style={styles.sellerBio} numberOfLines={2}>{product.user.bio}</Text>
              )}
            </View>
          </View>

          {/* Contact Buttons */}
          <View style={styles.contactButtons}>
            {product.user.whatsapp && (
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => handleContactWhatsApp(product.user.whatsapp)}
              >
                <Text style={styles.contactButtonText}>💬 Contactar por WhatsApp</Text>
              </TouchableOpacity>
            )}
            
            {product.user.instagram && (
              <TouchableOpacity
                style={styles.contactButtonSecondary}
                onPress={() => handleContactInstagram(product.user.instagram)}
              >
                <Text style={styles.contactButtonTextSecondary}>📷 Ver en Instagram</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>


      {/* Reviews */}
      {product.reviews.length > 0 && (
        <View style={styles.reviewsContainer}>
          <Text style={styles.reviewsTitle}>Reseñas</Text>
          {product.reviews.map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewUser}>
                  {review.user.firstName} {review.user.lastName}
                </Text>
                <View style={styles.reviewStars}>
                  {renderStars(review.rating)}
                </View>
              </View>
              {review.comment && (
                <Text style={styles.reviewComment}>{review.comment}</Text>
              )}
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 15,
    color: '#565959',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#565959',
  },
  imageContainer: {
    height: 350,
    backgroundColor: '#F5F5F5',
    width: '100%',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  category: {
    fontSize: 12,
    color: '#007185',
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0F1111',
    marginBottom: 16,
    lineHeight: 28,
  },
  priceRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0F1111',
  },
  currencyLabel: {
    fontSize: 14,
    color: '#565959',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 14,
  },
  ratingText: {
    fontSize: 13,
    color: '#007185',
    fontWeight: '500',
  },
  stockBadge: {
    backgroundColor: '#E6F7E6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  stockText: {
    fontSize: 13,
    color: '#008000',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E6E6E6',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F1111',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#0F1111',
    lineHeight: 22,
    marginBottom: 20,
  },
  sellerContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E6E6E6',
  },
  sellerCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E6E6E6',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F1111',
    marginBottom: 4,
  },
  sellerUsername: {
    fontSize: 13,
    color: '#565959',
    marginBottom: 4,
  },
  sellerBio: {
    fontSize: 13,
    color: '#565959',
    lineHeight: 18,
  },
  contactButtons: {
    gap: 10,
  },
  contactButton: {
    backgroundColor: '#25D366',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactButtonSecondary: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5D9D9',
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  contactButtonTextSecondary: {
    color: '#0F1111',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewsContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E6E6E6',
  },
  reviewItem: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F1111',
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: '#565959',
    lineHeight: 20,
  },
});

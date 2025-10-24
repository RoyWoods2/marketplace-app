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
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>${product.price}</Text>
        <Text style={styles.category}>{product.category}</Text>
        
        <View style={styles.ratingContainer}>
          <View style={styles.stars}>
            {renderStars(Math.round(product.averageRating))}
          </View>
          <Text style={styles.ratingText}>
            {product.averageRating.toFixed(1)} ({product.reviews.length} reseñas)
          </Text>
        </View>

        <Text style={styles.description}>{product.description}</Text>
        
        <View style={styles.stockContainer}>
          <Text style={styles.stockText}>
            Stock disponible: {product.stock} unidades
          </Text>
        </View>
      </View>

      {/* Seller Info */}
      <View style={styles.sellerContainer}>
        <Text style={styles.sellerTitle}>Vendedor</Text>
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
              <Text style={styles.sellerBio}>{product.user.bio}</Text>
            )}
          </View>
        </View>

        {/* Contact Buttons */}
        <View style={styles.contactButtons}>
          {product.user.whatsapp && (
            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={() => handleContactWhatsApp(product.user.whatsapp)}
            >
              <Text style={styles.buttonIcon}>💬</Text>
              <Text style={styles.buttonText}>WhatsApp</Text>
            </TouchableOpacity>
          )}
          
          {product.user.instagram && (
            <TouchableOpacity
              style={styles.instagramButton}
              onPress={() => handleContactInstagram(product.user.instagram)}
            >
              <Text style={styles.buttonIcon}>📷</Text>
              <Text style={styles.buttonText}>Instagram</Text>
            </TouchableOpacity>
          )}
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
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#f5f5f5',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  category: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 10,
  },
  star: {
    fontSize: 16,
    marginRight: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  stockContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  stockText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  sellerContainer: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    marginTop: 10,
  },
  sellerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  sellerUsername: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  sellerBio: {
    fontSize: 14,
    color: '#333',
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  instagramButton: {
    backgroundColor: '#E4405F',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 20,
    marginBottom: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewsContainer: {
    padding: 20,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  reviewItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

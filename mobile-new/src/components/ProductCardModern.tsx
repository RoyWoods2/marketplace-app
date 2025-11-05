import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { formatCurrencyShort } from '../utils/currency';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2; // 2 columns with padding

interface ProductCardModernProps {
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
    category?: string;
    stock?: number;
    user?: {
      companyName?: string;
      firstName?: string;
      lastName?: string;
    };
  };
  onPress: () => void;
  style?: any;
}

export default function ProductCardModern({ product, onPress, style }: ProductCardModernProps) {
  const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;
  
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: mainImage || 'https://via.placeholder.com/200' }}
          style={styles.image}
          resizeMode="cover"
        />
        {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeText}>Últimas {product.stock}</Text>
          </View>
        )}
        {product.stock === 0 && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Agotado</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        
        {/* Seller Info */}
        {product.user && (
          <Text style={styles.seller} numberOfLines={1}>
            {product.user.companyName || `${product.user.firstName} ${product.user.lastName}`}
          </Text>
        )}

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatCurrencyShort(product.price)}</Text>
        </View>

        {/* Category Badge */}
        {product.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>
        )}

        {/* Quick Action Button */}
        <TouchableOpacity
          style={styles.buyButton}
          onPress={(e) => {
            e.stopPropagation();
            onPress();
          }}
        >
          <Text style={styles.buyButtonText}>Ver detalles</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    width: CARD_WIDTH,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.9,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stockBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F1111',
    marginBottom: 4,
    lineHeight: 20,
    minHeight: 40,
  },
  seller: {
    fontSize: 12,
    color: '#565959',
    marginBottom: 8,
  },
  priceContainer: {
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F1111',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 10,
    color: '#007185',
    fontWeight: '500',
  },
  buyButton: {
    backgroundColor: '#FFD814',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buyButtonText: {
    color: '#0F1111',
    fontSize: 13,
    fontWeight: '600',
  },
});


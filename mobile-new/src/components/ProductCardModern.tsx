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
    backgroundColor: '#151527',
    borderRadius: 16,
    marginBottom: 16,
    width: CARD_WIDTH,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.9,
    backgroundColor: '#1f1f2f',
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
    padding: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 20,
    minHeight: 40,
  },
  seller: {
    fontSize: 12,
    color: '#8b8fa1',
    marginBottom: 10,
  },
  priceContainer: {
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(52,199,89,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 11,
    color: '#34C759',
    fontWeight: '600',
  },
  buyButton: {
    backgroundColor: '#34C759',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buyButtonText: {
    color: '#0a0a0f',
    fontSize: 12,
    fontWeight: '700',
  },
});


import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
  const sellerName = product.user
    ? product.user.companyName || `${product.user.firstName ?? ''} ${product.user.lastName ?? ''}`.trim()
    : undefined;

  const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: mainImage || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600' }}
          style={styles.image}
        />

        <LinearGradient
          colors={['transparent', 'rgba(4,6,14,0.85)']}
          style={styles.imageOverlay}
        />

        {product.category && (
          <View style={styles.categoryChip}>
            <Text style={styles.categoryChipText}>{product.category}</Text>
          </View>
        )}

        {!isOutOfStock && (
          <View style={styles.pricePill}>
            <Text style={styles.pricePillText}>{formatCurrencyShort(product.price)}</Text>
          </View>
        )}

        {isLowStock && (
          <View style={styles.stockBadge}>
            <Ionicons name="alert-circle" size={14} color="#FFD60A" />
            <Text style={styles.stockBadgeText}>Quedan {product.stock}</Text>
          </View>
        )}

        {isOutOfStock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Agotado</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        {sellerName && (
          <View style={styles.row}>
            <Text style={styles.label}>Vendedor</Text>
            <Text style={styles.value} numberOfLines={1}>{sellerName}</Text>
          </View>
        )}

        <View style={styles.row}>
          <Text style={styles.label}>Tipo</Text>
          <Text style={styles.value} numberOfLines={1}>{product.category ?? 'Sin categoría'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Valor</Text>
          <Text style={styles.valuePrimary}>{formatCurrencyShort(product.price)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Stock</Text>
          <Text style={[styles.value, isOutOfStock ? styles.valueDanger : isLowStock ? styles.valueWarning : undefined]}>
            {product.stock === undefined ? 'Consultar' : isOutOfStock ? 'Agotado' : `${product.stock} unidades`}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={(e) => {
            e.stopPropagation();
            onPress();
          }}
        >
          <Text style={styles.ctaText}>Ver detalles</Text>
          <Ionicons name="chevron-forward" size={16} color="#0b1b11" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#121326',
    borderRadius: 20,
    marginBottom: 18,
    width: CARD_WIDTH,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
    shadowColor: '#04060e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.05,
    backgroundColor: '#111325',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  categoryChip: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(4,6,14,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  categoryChipText: {
    color: '#E9FCEF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  pricePill: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#34C759',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: '#34C759',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  pricePillText: {
    color: '#04100a',
    fontSize: 13,
    fontWeight: '700',
  },
  stockBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,214,10,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  stockBadgeText: {
    color: '#FFD60A',
    fontSize: 12,
    fontWeight: '600',
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
    minHeight: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    color: '#7c819a',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  value: {
    color: '#e1e3f0',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  valuePrimary: {
    color: '#34C759',
    fontSize: 15,
    fontWeight: '700',
  },
  valueWarning: {
    color: '#FFD60A',
  },
  valueDanger: {
    color: '#FF453A',
  },
  ctaButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#34C759',
    borderRadius: 14,
    paddingVertical: 10,
  },
  ctaText: {
    color: '#0b1b11',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});


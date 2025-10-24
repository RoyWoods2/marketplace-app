import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    companyName?: string;
  };
}

interface SearchFilters {
  query: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  companyName: string;
  sortBy: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'name';
}

const CATEGORIES = [
  'Todas',
  'Tecnología',
  'Moda',
  'Hogar',
  'Deportes',
  'Belleza',
  'Libros',
  'Juguetes',
  'Otros',
];

export default function SearchScreen() {
  const navigation = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'Todas',
    minPrice: '',
    maxPrice: '',
    companyName: '',
    sortBy: 'newest',
  });

  // Cargar productos iniciales
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.1.120:3001/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || data); // Handle both response formats
      }
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async () => {
    try {
      setLoading(true);
      
      // Construir query parameters
      const params = new URLSearchParams();
      if (filters.query) params.append('search', filters.query);
      if (filters.category && filters.category !== 'Todas') params.append('category', filters.category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.companyName) params.append('companyName', filters.companyName);
      params.append('sortBy', filters.sortBy);

      const response = await fetch(`http://192.168.1.120:3001/api/products/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        
        // Mostrar mensaje de confirmación
        const filterCount = [
          filters.query,
          filters.category !== 'Todas' ? filters.category : null,
          filters.minPrice || filters.maxPrice ? 'precio' : null,
          filters.companyName,
        ].filter(Boolean).length;
        
        if (filterCount > 0) {
          Alert.alert(
            '✅ Filtros aplicados',
            `Se encontraron ${data.length} productos con los filtros seleccionados.`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error searching products:', error);
      Alert.alert('Error', 'No se pudo realizar la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      category: 'Todas',
      minPrice: '',
      maxPrice: '',
      companyName: '',
      sortBy: 'newest',
    });
    loadProducts();
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
    >
      <Image source={{ uri: item.images[0] }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.productPrice}>${item.price.toLocaleString()}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productCompany}>
          {item.user.companyName || `${item.user.firstName} ${item.user.lastName}`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <ScrollView style={styles.filtersContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.filtersTitle}>🔍 Filtros de Búsqueda</Text>
      
      {/* Categorías */}
      <Text style={styles.filterLabel}>Categoría:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              filters.category === category && styles.categoryChipActive,
            ]}
            onPress={() => setFilters({ ...filters, category })}
          >
            <Text
              style={[
                styles.categoryChipText,
                filters.category === category && styles.categoryChipTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Rango de precios */}
      <Text style={styles.filterLabel}>Rango de Precio:</Text>
      <View style={styles.priceContainer}>
        <TextInput
          style={styles.priceInput}
          placeholder="Min"
          placeholderTextColor="#666"
          value={filters.minPrice}
          onChangeText={(text) => setFilters({ ...filters, minPrice: text })}
          keyboardType="numeric"
        />
        <Text style={styles.priceSeparator}>-</Text>
        <TextInput
          style={styles.priceInput}
          placeholder="Max"
          placeholderTextColor="#666"
          value={filters.maxPrice}
          onChangeText={(text) => setFilters({ ...filters, maxPrice: text })}
          keyboardType="numeric"
        />
      </View>

      {/* Nombre de empresa */}
      <Text style={styles.filterLabel}>Empresa/Vendedor:</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Buscar por empresa o vendedor"
        placeholderTextColor="#666"
        value={filters.companyName}
        onChangeText={(text) => setFilters({ ...filters, companyName: text })}
      />

      {/* Ordenar por */}
      <Text style={styles.filterLabel}>Ordenar por:</Text>
      <View style={styles.sortContainer}>
        {[
          { key: 'newest', label: 'Más recientes' },
          { key: 'oldest', label: 'Más antiguos' },
          { key: 'price_low', label: 'Precio menor' },
          { key: 'price_high', label: 'Precio mayor' },
          { key: 'name', label: 'Nombre A-Z' },
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.sortOption,
              filters.sortBy === option.key && styles.sortOptionActive,
            ]}
            onPress={() => setFilters({ ...filters, sortBy: option.key as any })}
          >
            <Text
              style={[
                styles.sortOptionText,
                filters.sortBy === option.key && styles.sortOptionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Botones de acción */}
      <View style={styles.filterActions}>
        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearButtonText}>Limpiar Filtros</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.searchButton} onPress={searchProducts}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>
      
      {/* Espacio adicional para asegurar que los botones sean visibles */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header de búsqueda */}
      <View style={styles.searchHeader}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar productos, empresas..."
          placeholderTextColor="#666"
          value={filters.query}
          onChangeText={(text) => setFilters({ ...filters, query: text })}
          onSubmitEditing={searchProducts}
        />
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterToggleText}>
            {showFilters ? 'Ocultar' : 'Filtros'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      {showFilters && renderFilters()}

      {/* Resultados */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsCount}>
          {products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
        </Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Buscando...</Text>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  searchHeader: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#2c2c2e',
    color: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 16,
    marginRight: 10,
  },
  filterToggle: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
  },
  filterToggleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  filtersContainer: {
    backgroundColor: '#1c1c1e',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    maxHeight: 400, // Limitar altura para evitar que ocupe toda la pantalla
  },
  filtersTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  filterLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 8,
  },
  categoryScroll: {
    marginBottom: 10,
  },
  categoryChip: {
    backgroundColor: '#2c2c2e',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryChipText: {
    color: '#ccc',
    fontSize: 14,
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#2c2c2e',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    marginRight: 10,
  },
  priceSeparator: {
    color: '#ccc',
    fontSize: 18,
    marginHorizontal: 5,
  },
  textInput: {
    backgroundColor: '#2c2c2e',
    color: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 10,
  },
  sortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  sortOption: {
    backgroundColor: '#2c2c2e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  sortOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sortOptionText: {
    color: '#ccc',
    fontSize: 12,
  },
  sortOptionTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.48,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.48,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
    padding: 15,
  },
  resultsCount: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  productsList: {
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    margin: 5,
    flex: 1,
    maxWidth: '48%',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#2c2c2e',
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productPrice: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productCategory: {
    color: '#007AFF',
    fontSize: 12,
    marginBottom: 4,
  },
  productCompany: {
    color: '#ccc',
    fontSize: 12,
  },
  bottomSpacer: {
    height: 20,
  },
});

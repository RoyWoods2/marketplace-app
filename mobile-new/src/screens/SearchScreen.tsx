import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import ProductCardModern from '../components/ProductCardModern';
import { formatCurrencyShort } from '../utils/currency';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const SEARCH_HISTORY_KEY = '@search_history';
const MAX_HISTORY_ITEMS = 10;

export default function SearchScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [popularSearches] = useState<string[]>([
    'Tecnología',
    'Moda',
    'Hogar',
    'Deportes',
    'Belleza',
  ]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'Todas',
    minPrice: '',
    maxPrice: '',
    companyName: '',
    sortBy: 'newest',
  });

  // Cargar historial de búsquedas
  useEffect(() => {
    loadSearchHistory();
    loadProducts();
  }, []);

  // Búsqueda en tiempo real con debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (filters.query.trim().length > 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        performSearch();
      }, 500); // Debounce de 500ms
    } else if (filters.query.trim().length === 0) {
      loadProducts();
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.query]);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveToHistory = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      const updatedHistory = [
        query,
        ...searchHistory.filter(item => item.toLowerCase() !== query.toLowerCase())
      ].slice(0, MAX_HISTORY_ITEMS);
      
      setSearchHistory(updatedHistory);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const clearHistory = async () => {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.PRODUCTS, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      setIsSearching(true);
      
      // Construir query parameters
      const params = new URLSearchParams();
      if (filters.query.trim()) {
        params.append('search', filters.query.trim());
        await saveToHistory(filters.query.trim());
      }
      if (filters.category && filters.category !== 'Todas') params.append('category', filters.category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.companyName) params.append('companyName', filters.companyName);
      params.append('sortBy', filters.sortBy);

      const hasFilters = filters.query.trim() || 
        filters.category !== 'Todas' || 
        filters.minPrice || 
        filters.maxPrice || 
        filters.companyName;
      
      const searchUrl = hasFilters
        ? `${API_ENDPOINTS.PRODUCTS}/search?${params.toString()}`
        : `${API_ENDPOINTS.PRODUCTS}?${params.toString()}`;

      const response = await fetch(searchUrl, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : (data.products || []));
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const searchProducts = () => {
    performSearch();
  };

  const handleQuickSearch = (query: string) => {
    setFilters({ ...filters, query });
    setShowSuggestions(false);
    performSearch();
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
    setShowSuggestions(false);
    loadProducts();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (filters.query.trim() || filters.category !== 'Todas' || filters.minPrice || filters.maxPrice || filters.companyName) {
      await performSearch();
    } else {
      await loadProducts();
    }
    setRefreshing(false);
  }, [filters]);

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCardModern
      product={item}
      onPress={() => handleProductPress(item)}
    />
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

  const renderSuggestions = () => {
    if (!showSuggestions && filters.query.trim().length === 0) return null;

    const hasActiveFilters = filters.category !== 'Todas' || filters.minPrice || filters.maxPrice || filters.companyName;

    return (
      <View style={styles.suggestionsContainer}>
        {filters.query.trim().length === 0 && !hasActiveFilters && (
          <>
            {/* Búsquedas Populares */}
            {popularSearches.length > 0 && (
              <View style={styles.suggestionSection}>
                <Text style={styles.suggestionSectionTitle}>🔥 Búsquedas Populares</Text>
                <View style={styles.suggestionsGrid}>
                  {popularSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionChip}
                      onPress={() => handleQuickSearch(search)}
                    >
                      <Text style={styles.suggestionChipText}>{search}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Historial de Búsquedas */}
            {searchHistory.length > 0 && (
              <View style={styles.suggestionSection}>
                <View style={styles.suggestionSectionHeader}>
                  <Text style={styles.suggestionSectionTitle}>🕐 Búsquedas Recientes</Text>
                  <TouchableOpacity onPress={clearHistory}>
                    <Text style={styles.clearHistoryText}>Limpiar</Text>
                  </TouchableOpacity>
                </View>
                {searchHistory.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.historyItem}
                    onPress={() => handleQuickSearch(item)}
                  >
                    <Text style={styles.historyIcon}>🕐</Text>
                    <Text style={styles.historyText}>{item}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const updated = searchHistory.filter((_, i) => i !== index);
                        setSearchHistory(updated);
                        AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
                      }}
                    >
                      <Text style={styles.deleteIcon}>✕</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* Sugerencias mientras escribes */}
        {filters.query.trim().length > 0 && filters.query.trim().length < 3 && (
          <View style={styles.suggestionSection}>
            <Text style={styles.suggestionHint}>Escribe al menos 3 caracteres para buscar...</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header de búsqueda */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos, empresas..."
            placeholderTextColor="#767676"
            value={filters.query}
            onChangeText={(text) => {
              setFilters({ ...filters, query: text });
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onSubmitEditing={searchProducts}
            returnKeyType="search"
          />
          {filters.query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setFilters({ ...filters, query: '' });
                setShowSuggestions(true);
                loadProducts();
              }}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
          {isSearching && (
            <ActivityIndicator size="small" color="#007185" style={styles.searchingIndicator} />
          )}
        </View>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
          {(filters.category !== 'Todas' || filters.minPrice || filters.maxPrice || filters.companyName) && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>!</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Sugerencias */}
      {showSuggestions && renderSuggestions()}

      {/* Filtros */}
      {showFilters && renderFilters()}

      {/* Resultados */}
      <View style={styles.resultsContainer}>
        {!showSuggestions && (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
              </Text>
              {(filters.category !== 'Todas' || filters.minPrice || filters.maxPrice || filters.companyName) && (
                <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                  <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007185" />
                <Text style={styles.loadingText}>Buscando...</Text>
              </View>
            ) : products.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No se encontraron productos</Text>
                <Text style={styles.emptySubtitle}>
                  {filters.query.trim() || filters.category !== 'Todas' || filters.minPrice || filters.maxPrice || filters.companyName
                    ? 'Intenta ajustar tus filtros de búsqueda'
                    : 'Explora nuestros productos disponibles'}
                </Text>
                {(filters.query.trim() || filters.category !== 'Todas' || filters.minPrice || filters.maxPrice || filters.companyName) && (
                  <TouchableOpacity style={styles.emptyButton} onPress={clearFilters}>
                    <Text style={styles.emptyButtonText}>Limpiar Filtros</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.productsList}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#007185"
                  />
                }
              />
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
    maxHeight: 400,
  },
  filtersTitle: {
    color: '#0F1111',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  filterLabel: {
    color: '#0F1111',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  categoryScroll: {
    marginBottom: 10,
  },
  categoryChip: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D5D9D9',
  },
  categoryChipActive: {
    backgroundColor: '#007185',
    borderColor: '#007185',
  },
  categoryChipText: {
    color: '#565959',
    fontSize: 13,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    color: '#0F1111',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    fontSize: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#D5D9D9',
  },
  priceSeparator: {
    color: '#565959',
    fontSize: 16,
    marginHorizontal: 8,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    color: '#0F1111',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    fontSize: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#D5D9D9',
  },
  sortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  sortOption: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D5D9D9',
  },
  sortOptionActive: {
    backgroundColor: '#007185',
    borderColor: '#007185',
  },
  sortOptionText: {
    color: '#565959',
    fontSize: 13,
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clearButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.48,
    borderWidth: 1,
    borderColor: '#D5D9D9',
  },
  clearButtonText: {
    color: '#0F1111',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#FFD814',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchButtonText: {
    color: '#0F1111',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  resultsCount: {
    color: '#565959',
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    color: '#565959',
    marginTop: 12,
    fontSize: 15,
  },
  productsList: {
    paddingBottom: 20,
  },
  bottomSpacer: {
    height: 20,
  },
  // Header de búsqueda
  searchHeader: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#131921',
    alignItems: 'center',
    paddingTop: 50,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    fontSize: 18,
    color: '#565959',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#0F1111',
    fontSize: 15,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 16,
    color: '#565959',
    marginLeft: 8,
    padding: 4,
  },
  searchingIndicator: {
    marginLeft: 8,
  },
  filterToggle: {
    backgroundColor: '#007185',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD814',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#0F1111',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Sugerencias
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    maxHeight: 400,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  suggestionSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F1111',
    marginBottom: 12,
  },
  clearHistoryText: {
    fontSize: 14,
    color: '#007185',
    fontWeight: '600',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D5D9D9',
  },
  suggestionChipText: {
    color: '#0F1111',
    fontSize: 13,
    fontWeight: '500',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  historyIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  historyText: {
    flex: 1,
    fontSize: 15,
    color: '#0F1111',
  },
  deleteIcon: {
    fontSize: 18,
    color: '#565959',
    padding: 4,
  },
  suggestionHint: {
    fontSize: 14,
    color: '#565959',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  // Resultados
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearFiltersText: {
    color: '#007185',
    fontSize: 14,
    fontWeight: '600',
  },
  // Estado vacío
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F1111',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#565959',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007185',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

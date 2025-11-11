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
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

const hasActiveFilters =
  filters.category !== 'Todas' ||
  !!filters.minPrice ||
  !!filters.maxPrice ||
  !!filters.companyName;

  const renderFilters = () => (
    <ScrollView style={styles.filtersContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.filtersTitleContainer}>
        <Ionicons name="filter" size={20} color="#34C759" style={styles.filterTitleIcon} />
        <Text style={styles.filtersTitle}>Filtros de Búsqueda</Text>
      </View>
      
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
          placeholderTextColor="rgba(255,255,255,0.45)"
          value={filters.minPrice}
          onChangeText={(text) => setFilters({ ...filters, minPrice: text })}
          keyboardType="numeric"
        />
        <Text style={styles.priceSeparator}>-</Text>
        <TextInput
          style={styles.priceInput}
          placeholder="Max"
          placeholderTextColor="rgba(255,255,255,0.45)"
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
        placeholderTextColor="rgba(255,255,255,0.45)"
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

    return (
      <View style={styles.suggestionsContainer}>
        {filters.query.trim().length === 0 && !hasActiveFilters && (
          <>
            {popularSearches.length > 0 && (
              <View style={styles.suggestionSection}>
                <View style={styles.suggestionTitleContainer}>
                  <Ionicons name="flame" size={18} color="#34C759" style={styles.suggestionIcon} />
                  <Text style={styles.suggestionSectionTitle}>Búsquedas Populares</Text>
                </View>
                <View style={styles.suggestionsGrid}>
                  {popularSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionChip}
                      onPress={() => handleQuickSearch(search)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.suggestionChipText}>{search}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {searchHistory.length > 0 && (
              <View style={styles.suggestionSection}>
                <View style={styles.suggestionSectionHeader}>
                  <View style={styles.suggestionTitleContainer}>
                    <Ionicons name="time" size={18} color="#34C759" style={styles.suggestionIcon} />
                    <Text style={styles.suggestionSectionTitle}>Búsquedas Recientes</Text>
                  </View>
                  <TouchableOpacity onPress={clearHistory}>
                    <Text style={styles.clearHistoryText}>Limpiar</Text>
                  </TouchableOpacity>
                </View>
                {searchHistory.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.historyItem}
                    onPress={() => handleQuickSearch(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="time-outline" size={16} color="#8b8fa1" style={styles.historyIcon} />
                    <Text style={styles.historyText}>{item}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const updated = searchHistory.filter((_, i) => i !== index);
                        setSearchHistory(updated);
                        AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
                      }}
                    >
                      <Ionicons name="close" size={18} color="#8b8fa1" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

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
      <LinearGradient
        colors={['#34C759', '#30B350']}
        style={styles.searchHeader}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Explorar Marketplace</Text>
            <Text style={styles.headerSubtitle}>
              {products.length} producto{products.length !== 1 ? 's' : ''} disponible{products.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.toolbar}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.8)" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar productos, empresas..."
              placeholderTextColor="rgba(255,255,255,0.6)"
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
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
            {isSearching && (
              <ActivityIndicator size="small" color="#FFFFFF" style={styles.searchingIndicator} />
            )}
          </View>
          <TouchableOpacity
            style={styles.filterToggle}
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.8}
          >
            <Ionicons name="options" size={20} color="#FFFFFF" />
            {hasActiveFilters && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>!</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {!showSuggestions && filters.query.trim().length === 0 && (
          <View style={styles.quickChips}>
            {popularSearches.slice(0, 4).map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.quickChip}
                onPress={() => handleQuickSearch(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="flash" size={14} color="#34C759" style={styles.quickChipIcon} />
                <Text style={styles.quickChipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showFilters && renderFilters()}
        {showSuggestions && renderSuggestions()}

        <View style={styles.resultsContainer}>
          {!showSuggestions && (
            <>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                  {products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
                </Text>
                {hasActiveFilters && (
                  <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                    <Ionicons name="refresh" size={16} color="#34C759" />
                    <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
                  </TouchableOpacity>
                )}
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#34C759" />
                  <Text style={styles.loadingText}>Buscando...</Text>
                </View>
              ) : products.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={64} color="#2f3144" />
                  <Text style={styles.emptyTitle}>No se encontraron productos</Text>
                  <Text style={styles.emptySubtitle}>
                    {filters.query.trim() || hasActiveFilters
                      ? 'Intenta ajustar tus filtros de búsqueda'
                      : 'Explora nuestros productos disponibles'}
                  </Text>
                  {(filters.query.trim() || hasActiveFilters) && (
                    <TouchableOpacity style={styles.emptyButton} onPress={clearFilters} activeOpacity={0.8}>
                      <Text style={styles.emptyButtonText}>Limpiar filtros</Text>
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
                      tintColor="#34C759"
                    />
                  }
                />
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  searchHeader: {
    paddingTop: 64,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginTop: 6,
  },
  filterToggle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFD60A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#0a0a0f',
    fontSize: 10,
    fontWeight: '700',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  searchingIndicator: {
    marginLeft: 12,
  },
  quickChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickChipIcon: {
    marginRight: 6,
  },
  quickChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    marginTop: -12,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  filtersContainer: {
    backgroundColor: '#151527',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 20,
    maxHeight: 420,
  },
  filtersTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterTitleIcon: {
    marginRight: 8,
  },
  filtersTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  filterLabel: {
    color: '#8b8fa1',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryChip: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(52,199,89,0.2)',
    borderColor: '#34C759',
  },
  categoryChipText: {
    color: '#8b8fa1',
    fontSize: 13,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#34C759',
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  priceInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  priceSeparator: {
    color: '#8b8fa1',
    fontSize: 16,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  sortOption: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sortOptionActive: {
    backgroundColor: 'rgba(102,126,234,0.25)',
    borderColor: '#667eea',
  },
  sortOptionText: {
    color: '#8b8fa1',
    fontSize: 13,
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  clearButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#8b8fa1',
    fontWeight: '600',
  },
  searchButton: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#0a0a0f',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 8,
  },
  suggestionsContainer: {
    backgroundColor: '#151527',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 20,
  },
  suggestionSection: {
    marginBottom: 16,
  },
  suggestionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionIcon: {
    marginRight: 8,
  },
  suggestionSectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  suggestionChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  suggestionChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  suggestionSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearHistoryText: {
    color: '#34C759',
    fontWeight: '600',
    fontSize: 13,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  historyIcon: {
    marginRight: 12,
  },
  historyText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  suggestionHint: {
    color: '#8b8fa1',
    fontSize: 13,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsCount: {
    color: '#8b8fa1',
    fontSize: 14,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(52,199,89,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.4)',
  },
  clearFiltersText: {
    color: '#34C759',
    fontWeight: '600',
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#8b8fa1',
    fontSize: 15,
  },
  productsList: {
    paddingBottom: 100,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#8b8fa1',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: '#34C759',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#0a0a0f',
    fontWeight: '700',
  },
});

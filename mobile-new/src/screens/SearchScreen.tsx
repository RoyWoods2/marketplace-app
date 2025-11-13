import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SectionList,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import ProductCardModern from '../components/ProductCardModern';
import Card from '../components/Card';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GradientButton from '../components/GradientButton';
import FilterChip from '../components/FilterChip';

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
  'Artesanías',
  'Alimentos',
  'Joyería',
  'Deportes',
  'Belleza',
  'Libros',
  'Juguetes',
  'Otros',
];

const FEATURED_CATEGORY_PRESETS = [
  { key: 'Tecnología', icon: 'devices', gradient: ['#4facfe', '#00f2fe'] },
  { key: 'Moda', icon: 'checkroom', gradient: ['#fbc2eb', '#a6c1ee'] },
  { key: 'Hogar', icon: 'home', gradient: ['#43cea2', '#185a9d'] },
  { key: 'Artesanías', icon: 'handyman', gradient: ['#ffb88c', '#de6262'] },
  { key: 'Alimentos', icon: 'restaurant', gradient: ['#f7971e', '#ffd200'] },
  { key: 'Joyería', icon: 'diamond', gradient: ['#a18cd1', '#fbc2eb'] },
  { key: 'Deportes', icon: 'sports-handball', gradient: ['#51dacf', '#aef6cf'] },
  { key: 'Belleza', icon: 'spa', gradient: ['#ff9a9e', '#fad0c4'] },
  { key: 'Libros', icon: 'menu-book', gradient: ['#30cfd0', '#330867'] },
 ] as const;

const DISCOVERY_CARDS = [
  {
    id: 'new-arrivals',
    title: 'Nuevos ingresos',
    subtitle: 'Explora lanzamientos frescos de tus vendedores favoritos',
    icon: 'color-wand-outline',
    gradient: ['#667eea', '#764ba2'],
  },
  {
    id: 'local-talents',
    title: 'Talentos locales',
    subtitle: 'Productos hechos a mano con historias únicas',
    icon: 'leaf-outline',
    gradient: ['#2b5876', '#4e4376'],
  },
  {
    id: 'best-sellers',
    title: 'Top ventas',
    subtitle: 'Lo que más se vende esta semana en el marketplace',
    icon: 'trophy-outline',
    gradient: ['#f7971e', '#ffd200'],
  },
 ] as const;

const SEARCH_HISTORY_KEY = '@search_history';
const MAX_HISTORY_ITEMS = 10;

export default function SearchScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
  const filterModalAnim = useRef(new Animated.Value(0)).current;
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'category'>('grid');
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'Todas',
    minPrice: '',
    maxPrice: '',
    companyName: '',
    sortBy: 'newest',
  });

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'Todas') count += 1;
    if (filters.minPrice) count += 1;
    if (filters.maxPrice) count += 1;
    if (filters.companyName.trim()) count += 1;
    if (filters.sortBy && filters.sortBy !== 'newest') count += 1;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFiltersCount > 0;

  const resultsLabel = useMemo(() => {
    return `${products.length} producto${products.length !== 1 ? 's' : ''}`;
  }, [products.length]);

  const groupedProducts = useMemo(() => {
    if (showSuggestions) return [];

    const groups = new Map<string, Product[]>();
    products.forEach((product) => {
      const key = product.category || 'Otros';
      const bucket = groups.get(key) || [];
      bucket.push(product);
      groups.set(key, bucket);
    });

    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'es', { sensitivity: 'base' }))
      .map(([title, items]) => {
        const rows: Product[][] = [];
        for (let i = 0; i < items.length; i += 2) {
          rows.push(items.slice(i, i + 2));
        }
        return { title, data: rows };
      });
  }, [products, showSuggestions]);

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

  const openFilters = () => {
    setFiltersVisible(true);
    Animated.timing(filterModalAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const closeFilters = () => {
    Animated.timing(filterModalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setFiltersVisible(false));
  };

  const applyFilters = () => {
    performSearch();
    closeFilters();
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

  const performSearch = async (customFilters?: SearchFilters) => {
    try {
      setLoading(true);
      setIsSearching(true);
      
      const appliedFilters = customFilters || filters;

      // Construir query parameters
      const params = new URLSearchParams();
      if (appliedFilters.query.trim()) {
        params.append('search', appliedFilters.query.trim());
        await saveToHistory(appliedFilters.query.trim());
      }
      if (appliedFilters.category && appliedFilters.category !== 'Todas') params.append('category', appliedFilters.category);
      if (appliedFilters.minPrice) params.append('minPrice', appliedFilters.minPrice);
      if (appliedFilters.maxPrice) params.append('maxPrice', appliedFilters.maxPrice);
      if (appliedFilters.companyName) params.append('companyName', appliedFilters.companyName);
      params.append('sortBy', appliedFilters.sortBy);

      const hasFilters = appliedFilters.query.trim() || 
        appliedFilters.category !== 'Todas' || 
        appliedFilters.minPrice || 
        appliedFilters.maxPrice || 
        appliedFilters.companyName;
      
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
    setShowSuggestions(false);
  };

  const handleQuickSearch = (query: string) => {
    const updatedFilters = { ...filters, query };
    setFilters(updatedFilters);
    setShowSuggestions(false);
    performSearch(updatedFilters);
  };

  const handleCategoryQuickSelect = (category: string) => {
    const updatedFilters = {
      ...filters,
      category,
      query: '',
    };
    setFilters(updatedFilters);
    setShowSuggestions(false);
    performSearch(updatedFilters);
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

  const renderEmptyComponent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#34C759" />
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      );
    }

    if (showSuggestions) {
      return null;
    }

    return (
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
    );
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCardModern
      product={item}
      onPress={() => handleProductPress(item)}
    />
  );

  const renderDiscoveryHighlights = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.discoveryScroll}
    >
      {DISCOVERY_CARDS.map((card) => (
        <LinearGradient
          key={card.id}
          colors={card.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.discoveryCard}
        >
          <View style={styles.discoveryIconWrapper}>
            <Ionicons name={card.icon as any} size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.discoveryTitle}>{card.title}</Text>
          <Text style={styles.discoverySubtitle}>{card.subtitle}</Text>
        </LinearGradient>
      ))}
    </ScrollView>
  );

  const renderCategoryShortcuts = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryCarousel}
    >
      {FEATURED_CATEGORY_PRESETS.map((category) => (
        <TouchableOpacity
          key={category.key}
          style={styles.categoryCardWrapper}
          activeOpacity={0.8}
          onPress={() => handleCategoryQuickSelect(category.key)}
        >
          <LinearGradient
            colors={category.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.categoryCard,
              filters.category === category.key && styles.categoryCardActive,
            ]}
          >
            <View style={styles.categoryIconBubble}>
              <MaterialIcons name={category.icon as any} size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.categoryCardLabel}>{category.key}</Text>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderSuggestions = () => {
    if (!showSuggestions && filters.query.trim().length === 0) return null;

    return (
      <Card style={styles.suggestionsContainer}>
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
      </Card>
    );
  };

  const renderListHeader = () => (
    <>
      <LinearGradient
        colors={['#34C759', '#2fb355'] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroHeader}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroBadge}>
            <Ionicons name="planet-outline" size={18} color="rgba(12,45,21,0.9)" />
            <Text style={styles.heroBadgeText}>Marketplace vivo</Text>
          </View>
          <Text style={styles.heroTitle}>Buscar productos</Text>
          {/*<Text style={styles.heroSubtitle}>
            {resultsLabel} listados activos. Descubre novedades y conecta con vendedores confiables.
          </Text>*/}
        </View>
      </LinearGradient>

      <View style={styles.listHeader}>
        <View style={styles.listHeaderContent}>
          <Card style={styles.searchCard}>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.75)" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar productos, empresas o categorías"
              placeholderTextColor="rgba(255,255,255,0.55)"
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
                style={styles.searchClearButton}
                onPress={() => {
                  const clearedFilters = { ...filters, query: '' };
                  setFilters(clearedFilters);
                  setShowSuggestions(true);
                  loadProducts();
                }}
              >
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
            {isSearching && (
              <ActivityIndicator size="small" color="#34C759" style={styles.searchingIndicator} />
            )}
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={openFilters}
            activeOpacity={0.85}
          >
            <View style={styles.filterButtonLeft}>
              <MaterialIcons name="tune" size={20} color="#0a0a0f" />
              <Text style={styles.filterButtonText}>Filtros avanzados</Text>
            </View>
            {hasActiveFilters && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Card>

        {showSuggestions ? (
          renderSuggestions()
        ) : (
          <>
            {renderDiscoveryHighlights()}

            {filters.query.trim().length === 0 && (
              <>
                <View style={styles.quickSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="sparkles-outline" size={18} color="#34C759" />
                    <Text style={styles.sectionTitle}>Explorar por categoría</Text>
                  </View>
                  {renderCategoryShortcuts()}
                </View>

                <Card style={styles.quickActionsCard}>
                  <View style={styles.sectionHeaderSpacing}>
                    <Ionicons name="flash-outline" size={18} color="#FFD60A" />
                    <Text style={styles.quickActionsTitle}>Búsquedas rápidas</Text>
                  </View>
                  <View style={styles.quickActionsGrid}>
                    {popularSearches.slice(0, 6).map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.quickActionChip}
                        onPress={() => handleQuickSearch(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.quickActionText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Card>
              </>
            )}

            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>{resultsLabel}</Text>
              <View style={styles.actionsRow}>
                {hasActiveFilters && (
                  <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                    <Ionicons name="refresh" size={16} color="#34C759" />
                    <Text style={styles.clearFiltersText}>Limpiar</Text>
                  </TouchableOpacity>
                )}
                <View style={styles.viewSwitch}>
                  <TouchableOpacity
                    style={[styles.viewSwitchButton, viewMode === 'grid' && styles.viewSwitchButtonActive]}
                    onPress={() => setViewMode('grid')}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="grid-outline"
                      size={14}
                      color={viewMode === 'grid' ? '#04100a' : '#8b8fa1'}
                    />
                    <Text
                      style={[
                        styles.viewSwitchText,
                        viewMode === 'grid' && styles.viewSwitchTextActive,
                      ]}
                    >
                      Grid
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.viewSwitchButton, viewMode === 'category' && styles.viewSwitchButtonActive]}
                    onPress={() => setViewMode('category')}
                    activeOpacity={0.85}
                    disabled={showSuggestions}
                  >
                    <Ionicons
                      name="albums-outline"
                      size={14}
                      color={viewMode === 'category' && !showSuggestions ? '#04100a' : '#8b8fa1'}
                    />
                    <Text
                      style={[
                        styles.viewSwitchText,
                        viewMode === 'category' && !showSuggestions && styles.viewSwitchTextActive,
                        showSuggestions && styles.viewSwitchTextDisabled,
                      ]}
                    >
                      Categorías
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        )}
        </View>
      </View>
    </>
  );

  const listRefreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#34C759"
    />
  );

  return (
    <View style={styles.container}>
      {viewMode === 'category' && !showSuggestions ? (
        <SectionList
          sections={groupedProducts}
          keyExtractor={(item, index) => item.map((product) => product.id).join('-') || `row-${index}`}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionListHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.sectionRow}>
              {item.map((product) => (
                <ProductCardModern
                  key={product.id}
                  product={product}
                  onPress={() => handleProductPress(product)}
                  style={styles.sectionCard}
                />
              ))}
              {item.length === 1 && <View style={styles.sectionCardPlaceholder} />}
            </View>
          )}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={styles.sectionListContent}
          stickySectionHeadersEnabled={false}
          refreshControl={listRefreshControl}
        />
      ) : (
        <FlatList
          data={showSuggestions ? [] : products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.productsList}
          columnWrapperStyle={styles.productsRow}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={listRefreshControl}
        />
      )}

      <Modal
        transparent
        visible={filtersVisible}
        onRequestClose={closeFilters}
        animationType="none"
      >
        <Pressable style={styles.overlay} onPress={closeFilters} />
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [
                {
                  translateY: filterModalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [Dimensions.get('window').height, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <Ionicons name="filter" size={20} color="#34C759" />
              <Text style={styles.sheetTitle}>Filtros avanzados</Text>
            </View>
            {hasActiveFilters && (
              <TouchableOpacity onPress={clearFilters} style={styles.sheetClear}>
                <Ionicons name="refresh" size={16} color="#34C759" />
                <Text style={styles.sheetClearText}>Limpiar</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
          >
            <Text style={styles.sectionLabel}>Categorías</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sheetCategoryScroll}
            >
              {CATEGORIES.map((category) => (
                <FilterChip
                  key={category}
                  label={category}
                  selected={filters.category === category}
                  onPress={() => setFilters({ ...filters, category })}
                  style={styles.sheetChip}
                />
              ))}
            </ScrollView>

            <Text style={styles.sectionLabel}>Rango de precio</Text>
            <View style={styles.priceRow}>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.priceLabel}>Mínimo</Text>
                <TextInput
                  style={styles.sheetInput}
                  placeholder="$0"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={filters.minPrice}
                  onChangeText={(text) => setFilters({ ...filters, minPrice: text })}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.priceLabel}>Máximo</Text>
                <TextInput
                  style={styles.sheetInput}
                  placeholder="$500"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={filters.maxPrice}
                  onChangeText={(text) => setFilters({ ...filters, maxPrice: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.sectionLabel}>Empresa o vendedor</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="Nombre de la empresa"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={filters.companyName}
              onChangeText={(text) => setFilters({ ...filters, companyName: text })}
            />

            <Text style={styles.sectionLabel}>Ordenar por</Text>
            <View style={styles.sortGrid}>
              {[
                { key: 'newest', label: 'Más recientes' },
                { key: 'oldest', label: 'Más antiguos' },
                { key: 'price_low', label: 'Precio menor' },
                { key: 'price_high', label: 'Precio mayor' },
                { key: 'name', label: 'Nombre A-Z' },
              ].map((option) => (
                <FilterChip
                  key={option.key}
                  label={option.label}
                  selected={filters.sortBy === option.key}
                  onPress={() => setFilters({ ...filters, sortBy: option.key as any })}
                  style={styles.sheetChip}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.sheetActions}>
            <GradientButton
              text="Aplicar filtros"
              onPress={applyFilters}
            />
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070810',
  },
  heroHeader: {
    paddingHorizontal: 0,
    paddingTop: 52,
    paddingBottom: 36,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    marginHorizontal: -8,
  },
  heroContent: {
    paddingHorizontal: 24,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  heroBadgeText: {
    color: '#0c3b1f',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    maxWidth: 320,
  },
  listHeader: {
    paddingHorizontal: 0,
    paddingBottom: 12,
    paddingTop: 24,
    marginTop: -18,
    marginHorizontal: -8,
  },
  listHeaderContent: {
    paddingHorizontal: 12,
  },
  searchCard: {
    padding: 18,
    marginBottom: 20,
    backgroundColor: 'rgba(15, 17, 38, 0.95)',
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  searchClearButton: {
    marginLeft: 8,
  },
  searchingIndicator: {
    marginLeft: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  filterButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterButtonText: {
    color: '#0a0a0f',
    fontSize: 15,
    fontWeight: '700',
  },
  filterBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 12,
  },
  filterBadgeText: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '700',
  },
  discoveryScroll: {
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginBottom: 12,
  },
  discoveryCard: {
    width: 220,
    marginRight: 12,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  discoveryIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  discoveryTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  discoverySubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 18,
  },
  quickSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryCarousel: {
    paddingVertical: 4,
  },
  categoryCardWrapper: {
    marginRight: 12,
  },
  categoryCard: {
    width: 130,
    height: 110,
    borderRadius: 18,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  categoryCardActive: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  categoryIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  quickActionsCard: {
    marginTop: 12,
    marginBottom: 16,
    padding: 18,
    backgroundColor: 'rgba(15,17,36,0.95)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionHeaderSpacing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  quickActionsTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickActionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  suggestionsContainer: {
    backgroundColor: 'rgba(15,17,36,0.95)',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  viewSwitch: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  viewSwitchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewSwitchButtonActive: {
    backgroundColor: '#34C759',
  },
  viewSwitchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b8fa1',
  },
  viewSwitchTextActive: {
    color: '#04100a',
  },
  viewSwitchTextDisabled: {
    opacity: 0.4,
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
    paddingBottom: 120,
    paddingHorizontal: 8,
  },
  productsRow: {
    justifyContent: 'space-between',
  },
  sectionListContent: {
    paddingBottom: 120,
    paddingHorizontal: 8,
  },
  sectionListHeader: {
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    color: '#9ea2ba',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  sectionCard: {
    flex: 1,
  },
  sectionCardPlaceholder: {
    flex: 1,
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0c0d1c',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: Dimensions.get('window').height * 0.78,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginTop: 10,
  },
  sheetHeader: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    paddingTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sheetClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(52,199,89,0.12)',
  },
  sheetClearText: {
    color: '#34C759',
    fontWeight: '600',
    fontSize: 13,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 18,
  },
  sectionLabel: {
    color: '#8b8fa1',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sheetCategoryScroll: {
    paddingVertical: 10,
    gap: 10,
  },
  sheetChip: {
    marginRight: 10,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceLabel: {
    color: '#8b8fa1',
    fontSize: 12,
    marginBottom: 6,
  },
  sheetInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    fontSize: 15,
  },
  sortGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sheetActions: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#0c0d1c',
  },
});

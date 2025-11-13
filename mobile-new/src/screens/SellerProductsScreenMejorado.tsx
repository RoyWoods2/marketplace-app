import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import GradientButton from '../components/GradientButton';
import { formatCurrencyShort } from '../utils/currency';
import { useNavigation } from '@react-navigation/native';

const SCREEN_WIDTH = Dimensions.get('window').width;

const CATEGORIES = [
  'Tecnología',
  'Moda',
  'Hogar',
  'Deportes',
  'Belleza',
  'Libros',
  'Juguetes',
  'Artesanías',
  'Comida',
  'Otros',
];

type SortType = 'name' | 'price_low' | 'price_high' | 'stock_low' | 'stock_high' | 'date_new' | 'date_old';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  isActive: boolean;
  createdAt: string;
  salesCount?: number;
  revenue?: number;
}

type FilterType = 'all' | 'active' | 'inactive' | 'lowStock';

export default function SellerProductsScreen() {
  const navigation = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('date_new');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const { token, user } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    images: [] as string[],
  });

  useEffect(() => {
    fetchProducts();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        Alert.alert('Error', 'Usuario no autenticado');
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.SELLER_PRODUCTS}?userId=${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const productsData = data.products || [];

        // Fetch orders to calculate sales stats per product
        const ordersResponse = await fetch(`${API_ENDPOINTS.SELLER_ORDERS}?userId=${user.id}&limit=1000`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          const orders = ordersData.orders || [];

          // Calculate sales count and revenue per product
          const productStats: { [key: string]: { salesCount: number; revenue: number } } = {};
          
          orders.forEach((order: any) => {
            if (order.status === 'DELIVERED' && order.product) {
              const productId = order.product.id;
              if (!productStats[productId]) {
                productStats[productId] = { salesCount: 0, revenue: 0 };
              }
              productStats[productId].salesCount += order.quantity || 1;
              productStats[productId].revenue += order.total || 0;
            }
          });

          // Add stats to products
          const productsWithStats = productsData.map((product: Product) => ({
            ...product,
            salesCount: productStats[product.id]?.salesCount || 0,
            revenue: productStats[product.id]?.revenue || 0,
          }));

          setProducts(productsWithStats);
        } else {
          setProducts(productsData);
        }
      } else {
        Alert.alert('Error', 'No se pudieron cargar los productos');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleAddProduct = () => {
    setNewProduct({
      title: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      images: [],
    });
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setNewProduct({
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      images: product.images || [],
    });
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages = result.assets.map(asset => asset.uri);
        setNewProduct(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setNewProduct(prev => {
      const newImages = [...prev.images];
      const [moved] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, moved);
      return { ...prev, images: newImages };
    });
  };

  const handleDuplicateProduct = (product: Product) => {
    setNewProduct({
      title: `${product.title} (Copia)`,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      images: [...product.images],
    });
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const handlePreviewProduct = (product: Product) => {
    setPreviewProduct(product);
    setShowPreviewModal(true);
  };

  const calculateStats = () => {
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const activeProducts = products.filter(p => p.isActive).length;
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.stock <= 5).length;
    const noSalesProducts = products.filter(p => !p.salesCount || p.salesCount === 0).length;
    
    // Top 3 productos más vendidos
    const topSelling = [...products]
      .filter(p => p.salesCount && p.salesCount > 0)
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 3);

    return {
      totalInventoryValue,
      activeProducts,
      totalProducts,
      lowStockProducts,
      noSalesProducts,
      topSelling,
    };
  };

  const removeImage = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSaveProduct = async () => {
    if (!newProduct.title || !newProduct.price || !newProduct.stock) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (newProduct.images.length === 0) {
      Alert.alert('Error', 'Debes agregar al menos una imagen');
      return;
    }

    try {
      const productData = {
        title: newProduct.title,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        category: newProduct.category,
        images: newProduct.images,
        isActive: true,
        userId: user?.id
      };

      const url = editingProduct 
        ? `${API_ENDPOINTS.SELLER_PRODUCTS}/${editingProduct.id}`
        : API_ENDPOINTS.SELLER_PRODUCTS;
      
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        Alert.alert('Éxito', editingProduct ? 'Producto actualizado' : 'Producto creado');
        setShowAddModal(false);
        setEditingProduct(null);
        fetchProducts();
      } else {
        Alert.alert('Error', 'No se pudo guardar el producto');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Error al guardar el producto');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SELLER_PRODUCTS}/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          isActive: !product.isActive,
          userId: user?.id
        }),
      });

      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error toggling product:', error);
    }
  };

  const getFilteredAndSortedProducts = () => {
    let filtered = products;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    switch (filter) {
      case 'active':
        filtered = filtered.filter(p => p.isActive);
        break;
      case 'inactive':
        filtered = filtered.filter(p => !p.isActive);
        break;
      case 'lowStock':
        filtered = filtered.filter(p => p.stock <= 5);
        break;
      default:
        break;
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'stock_low':
          return a.stock - b.stock;
        case 'stock_high':
          return b.stock - a.stock;
        case 'date_new':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date_old':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  };

  const FilterButton = ({ type, label, icon, count }: { type: FilterType; label: string; icon: React.ReactNode; count?: number }) => {
    const isActive = filter === type;
    return (
      <TouchableOpacity
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setFilter(type)}
        activeOpacity={0.7}
      >
        {isActive ? (
          <LinearGradient
            colors={['#34C759', '#30B350']}
            style={styles.filterGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.filterIconContainer}>{icon}</View>
            <Text style={styles.filterTextActive}>{label}</Text>
            {count !== undefined && count > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{count}</Text>
              </View>
            )}
          </LinearGradient>
        ) : (
          <View style={styles.filterInactive}>
            <View style={styles.filterIconContainer}>{icon}</View>
            <Text style={styles.filterText}>{label}</Text>
            {count !== undefined && count > 0 && (
              <View style={[styles.filterBadge, styles.filterBadgeInactive]}>
                <Text style={styles.filterBadgeText}>{count}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderProduct = ({ item, index }: { item: Product; index: number }) => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleEditProduct(item)}
        activeOpacity={0.7}
      >
        <Card style={styles.productCardInner}>
          <View style={styles.productRow}>
            <Image
              source={{ uri: item.images[0] || 'https://via.placeholder.com/80' }}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <View style={styles.productHeader}>
                <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
                {!item.isActive && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveBadgeText}>Pausado</Text>
                  </View>
                )}
              </View>
              <Text style={styles.productDescription} numberOfLines={2}>
                {item.description || 'Sin descripción'}
              </Text>
              <View style={styles.productMeta}>
                <Text style={styles.productPrice}>{formatCurrencyShort(item.price)}</Text>
                <View style={[
                  styles.stockBadge,
                  item.stock <= 5 && styles.lowStockBadge
                ]}>
                  <Text style={styles.stockText}>
                    {item.stock} {item.stock === 1 ? 'unidad' : 'unidades'}
                  </Text>
                </View>
              </View>
              {(item.salesCount || item.revenue) && (
                <View style={styles.productStats}>
                  {item.salesCount && item.salesCount > 0 && (
                    <View style={styles.productStatItem}>
                      <Ionicons name="trending-up" size={16} color="#34C759" />
                      <Text style={styles.productStatText}>{item.salesCount} ventas</Text>
                    </View>
                  )}
                  {item.revenue && item.revenue > 0 && (
                    <View style={styles.productStatItem}>
                      <Ionicons name="cash-outline" size={16} color="#34C759" />
                      <Text style={styles.productStatText}>{formatCurrencyShort(item.revenue)}</Text>
                    </View>
                  )}
                </View>
              )}
              <View style={styles.productActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSmall]}
                  onPress={() => handlePreviewProduct(item)}
                >
                  <Ionicons name="eye" size={18} color="#FFFFFF" />
                </TouchableOpacity>
                {/* <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSmall]}
                  onPress={() => handleDuplicateProduct(item)}
                >
                  <Ionicons name="copy-outline" size={18} color="#0a0a0f" />
                </TouchableOpacity> */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditProduct(item)}
                >
                  <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  onPress={() => handleToggleActive(item)}
                >
                  <Ionicons
                    name={item.isActive ? 'pause' : 'play'}
                    size={18}
                    color={item.isActive ? '#FFFFFF' : '#FFFFFF'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading && products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  const filteredProducts = getFilteredAndSortedProducts();
  const stats = calculateStats();
  const lowStockCount = products.filter(p => p.stock <= 5).length;
  const activeCount = products.filter(p => p.isActive).length;
  const inactiveCount = products.filter(p => !p.isActive).length;

  const getSortLabel = () => {
    const labels: { [key: string]: string } = {
      name: 'Nombre A-Z',
      price_low: 'Precio: Menor',
      price_high: 'Precio: Mayor',
      stock_low: 'Stock: Menor',
      stock_high: 'Stock: Mayor',
      date_new: 'Más Recientes',
      date_old: 'Más Antiguos',
    };
    return labels[sortBy] || 'Ordenar';
  };


  const renderHeader = () => (
    <>
      {/* Header */}
      <LinearGradient
        colors={['#34C759', '#30B350']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerTitleContainer}>
              <MaterialIcons name="inventory" size={24} color="#FFFFFF" style={styles.headerTitleIcon} />
              <Text style={styles.headerTitle}>Mis Productos</Text>
            </View>
            <Text style={styles.headerSubtitle}>{products.length} producto{products.length !== 1 ? 's' : ''} total{products.length !== 1 ? 'es' : ''}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => setShowStatsModal(true)}
            >
              <Ionicons name="stats-chart" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddProduct}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
                style={styles.addButtonGradient}
              >
                <MaterialIcons name="add" size={24} color="#FFFFFF" />
                {/*<Text style={styles.addButtonText}>+ Agregar</Text>*/}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          <FilterButton type="all" label="Todos" icon={<MaterialIcons name="list" size={18} color="currentColor" />} count={products.length} />
          <FilterButton type="active" label="Activos" icon={<Ionicons name="checkmark-circle" size={18} color="currentColor" />} count={activeCount} />
          <FilterButton type="inactive" label="Pausados" icon={<Ionicons name="pause-circle" size={18} color="currentColor" />} count={inactiveCount} />
          <FilterButton type="lowStock" label="Stock Bajo" icon={<Ionicons name="warning" size={18} color="currentColor" />} count={lowStockCount} />
        </ScrollView>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#34C759"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inventory-2" size={64} color="#999" />
            <Text style={[styles.emptyTitle, { marginTop: 16 }]}>
              {filter === 'all' ? 'No tienes productos' : 'No hay productos en esta categoría'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' 
                ? 'Presiona + Agregar para crear tu primer producto' 
                : 'Cambia el filtro para ver otros productos'}
            </Text>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <LinearGradient
                  colors={['#34C759', '#30B350']}
                  style={styles.modalHeader}
                >
                  <View style={styles.modalTitleRow}>
                    <Ionicons
                      name={editingProduct ? 'create-outline' : 'add-circle-outline'}
                      size={22}
                      color="#FFFFFF"
                    />
                    <Text style={styles.modalTitle}>
                      {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowAddModal(false);
                    }}
                  >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </LinearGradient>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre del producto *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Camiseta Azul Talla M"
                  placeholderTextColor="#666"
                  value={newProduct.title}
                  onChangeText={(text) => setNewProduct({ ...newProduct, title: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe tu producto..."
                  placeholderTextColor="#666"
                  value={newProduct.description}
                  onChangeText={(text) => setNewProduct({ ...newProduct, description: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Precio *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="150"
                    placeholderTextColor="#666"
                    value={newProduct.price}
                    onChangeText={(text) => setNewProduct({ ...newProduct, price: text })}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Stock *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10"
                    placeholderTextColor="#666"
                    value={newProduct.stock}
                    onChangeText={(text) => setNewProduct({ ...newProduct, stock: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Categoría</Text>
                <TouchableOpacity
                  style={styles.categorySelector}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <Text style={newProduct.category ? styles.categorySelectorText : styles.categorySelectorPlaceholder}>
                    {newProduct.category || 'Seleccionar categoría'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Ionicons name="images-outline" size={18} color="#FFFFFF" />
                  <Text style={[styles.inputLabel, styles.inputLabelInline]}>Imágenes del producto *</Text>
                </View>
                <Text style={styles.inputHint}>Puedes seleccionar múltiples imágenes. Arrastra para reordenar.</Text>
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={pickImages}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.imagePickerGradient}
                  >
                    <View style={styles.imagePickerContent}>
                      <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.imagePickerText}>Seleccionar de Galería</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {newProduct.images.length > 0 && (
                  <View style={styles.imagesPreviewContainer}>
                    {newProduct.images.map((image, index) => (
                      <View key={index} style={styles.imagePreviewItem}>
                        <Image source={{ uri: image }} style={styles.imagePreview} />
                        <View style={styles.imagePreviewActions}>
                          {index > 0 && (
                            <TouchableOpacity
                              style={styles.imageActionButton}
                              onPress={() => moveImage(index, index - 1)}
                            >
                              <MaterialIcons name="keyboard-arrow-up" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                          )}
                          {index < newProduct.images.length - 1 && (
                            <TouchableOpacity
                              style={styles.imageActionButton}
                              onPress={() => moveImage(index, index + 1)}
                            >
                              <MaterialIcons name="keyboard-arrow-down" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={styles.removeImageButton}
                            onPress={() => removeImage(index)}
                          >
                            <Ionicons name="close" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.imageIndexText}>{index + 1}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowAddModal(false);
                  }}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                </TouchableOpacity>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <GradientButton
                    title={editingProduct ? 'Actualizar' : 'Crear Producto'}
                    onPress={() => {
                      Keyboard.dismiss();
                      handleSaveProduct();
                    }}
                    gradient={['#34C759', '#30B350']}
                  />
                </View>
              </View>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Stats Modal */}
      <Modal
        visible={showStatsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStatsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#FFD60A', '#FFA500']}
              style={styles.modalHeader}
            >
              <View style={styles.modalTitleRow}>
                <Ionicons name="stats-chart" size={22} color="#FFFFFF" />
                <Text style={styles.modalTitle}>Estadísticas</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowStatsModal(false)}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.modalBody}>
              <Card style={styles.statCard}>
                <View style={styles.statCardHeader}>
                  <Ionicons name="cash-outline" size={20} color="#FFD60A" />
                  <Text style={styles.statCardTitle}>Valor del Inventario</Text>
                </View>
                <Text style={styles.statCardValue}>{formatCurrencyShort(stats.totalInventoryValue)}</Text>
                <Text style={styles.statCardSubtext}>Total de productos × precio</Text>
              </Card>

              <Card style={styles.statCard}>
                <View style={styles.statCardHeader}>
                  <MaterialIcons name="inventory" size={20} color="#FFD60A" />
                  <Text style={styles.statCardTitle}>Resumen de Productos</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total:</Text>
                  <Text style={styles.statValue}>{stats.totalProducts}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Activos:</Text>
                  <Text style={[styles.statValue, { color: '#34C759' }]}>{stats.activeProducts}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Stock Bajo:</Text>
                  <Text style={[styles.statValue, { color: '#FF9800' }]}>{stats.lowStockProducts}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Sin Ventas:</Text>
                  <Text style={[styles.statValue, { color: '#FF3B30' }]}>{stats.noSalesProducts}</Text>
                </View>
              </Card>

              {stats.topSelling.length > 0 && (
                <Card style={styles.statCard}>
                  <View style={styles.statCardHeader}>
                    <Ionicons name="trophy-outline" size={20} color="#FFD60A" />
                    <Text style={styles.statCardTitle}>Productos Más Vendidos</Text>
                  </View>
                  {stats.topSelling.map((product, index) => (
                    <View key={product.id} style={styles.topProductItem}>
                      <Text style={styles.topProductRank}>#{index + 1}</Text>
                      <View style={styles.topProductInfo}>
                        <Text style={styles.topProductName}>{product.title}</Text>
                        <Text style={styles.topProductSales}>{product.salesCount} ventas</Text>
                      </View>
                    </View>
                  ))}
                </Card>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.modalHeader}
            >
              <View style={styles.modalTitleRow}>
                <Ionicons name="swap-vertical" size={22} color="#FFFFFF" />
                <Text style={styles.modalTitle}>Ordenar Por</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSortModal(false)}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.modalBody}>
              {(['name', 'price_low', 'price_high', 'stock_low', 'stock_high', 'date_new', 'date_old'] as SortType[]).map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={[styles.sortOption, sortBy === sort && styles.sortOptionActive]}
                  onPress={() => {
                    setSortBy(sort);
                    setShowSortModal(false);
                  }}
                >
                  <Text style={[styles.sortOptionText, sortBy === sort && styles.sortOptionTextActive]}>
                    {sort === 'name' ? 'Nombre A-Z' :
                     sort === 'price_low' ? 'Precio: Menor a Mayor' :
                     sort === 'price_high' ? 'Precio: Mayor a Menor' :
                     sort === 'stock_low' ? 'Stock: Menor a Mayor' :
                     sort === 'stock_high' ? 'Stock: Mayor a Menor' :
                     sort === 'date_new' ? 'Más Recientes' :
                     'Más Antiguos'}
                  </Text>
                  {sortBy === sort && <Text style={styles.sortOptionCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#34C759', '#30B350']}
              style={styles.modalHeader}
            >
              <View style={styles.modalTitleRow}>
                <Ionicons name="pricetag-outline" size={22} color="#FFFFFF" />
                <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.modalBody}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryOption, newProduct.category === category && styles.categoryOptionActive]}
                  onPress={() => {
                    setNewProduct({ ...newProduct, category });
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={[styles.categoryOptionText, newProduct.category === category && styles.categoryOptionTextActive]}>
                    {category}
                  </Text>
                  {newProduct.category === category && <Text style={styles.categoryOptionCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Preview Modal */}
      <Modal
        visible={showPreviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPreviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#34C759', '#30B350']}
              style={styles.modalHeader}
            >
              <View style={styles.modalTitleRow}>
                <Ionicons name="eye" size={22} color="#FFFFFF" />
                <Text style={styles.modalTitle}>Vista Previa</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPreviewModal(false)}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            {previewProduct && (
              <ScrollView style={styles.modalBody}>
                <Image
                  source={{ uri: previewProduct.images[0] || 'https://via.placeholder.com/400' }}
                  style={styles.previewImage}
                />
                <View style={styles.previewContent}>
                  <Text style={styles.previewTitle}>{previewProduct.title}</Text>
                  <Text style={styles.previewPrice}>{formatCurrencyShort(previewProduct.price)}</Text>
                  <Text style={styles.previewDescription}>{previewProduct.description || 'Sin descripción'}</Text>
                  <View style={styles.previewMeta}>
                    <View style={styles.previewMetaItem}>
                      <Ionicons name="cube-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.previewMetaText}>Stock: {previewProduct.stock}</Text>
                    </View>
                    <View style={styles.previewMetaItem}>
                      <Ionicons name="pricetag-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.previewMetaText}>{previewProduct.category}</Text>
                    </View>
                    <View style={styles.previewMetaItem}>
                      <Ionicons
                        name={previewProduct.isActive ? 'checkmark-circle' : 'pause-circle'}
                        size={16}
                        color={previewProduct.isActive ? '#34C759' : '#FF9800'}
                      />
                      <Text style={styles.previewMetaText}>
                        {previewProduct.isActive ? 'Activo' : 'Pausado'}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  headerGradient: {
    marginHorizontal: -16,
    paddingTop: 64,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingRight: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    marginRight: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginRight: 8,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  filtersContainer: {
    marginHorizontal: -16,
    backgroundColor: '#0a0a0f',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginTop: 0,
  },
  filtersScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  filterGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  filterInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    gap: 6,
  },
  filterButtonActive: {
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterIconContainer: {
    marginRight: 6,
  },
  filterText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterBadge: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeInactive: {
    backgroundColor: '#34C759',
  },
  filterBadgeText: {
    color: '#34C759',
    fontSize: 11,
    fontWeight: 'bold',
  },
  listContent: {
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  productCard: {
    marginBottom: 16,
  },
  productCardInner: {
    padding: 0,
  },
  productRow: {
    flexDirection: 'row',
    padding: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  productTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  inactiveBadge: {
    backgroundColor: 'rgba(255, 159, 10, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  inactiveBadgeText: {
    color: '#FF9F0A',
    fontSize: 11,
    fontWeight: 'bold',
  },
  productDescription: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
    lineHeight: 18,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34C759',
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  lowStockBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  stockText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  inputLabelInline: {
    marginBottom: 0,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalButtonTextCancel: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePickerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imagePickerGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  imagePickerText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  imagesPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imagePreviewItem: {
    position: 'relative',
  },
  imagePreview: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewActions: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    gap: 4,
  },
  imageActionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIndexText: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleIcon: {
    marginRight: 8,
  },
  searchContainer: {
    marginHorizontal: -16,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#0a0a0f',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  sortButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 12,
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  productStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  productStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productStatText: {
    fontSize: 12,
    color: '#888',
  },
  actionButtonSmall: {
    flex: 0,
    paddingHorizontal: 8,
    minWidth: 40,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categorySelectorText: {
    color: '#fff',
    fontSize: 15,
  },
  categorySelectorPlaceholder: {
    color: '#666',
    fontSize: 15,
  },
  inputHint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  statCard: {
    marginBottom: 16,
    padding: 20,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  statCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD60A',
    marginBottom: 4,
  },
  statCardSubtext: {
    fontSize: 12,
    color: '#888',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  topProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  topProductRank: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD60A',
    width: 40,
    textAlign: 'center',
  },
  topProductInfo: {
    flex: 1,
  },
  topProductName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  topProductSales: {
    fontSize: 13,
    color: '#888',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sortOptionActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderColor: '#667eea',
  },
  sortOptionText: {
    fontSize: 15,
    color: '#fff',
  },
  sortOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  sortOptionCheck: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: 'bold',
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryOptionActive: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    borderColor: '#34C759',
  },
  categoryOptionText: {
    fontSize: 15,
    color: '#fff',
  },
  categoryOptionTextActive: {
    color: '#34C759',
    fontWeight: '600',
  },
  categoryOptionCheck: {
    fontSize: 18,
    color: '#34C759',
    fontWeight: 'bold',
  },
  previewImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  previewContent: {
    padding: 20,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  previewPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD60A',
    marginBottom: 16,
  },
  previewDescription: {
    fontSize: 15,
    color: '#ddd',
    lineHeight: 22,
    marginBottom: 16,
  },
  previewMeta: {
    gap: 8,
  },
  previewMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewMetaText: {
    fontSize: 14,
    color: '#888',
  },
});


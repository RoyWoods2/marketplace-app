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
import * as ImagePicker from 'expo-image-picker';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import GradientButton from '../components/GradientButton';

const SCREEN_WIDTH = Dimensions.get('window').width;

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
}

type FilterType = 'all' | 'active' | 'inactive' | 'lowStock';

export default function SellerProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
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
        setProducts(data.products || []);
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
        allowsMultipleSelection: false,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets[0]) {
        setNewProduct(prev => ({
          ...prev,
          images: [...prev.images, result.assets[0].uri]
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
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

  const getFilteredProducts = () => {
    switch (filter) {
      case 'active':
        return products.filter(p => p.isActive);
      case 'inactive':
        return products.filter(p => !p.isActive);
      case 'lowStock':
        return products.filter(p => p.stock <= 5);
      default:
        return products;
    }
  };

  const FilterButton = ({ type, label, icon, count }: { type: FilterType; label: string; icon: string; count?: number }) => {
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
            <Text style={styles.filterIcon}>{icon}</Text>
            <Text style={styles.filterTextActive}>{label}</Text>
            {count !== undefined && count > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{count}</Text>
              </View>
            )}
          </LinearGradient>
        ) : (
          <View style={styles.filterInactive}>
            <Text style={styles.filterIcon}>{icon}</Text>
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
                <Text style={styles.productPrice}>${item.price}</Text>
                <View style={[
                  styles.stockBadge,
                  item.stock <= 5 && styles.lowStockBadge
                ]}>
                  <Text style={styles.stockText}>
                    {item.stock} {item.stock === 1 ? 'unidad' : 'unidades'}
                  </Text>
                </View>
              </View>
              <View style={styles.productActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditProduct(item)}
                >
                  <Text style={styles.actionButtonText}>✏️ Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  onPress={() => handleToggleActive(item)}
                >
                  <Text style={styles.actionButtonText}>
                    {item.isActive ? '⏸️ Pausar' : '▶️ Activar'}
                  </Text>
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

  const filteredProducts = getFilteredProducts();
  const lowStockCount = products.filter(p => p.stock <= 5).length;
  const activeCount = products.filter(p => p.isActive).length;
  const inactiveCount = products.filter(p => !p.isActive).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#34C759', '#30B350']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>📦 Mis Productos</Text>
            <Text style={styles.headerSubtitle}>{products.length} producto{products.length !== 1 ? 's' : ''} total{products.length !== 1 ? 'es' : ''}</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddProduct}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
              style={styles.addButtonGradient}
            >
              <Text style={styles.addButtonText}>+ Agregar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filtersScroll}>
          <FilterButton type="all" label="Todos" icon="📋" count={products.length} />
          <FilterButton type="active" label="Activos" icon="✅" count={activeCount} />
          <FilterButton type="inactive" label="Pausados" icon="⏸️" count={inactiveCount} />
          <FilterButton type="lowStock" label="Stock Bajo" icon="⚠️" count={lowStockCount} />
        </View>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
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
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>
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
                  <Text style={styles.modalTitle}>
                    {editingProduct ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowAddModal(false);
                    }}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
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
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Ropa, Electrónica, Comida..."
                  placeholderTextColor="#666"
                  value={newProduct.category}
                  onChangeText={(text) => setNewProduct({ ...newProduct, category: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📷 Imágenes del producto *</Text>
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={pickImages}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.imagePickerGradient}
                  >
                    <Text style={styles.imagePickerText}>📷 Seleccionar de Galería</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {newProduct.images.length > 0 && (
                  <View style={styles.imagesPreviewContainer}>
                    {newProduct.images.map((image, index) => (
                      <View key={index} style={styles.imagePreviewItem}>
                        <Image source={{ uri: image }} style={styles.imagePreview} />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => removeImage(index)}
                        >
                          <Text style={styles.removeImageText}>✕</Text>
                        </TouchableOpacity>
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
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  filtersContainer: {
    backgroundColor: '#0a0a0f',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  filtersScroll: {
    flexDirection: 'row',
    paddingHorizontal: 16,
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
  filterIcon: {
    fontSize: 14,
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
    padding: 16,
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
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
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
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
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
  removeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});


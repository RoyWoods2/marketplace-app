import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import GradientButton from '../components/GradientButton';
import Card from '../components/Card';
import { API_ENDPOINTS } from '../config/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
}

const CATEGORIES = [
  { id: '1', name: 'Tecnología', icon: '💻' },
  { id: '2', name: 'Moda', icon: '👔' },
  { id: '3', name: 'Hogar', icon: '🏠' },
  { id: '4', name: 'Deportes', icon: '⚽' },
  { id: '5', name: 'Belleza', icon: '💄' },
  { id: '6', name: 'Libros', icon: '📚' },
  { id: '7', name: 'Juguetes', icon: '🧸' },
  { id: '8', name: 'Otros', icon: '📦' },
];

export default function CreateScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'product' | 'reel'>('product');
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Product form state
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    images: [] as string[],
  });

  // Reel form state
  const [reelForm, setReelForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnail: '',
    productId: '',
  });

  const [userProducts, setUserProducts] = useState<Product[]>([]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    if (activeTab === 'reel' && user) {
      loadUserProducts();
    }
  }, [activeTab, user]);

  const loadUserProducts = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PRODUCTS);
      if (response.ok) {
        const data = await response.json();
        const products = data.products || data;
        const filteredProducts = products.filter((product: any) => 
          product.user.id === user?.id
        );
        setUserProducts(filteredProducts);
      }
    } catch (error) {
      console.error('Error loading user products:', error);
    }
  };

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => asset.uri);
        setProductForm(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'No se pudieron seleccionar las imágenes');
    }
  };

  const removeImage = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const createProduct = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes estar logueado para crear productos');
      return;
    }

    if (!productForm.title || !productForm.description || !productForm.price || !productForm.category) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    if (productForm.images.length === 0) {
      Alert.alert('Error', 'Debes agregar al menos una imagen');
      return;
    }

    try {
      setLoading(true);
      
      const productData = {
        title: productForm.title,
        description: productForm.description,
        price: parseFloat(productForm.price),
        images: productForm.images,
        category: productForm.category,
        stock: parseInt(productForm.stock) || 0,
        userId: user.id,
      };

      const response = await fetch(API_ENDPOINTS.PRODUCTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        Alert.alert(
          '✅ Producto creado',
          'Tu producto ha sido creado exitosamente',
          [{ text: 'OK', onPress: resetProductForm }]
        );
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'No se pudo crear el producto');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'No se pudo crear el producto');
    } finally {
      setLoading(false);
    }
  };

  const createReel = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes estar logueado para crear reels');
      return;
    }

    if (!reelForm.title || !reelForm.description || !reelForm.videoUrl) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setLoading(true);
      
      const reelData = {
        title: reelForm.title,
        description: reelForm.description,
        videoUrl: reelForm.videoUrl,
        thumbnail: reelForm.thumbnail || 'https://via.placeholder.com/300x400/34C759/FFFFFF?text=Reel',
        duration: 30,
        userId: user.id,
        productId: reelForm.productId || null,
      };

      const response = await fetch(API_ENDPOINTS.REELS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reelData),
      });

      if (response.ok) {
        Alert.alert(
          '✅ Reel creado',
          'Tu reel ha sido creado exitosamente',
          [{ text: 'OK', onPress: resetReelForm }]
        );
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'No se pudo crear el reel');
      }
    } catch (error) {
      console.error('Error creating reel:', error);
      Alert.alert('Error', 'No se pudo crear el reel');
    } finally {
      setLoading(false);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      title: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      images: [],
    });
  };

  const resetReelForm = () => {
    setReelForm({
      title: '',
      description: '',
      videoUrl: '',
      thumbnail: '',
      productId: '',
    });
  };

  const renderProductForm = () => (
    <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formHeader}>
          <Text style={styles.formIcon}>📦</Text>
          <Text style={styles.formTitle}>Crear Producto</Text>
          <Text style={styles.formSubtitle}>Agrega un nuevo producto a tu catálogo</Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>📝 Título del Producto *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Camiseta Azul Talla M"
            placeholderTextColor="#666"
            value={productForm.title}
            onChangeText={(text) => setProductForm(prev => ({ ...prev, title: text }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>📄 Descripción *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe tu producto en detalle..."
            placeholderTextColor="#666"
            value={productForm.description}
            onChangeText={(text) => setProductForm(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputGroupHalf}>
            <Text style={styles.label}>💰 Precio *</Text>
            <TextInput
              style={styles.input}
              placeholder="150"
              placeholderTextColor="#666"
              value={productForm.price}
              onChangeText={(text) => setProductForm(prev => ({ ...prev, price: text }))}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroupHalf}>
            <Text style={styles.label}>📦 Stock *</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              placeholderTextColor="#666"
              value={productForm.stock}
              onChangeText={(text) => setProductForm(prev => ({ ...prev, stock: text }))}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>🏷️ Categoría *</Text>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={styles.categoryButtonText}>
              {productForm.category || 'Seleccionar categoría'}
            </Text>
            <Text style={styles.categoryButtonIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>📷 Imágenes *</Text>
          <TouchableOpacity 
            style={styles.imageButton} 
            onPress={pickImages}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.imageButtonGradient}
            >
              <Text style={styles.imageButtonText}>📷 Agregar Imágenes</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {productForm.images.length > 0 && (
            <View style={styles.imagesContainer}>
              {productForm.images.map((image, index) => (
                <View key={index} style={styles.imageItem}>
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

        <GradientButton
          title="Crear Producto"
          onPress={() => {
            Keyboard.dismiss();
            createProduct();
          }}
          loading={loading}
          gradient={['#34C759', '#30B350']}
          style={styles.submitButton}
        />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Animated.View>
  );

  const renderReelForm = () => (
    <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formHeader}>
          <Text style={styles.formIcon}>🎬</Text>
          <Text style={styles.formTitle}>Crear Reel</Text>
          <Text style={styles.formSubtitle}>Comparte un video de tus productos</Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>📝 Título del Reel *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Unboxing Camiseta Premium"
            placeholderTextColor="#666"
            value={reelForm.title}
            onChangeText={(text) => setReelForm(prev => ({ ...prev, title: text }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>📄 Descripción *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe tu reel..."
            placeholderTextColor="#666"
            value={reelForm.description}
            onChangeText={(text) => setReelForm(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>🎥 URL del Video *</Text>
          <TextInput
            style={styles.input}
            placeholder="https://ejemplo.com/video.mp4"
            placeholderTextColor="#666"
            value={reelForm.videoUrl}
            onChangeText={(text) => setReelForm(prev => ({ ...prev, videoUrl: text }))}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>🖼️ URL del Thumbnail (Opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://ejemplo.com/thumbnail.jpg"
            placeholderTextColor="#666"
            value={reelForm.thumbnail}
            onChangeText={(text) => setReelForm(prev => ({ ...prev, thumbnail: text }))}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>📦 Producto Asociado (Opcional)</Text>
          <TouchableOpacity 
            style={styles.categoryButton}
            onPress={() => setShowProductModal(true)}
          >
            <Text style={styles.categoryButtonText}>
              {reelForm.productId ? 
                userProducts.find(p => p.id === reelForm.productId)?.title || 'Seleccionar producto' :
                'Seleccionar producto'
              }
            </Text>
            <Text style={styles.categoryButtonIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        <GradientButton
          title="Crear Reel"
          onPress={() => {
            Keyboard.dismiss();
            createReel();
          }}
          loading={loading}
          gradient={['#f093fb', '#f5576c']}
          style={styles.submitButton}
        />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#34C759', '#30B350']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>➕ Crear Contenido</Text>
        
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'product' && styles.activeTab]}
            onPress={() => setActiveTab('product')}
            activeOpacity={0.7}
          >
            {activeTab === 'product' ? (
              <View style={styles.activeTabContent}>
                <Text style={styles.activeTabText}>📦 Productos</Text>
              </View>
            ) : (
              <Text style={styles.tabText}>📦 Productos</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reel' && styles.activeTab]}
            onPress={() => setActiveTab('reel')}
            activeOpacity={0.7}
          >
            {activeTab === 'reel' ? (
              <View style={styles.activeTabContent}>
                <Text style={styles.activeTabText}>🎬 Reels</Text>
              </View>
            ) : (
              <Text style={styles.tabText}>🎬 Reels</Text>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Form Content */}
      {activeTab === 'product' ? renderProductForm() : renderReelForm()}

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#34C759', '#30B350']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </LinearGradient>
            
            <ScrollView style={styles.modalBody}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.modalOption}
                  onPress={() => {
                    setProductForm(prev => ({ ...prev, category: category.name }));
                    setShowCategoryModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Card style={styles.categoryCard}>
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </Card>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Product Modal */}
      <Modal
        visible={showProductModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProductModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>Seleccionar Producto</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowProductModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </LinearGradient>
            
            <ScrollView style={styles.modalBody}>
              {userProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.modalOption}
                  onPress={() => {
                    setReelForm(prev => ({ ...prev, productId: product.id }));
                    setShowProductModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Card style={styles.productCard}>
                    <Image source={{ uri: product.images[0] }} style={styles.productImageSmall} />
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.title}</Text>
                      <Text style={styles.productPriceSmall}>${product.price}</Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
              {userProducts.length === 0 && (
                <View style={styles.emptyProducts}>
                  <Text style={styles.emptyText}>No tienes productos aún</Text>
                </View>
              )}
            </ScrollView>
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
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  activeTabContent: {
    alignItems: 'center',
  },
  tabText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#34C759',
    fontSize: 15,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  formIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  inputGroupHalf: {
    flex: 1,
  },
  label: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  categoryButtonIcon: {
    color: '#888',
    fontSize: 12,
  },
  imageButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageItem: {
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
  submitButton: {
    marginTop: 20,
    marginBottom: 40,
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
    maxHeight: '70%',
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
  modalOption: {
    marginBottom: 12,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  productImageSmall: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  productPriceSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34C759',
  },
  emptyProducts: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
});


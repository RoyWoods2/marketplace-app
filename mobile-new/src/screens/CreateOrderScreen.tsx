import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';

interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
}

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface OrderData {
  productId: string;
  quantity: number;
  branchId: string;
  notes: string;
  total: number;
}

export default function CreateOrderScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuth();

  const [orderData, setOrderData] = useState<OrderData>({
    productId: '',
    quantity: 1,
    branchId: '',
    notes: '',
    total: 0,
  });

  useEffect(() => {
    fetchProducts();
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      setOrderData(prev => ({
        ...prev,
        productId: selectedProduct.id,
        total: selectedProduct.price * orderData.quantity
      }));
    }
  }, [selectedProduct, orderData.quantity]);

  const fetchProducts = async () => {
    try {
      if (!user) return;

      const response = await fetch(`${API_ENDPOINTS.SELLER_PRODUCTS}?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_BRANCHES, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBranches(data.branches || []);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleCreateOrder = async () => {
    try {
      if (!selectedProduct || !selectedBranch) {
        Alert.alert('Error', 'Por favor selecciona un producto y una sucursal');
        return;
      }

      if (orderData.quantity <= 0) {
        Alert.alert('Error', 'La cantidad debe ser mayor a 0');
        return;
      }

      setLoading(true);

      const response = await fetch(API_ENDPOINTS.ORDERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: orderData.productId,
          quantity: orderData.quantity,
          branchId: orderData.branchId,
          notes: orderData.notes,
          total: orderData.total,
          userId: user?.id
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Éxito',
          'Orden creada correctamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'No se pudo crear la orden');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Error al crear la orden');
    } finally {
      setLoading(false);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => {
        setSelectedProduct(item);
        setShowProductModal(false);
      }}
    >
      <Text style={styles.productTitle}>{item.title}</Text>
      <Text style={styles.productPrice}>${item.price}</Text>
      <Text style={styles.productStock}>Stock: {item.stock}</Text>
    </TouchableOpacity>
  );

  const renderBranch = ({ item }: { item: Branch }) => (
    <TouchableOpacity
      style={styles.branchItem}
      onPress={() => {
        setSelectedBranch(item);
        setOrderData(prev => ({ ...prev, branchId: item.id }));
        setShowBranchModal(false);
      }}
    >
      <Text style={styles.branchName}>{item.name}</Text>
      <Text style={styles.branchAddress}>{item.address}</Text>
      <Text style={styles.branchPhone}>{item.phone}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear Orden</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Product Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Producto</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowProductModal(true)}
          >
            <Text style={selectedProduct ? styles.selectorText : styles.selectorPlaceholder}>
              {selectedProduct ? selectedProduct.title : 'Seleccionar producto'}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>
          {selectedProduct && (
            <View style={styles.productInfo}>
              <Text style={styles.productDetail}>Precio: ${selectedProduct.price}</Text>
              <Text style={styles.productDetail}>Stock: {selectedProduct.stock}</Text>
            </View>
          )}
        </View>

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔢 Cantidad</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setOrderData(prev => ({ 
                ...prev, 
                quantity: Math.max(1, prev.quantity - 1) 
              }))}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.quantityInput}
              value={orderData.quantity.toString()}
              onChangeText={(text) => {
                const quantity = parseInt(text) || 1;
                setOrderData(prev => ({ ...prev, quantity }));
              }}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setOrderData(prev => ({ 
                ...prev, 
                quantity: prev.quantity + 1 
              }))}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Branch Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏪 Sucursal de Entrega</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowBranchModal(true)}
          >
            <Text style={selectedBranch ? styles.selectorText : styles.selectorPlaceholder}>
              {selectedBranch ? selectedBranch.name : 'Seleccionar sucursal'}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>
          {selectedBranch && (
            <View style={styles.branchInfo}>
              <Text style={styles.branchDetail}>{selectedBranch.address}</Text>
              <Text style={styles.branchDetail}>{selectedBranch.phone}</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Notas (Opcional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Agregar notas adicionales..."
            value={orderData.notes}
            onChangeText={(text) => setOrderData(prev => ({ ...prev, notes: text }))}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>${orderData.total}</Text>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, (!selectedProduct || !selectedBranch || loading) && styles.disabledButton]}
          onPress={handleCreateOrder}
          disabled={!selectedProduct || !selectedBranch || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.createButtonText}>Crear Orden</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Product Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Producto</Text>
            <TouchableOpacity onPress={() => setShowProductModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            style={styles.modalList}
          />
        </View>
      </Modal>

      {/* Branch Modal */}
      <Modal
        visible={showBranchModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Sucursal</Text>
            <TouchableOpacity onPress={() => setShowBranchModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={branches}
            renderItem={renderBranch}
            keyExtractor={(item) => item.id}
            style={styles.modalList}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#4CAF50',
    paddingTop: 60,
  },
  backButton: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
  },
  selectorPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  selectorArrow: {
    fontSize: 16,
    color: '#666',
  },
  productInfo: {
    marginTop: 8,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
  },
  productDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  quantityButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quantityInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    padding: 8,
  },
  branchInfo: {
    marginTop: 8,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
  },
  branchDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notesInput: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    textAlignVertical: 'top',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  modalList: {
    flex: 1,
  },
  productItem: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  productStock: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  branchItem: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  branchName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  branchAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  branchPhone: {
    fontSize: 14,
    color: '#666',
  },
});


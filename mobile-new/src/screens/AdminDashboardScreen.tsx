import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { API_ENDPOINTS } from '../config/api';

interface AdminStats {
  totalOrders: number;
  readyForPickup: number;
  totalBranches: number;
  recentOrders: Array<{
    id: string;
    status: string;
    createdAt: string;
    user: {
      firstName: string;
      lastName: string;
    };
    product: {
      title: string;
    };
    branch: {
      name: string;
    };
  }>;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  phone?: string;
}

const AdminDashboardScreen: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch admin dashboard stats
      const statsResponse = await fetch(API_ENDPOINTS.ADMIN_DASHBOARD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'admin_user_id' // This should come from auth context
        }),
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      // Fetch branches
      const branchesResponse = await fetch(API_ENDPOINTS.ADMIN_BRANCHES);
      if (branchesResponse.ok) {
        const branchesData = await branchesResponse.json();
        setBranches(branchesData.branches);
      }

    } catch (error) {
      console.error('Error fetching admin data:', error);
      Alert.alert('Error', 'No se pudo cargar la información del administrador');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY_FOR_PICKUP':
        return '#4CAF50';
      case 'PICKED_UP':
        return '#2196F3';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'READY_FOR_PICKUP':
        return 'Listo para retiro';
      case 'PICKED_UP':
        return 'Retirado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard Administrador</Text>
        <Text style={styles.subtitle}>Gestiona las sucursales y pedidos</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.totalOrders || 0}</Text>
          <Text style={styles.statLabel}>Total Órdenes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.readyForPickup || 0}</Text>
          <Text style={styles.statLabel}>Listos para Retiro</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.totalBranches || 0}</Text>
          <Text style={styles.statLabel}>Sucursales</Text>
        </View>
      </View>

      {/* Branches Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sucursales</Text>
        {branches.map((branch) => (
          <TouchableOpacity key={branch.id} style={styles.branchCard}>
            <Text style={styles.branchName}>{branch.name}</Text>
            <Text style={styles.branchAddress}>{branch.address}</Text>
            {branch.phone && (
              <Text style={styles.branchPhone}>📞 {branch.phone}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Órdenes Recientes</Text>
        {stats?.recentOrders && stats.recentOrders.length > 0 ? (
          stats.recentOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderProduct}>{order.product.title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.orderClient}>
                Cliente: {order.user.firstName} {order.user.lastName}
              </Text>
              <Text style={styles.orderBranch}>
                Sucursal: {order.branch.name}
              </Text>
              <Text style={styles.orderDate}>
                {formatDate(order.createdAt)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No hay órdenes recientes</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📱 Escanear QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>🏢 Gestionar Sucursales</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  branchCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  branchName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  branchAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  branchPhone: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderProduct: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  orderClient: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderBranch: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdminDashboardScreen;

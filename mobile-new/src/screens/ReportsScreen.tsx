import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { formatCurrency, formatCurrencyShort } from '../utils/currency';
import { generateInsights } from '../utils/analytics';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Order {
  id: string;
  total: number;
  quantity: number;
  status: string;
  createdAt: string;
  product?: {
    id: string;
    title: string;
    category: string;
    price: number;
  };
}

interface Insight {
  type: 'success' | 'info' | 'warning' | 'trend';
  icon: string;
  title: string;
  description: string;
  highlight?: string;
}

export default function ReportsScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const { token, user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      fetchStats();
      // Regenerate insights when timeframe changes
      const generatedInsights = generateInsights(orders, timeframe);
      setInsights(generatedInsights);
    }
  }, [orders, timeframe]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!user) return;

      // Fetch dashboard stats
      const statsResponse = await fetch(`${API_ENDPOINTS.SELLER_DASHBOARD}?userId=${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      // Fetch orders for analysis
      const ordersResponse = await fetch(`${API_ENDPOINTS.SELLER_ORDERS}?userId=${user.id}&limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const fetchedOrders = ordersData.orders || [];
        setOrders(fetchedOrders);
        
        // Generate insights
        const generatedInsights = generateInsights(fetchedOrders, timeframe);
        setInsights(generatedInsights);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = () => {
    // Stats are already fetched, just update based on timeframe
  };

  // Get insight card colors based on type
  const getInsightColors = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return ['rgba(52, 199, 89, 0.15)', 'rgba(52, 199, 89, 0.25)'];
      case 'info':
        return ['rgba(0, 122, 255, 0.15)', 'rgba(0, 122, 255, 0.25)'];
      case 'warning':
        return ['rgba(255, 149, 0, 0.15)', 'rgba(255, 149, 0, 0.25)'];
      case 'trend':
        return ['rgba(255, 214, 10, 0.15)', 'rgba(255, 214, 10, 0.25)'];
      default:
        return ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.2)'];
    }
  };

  const renderInsightCard = (insight: Insight, index: number) => (
    <Card key={index} style={styles.insightCard}>
      <LinearGradient
        colors={getInsightColors(insight.type)}
        style={styles.insightGradient}
      >
        <View style={styles.insightHeader}>
          <Text style={styles.insightIcon}>{insight.icon}</Text>
          <View style={styles.insightTitleContainer}>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            {insight.highlight && (
              <Text style={styles.insightHighlight}>{insight.highlight}</Text>
            )}
          </View>
        </View>
        <Text style={styles.insightDescription}>{insight.description}</Text>
      </LinearGradient>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD60A" />
        <Text style={styles.loadingText}>Cargando reportes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFD60A', '#FFA500']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reportes</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Quick Reports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Reportes Rápidos</Text>
          <View style={styles.reportsGrid}>
            <TouchableOpacity
              onPress={() => navigation.navigate('SalesHistory', { timeframe: 'all' })}
              style={styles.reportCard}
            >
              <LinearGradient
                colors={['rgba(52, 199, 89, 0.1)', 'rgba(52, 199, 89, 0.2)']}
                style={styles.reportGradient}
              >
                <Text style={styles.reportIcon}>📈</Text>
                <Text style={styles.reportTitle}>Historial de Ventas</Text>
                <Text style={styles.reportValue}>{stats?.totalSales || 0} ventas</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Income', { timeframe: 'all' })}
              style={styles.reportCard}
            >
              <LinearGradient
                colors={['rgba(255, 214, 10, 0.1)', 'rgba(255, 214, 10, 0.2)']}
                style={styles.reportGradient}
              >
                <Text style={styles.reportIcon}>💰</Text>
                <Text style={styles.reportTitle}>Ingresos</Text>
                <Text style={styles.reportValue}>{formatCurrencyShort(stats?.totalRevenue || 0)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Estadísticas Generales</Text>
          <Card style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Ventas Totales</Text>
              <Text style={styles.statValue}>{stats?.totalSales || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Ingresos Totales</Text>
              <Text style={styles.statValue}>{formatCurrencyShort(stats?.totalRevenue || 0)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Ventas de Hoy</Text>
              <Text style={styles.statValue}>{stats?.todaySales || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Ingresos de Hoy</Text>
              <Text style={styles.statValue}>{formatCurrencyShort(stats?.todayRevenue || 0)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Órdenes Pendientes</Text>
              <Text style={styles.statValue}>{stats?.pendingOrders || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Productos con Stock Bajo</Text>
              <Text style={styles.statValue}>{stats?.lowStockProducts || 0}</Text>
            </View>
          </Card>
        </View>

        {/* Charts */}
        <View style={styles.section}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>🧠 Análisis Inteligente</Text>
            <View style={styles.timeframeSelector}>
              <TouchableOpacity
                style={[styles.timeframeButton, timeframe === 'week' && styles.timeframeButtonActive]}
                onPress={() => setTimeframe('week')}
              >
                <Text style={[styles.timeframeText, timeframe === 'week' && styles.timeframeTextActive]}>
                  Semana
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeframeButton, timeframe === 'month' && styles.timeframeButtonActive]}
                onPress={() => setTimeframe('month')}
              >
                <Text style={[styles.timeframeText, timeframe === 'month' && styles.timeframeTextActive]}>
                  Mes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeframeButton, timeframe === 'year' && styles.timeframeButtonActive]}
                onPress={() => setTimeframe('year')}
              >
                <Text style={[styles.timeframeText, timeframe === 'year' && styles.timeframeTextActive]}>
                  Año
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {insights.length > 0 ? (
            <View style={styles.insightsContainer}>
              {insights.map((insight, index) => renderInsightCard(insight, index))}
            </View>
          ) : (
            <Card style={styles.emptyInsightsCard}>
              <Text style={styles.emptyInsightsText}>
                No hay suficientes datos para generar análisis. ¡Comienza a vender!
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
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
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  reportsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  reportCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  reportGradient: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  reportIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  reportValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD60A',
  },
  statsCard: {
    padding: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 16,
    color: '#888',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  comingSoonCard: {
    padding: 40,
    alignItems: 'center',
  },
  comingSoonIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  chartHeader: {
    marginBottom: 16,
  },
  timeframeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  timeframeButtonActive: {
    borderColor: '#FFD60A',
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
  },
  timeframeText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  timeframeTextActive: {
    color: '#FFD60A',
    fontWeight: '600',
  },
  insightsContainer: {
    gap: 16,
  },
  insightCard: {
    marginBottom: 0,
    overflow: 'hidden',
  },
  insightGradient: {
    padding: 20,
    borderRadius: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  insightTitleContainer: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  insightHighlight: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD60A',
  },
  insightDescription: {
    fontSize: 14,
    color: '#ddd',
    lineHeight: 20,
  },
  emptyInsightsCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyInsightsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});


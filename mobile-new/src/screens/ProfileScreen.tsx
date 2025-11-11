import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { formatCurrencyShort } from '../utils/currency';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  companyName?: string;
  createdAt: string;
}

interface UserStats {
  totalProducts?: number;
  totalOrders?: number;
  totalSales?: number;
  totalRevenue?: number;
}

export default function ProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { token, user, logout } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        Alert.alert('Error', 'Usuario no autenticado');
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.USER_PROFILE}?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setStats(data.stats || {});
      } else {
        Alert.alert('Error', 'No se pudo cargar el perfil');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Editar Perfil', 'Función de edición próximamente');
  };

  const handleSettings = () => {
    Alert.alert('Configuración', 'Configuraciones próximamente');
  };

  const handleNotifications = () => {
    navigation.getParent()?.navigate('Notifications');
  };

  type StatCard = {
    key: string;
    title: string;
    value: string | number;
    icon: React.ReactNode;
  };

  const displayName = profile?.firstName || profile?.lastName
    ? `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
    : profile?.username || 'Perfil';

  const accountLabel = user?.userType === 'SELLER' ? 'Vendedor' : 'Cliente';

  const statCards: StatCard[] = (
    [
      stats.totalProducts !== undefined && {
        key: 'products',
        title: 'Productos',
        value: stats.totalProducts,
        icon: <MaterialIcons name="inventory-2" size={18} color="#34C759" />,
      },
      stats.totalOrders !== undefined && {
        key: 'orders',
        title: 'Órdenes',
        value: stats.totalOrders,
        icon: <Ionicons name="cart-outline" size={18} color="#34C759" />,
      },
      stats.totalSales !== undefined && {
        key: 'sales',
        title: 'Ventas',
        value: stats.totalSales || 0,
        icon: <Ionicons name="trending-up-outline" size={18} color="#34C759" />,
      },
      stats.totalRevenue !== undefined && {
        key: 'revenue',
        title: 'Ingresos',
        value: formatCurrencyShort(stats.totalRevenue || 0),
        icon: <Ionicons name="cash-outline" size={18} color="#34C759" />,
      },
    ] as (StatCard | null)[]
  ).filter((item): item is StatCard => Boolean(item));

  const renderMenuButton = (title: string, icon: React.ReactNode, onPress: () => void, showArrow: boolean = true) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.menuButtonLeft}>
        <View style={styles.menuIconContainer}>{icon}</View>
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
      {showArrow && <Ionicons name="chevron-forward" size={18} color="#8b8fa1" />}
    </TouchableOpacity>
  );

  type ContactItem = {
    key: string;
    icon: React.ReactNode;
    text: string;
  };

  const contactItems: ContactItem[] = (
    [
      profile?.phone && {
        key: 'phone',
        icon: <Ionicons name="call" size={18} color="#34C759" style={styles.contactIcon} />,
        text: profile.phone,
      },
      profile?.whatsapp && {
        key: 'whatsapp',
        icon: <FontAwesome5 name="whatsapp" size={18} color="#25D366" style={styles.contactIcon} />,
        text: profile.whatsapp,
      },
      profile?.instagram && {
        key: 'instagram',
        icon: <FontAwesome5 name="instagram" size={18} color="#E4405F" style={styles.contactIcon} />,
        text: `@${profile.instagram}`,
      },
    ] as (ContactItem | null)[]
  ).filter((item): item is ContactItem => Boolean(item));

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
      })
    : 'Sin fecha';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#34C759"
          colors={["#34C759"]}
        />
      }
    >
      <LinearGradient
        colors={['#34C759', '#30B350']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.greeting}>Hola, {displayName}</Text>
            <Text style={styles.headerSubtitleText}>Gestiona tu experiencia en Marketplace</Text>
          </View>
          <View style={styles.accountBadge}>
            <MaterialIcons
              name={user?.userType === 'SELLER' ? 'storefront' : 'person'}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.accountBadgeText}>{accountLabel}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <Image
              source={{ uri: profile?.avatar || 'https://via.placeholder.com/160' }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarButton} onPress={handleEditProfile}>
              <Ionicons name="camera" size={18} color="#0a0a0f" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileUsername}>@{profile?.username}</Text>
          {profile?.companyName && (
            <View style={styles.companyChip}>
              <MaterialIcons name="business" size={14} color="#34C759" />
              <Text style={styles.companyChipText}>{profile.companyName}</Text>
            </View>
          )}
          <View style={styles.profileMetaRow}>
            <Ionicons name="calendar-outline" size={14} color="#8b8fa1" />
            <Text style={styles.profileMetaText}>
              Miembro desde {memberSince}
            </Text>
          </View>
          {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={18} color="#0a0a0f" />
            <Text style={styles.editButtonText}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        {statCards.length > 0 && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Resumen</Text>
            <View style={styles.statsGrid}>
              {statCards.map((card) => (
                <View key={card.key} style={styles.statCard}>
                  <View style={styles.statIconWrapper}>{card.icon}</View>
                  <Text style={styles.statValue}>{card.value}</Text>
                  <Text style={styles.statTitle}>{card.title}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {user?.userType === 'SELLER' && (
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Acciones rápidas</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.getParent()?.navigate('SellerOrders')}
                activeOpacity={0.85}
              >
                <MaterialIcons name="assignment" size={22} color="#34C759" />
                <Text style={styles.quickActionText}>Mis órdenes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.getParent()?.navigate('SellerProducts')}
                activeOpacity={0.85}
              >
                <MaterialIcons name="inventory" size={22} color="#34C759" />
                <Text style={styles.quickActionText}>Mis productos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={handleNotifications}
                activeOpacity={0.85}
              >
                <Ionicons name="notifications" size={22} color="#34C759" />
                <Text style={styles.quickActionText}>Notificaciones</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {contactItems.length > 0 && (
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Información de contacto</Text>
            <View style={styles.cardPanel}>
              {contactItems.map((item, index) => (
                <View
                  key={item.key}
                  style={[
                    styles.contactItem,
                    index === contactItems.length - 1 && styles.contactItemLast,
                  ]}
                >
                  {item.icon}
                  <Text style={styles.contactText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          <View style={styles.cardPanel}>
            {renderMenuButton('Notificaciones', <Ionicons name="notifications" size={22} color="#34C759" />, handleNotifications)}
            {renderMenuButton('Prueba notificaciones', <Ionicons name="flask" size={22} color="#34C759" />, () => navigation.navigate('TestNotifications'))}
            {renderMenuButton('Configuración', <Ionicons name="settings" size={22} color="#34C759" />, handleSettings)}
            {renderMenuButton('Ayuda y soporte', <Ionicons name="help-circle" size={22} color="#34C759" />, () => Alert.alert('Ayuda', 'Soporte próximamente'))}
            {renderMenuButton('Acerca de', <Ionicons name="information-circle" size={22} color="#34C759" />, () => Alert.alert('Acerca de', 'Marketplace v1.0'))}
          </View>
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
            <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Marketplace • {accountLabel}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
  },
  loadingText: {
    fontSize: 15,
    color: '#8b8fa1',
    marginTop: 12,
  },
  headerGradient: {
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
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 16,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitleText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginTop: 8,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  accountBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  profileCard: {
    backgroundColor: '#151527',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 24,
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#34C759',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#34C759',
    borderRadius: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0a0a0f',
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  profileUsername: {
    color: '#8b8fa1',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  companyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52,199,89,0.15)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
  },
  companyChipText: {
    color: '#34C759',
    fontSize: 13,
    fontWeight: '600',
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  profileMetaText: {
    color: '#8b8fa1',
    fontSize: 13,
  },
  bio: {
    fontSize: 14,
    color: '#cfd2dc',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 16,
  },
  editButton: {
    marginTop: 20,
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editButtonText: {
    color: '#0a0a0f',
    fontSize: 14,
    fontWeight: '700',
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flexBasis: '48%',
    backgroundColor: '#151527',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 12,
  },
  statIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(52,199,89,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statTitle: {
    fontSize: 12,
    color: '#8b8fa1',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  quickActionCard: {
    flexBasis: '30%',
    flexGrow: 1,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#151527',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 10,
  },
  quickActionText: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  cardSection: {
    marginBottom: 24,
  },
  cardPanel: {
    backgroundColor: '#151527',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  contactItemLast: {
    borderBottomWidth: 0,
  },
  contactIcon: {
    width: 24,
  },
  contactText: {
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
  },
  menuButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  menuButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  menuIconContainer: {
    width: 28,
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
  },
  logoutSection: {
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,59,48,0.12)',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.3)',
  },
  logoutButtonText: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#5c637d',
  },
});

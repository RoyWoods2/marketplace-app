import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import GradientButton from '../components/GradientButton';

export default function TestNotificationsScreen({ navigation }: any) {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lastTest, setLastTest] = useState<any>(null);

  const sendTestNotification = async () => {
    if (!user || !token) {
      Alert.alert('Error', 'Debes estar autenticado para probar notificaciones');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/push-notifications/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setLastTest({
          success: true,
          timestamp: new Date().toLocaleString(),
          ...data,
        });
        Alert.alert(
          '✅ Notificación Enviada',
          'Deberías recibir una notificación push en tu dispositivo en unos segundos.',
          [{ text: 'OK' }]
        );
      } else {
        setLastTest({
          success: false,
          timestamp: new Date().toLocaleString(),
          error: data.error,
        });
        Alert.alert('Error', data.error || 'No se pudo enviar la notificación');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setLastTest({
        success: false,
        timestamp: new Date().toLocaleString(),
        error: 'Error de conexión',
      });
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const sendCustomNotification = async () => {
    if (!user || !token) {
      Alert.alert('Error', 'Debes estar autenticado');
      return;
    }

    Alert.prompt(
      'Notificación Personalizada',
      'Ingresa el título de la notificación:',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Enviar',
          onPress: async (title) => {
            if (!title) return;

            Alert.prompt(
              'Mensaje',
              'Ingresa el mensaje de la notificación:',
              [
                {
                  text: 'Cancelar',
                  style: 'cancel',
                },
                {
                  text: 'Enviar',
                  onPress: async (body) => {
                    if (!body) return;

                    setLoading(true);
                    try {
                      const response = await fetch(`${API_BASE_URL}/api/push-notifications/send`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          userId: user.id,
                          title: title,
                          body: body,
                          data: {
                            type: 'CUSTOM_TEST',
                            timestamp: new Date().toISOString(),
                          },
                        }),
                      });

                      const data = await response.json();

                      if (response.ok) {
                        Alert.alert('✅ Notificación Enviada', 'La notificación personalizada fue enviada.');
                      } else {
                        Alert.alert('Error', data.error || 'No se pudo enviar');
                      }
                    } catch (error) {
                      Alert.alert('Error', 'Error de conexión');
                    } finally {
                      setLoading(false);
                    }
                  },
                },
              ],
              'plain-text'
            );
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🧪 Prueba de Notificaciones</Text>
          <Text style={styles.subtitle}>
            Prueba las notificaciones push en tiempo real
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Información</Text>
          <Text style={styles.infoText}>
            • Asegúrate de que las notificaciones estén habilitadas en tu dispositivo
          </Text>
          <Text style={styles.infoText}>
            • Las notificaciones funcionan mejor en dispositivos físicos
          </Text>
          <Text style={styles.infoText}>
            • Si no recibes notificaciones, verifica que tu token esté registrado
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userLabel}>Usuario:</Text>
          <Text style={styles.userValue}>
            {user?.firstName} {user?.lastName} ({user?.email})
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <GradientButton
            title={loading ? 'Enviando...' : '📱 Enviar Notificación de Prueba'}
            onPress={sendTestNotification}
            loading={loading}
            gradient={['#667eea', '#764ba2']}
            style={styles.button}
          />

          <GradientButton
            title="✏️ Enviar Notificación Personalizada"
            onPress={sendCustomNotification}
            loading={false}
            gradient={['#f093fb', '#f5576c']}
            style={styles.button}
          />
        </View>

        {lastTest && (
          <View style={[styles.resultCard, lastTest.success && styles.resultCardSuccess]}>
            <Text style={styles.resultTitle}>
              {lastTest.success ? '✅ Última Prueba Exitosa' : '❌ Última Prueba Fallida'}
            </Text>
            <Text style={styles.resultText}>
              Fecha: {lastTest.timestamp}
            </Text>
            {lastTest.success && (
              <>
                <Text style={styles.resultText}>
                  Título: {lastTest.title}
                </Text>
                <Text style={styles.resultText}>
                  Mensaje: {lastTest.body}
                </Text>
              </>
            )}
            {lastTest.error && (
              <Text style={[styles.resultText, styles.errorText]}>
                Error: {lastTest.error}
              </Text>
            )}
          </View>
        )}

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips para Pruebas</Text>
          <Text style={styles.tipsText}>
            1. Minimiza la app y envía una notificación para probar en segundo plano
          </Text>
          <Text style={styles.tipsText}>
            2. Prueba tocando la notificación para ver la navegación
          </Text>
          <Text style={styles.tipsText}>
            3. Verifica que el token esté registrado en el backend
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#bbb',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#ddd',
    marginBottom: 8,
    lineHeight: 20,
  },
  userInfo: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  userLabel: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 4,
  },
  userValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 20,
  },
  button: {
    marginBottom: 0,
  },
  resultCard: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.5)',
  },
  resultCardSuccess: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    borderColor: 'rgba(52, 199, 89, 0.5)',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    color: '#ddd',
    marginBottom: 4,
  },
  errorText: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 8,
    lineHeight: 20,
  },
});


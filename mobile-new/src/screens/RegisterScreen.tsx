import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GradientButton from '../components/GradientButton';
import { API_URL } from '../config/api';

export default function RegisterScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    username: '',
    userType: 'BUYER' as 'BUYER' | 'SELLER',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Contraseña requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.firstName) newErrors.firstName = 'Nombre requerido';
    if (!formData.lastName) newErrors.lastName = 'Apellido requerido';
    if (!formData.username) newErrors.username = 'Usuario requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        Alert.alert(
          'Éxito',
          'Cuenta creada exitosamente. Por favor inicia sesión.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Error al registrarse');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#f093fb', '#f5576c']}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.icon}>📝</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a nuestro marketplace</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.form,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* User Type Selection */}
            <View style={styles.userTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  formData.userType === 'BUYER' && styles.userTypeButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, userType: 'BUYER' })}
              >
                <Text
                  style={[
                    styles.userTypeText,
                    formData.userType === 'BUYER' && styles.userTypeTextActive,
                  ]}
                >
                  🛒 Comprador
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  formData.userType === 'SELLER' && styles.userTypeButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, userType: 'SELLER' })}
              >
                <Text
                  style={[
                    styles.userTypeText,
                    formData.userType === 'SELLER' && styles.userTypeTextActive,
                  ]}
                >
                  🏪 Vendedor
                </Text>
              </TouchableOpacity>
            </View>

            {/* Personal Info */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>👤 Nombre</Text>
              <TextInput
                style={[styles.input, errors.firstName && styles.inputError]}
                placeholder="Tu nombre"
                placeholderTextColor="#888"
                value={formData.firstName}
                onChangeText={(value) => updateField('firstName', value)}
              />
              {errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>👤 Apellido</Text>
              <TextInput
                style={[styles.input, errors.lastName && styles.inputError]}
                placeholder="Tu apellido"
                placeholderTextColor="#888"
                value={formData.lastName}
                onChangeText={(value) => updateField('lastName', value)}
              />
              {errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>@️ Usuario</Text>
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                placeholder="nombre_usuario"
                placeholderTextColor="#888"
                value={formData.username}
                onChangeText={(value) => updateField('username', value)}
                autoCapitalize="none"
              />
              {errors.username && (
                <Text style={styles.errorText}>{errors.username}</Text>
              )}
            </View>

            {/* Account Info */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>📧 Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="tu@email.com"
                placeholderTextColor="#888"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>🔒 Contraseña</Text>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor="#888"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>🔒 Confirmar Contraseña</Text>
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor="#888"
                value={formData.confirmPassword}
                onChangeText={(value) => updateField('confirmPassword', value)}
                secureTextEntry
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            <GradientButton
              title="Crear Cuenta"
              onPress={handleRegister}
              loading={loading}
              gradient={['#f093fb', '#f5576c']}
              style={styles.registerButton}
            />

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.linkText}>
                ¿Ya tienes cuenta?{' '}
                <Text style={styles.linkTextBold}>Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f5576c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#bbb',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  userTypeContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  userTypeButtonActive: {
    borderColor: '#f5576c',
    backgroundColor: 'rgba(245, 87, 108, 0.2)',
  },
  userTypeText: {
    color: '#bbb',
    fontSize: 16,
    fontWeight: '600',
  },
  userTypeTextActive: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  registerButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    color: '#bbb',
    fontSize: 15,
  },
  linkTextBold: {
    color: '#f5576c',
    fontWeight: 'bold',
  },
});

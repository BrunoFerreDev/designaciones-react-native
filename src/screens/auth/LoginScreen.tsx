import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { scaleFont } from "../../utils/responsive";
import tw from "../../theme/tailwind";

export default function LoginScreen() {
  const { login } = useAuth();
  const [whatsapp, setWhatsapp] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!whatsapp.trim() || !contrasenia.trim()) {
      Alert.alert("Campos requeridos", "Ingresá número y contraseña");
      return;
    }
    setLoading(true);
    try {
      await login({ whatsapp: whatsapp.trim(), contrasenia });
    } catch (error: any) {
      console.error(
        "Error login:",
        error?.response?.status,
        error?.response?.data,
        error?.message,
      );
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Error al conectar";
      Alert.alert("Error", serverMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Árbitros</Text>
      <Text style={styles.subtitle}>Iniciar sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Número WhatsApp"
        keyboardType="phone-pad"
        value={whatsapp}
        onChangeText={setWhatsapp}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={contrasenia}
        onChangeText={setContrasenia}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Ingresar</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: scaleFont(24),
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: scaleFont(28),
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: scaleFont(14),
    color: "#64748b",
    textAlign: "center",
    marginBottom: scaleFont(28),
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: scaleFont(14),
    fontSize: scaleFont(14),
    marginBottom: scaleFont(14),
    borderWidth: 1,
    borderColor: "#cbd5e1",
    color: "#0f172a",
  },
  button: {
    backgroundColor: "#1a1a2e",
    borderRadius: 10,
    padding: scaleFont(14),
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: scaleFont(15), fontWeight: "700" },
});

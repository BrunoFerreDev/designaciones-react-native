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
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Rect, Circle, G } from "react-native-svg";
import { useAuth } from "../../context/AuthContext";
import { scaleFont } from "../../utils/responsive";
import LoginBackground from "../../components/common/LoginBackground";

function WhistleIcon() {
  return (
    <Svg width={scaleFont(48)} height={scaleFont(26)} viewBox="-100 -36 220 72">
      <G fill="#ffffff">
        <Rect x="-90" y="-24" width="140" height="48" rx="24" />
        <Circle cx="80" cy="0" r="34" />
        <Rect x="42" y="-7" width="30" height="14" />
        <Circle cx="80" cy="0" r="15" fill="#0c231a" />
      </G>
    </Svg>
  );
}

export default function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
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
    <View style={styles.root}>
      <StatusBar style="light" />
      <LoginBackground />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(scaleFont(20), insets.top + scaleFont(12)),
              paddingBottom: Math.max(scaleFont(20), insets.bottom + scaleFont(12)),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.card}>
            {/* Encabezado institucional */}
            <View style={styles.header}>
              <View style={styles.whistleBadge}>
                <WhistleIcon />
              </View>

              <Text style={styles.titleMain}>CÍRCULO DE ÁRBITROS</Text>
              <Text style={styles.titleSub}>DE JARDÍN AMÉRICA</Text>
              <View style={styles.divider} />
            </View>

            {/* Subtítulo de acción */}
            <Text style={styles.subtitle}>Iniciar sesión</Text>

            {/* Inputs de acceso */}
            <TextInput
              style={styles.input}
              placeholder="Número WhatsApp"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={whatsapp}
              onChangeText={setWhatsapp}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={contrasenia}
              onChangeText={setContrasenia}
            />

            {/* Botón de ingreso */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#0c231a" />
              ) : (
                <Text style={styles.buttonText}>Ingresar</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#040e0b",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scaleFont(20),
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgba(5, 18, 13, 0.82)",
    borderRadius: 22,
    paddingHorizontal: scaleFont(22),
    paddingVertical: scaleFont(26),
    borderWidth: 1,
    borderColor: "rgba(244, 196, 48, 0.22)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: scaleFont(16),
  },
  whistleBadge: {
    width: scaleFont(60),
    height: scaleFont(60),
    borderRadius: scaleFont(30),
    backgroundColor: "rgba(244, 196, 48, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(244, 196, 48, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scaleFont(12),
  },
  titleMain: {
    fontSize: scaleFont(21),
    fontWeight: "800",
    color: "#f4c430",
    textAlign: "center",
    letterSpacing: 1.2,
  },
  titleSub: {
    fontSize: scaleFont(19),
    fontWeight: "800",
    color: "#f4c430",
    textAlign: "center",
    letterSpacing: 1.2,
    marginTop: 2,
  },
  divider: {
    width: scaleFont(80),
    height: 3,
    backgroundColor: "#f4c430",
    borderRadius: 2,
    marginTop: scaleFont(10),
  },
  subtitle: {
    fontSize: scaleFont(15),
    fontWeight: "600",
    color: "#cbd5e1",
    textAlign: "center",
    marginBottom: scaleFont(18),
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: scaleFont(16),
    paddingVertical: scaleFont(14),
    fontSize: scaleFont(15),
    marginBottom: scaleFont(14),
    borderWidth: 1,
    borderColor: "#cbd5e1",
    color: "#0f172a",
  },
  button: {
    backgroundColor: "#f4c430",
    borderRadius: 12,
    paddingVertical: scaleFont(15),
    alignItems: "center",
    marginTop: scaleFont(4),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: "#0c231a",
    fontSize: scaleFont(16),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Switch,
  Modal,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { arbitroService } from "../../services/arbitroService";
import { GetArbitroDTO, EstadoCuentaArbitroDTO } from "../../types";
import { scaleFont } from "../../utils/responsive";
import tw from "../../theme/tailwind";

export default function PerfilScreen() {
  const { arbitro: authArbitro, logout } = useAuth();
  const navigation = useNavigation();

  const [perfil, setPerfil] = useState<GetArbitroDTO | null>(null);
  const [estadoCuenta, setEstadoCuenta] =
    useState<EstadoCuentaArbitroDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal cambio contraseña
  const [modalPassVisible, setModalPassVisible] = useState(false);
  const [passActual, setPassActual] = useState("");
  const [passNueva, setPassNueva] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  // Disponibilidad local
  const [dispSabado, setDispSabado] = useState(false);
  const [dispDomingo, setDispDomingo] = useState(false);
  const [savingDisp, setSavingDisp] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [p, ec] = await Promise.allSettled([
        arbitroService.getMe(),
        arbitroService.getEstadoCuenta(),
      ]);

      if (p.status === "fulfilled" && p.value) {
        setPerfil(p.value);
        setDispSabado(p.value.disponibleSabado);
        setDispDomingo(p.value.disponibleDomingo);
      }
      if (ec.status === "fulfilled" && ec.value) {
        setEstadoCuenta(ec.value);
      }
    } catch (e: any) {
      console.warn("Error cargando perfil:", e);
    }
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleToggleDisp(dia: "sabado" | "domingo", valor: boolean) {
    const sab = dia === "sabado" ? valor : dispSabado;
    const dom = dia === "domingo" ? valor : dispDomingo;

    setSavingDisp(true);
    try {
      const updated = await arbitroService.updateDisponibilidad(sab, dom);
      setDispSabado(updated.disponibleSabado);
      setDispDomingo(updated.disponibleDomingo);
      setPerfil(updated);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e.message ||
        "Error al guardar disponibilidad";
      Alert.alert("Error", msg);
    } finally {
      setSavingDisp(false);
    }
  }

  async function handleChangePassword() {
    if (!passActual.trim() || !passNueva.trim()) {
      Alert.alert("Error", "Completá contraseña actual y nueva contraseña");
      return;
    }
    if (passNueva.length < 6) {
      Alert.alert(
        "Error",
        "La nueva contraseña debe tener al menos 6 caracteres",
      );
      return;
    }

    setPassLoading(true);
    try {
      await arbitroService.cambiarContrasenia({
        contraseniaActual: passActual,
        nuevaContrasenia: passNueva,
      });
      Alert.alert("Éxito", "Contraseña actualizada correctamente");
      setModalPassVisible(false);
      setPassActual("");
      setPassNueva("");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e.message ||
        "Error al cambiar contraseña";
      Alert.alert("Error", msg);
    } finally {
      setPassLoading(false);
    }
  }

  const nombreCompleto = perfil
    ? `${perfil.nombre} ${perfil.apellido}`
    : authArbitro?.nombreCompleto || "Usuario";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Top Header con Back */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.btnBack}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnBackText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity style={styles.btnLogout} onPress={logout}>
          <Text style={styles.btnLogoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#1a1a2e"
          style={{ marginTop: 40 }}
        />
      ) : (
        <>
          {/* Card Principal de Identidad */}
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {nombreCompleto.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{nombreCompleto}</Text>
              <Text style={styles.userPhone}>
                📱 {perfil?.whatsapp || authArbitro?.username}
              </Text>
              <Text style={styles.userCategory}>
                Categoría: {perfil?.categoria || "Sin categoría"}
              </Text>
            </View>
          </View>

          {/* Roles */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Roles Asignados</Text>
            <View style={styles.rolesRow}>
              {(perfil?.roles || authArbitro?.roles || []).map((rol) => (
                <View key={rol} style={styles.roleChip}>
                  <Text style={styles.roleText}>{rol}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Ficha Técnica y Equipamiento */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Equipamiento y Logística</Text>
            <View style={styles.rowDetail}>
              <Text style={styles.detailLabel}>Talle Camiseta:</Text>
              <Text style={styles.detailValue}>
                {perfil?.talleCamiseta || "No definido"}
              </Text>
            </View>
            <View style={styles.rowDetail}>
              <Text style={styles.detailLabel}>Talle Short:</Text>
              <Text style={styles.detailValue}>
                {perfil?.talleShort || "No definido"}
              </Text>
            </View>
            <View style={styles.rowDetail}>
              <Text style={styles.detailLabel}>
                Dispone de Auto / Movilidad:
              </Text>
              <Text style={styles.detailValue}>
                {perfil?.tieneAuto ? "✅ Sí" : "❌ No"}
              </Text>
            </View>
          </View>

          {/* Disponibilidad Fin de Semana */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>
                Mi Disponibilidad Fin de Semana
              </Text>
              {savingDisp && <ActivityIndicator size="small" color="#1a1a2e" />}
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchTitle}>Sábado</Text>
                <Text style={styles.switchSub}>
                  {dispSabado ? "Disponible para dirigir" : "No disponible"}
                </Text>
              </View>
              <Switch
                value={dispSabado}
                onValueChange={(val) => handleToggleDisp("sabado", val)}
                trackColor={{ false: "#d1d5db", true: "#27ae60" }}
              />
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchTitle}>Domingo</Text>
                <Text style={styles.switchSub}>
                  {dispDomingo ? "Disponible para dirigir" : "No disponible"}
                </Text>
              </View>
              <Switch
                value={dispDomingo}
                onValueChange={(val) => handleToggleDisp("domingo", val)}
                trackColor={{ false: "#d1d5db", true: "#27ae60" }}
              />
            </View>
          </View>

          {/* Estado de Cuenta */}
          {estadoCuenta && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Estado de Cuenta</Text>
              <View style={styles.rowDetail}>
                <Text style={styles.detailLabel}>Deuda Préstamos:</Text>
                <Text
                  style={[
                    styles.detailValue,
                    {
                      color:
                        estadoCuenta.totalDeudaPrestamos > 0
                          ? "#e74c3c"
                          : "#27ae60",
                    },
                  ]}
                >
                  ${estadoCuenta.totalDeudaPrestamos}
                </Text>
              </View>
              <View style={styles.rowDetail}>
                <Text style={styles.detailLabel}>Préstamos Activos:</Text>
                <Text style={styles.detailValue}>
                  {estadoCuenta.prestamosActivosCount}
                </Text>
              </View>
              <View style={styles.rowDetail}>
                <Text style={styles.detailLabel}>Gastos por Recuperar:</Text>
                <Text style={styles.detailValue}>
                  ${estadoCuenta.totalGastosConRecuperoPendientes}
                </Text>
              </View>
            </View>
          )}

          {/* Seguridad y Cuenta */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Seguridad</Text>
            <TouchableOpacity
              style={styles.btnPassword}
              onPress={() => setModalPassVisible(true)}
            >
              <Text style={styles.btnPasswordText} numberOfLines={1}>
                🔒 Cambiar Contraseña
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Modal Cambiar Contraseña */}
      <Modal visible={modalPassVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Cambiar Contraseña</Text>

            <Text style={styles.label}>Contraseña Actual *</Text>
            <TextInput
              style={styles.input}
              value={passActual}
              onChangeText={setPassActual}
              secureTextEntry
              placeholder="Ingresá contraseña actual"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>
              Nueva Contraseña (mínimo 6 chars) *
            </Text>
            <TextInput
              style={styles.input}
              value={passNueva}
              onChangeText={setPassNueva}
              secureTextEntry
              placeholder="Ingresá nueva contraseña"
              placeholderTextColor="#999"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.btnCancel]}
                onPress={() => setModalPassVisible(false)}
                disabled={passLoading}
              >
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.btnSave]}
                onPress={handleChangePassword}
                disabled={passLoading}
              >
                {passLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnSaveText}>Actualizar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: {
    padding: scaleFont(16),
    paddingTop: scaleFont(38),
    paddingBottom: scaleFont(44),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scaleFont(16),
  },
  btnBack: {
    paddingVertical: scaleFont(6),
    paddingHorizontal: scaleFont(10),
    borderRadius: 8,
    backgroundColor: "#e2e8f0",
  },
  btnBackText: { fontSize: scaleFont(12), fontWeight: "700", color: "#334155" },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: "bold",
    color: "#0f172a",
  },
  btnLogout: {
    paddingVertical: scaleFont(6),
    paddingHorizontal: scaleFont(12),
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  btnLogoutText: {
    fontSize: scaleFont(12),
    color: "#ef4444",
    fontWeight: "700",
  },
  userCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: scaleFont(16),
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scaleFont(14),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 1,
  },
  avatar: {
    width: scaleFont(52),
    height: scaleFont(52),
    borderRadius: scaleFont(26),
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scaleFont(14),
  },
  avatarText: { color: "#fff", fontSize: scaleFont(22), fontWeight: "bold" },
  userName: { fontSize: scaleFont(17), fontWeight: "bold", color: "#0f172a" },
  userPhone: { fontSize: scaleFont(12), color: "#64748b", marginTop: 2 },
  userCategory: {
    fontSize: scaleFont(12),
    fontWeight: "600",
    color: "#3b82f6",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: scaleFont(16),
    marginBottom: scaleFont(12),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: scaleFont(14),
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 10,
  },
  rolesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  roleChip: {
    backgroundColor: "#e2e8f0",
    borderRadius: 6,
    paddingHorizontal: scaleFont(10),
    paddingVertical: 4,
  },
  roleText: { fontSize: scaleFont(11), fontWeight: "700", color: "#334155" },
  rowDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: scaleFont(6),
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  detailLabel: { fontSize: scaleFont(12), color: "#64748b" },
  detailValue: { fontSize: scaleFont(12), fontWeight: "700", color: "#0f172a" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scaleFont(10),
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  switchTitle: { fontSize: scaleFont(13), fontWeight: "700", color: "#0f172a" },
  switchSub: { fontSize: scaleFont(11), color: "#64748b", marginTop: 2 },
  btnPassword: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingVertical: scaleFont(12),
    alignItems: "center",
    marginTop: 4,
  },
  btnPasswordText: {
    fontSize: scaleFont(13),
    minWidth: scaleFont(180),
    fontWeight: "700",
    color: "#0f172a",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: scaleFont(20),
    width: "100%",
    maxWidth: 400,
    elevation: 5,
  },
  modalTitle: {
    fontSize: scaleFont(18),
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 14,
  },
  label: {
    fontSize: scaleFont(12),
    fontWeight: "700",
    color: "#475569",
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: scaleFont(12),
    paddingVertical: scaleFont(10),
    fontSize: scaleFont(14),
    color: "#0f172a",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },
  modalBtn: {
    paddingVertical: scaleFont(10),
    paddingHorizontal: scaleFont(16),
    borderRadius: 8,
    minWidth: 90,
    alignItems: "center",
  },
  btnCancel: { backgroundColor: "#e2e8f0" },
  btnCancelText: { color: "#475569", fontWeight: "bold" },
  btnSave: { backgroundColor: "#1a1a2e" },
  btnSaveText: { color: "#fff", fontWeight: "bold" },
});

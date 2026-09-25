import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { designacionService } from "../../services/designacionService";
import { arbitroService } from "../../services/arbitroService";
import { suspensionService } from "../../services/suspensionService";
import { GetDesignacionDTO } from "../../types";
import { RootStackParamList } from "../../navigation/AppNavigator";
import DesignacionModal from "../../components/modals/DesignacionModal";
import ArbitroModal from "../../components/modals/ArbitroModal";
import SuspensionModal from "../../components/modals/SuspensionModal";
import { scaleFont, isSmallDevice } from "../../utils/responsive";
import tw from "../../theme/tailwind";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ESTADO_LABEL: Record<number, string> = {
  0: "Pendiente",
  1: "Confirmada",
  2: "Finalizada",
  3: "Cancelada",
  4: "Suspendida",
};

const ESTADO_COLOR: Record<number, string> = {
  0: "#f39c12",
  1: "#27ae60",
  2: "#3498db",
  3: "#e74c3c",
  4: "#9b59b6",
};

export default function HomeScreen() {
  const { arbitro, logout } = useAuth();
  const navigation = useNavigation<Nav>();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // KPIs
  const [totalDes, setTotalDes] = useState(0);
  const [pendientesDes, setPendientesDes] = useState(0);
  const [confirmadasDes, setConfirmadasDes] = useState(0);
  const [dispSabado, setDispSabado] = useState(0);
  const [dispDomingo, setDispDomingo] = useState(0);
  const [suspensionesActivas, setSuspensionesActivas] = useState(0);

  // Próximas designaciones
  const [proximas, setProximas] = useState<GetDesignacionDTO[]>([]);

  // Modales
  const [modalDesVisible, setModalDesVisible] = useState(false);
  const [modalArbVisible, setModalArbVisible] = useState(false);
  const [modalSuspVisible, setModalSuspVisible] = useState(false);

  const isSuperuser = arbitro?.roles.includes("SUPERUSER");
  const isPresidente = arbitro?.roles.includes("PRESIDENTE");
  const isDesignador = arbitro?.roles.includes("DESIGNADOR") || isSuperuser;
  const isSecretario = arbitro?.roles.includes("SECRETARIO") || isSuperuser;
  const canCreateArbitro = isSuperuser || isPresidente || isSecretario;
  const canCreateSuspension =
    isSuperuser || isPresidente || isSecretario || isDesignador;

  const loadDashboardData = useCallback(async () => {
    try {
      const [resDes, resArb, resSusp] = await Promise.allSettled([
        designacionService.getDesignaciones(Boolean(isDesignador)),
        arbitroService.getArbitros(),
        suspensionService.getSuspensiones(Boolean(isDesignador)),
      ]);

      const designaciones = resDes.status === "fulfilled" ? resDes.value : [];
      const arbitros = resArb.status === "fulfilled" ? resArb.value : [];
      const suspensiones = resSusp.status === "fulfilled" ? resSusp.value : [];

      setTotalDes(designaciones.length);
      setPendientesDes(
        designaciones.filter((d) => d.estadoDesignacion === 0).length,
      );
      setConfirmadasDes(
        designaciones.filter((d) => d.estadoDesignacion === 1).length,
      );

      setDispSabado(arbitros.filter((a) => a.disponibleSabado).length);
      setDispDomingo(arbitros.filter((a) => a.disponibleDomingo).length);

      setSuspensionesActivas(suspensiones.length);

      // Próximas 4 ordenadas por fecha
      const sorted = [...designaciones].sort((a, b) =>
        b.fecha > a.fecha ? 1 : -1,
      );
      setProximas(sorted.slice(0, 4));
    } catch (e) {
      console.warn("Error cargando métricas de dashboard:", e);
    }
  }, [isDesignador]);

  useEffect(() => {
    setLoading(true);
    loadDashboardData().finally(() => setLoading(false));
  }, [loadDashboardData]);

  async function onRefresh() {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcome}>Panel de Control</Text>
          <Text style={styles.name}>
            {arbitro?.nombreCompleto || arbitro?.username}
          </Text>
          <View style={styles.rolesContainer}>
            {arbitro?.roles.map((r) => (
              <View key={r} style={styles.roleBadge}>
                <Text style={styles.roleText}>{r}</Text>
              </View>
            ))}
          </View>
        </View>
        <TouchableOpacity style={styles.btnLogout} onPress={logout}>
          <Text style={styles.btnLogoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Acciones Rápidas */}
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      <View style={styles.actionsGrid}>
        {isDesignador && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#1a1a2e" }]}
            onPress={() => setModalDesVisible(true)}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionLabel}>+ Designación</Text>
          </TouchableOpacity>
        )}

        {canCreateArbitro && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#2c3e50" }]}
            onPress={() => setModalArbVisible(true)}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionLabel}>+ Árbitro</Text>
          </TouchableOpacity>
        )}

        {canCreateSuspension && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#c0392b" }]}
            onPress={() => setModalSuspVisible(true)}
          >
            <Text style={styles.actionIcon}>⚠️</Text>
            <Text style={styles.actionLabel}>+ Suspensión</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#27ae60" }]}
          onPress={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.actionIcon}>🔄</Text>
              <Text style={styles.actionLabel}>Actualizar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Tarjetas KPI */}
      <Text style={styles.sectionTitle}>Métricas en Vivo</Text>
      {loading ? (
        <ActivityIndicator
          style={{ marginVertical: 30 }}
          size="large"
          color="#1a1a2e"
        />
      ) : (
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>{totalDes}</Text>
            <Text style={styles.kpiLabel}>Designaciones</Text>
            <Text style={styles.kpiSub}>
              {confirmadasDes} confirmadas · {pendientesDes} pend.
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={[styles.kpiNumber, { color: "#27ae60" }]}>
              {dispSabado} / {dispDomingo}
            </Text>
            <Text style={styles.kpiLabel}>Disponibles Finde</Text>
            <Text style={styles.kpiSub}>Sábado / Domingo</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={[styles.kpiNumber, { color: "#e74c3c" }]}>
              {suspensionesActivas}
            </Text>
            <Text style={styles.kpiLabel}>Sanciones / Susp.</Text>
            <Text style={styles.kpiSub}>Registros activos</Text>
          </View>

          <TouchableOpacity
            style={[styles.kpiCard, styles.kpiCardProfile]}
            onPress={() => navigation.navigate("Perfil")}
            activeOpacity={0.8}
          >
            <View style={styles.profileCardTop}>
              <Text style={styles.profileIcon}>👤</Text>
              <View style={styles.badgeProfile}>
                <Text style={styles.badgeProfileText}>Ver Perfil →</Text>
              </View>
            </View>
            <Text style={styles.kpiLabel}>Mi Perfil</Text>
            <Text style={styles.kpiSub} numberOfLines={1}>
              {arbitro?.nombreCompleto || "Configuración y cuenta"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Próximas Designaciones */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Últimas Jornadas</Text>
        <TouchableOpacity onPress={() => (navigation as any).navigate('Designaciones')}>
          <Text style={styles.linkText}>Ver todas →</Text>
        </TouchableOpacity>
      </View>

      {proximas.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No hay designaciones registradas</Text>
          {isDesignador && (
            <TouchableOpacity
              style={styles.btnCrearEmpty}
              onPress={() => setModalDesVisible(true)}
            >
              <Text style={styles.btnCrearEmptyText}>+ Crear la primera</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        proximas.map((item) => {
          const fechaStr = new Date(item.fecha).toLocaleDateString("es-AR", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
          });
          const canchaNombre = item.cancha?.nombreCancha || "Predio s/n";
          return (
            <TouchableOpacity
              key={item.idDesignacion}
              style={styles.proximaCard}
              onPress={() =>
                navigation.navigate("DesignacionDetalle", {
                  idDesignacion: item.idDesignacion,
                })
              }
            >
              <View style={styles.proximaHeader}>
                <Text style={styles.proximaCancha}>{canchaNombre}</Text>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        ESTADO_COLOR[item.estadoDesignacion] || "#888",
                    },
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {ESTADO_LABEL[item.estadoDesignacion] || "Pendiente"}
                  </Text>
                </View>
              </View>
              <Text style={styles.proximaSub}>
                📅 {fechaStr} · {item.cantidadPartidos} partido(s)
              </Text>
            </TouchableOpacity>
          );
        })
      )}

      {/* Modales */}
      <DesignacionModal
        visible={modalDesVisible}
        onClose={() => setModalDesVisible(false)}
        onSaved={loadDashboardData}
      />
      <ArbitroModal
        visible={modalArbVisible}
        onClose={() => setModalArbVisible(false)}
        onSaved={loadDashboardData}
      />
      <SuspensionModal
        visible={modalSuspVisible}
        onClose={() => setModalSuspVisible(false)}
        onSaved={loadDashboardData}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: {
    padding: scaleFont(16),
    paddingTop: scaleFont(36),
    paddingBottom: scaleFont(36),
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: scaleFont(20),
  },
  welcome: {
    fontSize: scaleFont(12),
    color: "#64748b",
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  name: {
    fontSize: scaleFont(22),
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 2,
  },
  rolesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  roleBadge: {
    backgroundColor: "#e2e8f0",
    borderRadius: 6,
    paddingHorizontal: scaleFont(8),
    paddingVertical: 2,
  },
  roleText: { fontSize: scaleFont(11), fontWeight: "700", color: "#334155" },
  btnLogout: {
    backgroundColor: "#fff",
    paddingVertical: scaleFont(6),
    paddingHorizontal: scaleFont(12),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  btnLogoutText: {
    fontSize: scaleFont(12),
    color: "#ef4444",
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  linkText: { fontSize: scaleFont(13), color: "#3b82f6", fontWeight: "700" },
  actionsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  actionBtn: {
    flex: 1,
    minWidth: isSmallDevice ? 90 : 100,
    paddingVertical: scaleFont(12),
    paddingHorizontal: scaleFont(8),
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  actionIcon: { fontSize: scaleFont(20), marginBottom: 4 },
  actionLabel: {
    color: "#fff",
    fontSize: scaleFont(11),
    fontWeight: "700",
    textAlign: "center",
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: scaleFont(12),
    elevation: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  kpiCardProfile: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
  },
  profileCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  profileIcon: { fontSize: scaleFont(22) },
  badgeProfile: {
    backgroundColor: "#1a1a2e",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeProfileText: {
    color: "#fff",
    fontSize: scaleFont(10),
    fontWeight: "700",
  },
  kpiNumber: { fontSize: scaleFont(24), fontWeight: "900", color: "#0f172a" },
  kpiLabel: {
    fontSize: scaleFont(12),
    fontWeight: "700",
    color: "#334155",
    marginTop: 2,
  },
  kpiSub: { fontSize: scaleFont(10), color: "#64748b", marginTop: 4 },
  proximaCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: scaleFont(12),
    marginBottom: 10,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  proximaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  proximaCancha: {
    fontSize: scaleFont(14),
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: scaleFont(8),
    paddingVertical: 3,
  },
  badgeText: { color: "#fff", fontSize: scaleFont(11), fontWeight: "700" },
  proximaSub: { fontSize: scaleFont(12), color: "#64748b" },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: scaleFont(20),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyText: { color: "#94a3b8", fontSize: scaleFont(13), marginBottom: 12 },
  btnCrearEmpty: {
    backgroundColor: "#1a1a2e",
    paddingVertical: scaleFont(8),
    paddingHorizontal: scaleFont(16),
    borderRadius: 8,
  },
  btnCrearEmptyText: {
    color: "#fff",
    fontSize: scaleFont(12),
    fontWeight: "700",
  },
});

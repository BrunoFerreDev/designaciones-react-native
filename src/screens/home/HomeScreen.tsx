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
import { Ionicons } from "@expo/vector-icons";
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
import tw, { twFont } from "../../theme/tailwind";

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
  const {
    arbitro,
    logout,
    isFullAdmin,
    isDesignador,
    canManageDesignaciones,
    canManageArbitros,
    canManageSuspensiones,
  } = useAuth();
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

  const canCreateArbitro = canManageArbitros;
  const canCreateSuspension = canManageSuspensiones;

  const loadDashboardData = useCallback(async () => {
    try {
      const [resDes, resArb, resSusp] = await Promise.allSettled([
        designacionService.getDesignaciones(Boolean(canManageDesignaciones)),
        canManageArbitros ? arbitroService.getArbitros() : Promise.resolve([]),
        canManageSuspensiones
          ? suspensionService.getSuspensiones(true)
          : Promise.resolve([]),
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
      <View style={tw`flex-row items-start justify-between mb-5 w-full p-2`}>
        <View style={tw`flex-1 min-w-0 mr-3`}>
          <Text
            numberOfLines={1}
            style={twFont(
              "text-xs uppercase font-bold text-slate-500 tracking-wide",
            )}
          >
            Panel de Control
          </Text>
          <Text
            numberOfLines={1}
            style={twFont("text-xl font-extrabold text-slate-900 mt-0.5")}
          >
            {arbitro?.nombreCompleto || arbitro?.username}
          </Text>
          <View style={tw`flex-row flex-wrap gap-1.5 mt-1.5`}>
            {arbitro?.roles.map((r) => (
              <View key={r} style={styles.roleBadge}>
                <Text
                  numberOfLines={1}
                  style={twFont("text-xs font-bold text-slate-700")}
                >
                  {r}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.btnLogout,
            tw`shrink-0 min-w-[66px] items-center justify-center`,
          ]}
          onPress={logout}
        >
          <Text
            numberOfLines={1}
            style={{
              color: "#ef4444",
              fontSize: scaleFont(12),
              fontWeight: "700",
              includeFontPadding: false,
            }}
          >
            Salir
          </Text>
        </TouchableOpacity>
      </View>

      {/* Acciones Rápidas */}
      <Text style={twFont("text-base font-extrabold text-slate-900 mb-3 mt-2")}>
        Acciones Rápidas
      </Text>
      <View style={tw`flex-row gap-2 mb-5 w-full`}>
        {isDesignador && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#1a1a2e" }]}
            onPress={() => setModalDesVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={styles.actionLabel}
            >
              + Designación
            </Text>
          </TouchableOpacity>
        )}

        {canCreateArbitro && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#2c3e50" }]}
            onPress={() => setModalArbVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={styles.actionLabel}
            >
              + Árbitro
            </Text>
          </TouchableOpacity>
        )}

        {canCreateSuspension && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#c0392b" }]}
            onPress={() => setModalSuspVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>⚠️</Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={styles.actionLabel}
            >
              + Sanción
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tarjetas KPI */}
      <View style={tw`flex-row justify-between items-center mb-3 mt-2 w-full`}>
        <Text style={twFont("text-base font-extrabold text-slate-900")}>
          Métricas en Vivo
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          disabled={refreshing}
          style={tw`flex-row items-center bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200`}
          activeOpacity={0.7}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#16a34a" />
          ) : (
            <>
              <Ionicons
                name="refresh"
                size={scaleFont(13)}
                color="#16a34a"
                style={{ marginRight: 4 }}
              />
              <Text
                numberOfLines={1}
                style={{
                  color: "#16a34a",
                  fontSize: scaleFont(12),
                  fontWeight: "700",
                  minWidth: scaleFont(56),
                  includeFontPadding: false,
                }}
              >
                Actualizar
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator
          style={{ marginVertical: 30 }}
          size="large"
          color="#1a1a2e"
        />
      ) : (
        <View
          style={tw`flex-row flex-wrap justify-between gap-y-2.5 mb-5 w-full`}
        >
          {/* Tarjeta 1: Designaciones */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => (navigation as any).navigate("Designaciones")}
            activeOpacity={0.7}
          >
            <View style={styles.kpiCardTop}>
              <View
                style={[styles.kpiIconWrapper, { backgroundColor: "#eff6ff" }]}
              >
                <Ionicons
                  name="calendar"
                  size={scaleFont(15)}
                  color="#2563eb"
                />
              </View>
              <View style={[styles.kpiBadge, { backgroundColor: "#dbeafe" }]}>
                <Text
                  numberOfLines={1}
                  style={twFont("text-[10px] font-bold text-blue-700")}
                >
                  Jornadas
                </Text>
              </View>
            </View>
            <Text
              numberOfLines={1}
              style={twFont("text-xl font-black text-slate-900")}
            >
              {totalDes}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={twFont("text-xs font-bold text-slate-700 mt-0.5")}
            >
              Designaciones
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={twFont("text-[10px] font-medium text-slate-500 mt-0.5")}
            >
              {confirmadasDes} conf. · {pendientesDes} pend.
            </Text>
          </TouchableOpacity>

          {/* Tarjeta 2: Árbitros Disponibles */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() =>
              isFullAdmin && (navigation as any).navigate("Arbitros")
            }
            activeOpacity={isFullAdmin ? 0.7 : 1}
          >
            <View style={styles.kpiCardTop}>
              <View
                style={[styles.kpiIconWrapper, { backgroundColor: "#f0fdf4" }]}
              >
                <Ionicons name="people" size={scaleFont(15)} color="#16a34a" />
              </View>
              <View style={[styles.kpiBadge, { backgroundColor: "#dcfce7" }]}>
                <Text
                  numberOfLines={1}
                  style={twFont("text-[10px] font-bold text-emerald-700")}
                >
                  Finde
                </Text>
              </View>
            </View>
            <Text
              numberOfLines={1}
              style={twFont("text-xl font-black text-emerald-600")}
            >
              {dispSabado} / {dispDomingo}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={twFont("text-xs font-bold text-slate-700 mt-0.5")}
            >
              Disponibles
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={twFont("text-[10px] font-medium text-slate-500 mt-0.5")}
            >
              Sáb {dispSabado} · Dom {dispDomingo}
            </Text>
          </TouchableOpacity>

          {/* Tarjeta 3: Sanciones */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() =>
              isFullAdmin && (navigation as any).navigate("Suspensiones")
            }
            activeOpacity={isFullAdmin ? 0.7 : 1}
          >
            <View style={styles.kpiCardTop}>
              <View
                style={[styles.kpiIconWrapper, { backgroundColor: "#fef2f2" }]}
              >
                <Ionicons
                  name="alert-circle"
                  size={scaleFont(15)}
                  color="#dc2626"
                />
              </View>
              <View style={[styles.kpiBadge, { backgroundColor: "#fee2e2" }]}>
                <Text
                  numberOfLines={1}
                  style={twFont("text-[10px] font-bold text-red-700")}
                >
                  Activas
                </Text>
              </View>
            </View>
            <Text
              numberOfLines={1}
              style={twFont("text-xl font-black text-red-600")}
            >
              {suspensionesActivas}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={twFont("text-xs font-bold text-slate-700 mt-0.5")}
            >
              Sanciones
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={twFont("text-[10px] font-medium text-slate-500 mt-0.5")}
            >
              Registros vigentes
            </Text>
          </TouchableOpacity>

          {/* Tarjeta 4: Mi Perfil */}
          <TouchableOpacity
            style={[styles.kpiCard, styles.kpiCardProfile]}
            onPress={() => navigation.navigate("Perfil")}
            activeOpacity={0.7}
          >
            <View style={styles.kpiCardTop}>
              <View
                style={[styles.kpiIconWrapper, { backgroundColor: "#f1f5f9" }]}
              >
                <Ionicons name="person" size={scaleFont(15)} color="#1a1a2e" />
              </View>
              <View style={[styles.kpiBadge, { backgroundColor: "#e2e8f0" }]}>
                <Text
                  numberOfLines={1}
                  style={twFont("text-[10px] font-bold text-slate-800")}
                >
                  Cuenta
                </Text>
              </View>
            </View>
            <Text
              numberOfLines={1}
              style={twFont("text-xl font-black text-slate-900")}
            >
              {arbitro?.nombre || "Mi"}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={twFont("text-xs font-bold text-slate-700 mt-0.5")}
            >
              {arbitro?.nombreCompleto || "Mi Perfil"}
            </Text>
            <Text
              numberOfLines={1}
              style={twFont("text-[10px] font-semibold text-blue-600 mt-0.5")}
            >
              Ver detalles →
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Próximas Designaciones */}
      <View style={tw`flex-row justify-between items-center mt-3 mb-2 w-full`}>
        <Text style={twFont("text-base font-extrabold text-slate-900")}>
          Últimas Jornadas
        </Text>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate("Designaciones")}
        >
          <Text style={twFont("text-xs font-bold text-blue-600")}>
            Ver todas →
          </Text>
        </TouchableOpacity>
      </View>

      {proximas.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={twFont("text-xs text-slate-400 mb-3 text-center")}>
            No hay designaciones registradas
          </Text>
          {isDesignador && (
            <TouchableOpacity
              style={styles.btnCrearEmpty}
              onPress={() => setModalDesVisible(true)}
            >
              <Text style={twFont("text-xs font-bold text-white")}>
                + Crear la primera
              </Text>
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
              style={tw`bg-white rounded-xl p-3 mb-2.5 border border-slate-200 shadow-sm w-full`}
              onPress={() =>
                navigation.navigate("DesignacionDetalle", {
                  idDesignacion: item.idDesignacion,
                })
              }
            >
              <View
                style={tw`flex-row justify-between items-start w-full mb-1`}
              >
                <Text
                  numberOfLines={1}
                  style={twFont(
                    "text-sm font-bold text-slate-900 flex-1 min-w-0 mr-2",
                  )}
                >
                  {canchaNombre}
                </Text>
                <View
                  style={[
                    styles.badge,
                    tw`shrink-0`,
                    {
                      backgroundColor:
                        ESTADO_COLOR[item.estadoDesignacion] || "#888",
                    },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={twFont("text-xs font-bold text-white")}
                  >
                    {ESTADO_LABEL[item.estadoDesignacion] || "Pendiente"}
                  </Text>
                </View>
              </View>
              <Text
                numberOfLines={1}
                style={twFont("text-xs text-slate-500 mt-0.5")}
              >
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
    paddingVertical: scaleFont(8),
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  btnLogoutText: {
    fontSize: scaleFont(10),
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
    minHeight: scaleFont(64),
    paddingVertical: scaleFont(8),
    paddingHorizontal: scaleFont(4),
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  actionIcon: { fontSize: scaleFont(18), marginBottom: 4 },
  actionLabel: {
    color: "#fff",
    fontSize: isSmallDevice ? scaleFont(10) : scaleFont(11),
    fontWeight: "700",
    textAlign: "center",
    includeFontPadding: false,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: scaleFont(10),
    marginBottom: scaleFont(20),
  },
  kpiCard: {
    width: "48.5%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: scaleFont(11),
    minHeight: scaleFont(114),
    justifyContent: "space-between",
    elevation: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  kpiCardProfile: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
  },
  kpiCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scaleFont(6),
  },
  kpiIconWrapper: {
    width: scaleFont(28),
    height: scaleFont(28),
    borderRadius: scaleFont(8),
    alignItems: "center",
    justifyContent: "center",
  },
  kpiBadge: {
    borderRadius: 6,
    paddingHorizontal: scaleFont(6),
    paddingVertical: 2,
    flexShrink: 0,
  },
  kpiBadgeText: {
    fontSize: scaleFont(9.5),
    fontWeight: "700",
    includeFontPadding: false,
  },
  kpiNumber: {
    fontSize: isSmallDevice ? scaleFont(18) : scaleFont(20),
    fontWeight: "900",
    color: "#0f172a",
    includeFontPadding: false,
  },
  kpiLabel: {
    fontSize: isSmallDevice ? scaleFont(11) : scaleFont(12),
    fontWeight: "700",
    color: "#334155",
    marginTop: 2,
    includeFontPadding: false,
  },
  kpiSub: {
    fontSize: scaleFont(9.5),
    color: "#64748b",
    marginTop: 2,
    includeFontPadding: false,
  },
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
    minWidth: scaleFont(74),
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
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

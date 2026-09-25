import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  GetDesignacionDTO,
  GetDesignadosDTO,
  EstadoDesignacion,
} from "../../types";
import { designacionService } from "../../services/designacionService";
import { useAuth } from "../../context/AuthContext";
import { RootStackParamList } from "../../navigation/AppNavigator";
import AsignarArbitroModal from "../../components/modals/AsignarArbitroModal";
import DesignacionModal from "../../components/modals/DesignacionModal";
import { scaleFont } from "../../utils/responsive";
import tw, { twFont } from "../../theme/tailwind";
import {
  formatDesignacionWhatsApp,
  shareMessageWhatsApp,
} from "../../utils/whatsappShare";

type Route = RouteProp<RootStackParamList, "DesignacionDetalle">;

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

export default function DesignacionDetalle() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation();
  const { arbitro: authArbitro, canManageDesignaciones } = useAuth();

  const [designacion, setDesignacion] = useState<GetDesignacionDTO | null>(
    null,
  );
  const [designados, setDesignados] = useState<GetDesignadosDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [asignarModalVisible, setAsignarModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const isDesignador = canManageDesignaciones;

  async function handleShareWhatsApp() {
    if (!designacion) return;
    try {
      const msg = formatDesignacionWhatsApp(designacion, designados);
      await shareMessageWhatsApp(msg);
    } catch {
      Alert.alert("Error", "No se pudo compartir la designación");
    }
  }

  const loadData = useCallback(async () => {
    try {
      const [d, dd] = await Promise.all([
        designacionService.getDesignacionById(params.idDesignacion),
        designacionService.getDesignados(params.idDesignacion),
      ]);
      setDesignacion(d);
      setDesignados(dd);
    } catch (e: any) {
      console.warn("Error cargando detalle designacion de API:", e);
    } finally {
      setLoading(false);
    }
  }, [params.idDesignacion]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function cambiarEstado(nuevoEstado: number) {
    if (!designacion) return;
    try {
      const updated = await designacionService.cambiarEstado(
        designacion.idDesignacion,
        nuevoEstado,
      );
      setDesignacion(updated);
      Alert.alert("Éxito", `Estado cambiado a: ${ESTADO_LABEL[nuevoEstado]}`);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Error al cambiar estado";
      Alert.alert("Error", msg);
    }
  }

  async function handleRemoveDesignado(item: GetDesignadosDTO) {
    const nombre = `${item.arbitro?.apellido || ""}, ${item.arbitro?.nombre || ""}`;
    Alert.alert(
      "Quitar Árbitro",
      `¿Deseas desasignar a ${nombre} de esta fecha?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Quitar",
          style: "destructive",
          onPress: async () => {
            try {
              await designacionService.eliminarDesignado(
                params.idDesignacion,
                item.idDesignados,
              );
              loadData();
            } catch (e: any) {
              const msg =
                e?.response?.data?.message ||
                e?.message ||
                "Error al desasignar";
              Alert.alert("Error al desasignar", msg);
            }
          },
        },
      ],
    );
  }

  async function handleReprogramar() {
    if (!designacion) return;
    Alert.alert(
      "Reprogramar Designación",
      "¿Deseás reactivar y reprogramar esta designación cancelada?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Reprogramar",
          onPress: async () => {
            try {
              const updated = await designacionService.reprogramarDesignacion(
                designacion.idDesignacion,
              );
              setDesignacion(updated);
              Alert.alert(
                "Éxito",
                "La designación fue reprogramada exitosamente.",
              );
              loadData();
            } catch (e: any) {
              const msg =
                e?.response?.data?.message ||
                e?.message ||
                "Error al reprogramar";
              Alert.alert("Error", msg);
            }
          },
        },
      ],
    );
  }

  async function handleEliminarDesignacion() {
    if (!designacion) return;
    Alert.alert(
      "Eliminar Designación",
      "¿Estás seguro de que deseas eliminar permanentemente esta designación? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await designacionService.eliminarDesignacion(
                designacion.idDesignacion,
              );
              Alert.alert(
                "Eliminada",
                "La designación ha sido eliminada con éxito",
                [{ text: "OK", onPress: () => navigation.goBack() }],
              );
            } catch (e: any) {
              const msg =
                e?.response?.data?.message ||
                e?.message ||
                "Error al eliminar designación";
              Alert.alert("Error", msg);
            }
          },
        },
      ],
    );
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (!designacion)
    return <Text style={styles.empty}>Designación no encontrada</Text>;

  const fechaStr = new Date(designacion.fecha).toLocaleString("es-AR", {
    dateStyle: "full",
    timeStyle: "short",
  });
  const canchaNombre = designacion.cancha?.nombreCancha || "Predio s/n";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Encabezado */}
      <View
        style={tw`flex-row justify-between items-start bg-white p-4 rounded-2xl border border-slate-200 shadow-sm w-full mb-3`}
      >
        <View style={tw`flex-1 min-w-0 mr-2`}>
          <Text
            numberOfLines={2}
            style={twFont("text-base font-extrabold text-slate-900")}
          >
            {canchaNombre}
          </Text>
          <Text
            numberOfLines={1}
            style={twFont("text-xs text-slate-500 font-medium mt-1")}
          >
            {fechaStr}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            tw`shrink-0 self-start`,
            { minWidth: scaleFont(76) },
            {
              backgroundColor:
                ESTADO_COLOR[designacion.estadoDesignacion] || "#888",
            },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              twFont("text-xs font-bold text-white text-center"),
              { minWidth: scaleFont(76) },
            ]}
          >
            {ESTADO_LABEL[designacion.estadoDesignacion] || "Pendiente"}
          </Text>
        </View>
      </View>

      {/* Info Card */}
      <View
        style={tw`bg-white p-4 rounded-2xl border border-slate-200 shadow-sm w-full mb-3`}
      >
        <Text style={twFont("text-xs text-slate-700 font-medium mb-1.5")}>
          <Text style={twFont("text-xs font-bold text-slate-900")}>
            🏆 Etapa:{" "}
          </Text>
          {designacion.etapaCampeonato?.replace("_", " ")}
        </Text>
        <Text style={twFont("text-xs text-slate-700 font-medium mb-1.5")}>
          <Text style={twFont("text-xs font-bold text-slate-900")}>
            ⚽ Partidos:{" "}
          </Text>
          {designacion.cantidadPartidos}
        </Text>
        {designacion.detalleDesignacion || designacion.detalleExtra ? (
          <Text style={twFont("text-xs text-slate-700 font-medium")}>
            <Text style={twFont("text-xs font-bold text-slate-900")}>
              📝 Notas:{" "}
            </Text>
            {designacion.detalleDesignacion || designacion.detalleExtra}
          </Text>
        ) : null}
      </View>

      {/* Botón Compartir por WhatsApp (Solo si está Aceptada/Confirmada) */}
      {designacion.estadoDesignacion === 1 && (
        <TouchableOpacity
          style={styles.btnShareWhatsApp}
          onPress={handleShareWhatsApp}
          activeOpacity={0.8}
        >
          <Ionicons
            name="logo-whatsapp"
            size={scaleFont(18)}
            color="#ffffff"
            style={{ marginRight: 8 }}
          />
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={twFont("text-sm font-bold text-white")}
          >
            Compartir por WhatsApp
          </Text>
        </TouchableOpacity>
      )}

      {/* Botón Editar Designación */}
      {isDesignador && (
        <TouchableOpacity
          style={styles.btnEdit}
          onPress={() => setEditModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={twFont("text-xs font-bold text-slate-700")}
          >
            ✏️ Editar Información de la Jornada
          </Text>
        </TouchableOpacity>
      )}

      {/* Cuadrilla Arbitral */}
      <View style={tw`flex-row justify-between items-center mt-3 mb-2 w-full`}>
        <Text
          numberOfLines={1}
          style={twFont(
            "text-base font-extrabold text-slate-900 flex-1 min-w-0 mr-2",
          )}
        >
          Equipo Arbitral ({designados.length})
        </Text>
        {isDesignador && (
          <TouchableOpacity
            style={[styles.btnAddArbitro, tw`shrink-0`]}
            onPress={() => setAsignarModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text
              numberOfLines={1}
              style={{
                minWidth: scaleFont(70),
                color: "#fff"
              }}
            >
              + Agregar
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {designados.length === 0 ? (
        <View style={styles.emptyArbitrosCard}>
          <Text style={twFont("text-xs text-slate-400 text-center")}>
            Sin árbitros designados aún
          </Text>
        </View>
      ) : (
        designados.map((d) => {
          const arb = d.arbitro;
          return (
            <View
              key={d.idDesignados}
              style={tw`flex-row items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 mb-2 w-full`}
            >
              <View style={tw`flex-1 min-w-0 mr-2`}>
                <Text
                  numberOfLines={1}
                  style={twFont("text-sm font-bold text-slate-900")}
                >
                  {arb?.apellido}, {arb?.nombre}
                </Text>
                <Text
                  numberOfLines={1}
                  style={twFont("text-xs text-slate-500 mt-0.5")}
                >
                  {arb?.categoria || "Sin cat"} · {d.partidosDirigidos}{" "}
                  partido(s)
                </Text>
                {d.montoPercibido > 0 && (
                  <Text
                    numberOfLines={1}
                    style={twFont("text-xs text-emerald-600 font-bold mt-1")}
                  >
                    Honorario: ${d.montoPercibido.toFixed(2)}
                  </Text>
                )}
              </View>
              {isDesignador && (
                <TouchableOpacity
                  style={styles.btnRemove}
                  onPress={() => handleRemoveDesignado(d)}
                >
                  <Text style={styles.btnRemoveText}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}

      {/* Acciones de Estado */}
      {isDesignador && (
        <View style={styles.estadoSection}>
          <Text style={twFont("text-sm font-bold text-slate-900 mb-2")}>
            Cambiar Estado de la Jornada
          </Text>
          <View style={tw`gap-1.5 mt-1 w-full`}>
            {/* Fila 1: Pendiente, Confirmada, Finalizada */}
            <View style={tw`flex-row gap-1.5 w-full`}>
              {[0, 1, 2].map((est) => (
                <TouchableOpacity
                  key={est}
                  style={[
                    styles.btnEstado,
                    tw`flex-1 items-center justify-center`,
                    designacion.estadoDesignacion === est &&
                      styles.btnEstadoActive,
                  ]}
                  onPress={() => cambiarEstado(est)}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[
                      styles.btnEstadoText,
                      designacion.estadoDesignacion === est &&
                        styles.btnEstadoTextActive,
                    ]}
                  >
                    {ESTADO_LABEL[est]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Fila 2: Cancelada, Suspendida */}
            <View style={tw`flex-row gap-1.5 w-full`}>
              {[3, 4].map((est) => (
                <TouchableOpacity
                  key={est}
                  style={[
                    styles.btnEstado,
                    tw`flex-1 items-center justify-center`,
                    designacion.estadoDesignacion === est &&
                      styles.btnEstadoActive,
                  ]}
                  onPress={() => cambiarEstado(est)}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[
                      styles.btnEstadoText,
                      designacion.estadoDesignacion === est &&
                        styles.btnEstadoTextActive,
                    ]}
                  >
                    {ESTADO_LABEL[est]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Botón de Reprogramar (si la designación está cancelada) */}
      {designacion.estadoDesignacion === 3 && isDesignador && (
        <TouchableOpacity
          style={styles.btnReprogramar}
          onPress={handleReprogramar}
          activeOpacity={0.8}
        >
          <Ionicons
            name="refresh-circle-outline"
            size={scaleFont(22)}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text numberOfLines={1} style={styles.btnReprogramarText}>
            Reprogramar Designación
          </Text>
        </TouchableOpacity>
      )}

      {/* Botón de Eliminar Designación */}
      {isDesignador && (
        <TouchableOpacity
          style={styles.btnEliminar}
          onPress={handleEliminarDesignacion}
          activeOpacity={0.8}
        >
          <Ionicons
            name="trash-outline"
            size={scaleFont(18)}
            color="#ef4444"
            style={{ marginRight: 8 }}
          />
          <Text numberOfLines={1} style={styles.btnEliminarText}>
            Eliminar Designación
          </Text>
        </TouchableOpacity>
      )}

      {/* Modales */}
      <AsignarArbitroModal
        visible={asignarModalVisible}
        onClose={() => setAsignarModalVisible(false)}
        onAssigned={loadData}
        idDesignacion={params.idDesignacion}
        fechaDesignacion={designacion.fecha}
        assignedArbitroIds={
          designados
            .map((d) => d.arbitro?.idArbitro)
            .filter(Boolean) as number[]
        }
      />

      <DesignacionModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSaved={loadData}
        designacionToEdit={designacion}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: scaleFont(16), paddingBottom: scaleFont(50) },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    padding: scaleFont(14),
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 1,
    marginBottom: 12,
  },
  cancha: {
    fontSize: scaleFont(18),
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  fecha: { fontSize: scaleFont(12), color: "#64748b" },
  badge: {
    borderRadius: 6,
    paddingHorizontal: scaleFont(10),
    paddingVertical: 4,
    minWidth: scaleFont(76),
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  badgeText: { color: "#fff", fontSize: scaleFont(11), fontWeight: "700" },
  infoCard: {
    backgroundColor: "#fff",
    padding: scaleFont(14),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  infoRow: { fontSize: scaleFont(13), color: "#334155", marginBottom: 6 },
  infoLabel: { fontWeight: "700", color: "#0f172a" },
  btnEdit: {
    backgroundColor: "#f1f5f9",
    minHeight: scaleFont(42),
    paddingHorizontal: scaleFont(12),
    paddingVertical: scaleFont(8),
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  btnEditText: { color: "#0f172a", fontWeight: "700", fontSize: scaleFont(13) },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: scaleFont(15),
    fontWeight: "800",
    color: "#0f172a",
  },
  btnAddArbitro: {
    backgroundColor: "#1a1a2e",
    paddingVertical: scaleFont(7),
    paddingHorizontal: scaleFont(12),
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  btnAddArbitroText: {
    color: "#fff",
    fontSize: scaleFont(11),
    fontWeight: "700",
  },
  emptyArbitrosCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: scaleFont(16),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  emptyText: { color: "#94a3b8", fontSize: scaleFont(13) },
  arbitroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: scaleFont(12),
    marginBottom: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  arbitroNombre: {
    fontSize: scaleFont(14),
    fontWeight: "700",
    color: "#0f172a",
  },
  arbitroInfo: { fontSize: scaleFont(11), color: "#64748b", marginTop: 2 },
  arbitroMonto: {
    fontSize: scaleFont(12),
    color: "#16a34a",
    fontWeight: "700",
    marginTop: 3,
  },
  btnRemove: { padding: 8, marginLeft: 8 },
  btnRemoveText: { fontSize: scaleFont(16) },
  estadoSection: { marginTop: 18 },
  estadoButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  btnEstado: {
    backgroundColor: "#f1f5f9",
    paddingVertical: scaleFont(8),
    paddingHorizontal: scaleFont(6),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    minHeight: scaleFont(36),
  },
  btnEstadoActive: { backgroundColor: "#1a1a2e", borderColor: "#1a1a2e" },
  btnEstadoText: {
    fontSize: scaleFont(11),
    color: "#475569",
    fontWeight: "600",
    includeFontPadding: false,
    textAlign: "center",
  },
  btnEstadoTextActive: { color: "#fff", fontWeight: "700" },
  btnReprogramar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    paddingVertical: scaleFont(12),
    paddingHorizontal: scaleFont(16),
    borderRadius: 10,
    marginTop: 16,
    elevation: 2,
    minHeight: scaleFont(44),
  },
  btnReprogramarText: {
    color: "#fff",
    fontSize: scaleFont(13),
    fontWeight: "700",
  },
  btnEliminar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    paddingVertical: scaleFont(11),
    paddingHorizontal: scaleFont(16),
    borderRadius: 10,
    marginTop: 14,
    minHeight: scaleFont(44),
  },
  btnEliminarText: {
    color: "#dc2626",
    fontSize: scaleFont(13),
    fontWeight: "700",
  },
  btnShareWhatsApp: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16a34a",
    paddingVertical: scaleFont(11),
    paddingHorizontal: scaleFont(16),
    borderRadius: 10,
    marginBottom: 14,
    elevation: 2,
    minHeight: scaleFont(44),
  },
  btnShareWhatsAppText: {
    color: "#ffffff",
    fontSize: scaleFont(13),
    fontWeight: "700",
  },
  empty: {
    textAlign: "center",
    marginTop: 60,
    color: "#94a3b8",
    fontSize: scaleFont(14),
  },
});

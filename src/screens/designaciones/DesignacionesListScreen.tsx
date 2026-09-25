import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { GetDesignacionDTO, GetDesignadosDTO } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { designacionService } from "../../services/designacionService";
import DesignacionModal from "../../components/modals/DesignacionModal";
import { scaleFont, isSmallDevice } from "../../utils/responsive";
import tw, { twFont } from "../../theme/tailwind";
import {
  formatDesignacionWhatsApp,
  formatTodasAceptadasWhatsApp,
  shareMessageWhatsApp,
} from "../../utils/whatsappShare";

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

export default function DesignacionesListScreen() {
  const { arbitro, canManageDesignaciones } = useAuth();
  const navigation = useNavigation<Nav>();
  const [designaciones, setDesignaciones] = useState<GetDesignacionDTO[]>([]);
  const [designadosMap, setDesignadosMap] = useState<
    Record<number, GetDesignadosDTO[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const isDesignador = canManageDesignaciones;

  const aceptadasCount = designaciones.filter(
    (d) => d.estadoDesignacion === 1,
  ).length;

  async function handleShareIndividual(item: GetDesignacionDTO) {
    try {
      const arbitros = await designacionService.getDesignados(
        item.idDesignacion,
      );
      const msg = formatDesignacionWhatsApp(item, arbitros);
      await shareMessageWhatsApp(msg);
    } catch (e: any) {
      Alert.alert("Error", "No se pudo preparar el mensaje de WhatsApp");
    }
  }

  async function handleShareTodasAceptadas() {
    const aceptadas = designaciones.filter((d) => d.estadoDesignacion === 1);
    if (aceptadas.length === 0) {
      Alert.alert("Aviso", "No hay designaciones aceptadas para compartir.");
      return;
    }

    try {
      const conArbitros = await Promise.all(
        aceptadas.map(async (d) => {
          const arbitros = await designacionService.getDesignados(
            d.idDesignacion,
          );
          return { designacion: d, arbitros };
        }),
      );
      const msg = formatTodasAceptadasWhatsApp(conArbitros);
      await shareMessageWhatsApp(msg);
    } catch (e: any) {
      Alert.alert("Error", "Error al recopilar designaciones para WhatsApp");
    }
  }

  const loadData = useCallback(async () => {
    try {
      // Trae designaciones para cualquier usuario en rango de 14 días (-7 a +7 días)
      const data = await designacionService.getDesignaciones();

      // Ordenar por estado: 1- Pendiente (0), 2- Aceptadas/Confirmadas (1), resto después
      const ordenEstado: Record<number, number> = {
        0: 1, // 1- Pendiente
        1: 2, // 2- Aceptada / Confirmada
        2: 3, // Finalizada
        4: 4, // Suspendida
        3: 5, // Cancelada
      };

      const sorted = [...data].sort((a, b) => {
        const pesoA = ordenEstado[a.estadoDesignacion] ?? 99;
        const pesoB = ordenEstado[b.estadoDesignacion] ?? 99;
        if (pesoA !== pesoB) {
          return pesoA - pesoB;
        }
        return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      });

      setDesignaciones(sorted);

      // Cargar los árbitros asignados a cada designación para que todos los usuarios puedan verlos
      const designadosResultados = await Promise.all(
        sorted.map(async (d) => {
          try {
            const list = await designacionService.getDesignados(
              d.idDesignacion,
            );
            return [d.idDesignacion, list] as const;
          } catch {
            return [d.idDesignacion, []] as const;
          }
        }),
      );
      setDesignadosMap(Object.fromEntries(designadosResultados));
    } catch (e: any) {
      console.warn("Error cargando designaciones de API:", e);
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

  async function handleReprogramar(item: GetDesignacionDTO) {
    Alert.alert(
      "Reprogramar Designación",
      "¿Deseás reactivar y reprogramar esta designación cancelada?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Reprogramar",
          onPress: async () => {
            try {
              await designacionService.reprogramarDesignacion(
                item.idDesignacion,
              );
              Alert.alert("Éxito", "Designación reprogramada.");
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

  async function handleEliminar(item: GetDesignacionDTO) {
    Alert.alert(
      "Eliminar Designación",
      "¿Estás seguro de eliminar esta designación? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await designacionService.eliminarDesignacion(item.idDesignacion);
              loadData();
            } catch (e: any) {
              const msg =
                e?.response?.data?.message || e?.message || "Error al eliminar";
              Alert.alert("Error", msg);
            }
          },
        },
      ],
    );
  }

  function renderItem({ item }: { item: GetDesignacionDTO }) {
    const fecha = new Date(item.fecha).toLocaleDateString("es-AR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
    const canchaNombre = item.cancha?.nombreCancha || "Predio s/n";

    return (
      <TouchableOpacity
        style={tw`bg-white rounded-2xl p-4 mb-3 border border-slate-200 shadow-sm w-full`}
        onPress={() =>
          navigation.navigate("DesignacionDetalle", {
            idDesignacion: item.idDesignacion,
          })
        }
      >
        <View style={tw`flex-row justify-between items-start w-full mb-1.5`}>
          <Text
            numberOfLines={2}
            style={twFont(
              "text-sm font-bold text-slate-900 flex-1 min-w-0 mr-2",
            )}
          >
            {canchaNombre}
          </Text>
          <View
            style={[
              styles.badge,
              tw`shrink-0 self-start`,
              {
                backgroundColor: ESTADO_COLOR[item.estadoDesignacion] || "#888",
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[twFont("text-xs font-bold text-white"), { minWidth: scaleFont(60) }]}
            >
              {ESTADO_LABEL[item.estadoDesignacion] || "Pendiente"}
            </Text>
          </View>
        </View>
        <Text
          numberOfLines={1}
          style={twFont("text-xs text-slate-600 font-medium mb-1")}
        >
          📅 {fecha} · {item.cantidadPartidos} partido(s)
        </Text>
        <Text
          numberOfLines={1}
          style={twFont("text-xs text-slate-500 font-semibold mb-1")}
        >
          🏆 {item.etapaCampeonato?.replace("_", " ")}
        </Text>
        {item.detalleDesignacion || item.detalleExtra ? (
          <Text
            numberOfLines={2}
            style={twFont("text-xs text-slate-500 italic mt-1")}
          >
            {item.detalleDesignacion || item.detalleExtra}
          </Text>
        ) : null}

        {/* Árbitros Asignados (visible para todos los usuarios) */}
        {(() => {
          const cuadrilla = designadosMap[item.idDesignacion] || [];
          return (
            <View style={tw`mt-2 pt-2 border-t border-slate-100`}>
              <Text style={twFont("text-xs font-bold text-slate-700 mb-1")}>
                👥 Árbitros ({cuadrilla.length}):
              </Text>
              {cuadrilla.length === 0 ? (
                <Text style={twFont("text-[11px] text-slate-400 italic")}>
                  Sin árbitros designados aún
                </Text>
              ) : (
                <View style={tw`gap-2 mt-1`}>
                  {cuadrilla.map((des) => (
                    <View
                      key={des.idDesignados}
                      style={tw`bg-slate-100 px-2 py-1 rounded-md border border-slate-200`}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: scaleFont(11),
                          color: "#334155",
                          fontWeight: "600",
                          flexShrink: 1,
                        }}
                      >
                        👤 {des.arbitro?.apellido}, {des.arbitro?.nombre}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })()}

        {/* Acciones directas en la tarjeta */}
        {(item.estadoDesignacion === 1 || isDesignador) && (
          <View
            style={tw`flex-row flex-wrap gap-2 mt-2.5 pt-2.5 border-t border-slate-100 items-center`}
          >
            {item.estadoDesignacion === 1 && (
              <TouchableOpacity
                style={styles.btnCardWhatsapp}
                onPress={() => handleShareIndividual(item)}
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={scaleFont(15)}
                  color="#15803d"
                  style={{ marginRight: 4 }}
                />
                <Text style={twFont("text-xs font-bold text-emerald-700")}>
                  WhatsApp
                </Text>
              </TouchableOpacity>
            )}

            {isDesignador && (
              <>
                {item.estadoDesignacion === 3 && (
                  <TouchableOpacity
                    style={styles.btnCardReprogramar}
                    onPress={() => handleReprogramar(item)}
                  >
                    <Ionicons
                      name="refresh-circle-outline"
                      size={scaleFont(16)}
                      color="#2563eb"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={twFont("text-xs font-bold text-blue-600")}>
                      Reprogramar
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.btnCardDelete}
                  onPress={() => handleEliminar(item)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={scaleFont(16)}
                    color="#ef4444"
                  />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={tw`flex-1 min-w-0 mr-2`}>
          <Text
            numberOfLines={1}
            style={twFont("text-lg font-black text-slate-900")}
          >
            Designaciones
          </Text>
          <Text
            numberOfLines={1}
            style={twFont("text-[10.5px] text-slate-500 font-medium mt-0.5")}
          >
            📅 Rango: 7 días antes a 7 días después
          </Text>
        </View>
        <View style={tw`flex-row items-center gap-1.5 flex-shrink-0`}>
          {aceptadasCount > 0 && (
            <TouchableOpacity
              style={styles.btnShareAll}
              onPress={handleShareTodasAceptadas}
            >
              <Ionicons
                name="logo-whatsapp"
                size={scaleFont(16)}
                color="#ffffff"
                style={{ marginRight: 4 }}
              />
              <Text style={twFont("text-xs font-bold text-white")}>
                Aceptadas ({aceptadasCount})
              </Text>
            </TouchableOpacity>
          )}
          {isDesignador && (
            <TouchableOpacity
              style={[styles.btnAdd, { flexShrink: 0 }]}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: "#fff",
                  borderRadius: 8,
                  flexShrink: 0,
                  minWidth: scaleFont(54),
                  alignItems: "center",
                  justifyContent: "center",
                }}
                numberOfLines={1}
              >
                + Nueva
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={designaciones}
        keyExtractor={(item) => String(item.idDesignacion)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Sin designaciones registradas</Text>
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      />

      <DesignacionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={loadData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scaleFont(16),
    paddingBottom: scaleFont(10),
    paddingTop: scaleFont(44),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: {
    fontSize: isSmallDevice ? scaleFont(18) : scaleFont(20),
    fontWeight: "bold",
    color: "#0f172a",
    flexShrink: 1,
    includeFontPadding: false,
  },
  btnAdd: {
    backgroundColor: "#1a1a2e",
    paddingVertical: scaleFont(7),
    paddingHorizontal: scaleFont(10),
    borderRadius: 8,
    elevation: 2,
    flexShrink: 0,
    minWidth: scaleFont(74),
    alignItems: "center",
    justifyContent: "center",
  },
  btnAddText: {
    color: "#fff",
    fontSize: scaleFont(12),
    fontWeight: "700",
    includeFontPadding: false,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: scaleFont(14),
    marginBottom: scaleFont(10),
    elevation: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cancha: {
    fontSize: scaleFont(15),
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
    marginRight: 8,
    includeFontPadding: false,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: scaleFont(9),
    paddingVertical: 3,
    minWidth: scaleFont(74),
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  badgeText: {
    color: "#fff",
    fontSize: scaleFont(11),
    fontWeight: "700",
    includeFontPadding: false,
  },
  fecha: {
    fontSize: scaleFont(13),
    color: "#334155",
    marginBottom: 2,
    includeFontPadding: false,
  },
  etapa: {
    fontSize: scaleFont(12),
    color: "#64748b",
    includeFontPadding: false,
  },
  detalle: {
    fontSize: scaleFont(12),
    color: "#ef4444",
    marginTop: 4,
    includeFontPadding: false,
  },
  empty: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: 60,
    fontSize: scaleFont(14),
    includeFontPadding: false,
  },
  cardActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    flexWrap: "wrap",
    gap: scaleFont(6),
  },
  btnCardReprogramar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 6,
    paddingVertical: scaleFont(4),
    paddingHorizontal: scaleFont(8),
  },
  btnCardReprogramarText: {
    fontSize: scaleFont(11),
    fontWeight: "700",
    color: "#2563eb",
  },
  btnCardDelete: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 6,
    padding: scaleFont(6),
  },
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: scaleFont(8),
  },
  btnShareAll: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16a34a",
    paddingVertical: scaleFont(7),
    paddingHorizontal: scaleFont(9),
    borderRadius: 8,
    elevation: 2,
    flexShrink: 0,
  },
  btnShareAllText: {
    color: "#fff",
    fontSize: scaleFont(11),
    fontWeight: "700",
    includeFontPadding: false,
  },
  btnCardWhatsapp: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 6,
    paddingVertical: scaleFont(4),
    paddingHorizontal: scaleFont(8),
  },
  btnCardWhatsappText: {
    fontSize: scaleFont(11),
    fontWeight: "700",
    color: "#15803d",
  },
});

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
import { GetDesignacionDTO } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { designacionService } from "../../services/designacionService";
import DesignacionModal from "../../components/modals/DesignacionModal";
import { scaleFont } from "../../utils/responsive";
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

export default function DesignacionesListScreen() {
  const { arbitro, canManageDesignaciones } = useAuth();
  const navigation = useNavigation<Nav>();
  const [designaciones, setDesignaciones] = useState<GetDesignacionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const isDesignador = canManageDesignaciones;

  const loadData = useCallback(async () => {
    try {
      const data = await designacionService.getDesignaciones(
        Boolean(isDesignador),
      );
      setDesignaciones(data);
    } catch (e: any) {
      console.warn("Error cargando designaciones de API:", e);
    }
  }, [isDesignador]);

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
              await designacionService.reprogramarDesignacion(item.idDesignacion);
              Alert.alert("Éxito", "Designación reprogramada.");
              loadData();
            } catch (e: any) {
              const msg = e?.response?.data?.message || e?.message || "Error al reprogramar";
              Alert.alert("Error", msg);
            }
          },
        },
      ]
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
              const msg = e?.response?.data?.message || e?.message || "Error al eliminar";
              Alert.alert("Error", msg);
            }
          },
        },
      ]
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
        style={styles.card}
        onPress={() =>
          navigation.navigate("DesignacionDetalle", {
            idDesignacion: item.idDesignacion,
          })
        }
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cancha}>{canchaNombre}</Text>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: ESTADO_COLOR[item.estadoDesignacion] || "#888",
              },
            ]}
          >
            <Text style={styles.badgeText}>
              {ESTADO_LABEL[item.estadoDesignacion] || "Pendiente"}
            </Text>
          </View>
        </View>
        <Text style={styles.fecha}>
          📅 {fecha} · {item.cantidadPartidos} partido(s)
        </Text>
        <Text style={styles.etapa}>
          🏆 {item.etapaCampeonato?.replace("_", " ")}
        </Text>
        {item.detalleDesignacion || item.detalleExtra ? (
          <Text style={styles.detalle}>
            {item.detalleDesignacion || item.detalleExtra}
          </Text>
        ) : null}

        {/* Acciones directas en la tarjeta */}
        {isDesignador && (
          <View style={styles.cardActionsRow}>
            {item.estadoDesignacion === 3 && (
              <TouchableOpacity
                style={styles.btnCardReprogramar}
                onPress={() => handleReprogramar(item)}
              >
                <Ionicons name="refresh-circle-outline" size={scaleFont(16)} color="#2563eb" style={{ marginRight: 4 }} />
                <Text style={styles.btnCardReprogramarText}>Reprogramar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.btnCardDelete}
              onPress={() => handleEliminar(item)}
            >
              <Ionicons name="trash-outline" size={scaleFont(16)} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Designación</Text>
        {isDesignador && (
          <TouchableOpacity
            style={styles.btnAdd}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.btnAddText}>+ Nueva</Text>
          </TouchableOpacity>
        )}
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
  title: { fontSize: scaleFont(20), fontWeight: "bold", color: "#0f172a" },
  btnAdd: {
    backgroundColor: "#1a1a2e",
    paddingVertical: scaleFont(8),
    paddingHorizontal: scaleFont(14),
    borderRadius: 8,
    elevation: 2,
  },
  btnAddText: { color: "#fff", fontSize: scaleFont(12), fontWeight: "700" },
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
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: scaleFont(8),
    paddingVertical: 3,
  },
  badgeText: { color: "#fff", fontSize: scaleFont(11), fontWeight: "700" },
  fecha: { fontSize: scaleFont(13), color: "#334155", marginBottom: 2 },
  etapa: { fontSize: scaleFont(12), color: "#64748b" },
  detalle: { fontSize: scaleFont(12), color: "#ef4444", marginTop: 4 },
  empty: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: 60,
    fontSize: scaleFont(14),
  },
  cardActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    gap: 8,
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
});

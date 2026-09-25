import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { GetSuspencionDTO } from "../../types";
import { suspensionService } from "../../services/suspensionService";
import { useAuth } from "../../context/AuthContext";
import SuspensionModal from "../../components/modals/SuspensionModal";
import { scaleFont, isSmallDevice } from "../../utils/responsive";
import tw from "../../theme/tailwind";

const TIPO_LABEL: Record<number, string> = {
  1: "Llamado de atención",
  2: "Suspensión",
};

export default function SuspensionesListScreen() {
  const { arbitro: authArbitro, canManageSuspensiones } = useAuth();
  const [suspensiones, setSuspensiones] = useState<GetSuspencionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const canManage = canManageSuspensiones;

  const loadData = useCallback(async () => {
    try {
      const data = await suspensionService.getSuspensiones(Boolean(canManage));
      setSuspensiones(data);
    } catch (e: any) {
      console.warn("Error cargando suspensiones de API:", e);
    }
  }, [canManage]);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleDelete(item: GetSuspencionDTO) {
    const nombreArbitro = `${item.arbitro?.apellido || ""}, ${item.arbitro?.nombre || ""}`;
    Alert.alert(
      "Eliminar Sanción",
      `¿Deseas dar de baja esta sanción a ${nombreArbitro}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await suspensionService.deleteSuspension(item.idSuspencion);
              loadData();
            } catch (e: any) {
              const msg =
                e?.response?.data?.message ||
                e?.message ||
                "Error al eliminar sanción";
              Alert.alert("Error al eliminar", msg);
            }
          },
        },
      ],
    );
  }

  function renderItem({ item }: { item: GetSuspencionDTO }) {
    const fechaIncidente = new Date(item.fechaIncidente).toLocaleDateString(
      "es-AR",
    );
    const fechaFin = new Date(item.fechaFin).toLocaleDateString("es-AR");
    const esSuspension = item.tipoSuspencion === 2;
    const nombreArbitro =
      `${item.arbitro?.apellido || ""}, ${item.arbitro?.nombre || ""}`.trim() ||
      "Árbitro";
    const nombreCancha = item.cancha?.nombreCancha || "Cancha";

    return (
      <View style={[styles.card, esSuspension && styles.cardSuspension]}>
        <View style={styles.cardHeader}>
          <Text style={styles.arbitro}>{nombreArbitro}</Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: esSuspension ? "#e74c3c" : "#f39c12" },
            ]}
          >
            <Text numberOfLines={1} style={styles.badgeText}>
              {TIPO_LABEL[item.tipoSuspencion] || "Sanción"}
            </Text>
          </View>
        </View>
        <Text style={styles.cancha}>📍 {nombreCancha}</Text>
        <Text style={styles.motivo}>{item.motivo}</Text>
        <View style={styles.footerRow}>
          <Text style={styles.fechas}>
            📅 {fechaIncidente} → {fechaFin} ({item.cantidadDias} días)
          </Text>
          {canManage && (
            <TouchableOpacity
              style={styles.btnDel}
              onPress={() => handleDelete(item)}
            >
              <Text style={styles.btnDelText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <View style={styles.container}>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: scaleFont(16),
          paddingBottom: scaleFont(10),
          paddingTop: scaleFont(44),
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#e2e8f0",
        }}
      >
        <Text style={styles.title}>Sanciones</Text>
        {canManage && (
          <TouchableOpacity
            style={{
              backgroundColor: "#c0392b",
              paddingVertical: scaleFont(8),
              paddingHorizontal: scaleFont(12),
              borderRadius: 8,
              elevation: 2,
              flexShrink: 0,
              minWidth: scaleFont(74),
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.8}
            onPress={() => setModalVisible(true)}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: scaleFont(12),
                fontWeight: "700",
                minWidth: scaleFont(54),
                includeFontPadding: false,
              }}
              numberOfLines={1}
            >
              + Nueva
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={suspensiones}
        keyExtractor={(item) => String(item.idSuspencion)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Sin sanciones o suspensiones</Text>
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      />

      <SuspensionModal
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
    flex: 1,
    minWidth: 0,
    marginRight: 8,
    includeFontPadding: false,
  },
  btnAdd: {
    backgroundColor: "#c0392b",
    paddingVertical: scaleFont(8),
    paddingHorizontal: scaleFont(12),
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
    borderLeftWidth: 4,
    borderLeftColor: "#f39c12",
  },
  cardSuspension: { borderLeftColor: "#ef4444" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  arbitro: {
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
  badgeText: {
    color: "#fff",
    fontSize: scaleFont(12),
    minWidth: scaleFont(120),
    textAlign: "center",
    includeFontPadding: false,
    fontWeight: "700",
  },
  cancha: { fontSize: scaleFont(12), color: "#475569", marginBottom: 4 },
  motivo: { fontSize: scaleFont(13), color: "#334155", marginBottom: 6 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  fechas: { fontSize: scaleFont(11), color: "#64748b" },
  btnDel: { padding: 4 },
  btnDelText: { fontSize: scaleFont(16) },
  empty: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: 60,
    fontSize: scaleFont(14),
  },
});

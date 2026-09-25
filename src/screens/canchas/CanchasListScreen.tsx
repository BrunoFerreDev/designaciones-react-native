import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from "react-native";
import { GetCanchaDTO } from "../../types";
import { canchaService } from "../../services/canchaService";
import { useAuth } from "../../context/AuthContext";
import CanchaModal from "../../components/modals/CanchaModal";
import { scaleFont } from "../../utils/responsive";

const CAT_COLOR: Record<string, string> = {
  FUTBOL_11: "#2c3e50",
  FUTBOL_10: "#34495e",
  FUTBOL_9: "#16a085",
};

export default function CanchasListScreen() {
  const { arbitro, canManageCanchas } = useAuth();
  const [canchas, setCanchas] = useState<GetCanchaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCancha, setEditingCancha] = useState<GetCanchaDTO | null>(null);

  const canManage = canManageCanchas;

  const loadData = useCallback(async () => {
    try {
      const data = await canchaService.getCanchas();
      setCanchas(data);
    } catch (e: any) {
      console.warn("Error cargando canchas de API:", e);
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

  async function toggleEstado(cancha: GetCanchaDTO) {
    if (!canManage) return;
    try {
      const nuevoEstado = !cancha.estado;
      await canchaService.updateCancha(cancha.idCancha, {
        nombreCancha: cancha.nombreCancha,
        categoria: cancha.categoria,
        fueraDeJuego: cancha.fueraDeJuego,
        estado: nuevoEstado,
        necesitaViaje: cancha.necesitaViaje,
      });
      setCanchas((prev) =>
        prev.map((c) =>
          c.idCancha === cancha.idCancha ? { ...c, estado: nuevoEstado } : c,
        ),
      );
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Error al cambiar estado";
      Alert.alert("Error", msg);
    }
  }

  const filtered = canchas.filter((c) =>
    `${c.nombreCancha} ${c.categoria}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  function renderItem({ item }: { item: GetCanchaDTO }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.nombre}>{item.nombreCancha}</Text>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.catBadge,
                  { backgroundColor: CAT_COLOR[item.categoria] || "#1a1a2e" },
                ]}
              >
                <Text style={styles.catBadgeText}>
                  {item.categoria.replace("_", " ")}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.estado ? styles.badgeActive : styles.badgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    item.estado ? styles.textActive : styles.textInactive,
                  ]}
                >
                  {item.estado ? "Activa" : "Inactiva"}
                </Text>
              </View>
            </View>
          </View>

          {canManage && (
            <TouchableOpacity
              style={styles.btnEdit}
              onPress={() => {
                setEditingCancha(item);
                setModalVisible(true);
              }}
            >
              <Text style={styles.btnEditText}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.specsRow}>
          <View style={styles.specItem}>
            <Text style={styles.specIcon}>
              {item.fueraDeJuego ? "🚩" : "🚫"}
            </Text>
            <Text style={styles.specLabel} numberOfLines={1}>
              {item.fueraDeJuego ? "Con Offside" : "Sin Offside"}
            </Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specIcon}>
              {item.necesitaViaje ? "🚗" : "📍"}
            </Text>
            <Text style={styles.specLabel}>
              {item.necesitaViaje ? "Requiere Viaje" : "No requiere viaje"}
            </Text>
          </View>
          {canManage && (
            <View style={[styles.specItem, { marginLeft: "auto" }]}>
              <Switch
                value={item.estado}
                onValueChange={() => toggleEstado(item)}
                trackColor={{ false: "#d1d5db", true: "#27ae60" }}
              />
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Canchas y Predios</Text>
          <Text style={styles.subtitle}>
            {canchas.length} registradas ·{" "}
            {canchas.filter((c) => c.estado).length} activas
          </Text>
        </View>
        {canManage && (
          <TouchableOpacity
            style={styles.btnNew}
            onPress={() => {
              setEditingCancha(null);
              setModalVisible(true);
            }}
          >
            <Text numberOfLines={1} style={styles.btnNewText}>
              + Cancha
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Buscador */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o modalidad..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#1a1a2e"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.idCancha)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              No se encontraron canchas registradas
            </Text>
          }
        />
      )}

      {/* Modal */}
      <CanchaModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingCancha(null);
        }}
        onSaved={loadData}
        canchaToEdit={editingCancha}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    paddingHorizontal: scaleFont(16),
    paddingTop: scaleFont(44),
    paddingBottom: scaleFont(12),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: scaleFont(20),
    fontWeight: "bold",
    color: "#0f172a",
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: scaleFont(12),
    color: "#64748b",
    marginTop: 2,
    includeFontPadding: false,
  },
  btnNew: {
    backgroundColor: "#1a1a2e",
    paddingVertical: scaleFont(8),
    paddingHorizontal: scaleFont(14),
    borderRadius: 8,
    flexShrink: 0,
    minWidth: scaleFont(74),
    alignItems: "center",
    justifyContent: "center",
  },
  btnNewText: {
    color: "#fff",
    fontSize: scaleFont(12),
    fontWeight: "bold",
    includeFontPadding: false,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: scaleFont(16),
    marginVertical: scaleFont(12),
    paddingHorizontal: scaleFont(12),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  searchInput: {
    flex: 1,
    paddingVertical: scaleFont(10),
    fontSize: scaleFont(14),
    color: "#0f172a",
  },
  searchClear: { fontSize: scaleFont(14), color: "#94a3b8", padding: 4 },
  list: { paddingHorizontal: scaleFont(16), paddingBottom: scaleFont(40) },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: scaleFont(14),
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  nombre: {
    fontSize: scaleFont(15),
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 6,
    includeFontPadding: false,
  },
  badgeRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  catBadge: {
    borderRadius: 6,
    paddingHorizontal: scaleFont(8),
    paddingVertical: 2,
  },
  catBadgeText: {
    color: "#fff",
    fontSize: scaleFont(11),
    fontWeight: "700",
    includeFontPadding: false,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: scaleFont(8),
    paddingVertical: 2,
  },
  badgeActive: { backgroundColor: "#dcfce7" },
  badgeInactive: { backgroundColor: "#fee2e2" },
  statusBadgeText: {
    fontSize: scaleFont(11),
    fontWeight: "700",
    includeFontPadding: false,
  },
  textActive: { color: "#166534" },
  textInactive: { color: "#991b1b" },
  btnEdit: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: scaleFont(8),
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  btnEditText: { fontSize: scaleFont(14) },
  specsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scaleFont(12),
    paddingTop: scaleFont(10),
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    gap: 8,
    flexWrap: "wrap",
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flexShrink: 1,
    minHeight: 20,
  },
  specIcon: { fontSize: scaleFont(14) },
  specLabel: {
    fontSize: scaleFont(12),
    color: "#64748b",
    minWidth: scaleFont(80),
    fontWeight: "500",
    includeFontPadding: false,
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#94a3b8",
    fontSize: scaleFont(14),
    includeFontPadding: false,
  },
});

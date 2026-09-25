import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { GetArbitroDTO } from "../../types";
import { arbitroService } from "../../services/arbitroService";
import { useAuth } from "../../context/AuthContext";
import ArbitroModal from "../../components/modals/ArbitroModal";
import { scaleFont, isSmallDevice } from "../../utils/responsive";
import tw from "../../theme/tailwind";

type TabType = "activos" | "todos";

export default function ArbitrosListScreen() {
  const { arbitro: authArbitro, canManageArbitros, isDesignador } = useAuth();
  const [arbitros, setArbitros] = useState<GetArbitroDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("activos");

  // Modales
  const [modalVisible, setModalVisible] = useState(false);
  const [editingArbitro, setEditingArbitro] = useState<GetArbitroDTO | null>(
    null,
  );

  const canManage = canManageArbitros;

  const loadData = useCallback(async () => {
    try {
      const data = await arbitroService.getArbitros();
      setArbitros(data);
    } catch (e: any) {
      console.warn("Error cargando arbitros de API:", e);
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

  // Modificar disponibilidad (Tab 1: Activos)
  async function toggleDisponibilidad(
    item: GetArbitroDTO,
    campo: "disponibleSabado" | "disponibleDomingo",
    valor: boolean,
  ) {
    if (!isDesignador && item.idArbitro !== authArbitro?.idArbitro) return;

    try {
      const sab = campo === "disponibleSabado" ? valor : item.disponibleSabado;
      const dom =
        campo === "disponibleDomingo" ? valor : item.disponibleDomingo;

      if (item.idArbitro === authArbitro?.idArbitro) {
        await arbitroService.updateDisponibilidad(sab, dom);
      } else {
        await arbitroService.updateArbitro(item.idArbitro, {
          nombre: item.nombre,
          apellido: item.apellido,
          whatsapp: item.whatsapp,
          disponibleSabado: sab,
          disponibleDomingo: dom,
        });
      }

      setArbitros((prev) =>
        prev.map((a) =>
          a.idArbitro === item.idArbitro ? { ...a, [campo]: valor } : a,
        ),
      );
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Error al actualizar disponibilidad";
      Alert.alert("Error", msg);
    }
  }

  // Activar / Desactivar del sistema (Tab 2: Todos)
  async function toggleEstadoSistema(item: GetArbitroDTO) {
    if (!canManage) {
      Alert.alert(
        "Permiso denegado",
        "Solo administradores o secretarios pueden activar/desactivar árbitros",
      );
      return;
    }

    const nuevoEstado = !item.estadoSistema;
    try {
      await arbitroService.toggleEstadoSistema(item.idArbitro);
      setArbitros((prev) =>
        prev.map((a) =>
          a.idArbitro === item.idArbitro
            ? { ...a, estadoSistema: nuevoEstado }
            : a,
        ),
      );
    } catch {
      // Fallback a updateArbitro si el backend requiere PUT con body
      try {
        await arbitroService.updateArbitro(item.idArbitro, {
          nombre: item.nombre,
          apellido: item.apellido,
          whatsapp: item.whatsapp,
          estadoSistema: nuevoEstado,
        });
        setArbitros((prev) =>
          prev.map((a) =>
            a.idArbitro === item.idArbitro
              ? { ...a, estadoSistema: nuevoEstado }
              : a,
          ),
        );
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Error al cambiar estado del árbitro";
        Alert.alert("Error", msg);
      }
    }
  }

  const arbitrosActivos = arbitros.filter((a) => a.estadoSistema !== false);
  const dataTab = activeTab === "activos" ? arbitrosActivos : arbitros;

  const filtered = dataTab.filter((a) =>
    `${a.nombre} ${a.apellido} ${a.categoria || ""} ${a.whatsapp}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  function renderItem({ item }: { item: GetArbitroDTO }) {
    const canEditDisp =
      isDesignador || item.idArbitro === authArbitro?.idArbitro;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.nombre}>
                {item.apellido + " " + item.nombre}
              </Text>
              {activeTab === "todos" && (
                <View
                  style={[
                    styles.statusBadge,
                    item.estadoSistema
                      ? styles.statusBadgeActive
                      : styles.statusBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      item.estadoSistema
                        ? styles.statusTextActive
                        : styles.statusTextInactive,
                    ]}
                  >
                    {item.estadoSistema ? "Activo" : "Inactivo"}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.categoria}>
              {item.categoria || "Sin categoría"} · 📱 {item.whatsapp}
            </Text>
          </View>

          {canManage && (
            <TouchableOpacity
              style={styles.btnEdit}
              onPress={() => {
                setEditingArbitro(item);
                setModalVisible(true);
              }}
            >
              <Text style={styles.btnEditText}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>

        {item.roles && item.roles.length > 0 && (
          <View style={styles.rolesRow}>
            {item.roles.map((r) => (
              <View key={r} style={styles.roleBadge}>
                <Text style={styles.roleText}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        {/* TAB 1: Modificar Disponibilidad */}
        {activeTab === "activos" ? (
          <View style={styles.disponibilidad}>
            <View style={styles.dispItem}>
              <Text style={styles.dispLabel}>Sábado</Text>
              <Switch
                value={item.disponibleSabado}
                onValueChange={(v) => {
                  if (canEditDisp)
                    toggleDisponibilidad(item, "disponibleSabado", v);
                }}
                disabled={!canEditDisp}
                trackColor={{ false: "#cbd5e1", true: "#27ae60" }}
              />
            </View>
            <View style={styles.dispItem}>
              <Text style={styles.dispLabel}>Domingo</Text>
              <Switch
                value={item.disponibleDomingo}
                onValueChange={(v) => {
                  if (canEditDisp)
                    toggleDisponibilidad(item, "disponibleDomingo", v);
                }}
                disabled={!canEditDisp}
                trackColor={{ false: "#cbd5e1", true: "#27ae60" }}
              />
            </View>
          </View>
        ) : (
          /* TAB 2: Activar / Desactivar del Sistema */
          <View style={styles.systemToggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.systemToggleTitle}>
                {item.estadoSistema
                  ? "Habilitado en el Sistema"
                  : "Inhabilitado / De baja"}
              </Text>
              <Text style={styles.systemToggleSub}>
                {item.estadoSistema
                  ? "Puede recibir designaciones activas"
                  : "No aparece en selección de designaciones"}
              </Text>
            </View>
            <Switch
              value={Boolean(item.estadoSistema)}
              onValueChange={() => toggleEstadoSistema(item)}
              disabled={!canManage}
              trackColor={{ false: "#cbd5e1", true: "#27ae60" }}
            />
          </View>
        )}
      </View>
    );
  }

  if (loading)
    return (
      <ActivityIndicator style={{ flex: 1 }} size="large" color="#1a1a2e" />
    );

  return (
    <View style={styles.container}>
      {/* Cabecera */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>Árbitros</Text>
          <Text style={styles.subtitle}>
            {arbitrosActivos.length} activos · {arbitros.length} registrados
          </Text>
        </View>
        {canManage && (
          <TouchableOpacity
            style={styles.btnAdd}
            onPress={() => {
              setEditingArbitro(null);
              setModalVisible(true);
            }}
          >
            <Text style={styles.btnAddText}>+ Nuevo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs Selector */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "activos" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("activos")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "activos" && styles.tabTextActive,
            ]}
          >
            Árbitros Activos ({arbitrosActivos.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "todos" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("todos")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "todos" && styles.tabTextActive,
            ]}
          >
            Todos / Estado ({arbitros.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <TextInput
        style={styles.search}
        placeholder={
          activeTab === "activos"
            ? "Buscar en árbitros activos..."
            : "Buscar en todos los árbitros..."
        }
        placeholderTextColor="#94a3b8"
        value={search}
        onChangeText={setSearch}
      />

      {/* Lista */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.idArbitro)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {activeTab === "activos"
              ? "No hay árbitros activos encontrados"
              : "No hay árbitros registrados"}
          </Text>
        }
        contentContainerStyle={{
          paddingHorizontal: scaleFont(16),
          paddingBottom: scaleFont(80),
        }}
      />

      <ArbitroModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingArbitro(null);
        }}
        onSaved={loadData}
        arbitroToEdit={editingArbitro}
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
    paddingBottom: scaleFont(8),
    paddingTop: scaleFont(44),
    backgroundColor: "#fff",
  },
  title: { fontSize: scaleFont(20), fontWeight: "bold", color: "#0f172a", includeFontPadding: false },
  subtitle: { fontSize: scaleFont(12), color: "#64748b", marginTop: 2, includeFontPadding: false },
  btnAdd: {
    backgroundColor: "#1a1a2e",
    paddingVertical: scaleFont(8),
    paddingHorizontal: scaleFont(14),
    borderRadius: 8,
    elevation: 2,
  },
  btnAddText: { color: "#fff", fontSize: scaleFont(12), fontWeight: "700", includeFontPadding: false },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: scaleFont(16),
    paddingBottom: scaleFont(10),
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: scaleFont(8),
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tabButtonActive: {
    backgroundColor: "#1a1a2e",
    borderColor: "#1a1a2e",
  },
  tabText: {
    fontSize: isSmallDevice ? scaleFont(10.5) : scaleFont(11.5),
    fontWeight: "700",
    color: "#64748b",
    includeFontPadding: false,
  },
  tabTextActive: { color: "#fff" },
  search: {
    marginHorizontal: scaleFont(16),
    marginVertical: scaleFont(10),
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: scaleFont(10),
    fontSize: scaleFont(14),
    backgroundColor: "#fff",
    color: "#0f172a",
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
    alignItems: "flex-start",
    marginBottom: 6,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  nombre: { fontSize: scaleFont(15), fontWeight: "700", color: "#0f172a" },
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: scaleFont(6),
    paddingVertical: 2,
  },
  statusBadgeActive: { backgroundColor: "#dcfce7" },
  statusBadgeInactive: { backgroundColor: "#fee2e2" },
  statusBadgeText: { fontSize: scaleFont(10), fontWeight: "700" },
  statusTextActive: { color: "#166534" },
  statusTextInactive: { color: "#991b1b" },
  categoria: { fontSize: scaleFont(12), color: "#64748b", marginTop: 2 },
  btnEdit: { padding: 6, marginLeft: 8 },
  btnEditText: { fontSize: scaleFont(16) },
  rolesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginVertical: 6,
  },
  roleBadge: {
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    paddingHorizontal: scaleFont(6),
    paddingVertical: 2,
  },
  roleText: { fontSize: scaleFont(10), fontWeight: "700", color: "#334155" },
  disponibilidad: {
    flexDirection: "row",
    gap: scaleFont(16),
    marginTop: 8,
    paddingTop: scaleFont(8),
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  dispItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dispLabel: { fontSize: scaleFont(12), color: "#475569", fontWeight: "600" },
  systemToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: scaleFont(8),
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  systemToggleTitle: {
    fontSize: scaleFont(12),
    fontWeight: "700",
    color: "#0f172a",
  },
  systemToggleSub: { fontSize: scaleFont(10), color: "#64748b", marginTop: 1 },
  empty: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: 60,
    fontSize: scaleFont(14),
  },
});

import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GetArbitroDTO } from "../../types";
import { arbitroService } from "../../services/arbitroService";
import { designacionService } from "../../services/designacionService";
import { scaleFont, isSmallDevice } from "../../utils/responsive";

interface Props {
  visible: boolean;
  onClose: () => void;
  onAssigned: () => void;
  idDesignacion: number;
  assignedArbitroIds: number[];
  fechaDesignacion?: string;
}

type FiltroDia = "auto" | "sabado" | "domingo" | "todos";

function getDiaSemana(fechaIso?: string): "sabado" | "domingo" | "otro" {
  if (!fechaIso) return "otro";
  const datePart = fechaIso.slice(0, 10);
  const parts = datePart.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    const day = date.getDay(); // 0 = Domingo, 6 = Sábado
    if (day === 6) return "sabado";
    if (day === 0) return "domingo";
  }
  return "otro";
}

export default function AsignarArbitroModal({
  visible,
  onClose,
  onAssigned,
  idDesignacion,
  assignedArbitroIds,
  fechaDesignacion,
}: Props) {
  const [arbitros, setArbitros] = useState<GetArbitroDTO[]>([]);
  const [ocupadosMap, setOcupadosMap] = useState<Map<number, string>>(new Map());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [search, setSearch] = useState("");
  const [filtroDia, setFiltroDia] = useState<FiltroDia>("auto");
  const [ignorarOcupados, setIgnorarOcupados] = useState(true);

  const diaDetectado = useMemo(
    () => getDiaSemana(fechaDesignacion),
    [fechaDesignacion]
  );

  useEffect(() => {
    if (visible) {
      loadData();
      setSelectedId(null);
      setSearch("");
      setFiltroDia("auto");
      setIgnorarOcupados(true);
    }
  }, [visible, idDesignacion, fechaDesignacion]);

  async function loadData() {
    setLoadingList(true);
    try {
      const [arbitrosData, designacionesData] = await Promise.all([
        arbitroService.getArbitros(),
        designacionService.getDesignaciones(true).catch(() => []),
      ]);

      setArbitros(arbitrosData);

      // Mapear árbitros ocupados en otras canchas en la misma fecha
      const newOcupadosMap = new Map<number, string>();
      if (fechaDesignacion && Array.isArray(designacionesData)) {
        const targetDate = fechaDesignacion.slice(0, 10);
        const concurrentes = designacionesData.filter(
          (d) =>
            d.idDesignacion !== idDesignacion &&
            d.estadoDesignacion !== 3 && // Excluir canceladas
            d.fecha &&
            d.fecha.slice(0, 10) === targetDate
        );

        if (concurrentes.length > 0) {
          const designadosArrays = await Promise.all(
            concurrentes.map((d) =>
              designacionService.getDesignados(d.idDesignacion).catch(() => [])
            )
          );

          concurrentes.forEach((d, idx) => {
            const arr = designadosArrays[idx] || [];
            const nombreCancha = d.cancha?.nombreCancha || "Otra cancha";
            arr.forEach((des) => {
              if (des.arbitro?.idArbitro) {
                newOcupadosMap.set(des.arbitro.idArbitro, nombreCancha);
              }
            });
          });
        }
      }

      setOcupadosMap(newOcupadosMap);
    } catch (e: any) {
      console.warn("Error cargando árbitros o designaciones concurrentes:", e);
    } finally {
      setLoadingList(false);
    }
  }

  // 1. Solo árbitros activos en el sistema
  const activos = useMemo(
    () => arbitros.filter((a) => a.estadoSistema !== false),
    [arbitros]
  );

  // 2. Excluir los ya asignados a esta designación
  const unassigned = useMemo(
    () => activos.filter((a) => !assignedArbitroIds.includes(a.idArbitro)),
    [activos, assignedArbitroIds]
  );

  // 3. Filtrar por disponibilidad (Sábado o Domingo)
  const diaEfectivo = filtroDia === "auto" ? diaDetectado : filtroDia;
  const porDisponibilidad = useMemo(() => {
    if (diaEfectivo === "sabado") {
      return unassigned.filter((a) => a.disponibleSabado);
    }
    if (diaEfectivo === "domingo") {
      return unassigned.filter((a) => a.disponibleDomingo);
    }
    return unassigned;
  }, [unassigned, diaEfectivo]);

  // 4. Ignorar árbitros ya designados en otra cancha el mismo día
  const porOcupacion = useMemo(() => {
    if (ignorarOcupados) {
      return porDisponibilidad.filter((a) => !ocupadosMap.has(a.idArbitro));
    }
    return porDisponibilidad;
  }, [porDisponibilidad, ignorarOcupados, ocupadosMap]);

  // 5. Búsqueda por texto
  const filtered = useMemo(() => {
    if (!search.trim()) return porOcupacion;
    const q = search.toLowerCase();
    return porOcupacion.filter((a) =>
      `${a.nombre} ${a.apellido} ${a.categoria || ""} ${a.whatsapp}`
        .toLowerCase()
        .includes(q)
    );
  }, [porOcupacion, search]);

  const cantidadOcupados = ocupadosMap.size;

  function handleSelectArbitro(id: number) {
    if (ocupadosMap.has(id)) {
      const canchaOcupada = ocupadosMap.get(id);
      Alert.alert(
        "Árbitro con designación previa",
        `Este árbitro ya está asignado en "${canchaOcupada}" en la misma fecha.\n\n¿Deseas seleccionarlo igualmente?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Seleccionar", onPress: () => setSelectedId(id) },
        ]
      );
      return;
    }
    setSelectedId(id);
  }

  async function handleAssign(forzar: boolean = false) {
    if (!selectedId) {
      Alert.alert("Error", "Seleccioná un árbitro para asignar");
      return;
    }

    setLoading(true);
    try {
      await designacionService.asignarArbitro(idDesignacion, selectedId, forzar);
      Alert.alert(
        "Éxito",
        forzar
          ? "Árbitro asignado forzando designación."
          : "Árbitro asignado correctamente."
      );
      onAssigned();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "";
      const esConflictoCancha =
        msg.toLowerCase().includes("cancha") ||
        msg.toLowerCase().includes("estuvo") ||
        msg.toLowerCase().includes("repet") ||
        msg.toLowerCase().includes("forzar") ||
        msg.toLowerCase().includes("antecedente") ||
        e?.response?.status === 400 ||
        e?.response?.status === 409 ||
        e?.response?.status === 422;

      if (!forzar && esConflictoCancha) {
        Alert.alert(
          "Árbitro ya estuvo en esta cancha",
          `${
            msg ||
            "El árbitro seleccionado ya estuvo designado previamente en esta cancha."
          }\n\n¿Deseás forzar la designación?`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Forzar Designación",
              style: "default",
              onPress: () => handleAssign(true),
            },
          ]
        );
      } else {
        Alert.alert("Error al asignar", msg || "No se pudo asignar el árbitro");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Encabezado */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Asignar Árbitro</Text>
              <Text style={styles.subTitle}>
                {diaDetectado === "sabado"
                  ? "📅 Jornada de Sábado · Solo activos disponibles"
                  : diaDetectado === "domingo"
                  ? "📅 Jornada de Domingo · Solo activos disponibles"
                  : "📅 Jornada deportiva · Árbitros activos"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.btnClose}>
              <Ionicons name="close" size={scaleFont(20)} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Filtros de Disponibilidad por Día */}
          <View style={styles.pillsRow}>
            <TouchableOpacity
              style={[
                styles.pill,
                diaEfectivo === "sabado" && styles.pillActive,
              ]}
              onPress={() => setFiltroDia("sabado")}
            >
              <Text
                style={[
                  styles.pillText,
                  diaEfectivo === "sabado" && styles.pillTextActive,
                ]}
              >
                Sábado {diaDetectado === "sabado" ? "✓" : ""}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pill,
                diaEfectivo === "domingo" && styles.pillActive,
              ]}
              onPress={() => setFiltroDia("domingo")}
            >
              <Text
                style={[
                  styles.pillText,
                  diaEfectivo === "domingo" && styles.pillTextActive,
                ]}
              >
                Domingo {diaDetectado === "domingo" ? "✓" : ""}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pill,
                diaEfectivo === "todos" && styles.pillActive,
              ]}
              onPress={() => setFiltroDia("todos")}
            >
              <Text
                style={[
                  styles.pillText,
                  diaEfectivo === "todos" && styles.pillTextActive,
                ]}
              >
                Todos activos
              </Text>
            </TouchableOpacity>
          </View>

          {/* Switch: Ignorar ya designados en otra cancha */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.switchLabel}>
                Ignorar ya designados hoy
              </Text>
              <Text style={styles.switchHelp}>
                {cantidadOcupados > 0
                  ? `${cantidadOcupados} árbitro(s) ya asignado(s) en otra cancha`
                  : "Sin solapamientos en otras canchas"}
              </Text>
            </View>
            <Switch
              value={ignorarOcupados}
              onValueChange={setIgnorarOcupados}
              trackColor={{ false: "#cbd5e1", true: "#0284c7" }}
              thumbColor={ignorarOcupados ? "#ffffff" : "#f1f5f9"}
            />
          </View>

          {/* Buscador */}
          <TextInput
            style={styles.search}
            placeholder="Buscar por apellido, nombre o categoría..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94a3b8"
          />

          {/* Contador de resultados */}
          <View style={styles.counterRow}>
            <Text style={styles.counterText}>
              {loadingList
                ? "Cargando árbitros..."
                : `${filtered.length} árbitro(s) disponible(s)`}
            </Text>
          </View>

          {/* Lista de Árbitros */}
          {loadingList ? (
            <ActivityIndicator
              style={{ marginVertical: 30 }}
              size="small"
              color="#1a1a2e"
            />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.idArbitro)}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="people-outline"
                    size={scaleFont(32)}
                    color="#94a3b8"
                  />
                  <Text style={styles.empty}>
                    No hay árbitros disponibles con estos filtros
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const ocupadoEn = ocupadosMap.get(item.idArbitro);
                const isSelected = selectedId === item.idArbitro;

                return (
                  <TouchableOpacity
                    style={[
                      styles.item,
                      isSelected && styles.itemSelected,
                      ocupadoEn && !isSelected && styles.itemOcupado,
                    ]}
                    onPress={() => handleSelectArbitro(item.idArbitro)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemNombre}>
                        {item.apellido}, {item.nombre}
                      </Text>
                      <Text style={styles.itemCat}>
                        {item.categoria || "Sin cat"} · 📱 {item.whatsapp}
                      </Text>

                      {/* Disponibilidad e info */}
                      <View style={styles.tagsRow}>
                        {item.disponibleSabado && (
                          <View style={styles.tagSab}>
                            <Text style={styles.tagSabText}>Sáb ✓</Text>
                          </View>
                        )}
                        {item.disponibleDomingo && (
                          <View style={styles.tagDom}>
                            <Text style={styles.tagDomText}>Dom ✓</Text>
                          </View>
                        )}
                        {item.tieneAuto && (
                          <View style={styles.tagAuto}>
                            <Text style={styles.tagAutoText}>🚗 Auto</Text>
                          </View>
                        )}
                        {ocupadoEn && (
                          <View style={styles.tagOcupado}>
                            <Text style={styles.tagOcupadoText}>
                              ⚠️ En: {ocupadoEn}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={scaleFont(22)}
                        color="#0f172a"
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Acciones */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.btnCancel}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btnSave,
                (!selectedId || loading) && styles.btnSaveDisabled,
              ]}
              onPress={() => handleAssign(false)}
              disabled={loading || !selectedId}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnSaveText}>Asignar Árbitro</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: scaleFont(14),
  },
  modal: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    width: "100%",
    maxHeight: "90%",
    padding: scaleFont(16),
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: scaleFont(10),
  },
  title: {
    fontSize: scaleFont(17),
    fontWeight: "bold",
    color: "#0f172a",
    includeFontPadding: false,
  },
  subTitle: {
    fontSize: scaleFont(11.5),
    color: "#64748b",
    marginTop: 2,
    includeFontPadding: false,
  },
  btnClose: {
    padding: 4,
  },
  pillsRow: {
    flexDirection: "row",
    gap: scaleFont(6),
    marginBottom: scaleFont(10),
  },
  pill: {
    paddingVertical: scaleFont(5),
    paddingHorizontal: scaleFont(10),
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  pillActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  pillText: {
    fontSize: scaleFont(11),
    fontWeight: "600",
    color: "#475569",
    includeFontPadding: false,
  },
  pillTextActive: {
    color: "#ffffff",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    paddingVertical: scaleFont(6),
    paddingHorizontal: scaleFont(10),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: scaleFont(10),
  },
  switchLabel: {
    fontSize: scaleFont(12),
    fontWeight: "700",
    color: "#1e293b",
    includeFontPadding: false,
  },
  switchHelp: {
    fontSize: scaleFont(10),
    color: "#64748b",
    marginTop: 1,
    includeFontPadding: false,
  },
  search: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingVertical: scaleFont(7),
    paddingHorizontal: scaleFont(10),
    fontSize: scaleFont(12.5),
    backgroundColor: "#f8fafc",
    marginBottom: scaleFont(6),
    color: "#0f172a",
  },
  counterRow: {
    marginBottom: scaleFont(6),
  },
  counterText: {
    fontSize: scaleFont(10.5),
    color: "#64748b",
    fontWeight: "600",
    includeFontPadding: false,
  },
  list: {
    maxHeight: scaleFont(240),
    marginBottom: scaleFont(10),
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: scaleFont(10),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    marginBottom: scaleFont(6),
  },
  itemSelected: {
    backgroundColor: "#f1f5f9",
    borderColor: "#0f172a",
  },
  itemOcupado: {
    backgroundColor: "#fffbeb",
    borderColor: "#fef3c7",
  },
  itemNombre: {
    fontSize: scaleFont(13.5),
    fontWeight: "700",
    color: "#0f172a",
    includeFontPadding: false,
  },
  itemCat: {
    fontSize: scaleFont(11),
    color: "#64748b",
    marginTop: 2,
    includeFontPadding: false,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  tagSab: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagSabText: {
    fontSize: scaleFont(9.5),
    color: "#15803d",
    fontWeight: "600",
    includeFontPadding: false,
  },
  tagDom: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagDomText: {
    fontSize: scaleFont(9.5),
    color: "#0369a1",
    fontWeight: "600",
    includeFontPadding: false,
  },
  tagAuto: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagAutoText: {
    fontSize: scaleFont(9.5),
    color: "#475569",
    includeFontPadding: false,
  },
  tagOcupado: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagOcupadoText: {
    fontSize: scaleFont(9.5),
    color: "#b45309",
    fontWeight: "700",
    includeFontPadding: false,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scaleFont(24),
  },
  empty: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: scaleFont(8),
    fontSize: scaleFont(12),
    includeFontPadding: false,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: scaleFont(8),
    marginTop: scaleFont(6),
  },
  btnCancel: {
    paddingVertical: scaleFont(9),
    paddingHorizontal: scaleFont(14),
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  btnCancelText: {
    color: "#475569",
    fontWeight: "700",
    fontSize: scaleFont(12.5),
    includeFontPadding: false,
  },
  btnSave: {
    backgroundColor: "#0f172a",
    paddingVertical: scaleFont(9),
    paddingHorizontal: scaleFont(16),
    borderRadius: 8,
  },
  btnSaveDisabled: {
    opacity: 0.5,
  },
  btnSaveText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: scaleFont(12.5),
    includeFontPadding: false,
  },
});

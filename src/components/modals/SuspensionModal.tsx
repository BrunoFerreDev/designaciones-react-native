import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { GetArbitroDTO, GetCanchaDTO, TipoSuspencion } from "../../types";
import { arbitroService } from "../../services/arbitroService";
import { canchaService } from "../../services/canchaService";
import { suspensionService } from "../../services/suspensionService";
import DropdownSelect from "../common/DropdownSelect";
import DateTimePickerField from "../common/DateTimePickerField";
import { scaleFont } from "../../utils/responsive";
import tw from "../../theme/tailwind";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function getFechaActualSinSegundos(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export default function SuspensionModal({ visible, onClose, onSaved }: Props) {
  const [arbitros, setArbitros] = useState<GetArbitroDTO[]>([]);
  const [canchas, setCanchas] = useState<GetCanchaDTO[]>([]);
  const [idArbitro, setIdArbitro] = useState<number>(0);
  const [idCancha, setIdCancha] = useState<number>(0);
  const [fechaIncidente, setFechaIncidente] = useState("");
  const [cantidadDias, setCantidadDias] = useState("7");
  const [tipoSuspencion, setTipoSuspencion] = useState<TipoSuspencion>(2);
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
      setFechaIncidente(getFechaActualSinSegundos());
      setCantidadDias("7");
      setTipoSuspencion(2);
      setMotivo("");
    }
  }, [visible]);

  async function loadData() {
    try {
      const [arbs, cans] = await Promise.all([
        arbitroService.getArbitros(),
        canchaService.getCanchas(),
      ]);
      setArbitros(arbs);
      setCanchas(cans);
      if (arbs.length > 0) setIdArbitro(arbs[0].idArbitro);
      if (cans.length > 0) setIdCancha(cans[0].idCancha);
    } catch (e: any) {
      console.warn("Error cargando listas para suspension:", e);
    }
  }

  async function handleSave() {
    if (!idArbitro || !idCancha) {
      Alert.alert("Error", "Seleccioná un árbitro y una cancha");
      return;
    }
    const dias = parseInt(cantidadDias, 10);
    if (isNaN(dias) || dias <= 0) {
      Alert.alert("Error", "Cantidad de días inválida");
      return;
    }
    if (!motivo.trim()) {
      Alert.alert("Error", "Ingresá el motivo de la sanción");
      return;
    }

    const fechaIso =
      fechaIncidente.trim().length === 16
        ? `${fechaIncidente.trim()}:00`
        : fechaIncidente.trim();

    setLoading(true);
    try {
      await suspensionService.createSuspension(idArbitro, {
        arbitro: idArbitro,
        cancha: idCancha,
        fechaIncidente: fechaIso,
        cantidadDias: dias,
        motivo: motivo.trim(),
        tipoSuspencion,
      });

      onSaved();
      onClose();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Error al registrar sanción";
      Alert.alert("Error al registrar sanción", msg);
    } finally {
      setLoading(false);
    }
  }

  const arbitroItems = arbitros.map((a) => ({
    label: `${a.apellido}, ${a.nombre}`,
    value: a.idArbitro,
    subtitle: `${a.categoria || "Sin cat"} · 📱 ${a.whatsapp}`,
  }));

  const canchaItems = canchas.map((c) => ({
    label: c.nombreCancha,
    value: c.idCancha,
    subtitle: c.categoria,
  }));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Nueva Sanción / Suspensión</Text>

          <ScrollView
            style={styles.form}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <DropdownSelect
              label="Árbitro Sancionado"
              items={arbitroItems}
              selectedValue={idArbitro}
              onSelect={setIdArbitro}
              placeholder="Seleccionar árbitro..."
            />

            <DropdownSelect
              label="Cancha del Incidente"
              items={canchaItems}
              selectedValue={idCancha}
              onSelect={setIdCancha}
              placeholder="Seleccionar cancha..."
            />

            <Text style={styles.label}>Tipo de Sanción</Text>
            <View style={[styles.pillContainer, tw`flex-row flex-wrap gap-2`]}>
              <TouchableOpacity
                style={[
                  styles.pill,
                  tipoSuspencion === 2 && styles.pillDanger,
                  { minWidth: scaleFont(120) },
                ]}
                onPress={() => setTipoSuspencion(2)}
              >
                <Text
                  style={[
                    styles.pillText,
                    tipoSuspencion === 2 && styles.pillTextActive,
                  ]}
                >
                  Suspensión
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pill,
                  tipoSuspencion === 1 && styles.pillWarning,
                ]}
                onPress={() => setTipoSuspencion(1)}
              >
                <Text
                  style={[
                    styles.pillText,
                    tipoSuspencion === 1 && styles.pillTextActive,
                  ]}
                >
                  Llamado de atención
                </Text>
              </TouchableOpacity>
            </View>

            <DateTimePickerField
              label="Fecha y Hora del Incidente *"
              value={fechaIncidente}
              onChange={setFechaIncidente}
              hint="Selector interactivo estándar (sin segundos)"
            />

            <Text style={styles.label}>Días de Suspensión</Text>
            <TextInput
              style={styles.input}
              value={cantidadDias}
              onChangeText={setCantidadDias}
              keyboardType="numeric"
              placeholder="Ej: 15"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Motivo *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Detalle de la falta o informe arbitral"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
            />
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.btnCancel}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnSave}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnSaveText}>Registrar</Text>
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: scaleFont(12),
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    padding: scaleFont(18),
    elevation: 5,
  },
  title: {
    fontSize: scaleFont(18),
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 12,
  },
  form: { maxHeight: scaleFont(640) },
  label: {
    fontSize: scaleFont(12),
    fontWeight: "700",
    color: "#475569",
    marginTop: 10,
    marginBottom: 2,
  },
  hint: {
    fontSize: scaleFont(11),
    color: "#64748b",
    marginTop: 2,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: scaleFont(9),
    fontSize: scaleFont(14),
    backgroundColor: "#f8fafc",
    color: "#0f172a",
  },
  textArea: {
    height: scaleFont(60),
    textAlignVertical: "top",
    marginBottom: 6,
  },
  pillContainer: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pill: {
    paddingHorizontal: scaleFont(10),
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
    marginBottom: 4,
  },
  pillDanger: { backgroundColor: "#ef4444" },
  pillWarning: { backgroundColor: "#f59e0b" },
  pillText: {
    minWidth: scaleFont(120),
    fontSize: scaleFont(12),
    color: "#334155",
    textAlign: "center",
    fontWeight: "600",
  },
  pillTextActive: {
    minWidth: scaleFont(120),
    textAlign: "center",
    color: "#fff",
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },
  btnCancel: {
    paddingVertical: scaleFont(10),
    paddingHorizontal: scaleFont(16),
    borderRadius: 8,
    backgroundColor: "#e2e8f0",
  },
  btnCancelText: {
    color: "#475569",
    fontWeight: "700",
    fontSize: scaleFont(13),
  },
  btnSave: {
    backgroundColor: "#1a1a2e",
    paddingVertical: scaleFont(10),
    paddingHorizontal: scaleFont(18),
    borderRadius: 8,
  },
  btnSaveText: { color: "#fff", fontWeight: "700", fontSize: scaleFont(13) },
});

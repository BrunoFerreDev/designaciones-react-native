import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { GetCanchaDTO, GetDesignacionDTO, EtapaCampeonato } from '../../types';
import { canchaService } from '../../services/canchaService';
import { designacionService } from '../../services/designacionService';
import DropdownSelect from '../common/DropdownSelect';
import DateTimePickerField from '../common/DateTimePickerField';
import { scaleFont } from '../../utils/responsive';
import tw from '../../theme/tailwind';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  designacionToEdit?: GetDesignacionDTO | null;
}

const ETAPAS: EtapaCampeonato[] = [
  'FECHA_NORMAL', 'FECHA_PICANTE', 'CLASIFICACION', 'CRUCES', 'SEMIFINAL', 'FINAL',
];

function getFechaActualSinSegundos(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export default function DesignacionModal({ visible, onClose, onSaved, designacionToEdit }: Props) {
  const [canchas, setCanchas] = useState<GetCanchaDTO[]>([]);
  const [idCancha, setIdCancha] = useState<number>(0);
  const [fecha, setFecha] = useState('');
  const [cantidadPartidos, setCantidadPartidos] = useState('1');
  const [etapa, setEtapa] = useState<EtapaCampeonato>('FECHA_NORMAL');
  const [detalle, setDetalle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCanchas();
      if (designacionToEdit) {
        setIdCancha(designacionToEdit.cancha?.idCancha ?? designacionToEdit.idCanchaH ?? 0);
        const f = designacionToEdit.fecha ? designacionToEdit.fecha.slice(0, 16) : getFechaActualSinSegundos();
        setFecha(f);
        setCantidadPartidos(String(designacionToEdit.cantidadPartidos || 1));
        setEtapa(designacionToEdit.etapaCampeonato || 'FECHA_NORMAL');
        setDetalle(designacionToEdit.detalleDesignacion || designacionToEdit.detalleExtra || '');
      } else {
        setFecha(getFechaActualSinSegundos());
        setCantidadPartidos('1');
        setEtapa('FECHA_NORMAL');
        setDetalle('');
      }
    }
  }, [visible, designacionToEdit]);

  async function loadCanchas() {
    try {
      const data = await canchaService.getCanchas();
      setCanchas(data);
      if (data.length > 0 && !designacionToEdit) {
        setIdCancha(data[0].idCancha);
      }
    } catch (e: any) {
      console.warn('Error cargando canchas:', e);
    }
  }

  async function handleSave() {
    if (!idCancha) {
      Alert.alert('Error', 'Debes seleccionar una cancha');
      return;
    }
    const partidos = parseInt(cantidadPartidos, 10);
    if (isNaN(partidos) || partidos <= 0) {
      Alert.alert('Error', 'Cantidad de partidos inválida');
      return;
    }
    if (!fecha.trim()) {
      Alert.alert('Error', 'Ingresá fecha y hora');
      return;
    }

    const fechaIso = fecha.trim().length === 16 ? `${fecha.trim()}:00` : fecha.trim();

    setLoading(true);
    try {
      if (designacionToEdit) {
        await designacionService.updateDesignacion(designacionToEdit.idDesignacion, {
          idCancha,
          fecha: fechaIso,
          cantidadPartidos: partidos,
          etapaCampeonato: etapa,
          detalle: detalle.trim() || undefined,
        });
      } else {
        await designacionService.createDesignacion({
          idCancha,
          fecha: fechaIso,
          cantidadPartidos: partidos,
          etapaCampeonato: etapa,
          detalle: detalle.trim() || undefined,
        });
      }

      onSaved();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Error al guardar';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  const canchaItems = canchas.map((c) => ({
    label: c.nombreCancha,
    value: c.idCancha,
    subtitle: `${c.categoria} ${c.necesitaViaje ? '· Requiere viaje' : ''}`,
  }));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            {designacionToEdit ? 'Editar Designación' : 'Nueva Designación'}
          </Text>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <DropdownSelect
              label="Cancha / Predio"
              items={canchaItems}
              selectedValue={idCancha}
              onSelect={setIdCancha}
              placeholder="Seleccionar cancha..."
            />

            <DateTimePickerField
              label="Fecha y Hora de la Jornada *"
              value={fecha}
              onChange={setFecha}
              hint="Selector interactivo estándar (sin segundos)"
            />

            <Text style={styles.label}>Cantidad de Partidos</Text>
            <TextInput
              style={styles.input}
              value={cantidadPartidos}
              onChangeText={setCantidadPartidos}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Etapa del Campeonato</Text>
            <View style={styles.pillContainer}>
              {ETAPAS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.pill, etapa === e && styles.pillActive]}
                  onPress={() => setEtapa(e)}
                >
                  <Text style={[styles.pillText, etapa === e && styles.pillTextActive]}>
                    {e.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Detalle / Observaciones</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={detalle}
              onChangeText={setDetalle}
              placeholder="Notas u observaciones de la jornada"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
            />
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose} disabled={loading}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSave} onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnSaveText}>Guardar</Text>
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
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: scaleFont(16),
  },
  modal: {
    backgroundColor: '#fff', borderRadius: 16, width: '100%',
    maxHeight: '90%', padding: scaleFont(18), elevation: 5,
  },
  title: { fontSize: scaleFont(18), fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  form: { maxHeight: scaleFont(440) },
  label: { fontSize: scaleFont(12), fontWeight: '700', color: '#475569', marginTop: 12, marginBottom: 6 },
  hint: { fontSize: scaleFont(11), color: '#64748b', marginTop: 2, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8,
    padding: scaleFont(10), fontSize: scaleFont(14), backgroundColor: '#f8fafc', color: '#0f172a',
  },
  textArea: { height: scaleFont(60), textAlignVertical: 'top' },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    paddingHorizontal: scaleFont(10), paddingVertical: 5, borderRadius: 20,
    backgroundColor: '#e2e8f0', marginBottom: 4,
  },
  pillActive: { backgroundColor: '#1a1a2e' },
  pillText: { fontSize: scaleFont(11), color: '#334155' },
  pillTextActive: { color: '#fff', fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  btnCancel: { paddingVertical: scaleFont(10), paddingHorizontal: scaleFont(16), borderRadius: 8, backgroundColor: '#e2e8f0' },
  btnCancelText: { color: '#475569', fontWeight: '700', fontSize: scaleFont(13) },
  btnSave: { backgroundColor: '#1a1a2e', paddingVertical: scaleFont(10), paddingHorizontal: scaleFont(18), borderRadius: 8 },
  btnSaveText: { color: '#fff', fontWeight: '700', fontSize: scaleFont(13) },
});

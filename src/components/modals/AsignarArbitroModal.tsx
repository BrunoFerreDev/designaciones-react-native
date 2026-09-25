import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { GetArbitroDTO } from '../../types';
import { arbitroService } from '../../services/arbitroService';
import { designacionService } from '../../services/designacionService';
import { scaleFont } from '../../utils/responsive';
import tw from '../../theme/tailwind';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAssigned: () => void;
  idDesignacion: number;
  assignedArbitroIds: number[];
}

export default function AsignarArbitroModal({
  visible, onClose, onAssigned, idDesignacion, assignedArbitroIds,
}: Props) {
  const [arbitros, setArbitros] = useState<GetArbitroDTO[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) {
      loadArbitros();
      setSelectedId(null);
      setSearch('');
    }
  }, [visible]);

  async function loadArbitros() {
    setLoadingList(true);
    try {
      const data = await arbitroService.getArbitros();
      setArbitros(data);
    } catch (e: any) {
      console.warn('Error cargando arbitros:', e);
    } finally {
      setLoadingList(false);
    }
  }

  const unassigned = arbitros.filter((a) => !assignedArbitroIds.includes(a.idArbitro));
  const filtered = unassigned.filter((a) =>
    `${a.nombre} ${a.apellido} ${a.categoria || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAssign(forzar: boolean = false) {
    if (!selectedId) {
      Alert.alert('Error', 'Seleccioná un árbitro para asignar');
      return;
    }

    setLoading(true);
    try {
      await designacionService.asignarArbitro(idDesignacion, selectedId, forzar);
      Alert.alert('Éxito', forzar ? 'Árbitro asignado forzando designación.' : 'Árbitro asignado correctamente.');
      onAssigned();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      const esConflictoCancha =
        msg.toLowerCase().includes('cancha') ||
        msg.toLowerCase().includes('estuvo') ||
        msg.toLowerCase().includes('repet') ||
        msg.toLowerCase().includes('forzar') ||
        msg.toLowerCase().includes('antecedente') ||
        e?.response?.status === 400 ||
        e?.response?.status === 409 ||
        e?.response?.status === 422;

      if (!forzar && esConflictoCancha) {
        Alert.alert(
          'Árbitro ya estuvo en esta cancha',
          `${msg || 'El árbitro seleccionado ya estuvo designado previamente en esta cancha.'}\n\n¿Deseás forzar la designación?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Forzar Designación',
              style: 'default',
              onPress: () => handleAssign(true),
            },
          ]
        );
      } else {
        Alert.alert('Error al asignar', msg || 'No se pudo asignar el árbitro');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Asignar Árbitro a Jornada</Text>

          <TextInput
            style={styles.search}
            placeholder="Buscar por apellido o categoría..."
            value={search}
            onChangeText={setSearch}
          />

          {loadingList ? (
            <ActivityIndicator style={{ marginVertical: 30 }} size="small" color="#1a1a2e" />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.idArbitro)}
              style={styles.list}
              ListEmptyComponent={
                <Text style={styles.empty}>No hay árbitros disponibles para asignar</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.item, selectedId === item.idArbitro && styles.itemSelected]}
                  onPress={() => setSelectedId(item.idArbitro)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemNombre}>{item.apellido}, {item.nombre}</Text>
                    <Text style={styles.itemCat}>{item.categoria || 'Sin cat'} · 📱 {item.whatsapp}</Text>
                  </View>
                  {selectedId === item.idArbitro && (
                    <Text style={styles.check}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose} disabled={loading}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSave} onPress={() => handleAssign(false)} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnSaveText}>Asignar</Text>
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
    maxHeight: '85%', padding: scaleFont(18), elevation: 5,
  },
  title: { fontSize: scaleFont(17), fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  search: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8,
    padding: scaleFont(8), fontSize: scaleFont(13), backgroundColor: '#f8fafc', marginBottom: 10, color: '#0f172a',
  },
  list: { maxHeight: scaleFont(280), marginBottom: 10 },
  item: {
    flexDirection: 'row', alignItems: 'center', padding: scaleFont(10),
    borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 6,
  },
  itemSelected: { backgroundColor: '#f1f5f9', borderColor: '#1a1a2e' },
  itemNombre: { fontSize: scaleFont(14), fontWeight: '700', color: '#0f172a' },
  itemCat: { fontSize: scaleFont(11), color: '#64748b', marginTop: 2 },
  check: { fontSize: scaleFont(16), fontWeight: 'bold', color: '#1a1a2e', marginLeft: 8 },
  empty: { textAlign: 'center', color: '#94a3b8', marginVertical: 20, fontSize: scaleFont(13) },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  btnCancel: { paddingVertical: scaleFont(10), paddingHorizontal: scaleFont(16), borderRadius: 8, backgroundColor: '#e2e8f0' },
  btnCancelText: { color: '#475569', fontWeight: '700', fontSize: scaleFont(13) },
  btnSave: { backgroundColor: '#1a1a2e', paddingVertical: scaleFont(10), paddingHorizontal: scaleFont(18), borderRadius: 8 },
  btnSaveText: { color: '#fff', fontWeight: '700', fontSize: scaleFont(13) },
});

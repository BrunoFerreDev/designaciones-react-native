import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { GetCanchaDTO, CategoriaCancha, CanchaDTO } from '../../types';
import { canchaService } from '../../services/canchaService';
import { scaleFont } from '../../utils/responsive';
import tw from '../../theme/tailwind';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  canchaToEdit?: GetCanchaDTO | null;
}

const CATEGORIAS_CANCHA: CategoriaCancha[] = ['FUTBOL_11', 'FUTBOL_10', 'FUTBOL_9'];

export default function CanchaModal({ visible, onClose, onSaved, canchaToEdit }: Props) {
  const [nombreCancha, setNombreCancha] = useState('');
  const [categoria, setCategoria] = useState<CategoriaCancha>('FUTBOL_11');
  const [fueraDeJuego, setFueraDeJuego] = useState(false);
  const [estado, setEstado] = useState(true);
  const [necesitaViaje, setNecesitaViaje] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (canchaToEdit) {
        setNombreCancha(canchaToEdit.nombreCancha || '');
        setCategoria(canchaToEdit.categoria || 'FUTBOL_11');
        setFueraDeJuego(Boolean(canchaToEdit.fueraDeJuego));
        setEstado(Boolean(canchaToEdit.estado));
        setNecesitaViaje(Boolean(canchaToEdit.necesitaViaje));
      } else {
        setNombreCancha('');
        setCategoria('FUTBOL_11');
        setFueraDeJuego(false);
        setEstado(true);
        setNecesitaViaje(false);
      }
    }
  }, [visible, canchaToEdit]);

  async function handleSave() {
    if (!nombreCancha.trim()) {
      Alert.alert('Error', 'Ingresá el nombre o predio de la cancha');
      return;
    }

    setLoading(true);
    try {
      const payload: CanchaDTO = {
        nombreCancha: nombreCancha.trim(),
        categoria,
        fueraDeJuego,
        estado,
        necesitaViaje,
      };

      if (canchaToEdit) {
        await canchaService.updateCancha(canchaToEdit.idCancha, payload);
        Alert.alert('Éxito', 'Cancha actualizada correctamente');
      } else {
        await canchaService.createCancha(payload);
        Alert.alert('Éxito', 'Cancha creada correctamente');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Error al guardar cancha';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>
            {canchaToEdit ? 'Editar Cancha' : 'Nueva Cancha'}
          </Text>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Nombre / Predio *</Text>
            <TextInput
              style={styles.input}
              value={nombreCancha}
              onChangeText={setNombreCancha}
              placeholder="Ej: Predio Don Bosco - Cancha 1"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Modalidad / Categoría</Text>
            <View style={styles.categoryRow}>
              {CATEGORIAS_CANCHA.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryBtn, categoria === cat && styles.categoryBtnActive]}
                  onPress={() => setCategoria(cat)}
                >
                  <Text style={[styles.categoryBtnText, categoria === cat && styles.categoryBtnTextActive]}>
                    {cat.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Estado Activa</Text>
                <Text style={styles.switchSub}>Habilitada para designaciones</Text>
              </View>
              <Switch
                value={estado}
                onValueChange={setEstado}
                trackColor={{ false: '#d1d5db', true: '#27ae60' }}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Regla Fuera de Juego (Offside)</Text>
                <Text style={styles.switchSub}>Aplica regla de offside en partidos</Text>
              </View>
              <Switch
                value={fueraDeJuego}
                onValueChange={setFueraDeJuego}
                trackColor={{ false: '#d1d5db', true: '#3498db' }}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Requiere Viáticos / Viaje</Text>
                <Text style={styles.switchSub}>Predio distante que añade plus de traslado</Text>
              </View>
              <Switch
                value={necesitaViaje}
                onValueChange={setNecesitaViaje}
                trackColor={{ false: '#d1d5db', true: '#f39c12' }}
              />
            </View>
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnSave]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnSaveText}>
                  {canchaToEdit ? 'Actualizar' : 'Crear'}
                </Text>
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
  modalBox: {
    backgroundColor: '#fff', borderRadius: 16, padding: scaleFont(20),
    width: '100%', maxWidth: 500, maxHeight: '85%', elevation: 5,
  },
  title: { fontSize: scaleFont(18), fontWeight: 'bold', color: '#0f172a', marginBottom: 14 },
  form: { marginBottom: 16 },
  label: { fontSize: scaleFont(12), fontWeight: '700', color: '#475569', marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1',
    borderRadius: 8, paddingHorizontal: scaleFont(12), paddingVertical: scaleFont(10),
    fontSize: scaleFont(14), color: '#0f172a',
  },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  categoryBtn: {
    flex: 1, paddingVertical: scaleFont(10), borderRadius: 8,
    borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', backgroundColor: '#f8fafc',
  },
  categoryBtnActive: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  categoryBtnText: { fontSize: scaleFont(11), fontWeight: '700', color: '#64748b' },
  categoryBtnTextActive: { color: '#fff' },
  switchRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: scaleFont(10),
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  switchLabel: { fontSize: scaleFont(13), fontWeight: '700', color: '#0f172a' },
  switchSub: { fontSize: scaleFont(11), color: '#64748b', marginTop: 2 },
  btnRow: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 10 },
  btn: { paddingVertical: scaleFont(10), paddingHorizontal: scaleFont(18), borderRadius: 8, minWidth: 90, alignItems: 'center' },
  btnCancel: { backgroundColor: '#e2e8f0' },
  btnCancelText: { color: '#475569', fontWeight: 'bold', fontSize: scaleFont(13) },
  btnSave: { backgroundColor: '#1a1a2e' },
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: scaleFont(13) },
});

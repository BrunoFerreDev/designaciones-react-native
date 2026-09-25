import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { GetArbitroDTO, CategoriaArbitro, RolUsuario } from '../../types';
import { arbitroService } from '../../services/arbitroService';
import { scaleFont } from '../../utils/responsive';
import tw from '../../theme/tailwind';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  arbitroToEdit?: GetArbitroDTO | null;
}

const CATEGORIAS: CategoriaArbitro[] = [
  'AVANZADO', 'INTERMEDIO', 'PRINCIPAL_1', 'PRINCIPAL_2',
  'PRINCIPAL_3', 'PRINCIPAL_4', 'ASISTENTE', 'INICIAL',
];

const ROLES: RolUsuario[] = ['ARBITRO', 'DESIGNADOR', 'SECRETARIO', 'PRESIDENTE'];

export default function ArbitroModal({ visible, onClose, onSaved, arbitroToEdit }: Props) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [categoria, setCategoria] = useState<CategoriaArbitro>('INICIAL');
  const [roles, setRoles] = useState<RolUsuario[]>(['ARBITRO']);
  const [talleCamiseta, setTalleCamiseta] = useState('L');
  const [talleShort, setTalleShort] = useState('L');
  const [tieneAuto, setTieneAuto] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (arbitroToEdit) {
        setNombre(arbitroToEdit.nombre || '');
        setApellido(arbitroToEdit.apellido || '');
        setWhatsapp(arbitroToEdit.whatsapp || '');
        setContrasenia('');
        setCategoria((arbitroToEdit.categoria as CategoriaArbitro) || 'INICIAL');
        setRoles(Array.isArray(arbitroToEdit.roles) ? arbitroToEdit.roles : ['ARBITRO']);
        setTalleCamiseta(arbitroToEdit.talleCamiseta || 'L');
        setTalleShort(arbitroToEdit.talleShort || 'L');
        setTieneAuto(Boolean(arbitroToEdit.tieneAuto));
      } else {
        setNombre('');
        setApellido('');
        setWhatsapp('');
        setContrasenia('123456');
        setCategoria('INICIAL');
        setRoles(['ARBITRO']);
        setTalleCamiseta('L');
        setTalleShort('L');
        setTieneAuto(false);
      }
    }
  }, [visible, arbitroToEdit]);

  function toggleRol(r: RolUsuario) {
    if (roles.includes(r)) {
      if (roles.length === 1) return;
      setRoles(roles.filter((x) => x !== r));
    } else {
      setRoles([...roles, r]);
    }
  }

  async function handleSave() {
    if (!nombre.trim() || !apellido.trim() || !whatsapp.trim()) {
      Alert.alert('Error', 'Completá nombre, apellido y WhatsApp');
      return;
    }
    if (!arbitroToEdit && !contrasenia.trim()) {
      Alert.alert('Error', 'Ingresá una contraseña inicial');
      return;
    }

    setLoading(true);
    try {
      if (arbitroToEdit) {
        await arbitroService.updateArbitro(arbitroToEdit.idArbitro, {
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          whatsapp: whatsapp.trim(),
          talleCamiseta,
          talleShort,
          categoria,
          tieneAuto,
          roles,
        });
      } else {
        await arbitroService.createArbitro({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          whatsapp: whatsapp.trim(),
          contrasenia,
          talleCamiseta,
          talleShort,
          categoria,
          tieneAuto,
          roles,
        });
      }

      onSaved();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Error al guardar árbitro';
      Alert.alert('Error al guardar árbitro', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            {arbitroToEdit ? 'Editar Árbitro' : 'Nuevo Árbitro'}
          </Text>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej: Juan"
              placeholderTextColor="#94a3b8"
              autoCapitalize="words"
            />

            <Text style={styles.label}>Apellido *</Text>
            <TextInput
              style={styles.input}
              value={apellido}
              onChangeText={setApellido}
              placeholder="Ej: Pérez"
              placeholderTextColor="#94a3b8"
              autoCapitalize="words"
            />

            <Text style={styles.label}>WhatsApp / Teléfono *</Text>
            <TextInput
              style={styles.input}
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="Ej: 5491123456789"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {!arbitroToEdit && (
              <>
                <Text style={styles.label}>Contraseña Inicial *</Text>
                <TextInput
                  style={styles.input}
                  value={contrasenia}
                  onChangeText={setContrasenia}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </>
            )}

            <Text style={styles.label}>Categoría</Text>
            <View style={styles.pillContainer}>
              {CATEGORIAS.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.pill, categoria === cat && styles.pillActive]}
                  onPress={() => setCategoria(cat)}
                >
                  <Text style={[styles.pillText, categoria === cat && styles.pillTextActive]}>
                    {cat.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Roles</Text>
            <View style={styles.pillContainer}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.pill, roles.includes(r) && styles.pillActive]}
                  onPress={() => toggleRol(r)}
                >
                  <Text style={[styles.pillText, roles.includes(r) && styles.pillTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Talle Camiseta</Text>
                <TextInput
                  style={styles.input}
                  value={talleCamiseta}
                  onChangeText={setTalleCamiseta}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Talle Short</Text>
                <TextInput
                  style={styles.input}
                  value={talleShort}
                  onChangeText={setTalleShort}
                />
              </View>
            </View>

            <View style={[styles.row, { alignItems: 'center', marginTop: 12 }]}>
              <Text style={[styles.label, { flex: 1, marginTop: 0 }]}>Cuenta con Vehículo</Text>
              <Switch value={tieneAuto} onValueChange={setTieneAuto} />
            </View>
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
  title: { fontSize: scaleFont(18), fontWeight: 'bold', color: '#0f172a', marginBottom: 14 },
  form: { maxHeight: scaleFont(440) },
  label: { fontSize: scaleFont(12), fontWeight: '700', color: '#475569', marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8,
    padding: scaleFont(9), fontSize: scaleFont(14), backgroundColor: '#f8fafc', color: '#0f172a',
  },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    paddingHorizontal: scaleFont(10), paddingVertical: 5, borderRadius: 16,
    backgroundColor: '#e2e8f0', marginBottom: 4,
  },
  pillActive: { backgroundColor: '#1a1a2e' },
  pillText: { fontSize: scaleFont(11), color: '#334155' },
  pillTextActive: { color: '#fff', fontWeight: '600' },
  row: { flexDirection: 'row', marginTop: 6 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  btnCancel: { paddingVertical: scaleFont(10), paddingHorizontal: scaleFont(16), borderRadius: 8, backgroundColor: '#e2e8f0' },
  btnCancelText: { color: '#475569', fontWeight: '700', fontSize: scaleFont(13) },
  btnSave: { backgroundColor: '#1a1a2e', paddingVertical: scaleFont(10), paddingHorizontal: scaleFont(18), borderRadius: 8 },
  btnSaveText: { color: '#fff', fontWeight: '700', fontSize: scaleFont(13) },
});

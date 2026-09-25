import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ScrollView,
} from 'react-native';
import { scaleFont } from '../../utils/responsive';
import tw from '../../theme/tailwind';

export interface DropdownItem {
  label: string;
  value: number | string;
  subtitle?: string;
}

interface Props {
  label: string;
  items: DropdownItem[];
  selectedValue: number | string;
  onSelect: (val: any) => void;
  placeholder?: string;
}

export default function DropdownSelect({
  label, items, selectedValue, onSelect, placeholder = 'Seleccionar...',
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedItem = items.find((i) => i.value === selectedValue);

  const filtered = items.filter((i) =>
    `${i.label} ${i.subtitle || ''}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* Caja desplegable */}
      <TouchableOpacity
        style={[styles.box, open && styles.boxOpen]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
      >
        <Text style={[styles.boxText, !selectedItem && styles.placeholder]}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Text style={styles.arrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Menú desplegable */}
      {open && (
        <View style={styles.dropdown}>
          {items.length > 5 && (
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar en la lista..."
              value={query}
              onChangeText={setQuery}
              autoFocus={false}
            />
          )}

          <ScrollView style={styles.list} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {filtered.length === 0 ? (
              <Text style={styles.empty}>Sin resultados</Text>
            ) : (
              filtered.map((item) => {
                const isSelected = item.value === selectedValue;
                return (
                  <TouchableOpacity
                    key={String(item.value)}
                    style={[styles.item, isSelected && styles.itemSelected]}
                    onPress={() => {
                      onSelect(item.value);
                      setOpen(false);
                      setQuery('');
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>
                        {item.label}
                      </Text>
                      {item.subtitle ? (
                        <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                      ) : null}
                    </View>
                    {isSelected && <Text style={styles.check}>✓</Text>}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10, marginBottom: 4 },
  label: { fontSize: scaleFont(12), fontWeight: '700', color: '#475569', marginBottom: 6 },
  box: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8,
    paddingVertical: scaleFont(10), paddingHorizontal: scaleFont(12), backgroundColor: '#f8fafc',
  },
  boxOpen: { borderColor: '#1a1a2e', backgroundColor: '#fff' },
  boxText: { fontSize: scaleFont(13), color: '#0f172a', fontWeight: '600', flex: 1 },
  placeholder: { color: '#94a3b8', fontWeight: '400' },
  arrow: { fontSize: scaleFont(11), color: '#64748b', marginLeft: 8 },
  dropdown: {
    borderWidth: 1, borderColor: '#cbd5e1', borderTopWidth: 0,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    backgroundColor: '#fff', elevation: 3, shadowColor: '#000',
    shadowOpacity: 0.08, shadowRadius: 4, maxHeight: scaleFont(220),
  },
  searchInput: {
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9', padding: scaleFont(8),
    fontSize: scaleFont(12), backgroundColor: '#f8fafc', color: '#0f172a',
  },
  list: { maxHeight: scaleFont(170) },
  item: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: scaleFont(10),
    paddingHorizontal: scaleFont(12), borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  itemSelected: { backgroundColor: '#f1f5f9' },
  itemLabel: { fontSize: scaleFont(13), color: '#334155' },
  itemLabelSelected: { fontWeight: '700', color: '#0f172a' },
  itemSubtitle: { fontSize: scaleFont(11), color: '#64748b', marginTop: 2 },
  check: { fontSize: scaleFont(13), color: '#1a1a2e', fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#94a3b8', padding: scaleFont(14), fontSize: scaleFont(12) },
});

import React, { useState } from 'react';
import {
  Platform, View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { scaleFont } from '../../utils/responsive';

interface Props {
  label: string;
  value: string; // formato esperado: YYYY-MM-DDTHH:mm
  onChange: (val: string) => void;
  hint?: string;
}

export function toLocalISOString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}

export function parseDate(val: string): Date {
  if (!val) return new Date();
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default function DateTimePickerField({ label, value, onChange, hint }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState<Date>(() => parseDate(value));

  // Formato para mostrar al usuario en móvil
  function formatHumanReadable(val: string): string {
    if (!val) return 'Seleccionar fecha y hora...';
    try {
      const d = parseDate(val);
      const opciones: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      };
      return d.toLocaleDateString('es-AR', opciones);
    } catch {
      return val;
    }
  }

  // Manejador en Web (HTML nativo input type="datetime-local")
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <input
          type="datetime-local"
          value={value || toLocalISOString(new Date())}
          onChange={(e: any) => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '14px',
            fontFamily: 'inherit',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#f8fafc',
            color: '#0f172a',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
    );
  }

  // Manejador en Android / iOS nativo
  function openPicker() {
    setTempDate(parseDate(value));
    setPickerMode('date');
    setShowPicker(true);
  }

  function handleValueChange(event: DateTimePickerChangeEvent, selectedDate: Date) {
    if (pickerMode === 'date') {
      // Guardar fecha elegida y pasar a seleccionar hora
      const updated = new Date(tempDate);
      updated.setFullYear(selectedDate.getFullYear());
      updated.setMonth(selectedDate.getMonth());
      updated.setDate(selectedDate.getDate());
      setTempDate(updated);

      if (Platform.OS === 'android') {
        setShowPicker(false);
        setTimeout(() => {
          setPickerMode('time');
          setShowPicker(true);
        }, 100);
      } else {
        setPickerMode('time');
      }
    } else {
      // Seleccionó la hora final
      const finalDate = new Date(tempDate);
      finalDate.setHours(selectedDate.getHours());
      finalDate.setMinutes(selectedDate.getMinutes());
      finalDate.setSeconds(0);
      finalDate.setMilliseconds(0);

      setShowPicker(false);
      onChange(toLocalISOString(finalDate));
    }
  }

  function handleDismiss() {
    setShowPicker(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={styles.pickerButton}
        onPress={openPicker}
        activeOpacity={0.8}
      >
        <View style={styles.iconBox}>
          <Ionicons name="calendar-outline" size={scaleFont(18)} color="#1a1a2e" />
        </View>
        <Text style={[styles.valueText, !value && styles.placeholderText]}>
          {formatHumanReadable(value)}
        </Text>
        <Ionicons name="time-outline" size={scaleFont(18)} color="#64748b" style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      {hint && <Text style={styles.hint}>{hint}</Text>}

      {showPicker && (
        <DateTimePicker
          value={tempDate}
          mode={pickerMode}
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onValueChange={handleValueChange}
          onDismiss={handleDismiss}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10, marginBottom: 4 },
  label: { fontSize: scaleFont(12), fontWeight: '700', color: '#475569', marginBottom: 6 },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: scaleFont(10),
    paddingHorizontal: scaleFont(12),
    backgroundColor: '#f8fafc',
  },
  iconBox: { marginRight: 8 },
  valueText: { fontSize: scaleFont(13), color: '#0f172a', fontWeight: '600' },
  placeholderText: { color: '#94a3b8', fontWeight: '400' },
  hint: { fontSize: scaleFont(11), color: '#64748b', marginTop: 4 },
});

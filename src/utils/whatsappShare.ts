import { Linking, Share } from 'react-native';
import { GetDesignacionDTO, GetDesignadosDTO } from '../types';

/**
 * Retorna fecha en formato: "SÁBADO 19 DE SEPTIEMBRE"
 */
function getFechaTitulo(fechaStr: string): string {
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return 'FECHA A CONFIRMAR';

    const diaSemana = d.toLocaleDateString('es-AR', { weekday: 'long' });
    const diaMes = d.getDate();
    const mes = d.toLocaleDateString('es-AR', { month: 'long' });
    return `${diaSemana} ${diaMes} DE ${mes}`.toUpperCase();
  } catch {
    return 'FECHA A CONFIRMAR';
  }
}

/**
 * Retorna el texto del horario.
 * Si es 12 am (00:00), retorna ", horario a confirmar".
 * De lo contrario retorna ", horario de inicio [HH:mm]hs" o ", horario de inicio [H]hs".
 */
function getHorarioTexto(fechaStr: string): string {
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return ', horario a confirmar';

    const horas = d.getHours();
    const minutos = d.getMinutes();

    // Si es 12 am (00:00), no poner hora y colocar "horario a confirmar"
    if (horas === 0 && minutos === 0) {
      return ', horario a confirmar';
    }

    if (minutos === 0) {
      return `, horario de inicio ${horas}hs`;
    }
    const hh = String(horas).padStart(2, '0');
    const mm = String(minutos).padStart(2, '0');
    return `, horario de inicio ${hh}:${mm}hs`;
  } catch {
    return ', horario a confirmar';
  }
}

/**
 * Formatea una única designación para compartir por WhatsApp
 */
export function formatDesignacionWhatsApp(
  d: GetDesignacionDTO,
  arbitros: GetDesignadosDTO[]
): string {
  const fechaTitulo = d.fecha ? getFechaTitulo(d.fecha) : 'FECHA A CONFIRMAR';
  const canchaNombre = d.cancha?.nombreCancha || 'Cancha a confirmar';
  const horarioTexto = getHorarioTexto(d.fecha);

  let msg = `📋 DESIGNACIÓN DE ÁRBITROS ${fechaTitulo}\n\n`;
  msg += `  🏟️ ${canchaNombre}${horarioTexto}\n`;

  if (!arbitros || arbitros.length === 0) {
    msg += `    • 👤 (Sin árbitros designados aún)`;
  } else {
    const lineasArb = arbitros.map((a) => {
      const arb = a.arbitro;
      const nombreCompleto = arb
        ? `${arb.nombre} ${arb.apellido}`.trim()
        : 'Árbitro';
      return `    • 👤 ${nombreCompleto} - Árbitro`;
    });
    msg += lineasArb.join('\n');
  }

  return msg;
}

/**
 * Formatea todas las designaciones aceptadas consolidadas con el formato solicitado:
 * 📋 DESIGNACIONES DE ÁRBITROS SABÁDO 19 DE SEPTIEMBRE
 *   🏟️ Cancha, horario de inicio 12:45hs (o ", horario a confirmar" si es 00:00)
 *     • 👤 Nombre Apellido - Árbitro
 */
export function formatTodasAceptadasWhatsApp(
  items: { designacion: GetDesignacionDTO; arbitros: GetDesignadosDTO[] }[]
): string {
  if (items.length === 0) return '';

  // Agrupar por fecha calendario (YYYY-MM-DD)
  const gruposPorFecha = new Map<string, typeof items>();
  items.forEach((item) => {
    const key = item.designacion.fecha
      ? item.designacion.fecha.split('T')[0]
      : 'sin-fecha';
    const list = gruposPorFecha.get(key) || [];
    list.push(item);
    gruposPorFecha.set(key, list);
  });

  const secciones: string[] = [];

  gruposPorFecha.forEach((jornadas) => {
    const fechaTitulo = jornadas[0]?.designacion.fecha
      ? getFechaTitulo(jornadas[0].designacion.fecha)
      : 'FECHA A CONFIRMAR';

    let bloque = `📋 DESIGNACIONES DE ÁRBITROS ${fechaTitulo}\n\n`;

    const bloquesCanchas = jornadas.map((item) => {
      const { designacion: d, arbitros } = item;
      const canchaNombre = d.cancha?.nombreCancha || 'Cancha a confirmar';
      const horarioTexto = getHorarioTexto(d.fecha);

      let lineaCancha = `  🏟️ ${canchaNombre}${horarioTexto}\n`;

      if (!arbitros || arbitros.length === 0) {
        lineaCancha += `    • 👤 (Sin árbitros designados)`;
      } else {
        const lineasArb = arbitros.map((a) => {
          const arb = a.arbitro;
          const nombreCompleto = arb
            ? `${arb.nombre} ${arb.apellido}`.trim()
            : 'Árbitro';
          return `    • 👤 ${nombreCompleto} - Árbitro`;
        });
        lineaCancha += lineasArb.join('\n');
      }

      return lineaCancha;
    });

    bloque += bloquesCanchas.join('\n\n');
    secciones.push(bloque);
  });

  return secciones.join('\n\n');
}

/**
 * Abre WhatsApp con el mensaje precargado (o abre diálogo nativo como fallback)
 */
export async function shareMessageWhatsApp(text: string): Promise<void> {
  const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return;
    }
  } catch {}

  // Fallback directo a openURL o Share API nativa
  try {
    await Linking.openURL(url);
  } catch {
    await Share.share({
      message: text,
      title: 'Designaciones Arbitrales',
    });
  }
}

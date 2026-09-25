import { Linking, Share } from 'react-native';
import { GetDesignacionDTO, GetDesignadosDTO } from '../types';

function formatFechaHora(fechaStr: string): string {
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return fechaStr;

    const dia = d.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const hora = d.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const diaCapitalizado = dia.charAt(0).toUpperCase() + dia.slice(1);
    return `${diaCapitalizado} - ${hora} hs`;
  } catch {
    return fechaStr;
  }
}

/**
 * Formatea una única designación para compartir por WhatsApp
 */
export function formatDesignacionWhatsApp(
  d: GetDesignacionDTO,
  arbitros: GetDesignadosDTO[]
): string {
  const canchaNombre = d.cancha?.nombreCancha || 'Predio a confirmar';
  const fecha = formatFechaHora(d.fecha);
  const etapa = d.etapaCampeonato ? d.etapaCampeonato.replace(/_/g, ' ') : '';
  const detalle = d.detalleDesignacion || d.detalleExtra;

  let msg = `⚽ *DESIGNACIÓN ARBITRAL* ⚽\n\n`;
  msg += `🏟 *Cancha:* ${canchaNombre}\n`;
  msg += `📅 *Fecha:* ${fecha}\n`;
  msg += `🏆 *Etapa:* ${etapa} (${d.cantidadPartidos} ${d.cantidadPartidos === 1 ? 'partido' : 'partidos'})\n`;
  if (detalle) {
    msg += `📝 *Detalle:* ${detalle}\n`;
  }

  msg += `\n👥 *Cuadrilla Arbitral:*`;
  if (!arbitros || arbitros.length === 0) {
    msg += `\n_Sin árbitros designados aún_`;
  } else {
    arbitros.forEach((a) => {
      const arb = a.arbitro;
      const nombre = arb ? `${arb.apellido}, ${arb.nombre}` : 'Árbitro';
      const cat = arb?.categoria ? ` (${arb.categoria})` : '';
      const cant = a.partidosDirigidos > 0 ? ` - ${a.partidosDirigidos} partido(s)` : '';
      msg += `\n• ${nombre}${cat}${cant}`;
    });
  }

  return msg;
}

/**
 * Formatea todas las designaciones aceptadas consolidadas
 */
export function formatTodasAceptadasWhatsApp(
  items: { designacion: GetDesignacionDTO; arbitros: GetDesignadosDTO[] }[]
): string {
  if (items.length === 0) return '';

  let msg = `📋 *DESIGNACIONES CONFIRMADAS*\n`;
  msg += `*Círculo de Árbitros*\n`;
  msg += `Total: ${items.length} ${items.length === 1 ? 'jornada confirmada' : 'jornadas confirmadas'}\n`;
  msg += `═════════════════════════\n\n`;

  items.forEach((item, index) => {
    const { designacion: d, arbitros } = item;
    const canchaNombre = d.cancha?.nombreCancha || 'Predio a confirmar';
    const fecha = formatFechaHora(d.fecha);
    const etapa = d.etapaCampeonato ? d.etapaCampeonato.replace(/_/g, ' ') : '';
    const detalle = d.detalleDesignacion || d.detalleExtra;

    msg += `🏟 *${canchaNombre}*\n`;
    msg += `📅 ${fecha}\n`;
    msg += `🏆 ${etapa} · ${d.cantidadPartidos} partido(s)\n`;
    if (detalle) {
      msg += `📝 ${detalle}\n`;
    }

    if (arbitros && arbitros.length > 0) {
      msg += `👥 *Árbitros:*\n`;
      arbitros.forEach((a) => {
        const arb = a.arbitro;
        const nombre = arb ? `${arb.apellido}, ${arb.nombre}` : 'Árbitro';
        const cat = arb?.categoria ? ` (${arb.categoria})` : '';
        const cant = a.partidosDirigidos > 0 ? ` [${a.partidosDirigidos} p.]` : '';
        msg += `  • ${nombre}${cat}${cant}\n`;
      });
    } else {
      msg += `👥 _Sin árbitros designados_\n`;
    }

    if (index < items.length - 1) {
      msg += `─────────────────────────\n\n`;
    }
  });

  return msg;
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

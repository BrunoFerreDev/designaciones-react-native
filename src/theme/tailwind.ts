import { create } from 'twrnc';
import { scaleFont, isSmallDevice, isTablet } from '../utils/responsive';

// Instancia de twrnc vinculada con la configuración del proyecto (colores, tema, etc.)
const tw = create(require('../../tailwind.config.js'));

/**
 * Helper tipográfico Tailwind con soporte automático para evitar recortes en Android.
 * Aplica includeFontPadding: false y combina estilos utilitarios de Tailwind.
 * Ej: twFont('text-xs font-bold text-slate-800')
 */
export function twFont(classes: string, extraStyle?: Record<string, any>) {
  return tw.style(classes, { includeFontPadding: false, ...(extraStyle || {}) });
}

export { tw, scaleFont, isSmallDevice, isTablet };
export default tw;

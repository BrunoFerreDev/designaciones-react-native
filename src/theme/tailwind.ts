import { create } from "twrnc";
import { scaleFont, isSmallDevice, isTablet } from "../utils/responsive";

// Instancia de twrnc vinculada con la configuración del proyecto (colores, tema, etc.)
const tw = create(require("../../tailwind.config.js"));

/**
 * Helper tipográfico Tailwind con soporte automático para evitar recortes en Android.
 * Aplica includeFontPadding: false y combina estilos utilitarios de Tailwind.
 * Ej: twFont('text-xs font-bold text-slate-800')
 */
export function twFont(classes: string, extraStyle?: Record<string, any>) {
  const style = { ...tw.style(classes), ...(extraStyle || {}) };
  // En Android, los lineHeights fijos de Tailwind (ej: text-xs => lineHeight: 16)
  // pueden causar recortes verticales o truncamiento inesperado cuando el sistema escala fuentes.
  // Si la clase no especifica explícitamente `leading-`, removemos el lineHeight rígido
  // para que el componente Text utilice la métrica natural de la fuente.
  if (
    !classes.includes("leading-") &&
    (!extraStyle || extraStyle.lineHeight === undefined)
  ) {
    delete style.lineHeight;
  }
  return { includeFontPadding: false, ...style };
}

export { tw, scaleFont, isSmallDevice, isTablet };
export default tw;

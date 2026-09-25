import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Ancho base estándar de referencia (375pt como iPhone X / Galaxy S moderno)
const BASE_WIDTH = 375;

// Factor de escala calculado con clamping seguro (0.85 a 1.25) para que no rompa en pantallas muy chicas ni sea gigante en tablets
const horizontalScale = SCREEN_WIDTH / BASE_WIDTH;
const clampedScale = Math.min(Math.max(horizontalScale, 0.85), 1.25);

/**
 * Escala un tamaño de fuente de manera proporcional al ancho del dispositivo.
 * Normaliza contra PixelRatio.getFontScale() para evitar que el ajuste de accesibilidad
 * del sistema de Android (fuente Grande/Muy grande) duplique excesivamente el tamaño y corte palabras.
 */
export function scaleFont(size: number): number {
  const fontScale = PixelRatio.getFontScale() || 1;
  // Si el usuario tiene fuente aumentada en el sistema, mitigamos la duplicación
  const fontScaleAdjustment = fontScale > 1 ? Math.sqrt(fontScale) : 1;
  const normalizedScale = clampedScale / fontScaleAdjustment;
  const scaled = size * normalizedScale;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
}

/**
 * Helper para escalar dimensiones horizontales (paddings, margins, anchos)
 */
export function scaleWidth(size: number): number {
  return Math.round(size * clampedScale);
}

// Dispositivos compactos como Moto G04 (~360dp) o iPhone SE (375dp)
export const isSmallDevice = SCREEN_WIDTH <= 375;
export const isTablet = SCREEN_WIDTH >= 768;

export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: isSmallDevice,
  isTablet,
};

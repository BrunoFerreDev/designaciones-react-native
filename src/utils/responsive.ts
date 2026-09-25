import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Ancho base estándar de referencia (375pt como iPhone X / Galaxy S moderno)
const BASE_WIDTH = 375;

// Factor de escala calculado con clamping seguro (0.85 a 1.25) para que no rompa en pantallas muy chicas ni sea gigante en tablets
const horizontalScale = SCREEN_WIDTH / BASE_WIDTH;
const clampedScale = Math.min(Math.max(horizontalScale, 0.85), 1.25);

/**
 * Escala un tamaño de fuente de manera proporcional al ancho del dispositivo.
 * Aplica PixelRatio para evitar fuentes borrosas en pantallas de alta densidad.
 */
export function scaleFont(size: number): number {
  const scaled = size * clampedScale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(scaled));
  }
  return Math.round(PixelRatio.roundToNearestPixel(scaled)) - (PixelRatio.get() >= 3 ? 0.5 : 0);
}

/**
 * Helper para escalar dimensiones horizontales (paddings, margins, anchos)
 */
export function scaleWidth(size: number): number {
  return Math.round(size * clampedScale);
}

export const isSmallDevice = SCREEN_WIDTH < 360;
export const isTablet = SCREEN_WIDTH >= 768;

export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: isSmallDevice,
  isTablet,
};

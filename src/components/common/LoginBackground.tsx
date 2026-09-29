import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Circle,
  Line,
  G,
  Path,
} from "react-native-svg";

export default function LoginBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 1080 1920"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0c231a" />
            <Stop offset="50%" stopColor="#081c15" />
            <Stop offset="100%" stopColor="#040e0b" />
          </LinearGradient>
          <LinearGradient id="yellow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#f6cd3c" />
            <Stop offset="100%" stopColor="#d9a411" />
          </LinearGradient>
          <LinearGradient id="red" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#e8534a" />
            <Stop offset="100%" stopColor="#b7241c" />
          </LinearGradient>
        </Defs>

        {/* Fondo con gradiente verde bosque oscuro */}
        <Rect x="0" y="0" width="1080" height="1920" fill="url(#bg)" />

        {/* Líneas sutiles del campo de juego */}
        <Circle
          cx="540"
          cy="960"
          r="320"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.05"
          strokeWidth="3"
        />
        <Line
          x1="40"
          y1="960"
          x2="1040"
          y2="960"
          stroke="#ffffff"
          strokeOpacity="0.05"
          strokeWidth="3"
        />

        {/* Esquina superior izquierda: tarjeta amarilla inclinada */}
        <G transform="translate(150,230) rotate(-14)">
          <Rect
            x="-42"
            y="-60"
            width="84"
            height="120"
            rx="9"
            fill="url(#yellow)"
            fillOpacity="0.85"
          />
        </G>

        {/* Esquina superior derecha: tarjeta roja inclinada */}
        <G transform="translate(930,270) rotate(12)">
          <Rect
            x="-42"
            y="-60"
            width="84"
            height="120"
            rx="9"
            fill="url(#red)"
            fillOpacity="0.85"
          />
        </G>

        {/* Esquina superior derecha: silbato decorativo */}
        <G
          transform="translate(870,160) rotate(-10) scale(0.6)"
          fill="#ffffff"
          fillOpacity="0.5"
        >
          <Rect x="-90" y="-24" width="140" height="48" rx="24" />
          <Circle cx="80" cy="0" r="34" />
          <Rect x="42" y="-7" width="30" height="14" />
          <Circle cx="80" cy="0" r="15" fill="#0c231a" />
        </G>

        {/* Esquina superior izquierda: banderín de línea */}
        <G
          transform="translate(200,120) rotate(18)"
          fill="#ffffff"
          fillOpacity="0.45"
        >
          <Rect x="-4" y="-10" width="8" height="120" rx="2" />
          <Path d="M4 -10 L74 6 L4 36 Z" />
        </G>

        {/* Esquina inferior izquierda: banderín atenuado */}
        <G
          transform="translate(140,1650) rotate(-16)"
          fill="#ffffff"
          fillOpacity="0.12"
        >
          <Rect x="-5" y="-14" width="10" height="170" rx="3" />
          <Path d="M5 -14 L110 10 L5 52 Z" />
        </G>

        {/* Esquina inferior derecha: abanico de tarjetas atenuadas */}
        <G transform="translate(950,1660) rotate(8)">
          <Rect
            x="-38"
            y="-54"
            width="76"
            height="108"
            rx="8"
            fill="url(#red)"
            fillOpacity="0.22"
          />
        </G>
        <G transform="translate(1000,1600) rotate(-6)">
          <Rect
            x="-38"
            y="-54"
            width="76"
            height="108"
            rx="8"
            fill="url(#yellow)"
            fillOpacity="0.22"
          />
        </G>

        {/* Esquina inferior izquierda: silbato decorativo atenuado */}
        <G
          transform="translate(210,1750) rotate(20) scale(0.55)"
          fill="#ffffff"
          fillOpacity="0.14"
        >
          <Rect x="-90" y="-24" width="140" height="48" rx="24" />
          <Circle cx="80" cy="0" r="34" />
          <Rect x="42" y="-7" width="30" height="14" />
        </G>
      </Svg>
    </View>
  );
}

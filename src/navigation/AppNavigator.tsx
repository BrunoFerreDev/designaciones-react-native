import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";

// Screens
import LoginScreen from "../screens/auth/LoginScreen";
import HomeScreen from "../screens/home/HomeScreen";
import DesignacionesListScreen from "../screens/designaciones/DesignacionesListScreen";
import DesignacionDetalle from "../screens/designaciones/DesignacionDetalle";
import CanchasListScreen from "../screens/canchas/CanchasListScreen";
import ArbitrosListScreen from "../screens/arbitros/ArbitrosListScreen";
import SuspensionesListScreen from "../screens/suspensiones/SuspensionesListScreen";
import PerfilScreen from "../screens/perfil/PerfilScreen";

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  DesignacionDetalle: { idDesignacion: number };
  Perfil: undefined;
};

export type TabParamList = {
  Home: undefined;
  Designaciones: undefined;
  Canchas: undefined;
  Arbitros: undefined;
  Suspensiones: undefined;
  Perfil: undefined;
};

import { Ionicons } from "@expo/vector-icons";
import { scaleFont, isSmallDevice } from "../utils/responsive";
import tw from "../theme/tailwind";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  const { isFullAdmin, isDesignador, isArbitroSolo } = useAuth();

  return (
    <Tab.Navigator
      initialRouteName={isArbitroSolo ? "Designaciones" : "Home"}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#1a1a2e",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: {
          fontSize: isSmallDevice ? scaleFont(9.5) : scaleFont(10.5),
          fontWeight: "700",
          marginBottom: 3,
          includeFontPadding: false,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
        },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e2e8f0",
          borderTopWidth: 1,
          height: scaleFont(56),
          paddingTop: 5,
          paddingBottom: 5,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "help-circle-outline";

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Designaciones") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Canchas") {
            iconName = focused ? "football" : "football-outline";
          } else if (route.name === "Arbitros") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "Suspensiones") {
            iconName = focused ? "alert-circle" : "alert-circle-outline";
          } else if (route.name === "Perfil") {
            iconName = focused ? "person" : "person-outline";
          }

          return (
            <Ionicons name={iconName} size={scaleFont(22)} color={color} />
          );
        },
      })}
    >
      {/* Home para Administrador o Designador */}
      {!isArbitroSolo && (
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Inicio" }}
        />
      )}

      {/* Designaciones visible para todos los roles */}
      <Tab.Screen
        name="Designaciones"
        component={DesignacionesListScreen}
        options={{ title: "Designaciones" }}
      />

      {/* Canchas visible para Administrador o Designador */}
      {(isFullAdmin || isDesignador) && (
        <Tab.Screen
          name="Canchas"
          component={CanchasListScreen}
          options={{ title: "Canchas" }}
        />
      )}

      {/* Árbitros y Sanciones exclusivo para Presidente y Superusuario */}
      {isFullAdmin && (
        <>
          <Tab.Screen
            name="Arbitros"
            component={ArbitrosListScreen}
            options={{ title: "Árbitros" }}
          />
          <Tab.Screen
            name="Suspensiones"
            component={SuspensionesListScreen}
            options={{ title: "Sanciones" }}
          />
        </>
      )}

      {/* Perfil en la barra de navegación para Árbitro Solo o Designador */}
      {!isFullAdmin && (
        <Tab.Screen
          name="Perfil"
          component={PerfilScreen}
          options={{ title: "Mi Perfil" }}
        />
      )}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, isLoading } = useAuth();
  if (isLoading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="DesignacionDetalle"
            component={DesignacionDetalle}
            options={{ headerShown: true, title: "Detalle Designación" }}
          />
          <Stack.Screen
            name="Perfil"
            component={PerfilScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

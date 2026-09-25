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
};

import { Ionicons } from "@expo/vector-icons";
import { scaleFont } from "../utils/responsive";
import tw from "../theme/tailwind";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#1a1a2e",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: {
          fontSize: scaleFont(11),
          fontWeight: "700",
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e2e8f0",
          borderTopWidth: 1,
          height: scaleFont(58),
          paddingTop: 6,
          paddingBottom: 6,
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
          }

          return (
            <Ionicons name={iconName} size={scaleFont(22)} color={color} />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Inicio" }}
      />
      <Tab.Screen
        name="Designaciones"
        component={DesignacionesListScreen}
        options={{ title: "Designaciones" }}
      />
      <Tab.Screen
        name="Canchas"
        component={CanchasListScreen}
        options={{ title: "Canchas" }}
      />
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

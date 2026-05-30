import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DashboardScreen } from '../screens/DashboardScreen';
import { LogFoodScreen } from '../screens/LogFoodScreen';
import { LogWorkoutScreen } from '../screens/LogWorkoutScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { WeeklyReportScreen } from '../screens/WeeklyReportScreen';
import { DailyReportScreen } from '../screens/DailyReportScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { useTheme } from '../context/ThemeContext';
import { Routes, MainStackParamList, TabParamList } from '../constants/routes';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

// ─── Custom Tab Bar Icon ─────────────────────────────────────────────────────

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        tabStyles.iconWrap,
        focused
          ? { backgroundColor: theme.primary, width: 38, height: 38, borderRadius: 19 }
          : { backgroundColor: 'transparent', width: 38, height: 38, borderRadius: 19 },
      ]}
    >
      <Icon
        name={focused ? name : `${name}-outline`}
        size={22}
        color={focused ? '#ffffff' : theme.textMuted}
      />
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Home Tabs (5 max) ───────────────────────────────────────────────────────

function HomeTabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopWidth: 0,
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          borderRadius: 28,
          height: Platform.OS === 'ios' ? 68 : 60,
          paddingBottom: Platform.OS === 'ios' ? 12 : 8,
          paddingTop: 8,
          shadowColor: theme.primary,
          shadowOpacity: 0.18,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 20,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 0,
        },
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerStyle: {
          backgroundColor: theme.background,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
          color: theme.text,
        },
      }}
    >
      <Tab.Screen
        name={Routes.DASHBOARD}
        component={DashboardScreen}
        options={{
          title: 'Vandaag',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name={Routes.LOG_FOOD}
        component={LogFoodScreen}
        options={{
          title: 'Eten',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="restaurant" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name={Routes.LOG_WORKOUT}
        component={LogWorkoutScreen}
        options={{
          title: 'Sport',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="barbell" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name={Routes.PROGRESS}
        component={ProgressScreen}
        options={{
          title: 'Trend',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="stats-chart" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name={Routes.PROFILE}
        component={ProfileScreen}
        options={{
          title: 'Profiel',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Stack (includes modal screens) ────────────────────────────────────

function MainStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name={Routes.TABS} component={HomeTabs} />
      <Stack.Screen
        name={Routes.CHAT}
        component={ChatScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={Routes.ACHIEVEMENTS}
        component={AchievementsScreen}
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Achievements',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name={Routes.HISTORY}
        component={HistoryScreen}
        options={{
          headerShown: true,
          headerTitle: 'Historie',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name={Routes.GOALS}
        component={GoalsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Doelen',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name={Routes.WEEKLY_REPORT}
        component={WeeklyReportScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={Routes.DAILY_REPORT}
        component={DailyReportScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// ─── Root Navigator (onboarding gate) ───────────────────────────────────────

export function AppNavigator() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_done').then(val => {
      setOnboardingDone(val === 'true');
    });
  }, []);

  if (onboardingDone === null) return null;

  if (!onboardingDone) {
    return <OnboardingScreen onComplete={() => setOnboardingDone(true)} />;
  }

  return (
    <NavigationContainer>
      <MainStack />
    </NavigationContainer>
  );
}

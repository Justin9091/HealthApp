import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_GOALS } from '../types';
import { storageService } from '../services/StorageService';
import { spacing, radius, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface OnboardingProps {
  onComplete: () => void;
}

type GoalKey =
  | 'lose_weight'
  | 'build_muscle'
  | 'eat_healthier'
  | 'more_energy'
  | 'feel_better';

const GOALS: { key: GoalKey; label: string; icon: string; desc: string }[] = [
  {
    key: 'lose_weight',
    label: 'Afvallen',
    icon: 'trending-down-outline',
    desc: 'Gezond gewicht bereiken',
  },
  {
    key: 'build_muscle',
    label: 'Spieren kweken',
    icon: 'barbell-outline',
    desc: 'Sterker en fitter worden',
  },
  {
    key: 'eat_healthier',
    label: 'Gezonder eten',
    icon: 'nutrition-outline',
    desc: 'Bewuster omgaan met voeding',
  },
  {
    key: 'more_energy',
    label: 'Meer energie',
    icon: 'flash-outline',
    desc: 'De dag met pit beginnen',
  },
  {
    key: 'feel_better',
    label: 'Beter in mijn vel',
    icon: 'heart-outline',
    desc: 'Algeheel welzijn verbeteren',
  },
];

export function OnboardingScreen({ onComplete }: OnboardingProps) {
  const { theme } = useTheme();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<GoalKey[]>([]);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: {
          flex: 1,
          backgroundColor: theme.background,
        },
        dotsRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: spacing.md,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.border,
        },
        dotActive: {
          width: 28,
          borderRadius: 4,
          backgroundColor: theme.primary,
        },

        stepContainer: {
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl,
        },

        // Welcome illustration
        illustrationContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          height: 260,
          position: 'relative',
        },
        illustrationBg: {
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: theme.primary,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadow.lg,
        },
        illustrationInner: {
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: 'rgba(255,255,255,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        floatBubble: {
          position: 'absolute',
          borderRadius: 50,
          backgroundColor: theme.primary,
        },

        // Text blocks
        textBlock: {
          marginBottom: spacing.xl,
        },
        welcomeLabel: {
          fontSize: 16,
          fontWeight: '600',
          color: theme.textSecondary,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 4,
        },
        appName: {
          fontSize: 56,
          fontWeight: '900',
          color: theme.primary,
          letterSpacing: -2,
          marginBottom: spacing.md,
        },
        welcomeSub: {
          fontSize: 16,
          lineHeight: 26,
          color: theme.textSecondary,
        },

        // Name step
        stepIconWrap: {
          alignItems: 'center',
          paddingVertical: spacing.xl,
        },
        stepTitle: {
          fontSize: 32,
          fontWeight: '900',
          color: theme.text,
          letterSpacing: -1,
          marginBottom: spacing.sm,
        },
        stepSub: {
          fontSize: 16,
          lineHeight: 26,
          color: theme.textSecondary,
        },
        inputSection: {
          flex: 1,
          marginTop: spacing.sm,
        },
        nameInput: {
          backgroundColor: theme.surface,
          borderRadius: radius.full,
          borderWidth: 2,
          borderColor: theme.border,
          paddingHorizontal: spacing.md,
          paddingVertical: 18,
          fontSize: 20,
          fontWeight: '600',
          color: theme.text,
          textAlign: 'center',
          ...shadow.sm,
        },
        greeting: {
          fontSize: 16,
          color: theme.primary,
          fontWeight: '600',
          marginTop: spacing.md,
          textAlign: 'center',
        },

        // Goals step
        goalsGrid: {
          gap: spacing.sm,
          paddingBottom: spacing.lg,
        },
        goalCard: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface,
          borderRadius: radius.xl,
          padding: spacing.lg,
          borderWidth: 2,
          borderColor: theme.border,
          gap: spacing.md,
          ...shadow.sm,
        },
        goalCardActive: {
          borderColor: theme.primary,
          backgroundColor: theme.primaryLight,
        },
        goalIconWrap: {
          width: 48,
          height: 48,
          borderRadius: 16,
          backgroundColor: theme.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
        },
        goalIconWrapActive: {
          backgroundColor: theme.primary,
        },
        goalLabel: {
          fontSize: 17,
          fontWeight: '800',
          color: theme.text,
          marginBottom: 2,
        },
        goalLabelActive: {
          color: theme.primaryDark,
        },
        goalDesc: {
          fontSize: 13,
          color: theme.textSecondary,
        },
        goalDescActive: {
          color: theme.textSecondary,
        },

        // Buttons
        bottomSection: {
          alignItems: 'center',
          paddingTop: spacing.sm,
        },
        primaryBtn: {
          backgroundColor: theme.primary,
          borderRadius: radius.full,
          paddingVertical: 18,
          paddingHorizontal: spacing.xl,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          ...shadow.md,
        },
        primaryBtnMuted: {
          backgroundColor: theme.textMuted,
        },
        primaryBtnText: {
          color: '#fff',
          fontSize: 17,
          fontWeight: '700',
        },
        skipText: {
          color: theme.textMuted,
          fontSize: 15,
          paddingVertical: 8,
        },
        privacyNote: {
          marginTop: spacing.md,
          fontSize: 13,
          color: theme.textMuted,
          textAlign: 'center',
        },
      }),
    [theme],
  );

  const goToStep = (next: number) => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setStep(next);
  };

  const toggleGoal = (key: GoalKey) => {
    setSelectedGoals(prev =>
      prev.includes(key) ? prev.filter(g => g !== key) : [...prev, key],
    );
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem('onboarding_done', 'true');
    await AsyncStorage.setItem('user_name', name.trim() || 'jij');

    const goals = { ...DEFAULT_GOALS };
    if (selectedGoals.includes('lose_weight')) {
      goals.dailyCaloriesTarget = 1600;
      goals.dailyProteinTarget = 130;
    } else if (selectedGoals.includes('build_muscle')) {
      goals.dailyCaloriesTarget = 2500;
      goals.dailyProteinTarget = 180;
    }
    await storageService.set('user:goals', goals);

    onComplete();
  };

  const steps = [
    <WelcomeStep
      key="welcome"
      onNext={() => goToStep(1)}
      styles={styles}
      theme={theme}
    />,
    <NameStep
      key="name"
      name={name}
      setName={setName}
      onNext={() => goToStep(2)}
      styles={styles}
      theme={theme}
    />,
    <GoalsStep
      key="goals"
      selectedGoals={selectedGoals}
      toggleGoal={toggleGoal}
      onComplete={handleComplete}
      styles={styles}
      theme={theme}
    />,
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress dots */}
      {step > 0 && (
        <View style={styles.dotsRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
          ))}
        </View>
      )}

      <Animated.View
        style={{ flex: 1, transform: [{ translateY: slideAnim }] }}
      >
        {steps[step]}
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Step 1: Welcome ────────────────────────────────────────────────────────

function WelcomeStep({
  onNext,
  styles,
  theme,
}: {
  onNext: () => void;
  styles: any;
  theme: any;
}) {
  return (
    <View style={styles.stepContainer}>
      {/* Illustration area */}
      <View style={styles.illustrationContainer}>
        <View style={styles.illustrationBg}>
          <View style={styles.illustrationInner}>
            <Icon name="leaf" size={72} color="#fff" />
          </View>
        </View>
        {/* Floating decorations */}
        <View
          style={[
            styles.floatBubble,
            { top: 20, right: 40, width: 48, height: 48, opacity: 0.5 },
          ]}
        />
        <View
          style={[
            styles.floatBubble,
            { top: 80, right: 10, width: 28, height: 28, opacity: 0.3 },
          ]}
        />
        <View
          style={[
            styles.floatBubble,
            {
              top: 40,
              left: 30,
              width: 36,
              height: 36,
              opacity: 0.35,
              backgroundColor: theme.secondary,
            },
          ]}
        />
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.welcomeLabel}>Welkom bij</Text>
        <Text style={styles.appName}>Vitaal</Text>
        <Text style={styles.welcomeSub}>
          Jouw persoonlijke gezondheidsmaatje. Geen ingewikkelde dashboards,
          geen technische termen — gewoon jij, lekker in je vel.
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onNext}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Laten we beginnen</Text>
          <Icon
            name="arrow-forward"
            size={20}
            color="#fff"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
        <Text style={styles.privacyNote}>
          <Icon name="lock-closed-outline" size={12} color={theme.textMuted} />{' '}
          Jouw data blijft op jouw telefoon
        </Text>
      </View>
    </View>
  );
}

// ─── Step 2: Name ───────────────────────────────────────────────────────────

function NameStep({
  name,
  setName,
  onNext,
  styles,
  theme,
}: {
  name: string;
  setName: (v: string) => void;
  onNext: () => void;
  styles: any;
  theme: any;
}) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.stepContainer}>
        <View style={styles.stepIconWrap}>
          <Icon name="person-circle-outline" size={80} color={theme.primary} />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.stepTitle}>Hoi! Wat is je naam?</Text>
          <Text style={styles.stepSub}>
            We houden het persoonlijk — zo voelt alles een stuk warmer aan.
          </Text>
        </View>

        <View style={styles.inputSection}>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Jouw voornaam"
            placeholderTextColor={theme.textMuted}
            autoFocus
            returnKeyType="next"
            onSubmitEditing={onNext}
            maxLength={30}
          />
          {name.trim().length > 0 && (
            <Text style={styles.greeting}>Hoi, {name.trim()}! 👋</Text>
          )}
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onNext}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Volgende</Text>
            <Icon
              name="arrow-forward"
              size={20}
              color="#fff"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onNext} style={{ marginTop: 12 }}>
            <Text style={styles.skipText}>Overslaan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Step 3: Goals ──────────────────────────────────────────────────────────

function GoalsStep({
  selectedGoals,
  toggleGoal,
  onComplete,
  styles,
  theme,
}: {
  selectedGoals: GoalKey[];
  toggleGoal: (k: GoalKey) => void;
  onComplete: () => void;
  styles: any;
  theme: any;
}) {
  return (
    <View style={[styles.stepContainer, { paddingBottom: 0 }]}>
      <View style={styles.stepIconWrap}>
        <Icon name="flag-outline" size={56} color={theme.primary} />
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.stepTitle}>Wat wil jij bereiken?</Text>
        <Text style={styles.stepSub}>
          Kies wat bij jou past. Je kunt dit altijd later aanpassen.
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.goalsGrid}
        showsVerticalScrollIndicator={false}
      >
        {GOALS.map(goal => {
          const active = selectedGoals.includes(goal.key);
          return (
            <TouchableOpacity
              key={goal.key}
              style={[styles.goalCard, active && styles.goalCardActive]}
              onPress={() => toggleGoal(goal.key)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.goalIconWrap,
                  active && styles.goalIconWrapActive,
                ]}
              >
                <Icon
                  name={goal.icon}
                  size={26}
                  color={active ? '#fff' : theme.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.goalLabel, active && styles.goalLabelActive]}
                >
                  {goal.label}
                </Text>
                <Text
                  style={[styles.goalDesc, active && styles.goalDescActive]}
                >
                  {goal.desc}
                </Text>
              </View>
              {active && (
                <Icon name="checkmark-circle" size={22} color={theme.primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.bottomSection, { paddingTop: spacing.md }]}>
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            selectedGoals.length === 0 && styles.primaryBtnMuted,
          ]}
          onPress={onComplete}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>
            {selectedGoals.length === 0 ? 'Overslaan' : 'Aan de slag!'}
          </Text>
          <Icon
            name="checkmark"
            size={20}
            color="#fff"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

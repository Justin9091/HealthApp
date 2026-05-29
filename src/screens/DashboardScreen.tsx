import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';
import {
  useNutritionSummary,
  useWaterTotal,
  useGoals,
} from '../hooks/useNutrition';
import { useFitnessSummary } from '../hooks/useFitness';
import { useDailyHealthSummary } from '../hooks/useGoogleHealth';
import { colors, spacing, radius, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { formatDate, todayStr } from '../utils/helpers';
import { queryKeys } from '../utils/queryKeys';
import { streakService } from '../services/StreakService';

const today = todayStr();

// ─── Stagger animation hook ───────────────────────────────────────────────────

function useStagger(count: number, delay = 60) {
  const anims = useRef(
    Array.from({ length: count }, () => new Animated.Value(0)),
  ).current;
  useEffect(() => {
    Animated.stagger(
      delay,
      anims.map(a =>
        Animated.spring(a, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 180,
        }),
      ),
    ).start();
  }, [anims, delay]);
  return anims;
}

function staggerStyle(anim: Animated.Value) {
  return {
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
    ],
  };
}

// ─── Large calorie arc ────────────────────────────────────────────────────────

const ARC = 200;
const A_STR = 14;
const A_R = (ARC - A_STR) / 2;
const A_C = 2 * Math.PI * A_R;

function CalorieArc({ pct, color }: { pct: number; color: string }) {
  const { theme } = useTheme();
  const p = Math.min(Math.max(pct, 0), 1);
  return (
    <Svg width={ARC} height={ARC} style={StyleSheet.absoluteFill}>
      <Circle
        cx={ARC / 2}
        cy={ARC / 2}
        r={A_R}
        stroke={theme.surfaceAlt}
        strokeWidth={A_STR}
        fill="none"
      />
      <Circle
        cx={ARC / 2}
        cy={ARC / 2}
        r={A_R}
        stroke={color}
        strokeWidth={A_STR}
        fill="none"
        strokeDasharray={`${A_C} ${A_C}`}
        strokeDashoffset={A_C * (1 - p)}
        strokeLinecap="round"
        rotation="-90"
        origin={`${ARC / 2}, ${ARC / 2}`}
      />
    </Svg>
  );
}

// ─── Ring metric ──────────────────────────────────────────────────────────────

const RNG = 56;
const R_STR = 5;
const R_R = (RNG - R_STR) / 2;
const R_C = 2 * Math.PI * R_R;

function RingMetric({
  icon,
  value,
  label,
  pct,
  color,
}: {
  icon: string;
  value: string;
  label: string;
  pct: number;
  color: string;
}) {
  const { theme } = useTheme();
  const p = Math.min(Math.max(pct, 0), 1);
  return (
    <View style={rm.wrap}>
      <View style={{ width: RNG, height: RNG }}>
        <Svg width={RNG} height={RNG} style={StyleSheet.absoluteFill}>
          <Circle
            cx={RNG / 2}
            cy={RNG / 2}
            r={R_R}
            stroke={color + '28'}
            strokeWidth={R_STR}
            fill="none"
          />
          <Circle
            cx={RNG / 2}
            cy={RNG / 2}
            r={R_R}
            stroke={color}
            strokeWidth={R_STR}
            fill="none"
            strokeDasharray={`${R_C} ${R_C}`}
            strokeDashoffset={R_C * (1 - p)}
            strokeLinecap="round"
            rotation="-90"
            origin={`${RNG / 2}, ${RNG / 2}`}
          />
        </Svg>
        <View style={rm.iconCenter}>
          <Icon name={icon} size={22} color={color} />
        </View>
      </View>
      <Text style={[rm.value, { color: theme.text }]}>{value}</Text>
      <Text style={[rm.label, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}
const rm = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6, flex: 1 },
  iconCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontSize: 13, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '500' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

function greeting(name: string) {
  const h = new Date().getHours();
  return `${
    h < 12 ? 'Goedemorgen' : h < 18 ? 'Goedemiddag' : 'Goedenavond'
  }, ${name}`;
}

export function DashboardScreen({ navigation }: any) {
  const { theme } = useTheme();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = React.useState(false);
  const [userName, setUserName] = React.useState('');
  const anims = useStagger(5, 70);

  React.useEffect(() => {
    AsyncStorage.getItem('user_name').then(n => {
      if (n) setUserName(n);
    });
  }, []);

  const { data: nutrition } = useNutritionSummary(today);
  const { data: fitness } = useFitnessSummary(today);
  const { data: health } = useDailyHealthSummary(today);
  const { data: waterMl = 0 } = useWaterTotal(today);
  const { data: goals } = useGoals();
  const { data: streak = 0 } = useQuery({
    queryKey: queryKeys.streak.current(),
    queryFn: () => streakService.getCurrentStreak(),
    staleTime: 60_000,
  });

  const s = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: theme.background },
        scroll: { flex: 1 },
        content: {
          paddingHorizontal: spacing.md,
          paddingBottom: 40,
          gap: spacing.md,
        },

        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: spacing.md,
          paddingBottom: spacing.xs,
        },
        greeting: {
          fontSize: 24,
          fontWeight: '800',
          color: theme.text,
          letterSpacing: -0.5,
        },
        date: {
          fontSize: 13,
          color: theme.textSecondary,
          marginTop: 2,
          textTransform: 'capitalize',
        },
        headerRight: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        streak: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: '#FFF3E0',
          borderRadius: radius.full,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderWidth: 1.5,
          borderColor: '#FFB74D',
        },
        streakNum: { fontSize: 14, fontWeight: '800', color: '#E65100' },
        aiBtn: {
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: theme.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
        },

        heroCard: {
          backgroundColor: theme.surface,
          borderRadius: radius.xl,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.md,
          alignItems: 'center',
          ...shadow.md,
        },
        arcWrap: {
          width: ARC,
          height: ARC,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        },
        arcInner: { alignItems: 'center' },
        arcNum: {
          fontSize: 52,
          fontWeight: '900',
          letterSpacing: -2,
          lineHeight: 56,
        },
        arcLabel: {
          fontSize: 14,
          color: theme.textMuted,
          fontWeight: '600',
          marginTop: 2,
        },

        calRow: {
          flexDirection: 'row',
          width: '100%',
          borderTopWidth: 1,
          borderTopColor: theme.borderLight,
          paddingTop: spacing.md,
        },
        calStat: { flex: 1, alignItems: 'center', gap: 3 },
        calStatNum: { fontSize: 17, fontWeight: '800' },
        calStatLabel: { fontSize: 11, color: theme.textSecondary },
        calDivider: {
          width: 1,
          backgroundColor: theme.borderLight,
          marginVertical: 4,
        },

        ringsCard: {
          backgroundColor: theme.surface,
          borderRadius: radius.xl,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          ...shadow.sm,
        },
        ringDivider: {
          width: 1,
          height: 50,
          backgroundColor: theme.borderLight,
        },

        quickRow: { flexDirection: 'row', gap: spacing.md },
        quickCard: {
          flex: 1,
          borderRadius: radius.xl,
          padding: spacing.md,
          gap: spacing.sm,
          ...shadow.sm,
        },
        quickIcon: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
        },
        quickTitle: {
          fontSize: 16,
          fontWeight: '800',
          color: theme.text,
          lineHeight: 22,
        },
        quickMeta: {
          flexDirection: 'row',
          alignItems: 'baseline',
          marginTop: 4,
        },
        quickMetaNum: { fontSize: 22, fontWeight: '900', color: theme.text },
        quickMetaLabel: { fontSize: 12, color: theme.textSecondary },

        macroCard: {
          backgroundColor: theme.surface,
          borderRadius: radius.xl,
          padding: spacing.md,
          gap: spacing.sm,
          ...shadow.sm,
        },
        macroRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        macroLabel: {
          fontSize: 12,
          color: theme.textSecondary,
          fontWeight: '600',
          width: 46,
        },
        macroTrack: {
          flex: 1,
          height: 6,
          backgroundColor: theme.surfaceAlt,
          borderRadius: 3,
          overflow: 'hidden',
        },
        macroFill: { height: '100%', borderRadius: 3 },
        macroVal: {
          fontSize: 12,
          fontWeight: '700',
          color: theme.text,
          width: 36,
          textAlign: 'right',
        },

        healthRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
        healthPill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: radius.full,
        },
        healthPillText: { fontSize: 13, fontWeight: '600' },

        reportCard: {
          backgroundColor: theme.surface,
          borderRadius: radius.xl,
          padding: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1.5,
          borderColor: theme.primary + '40',
          ...shadow.sm,
        },
        reportLeft: { gap: 4 },
        reportBadge: {
          alignSelf: 'flex-start',
          backgroundColor: theme.primary,
          borderRadius: radius.sm,
          paddingHorizontal: 6,
          paddingVertical: 2,
          marginBottom: 2,
        },
        reportBadgeText: {
          color: '#fff',
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.5,
        },
        reportTitle: { fontSize: 16, fontWeight: '800', color: theme.text },
        reportSub: { fontSize: 13, color: theme.textSecondary },
        reportRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
        reportEmoji: { fontSize: 28 },
      }),
    [theme],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.nutrition.all }),
      qc.invalidateQueries({ queryKey: queryKeys.fitness.all }),
      qc.invalidateQueries({ queryKey: queryKeys.health.all }),
    ]);
    setRefreshing(false);
  };

  const g = goals ?? {
    dailyCaloriesTarget: 2000,
    dailyProteinTarget: 150,
    dailyCarbsTarget: 250,
    dailyFatTarget: 65,
    dailyStepsTarget: 10000,
    dailyActiveMinutesTarget: 30,
    dailyWaterTarget: 2500,
  };

  const consumed = nutrition?.totalCalories ?? 0;
  const burned = fitness?.totalCaloriesBurned ?? 0;
  const net = consumed - burned;
  const left = Math.max(0, g.dailyCaloriesTarget - net);
  const over = net > g.dailyCaloriesTarget;
  const ringColor = over ? colors.danger : theme.primary;

  const steps = health?.steps ?? fitness?.totalSteps ?? 0;
  const activeMin = fitness?.totalDurationMinutes ?? 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* ── Header ── */}
        <Animated.View style={[s.header, staggerStyle(anims[0])]}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>{greeting(userName || 'jij')}</Text>
            <Text style={s.date}>{formatDate(new Date())}</Text>
          </View>
          <View style={s.headerRight}>
            {streak > 0 && (
              <TouchableOpacity
                style={s.streak}
                onPress={() => navigation.navigate('Achievements')}
                activeOpacity={0.8}
              >
                <Icon name="flame" size={15} color="#E65100" />
                <Text style={s.streakNum}>{streak}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={s.aiBtn}
              onPress={() =>
                navigation.navigate(
                  'DailyReport' as never,
                  { date: today } as never,
                )
              }
              activeOpacity={0.8}
            >
              <Icon name="document-text" size={18} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.aiBtn}
              onPress={() => navigation.navigate('Chat')}
              activeOpacity={0.8}
            >
              <Icon name="sparkles" size={18} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Hero calorie card ── */}
        <Animated.View style={[s.heroCard, staggerStyle(anims[1])]}>
          <View style={s.arcWrap}>
            <CalorieArc pct={net / g.dailyCaloriesTarget} color={ringColor} />
            <View style={s.arcInner}>
              <Text style={[s.arcNum, { color: ringColor }]}>
                {left.toLocaleString('nl')}
              </Text>
              <Text style={s.arcLabel}>kcal over</Text>
            </View>
          </View>
          <View style={s.calRow}>
            <CalStat
              label="Gegeten"
              value={consumed}
              color={theme.secondary}
              s={s}
            />
            <View style={s.calDivider} />
            <CalStat label="Verbrand" value={burned} color="#FF8C6B" s={s} />
            <View style={s.calDivider} />
            <CalStat
              label="Doel"
              value={g.dailyCaloriesTarget}
              color={theme.textMuted}
              s={s}
            />
          </View>
        </Animated.View>

        {/* ── Ring metrics ── */}
        <Animated.View style={[s.ringsCard, staggerStyle(anims[2])]}>
          <RingMetric
            icon="footsteps"
            value={
              steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : String(steps)
            }
            label="Stappen"
            pct={steps / g.dailyStepsTarget}
            color={theme.secondary}
          />
          <View style={s.ringDivider} />
          <RingMetric
            icon="time-outline"
            value={`${activeMin}m`}
            label="Actief"
            pct={activeMin / g.dailyActiveMinutesTarget}
            color={theme.accent}
          />
          <View style={s.ringDivider} />
          <RingMetric
            icon="water"
            value={`${(waterMl / 1000).toFixed(1)}L`}
            label="Water"
            pct={waterMl / g.dailyWaterTarget}
            color={theme.primary}
          />
        </Animated.View>

        {/* ── Quick log ── */}
        <Animated.View style={[s.quickRow, staggerStyle(anims[3])]}>
          <TouchableOpacity
            style={[s.quickCard, { backgroundColor: theme.secondaryLight }]}
            onPress={() => navigation.navigate('LogFood')}
            activeOpacity={0.85}
          >
            <View style={[s.quickIcon, { backgroundColor: theme.secondary }]}>
              <Icon name="restaurant" size={22} color="#fff" />
            </View>
            <Text style={s.quickTitle}>Maaltijd{'\n'}loggen</Text>
            <View style={s.quickMeta}>
              <Text style={s.quickMetaNum}>
                {nutrition?.entries.length ?? 0}
              </Text>
              <Text style={s.quickMetaLabel}> maaltijden</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.quickCard, { backgroundColor: theme.accentLight }]}
            onPress={() => navigation.navigate('LogWorkout')}
            activeOpacity={0.85}
          >
            <View style={[s.quickIcon, { backgroundColor: theme.accent }]}>
              <Icon name="barbell" size={22} color="#fff" />
            </View>
            <Text style={s.quickTitle}>Training{'\n'}loggen</Text>
            <View style={s.quickMeta}>
              <Text style={s.quickMetaNum}>
                {fitness?.workouts.length ?? 0}
              </Text>
              <Text style={s.quickMetaLabel}> trainingen</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Macro strip ── */}
        <Animated.View style={[s.macroCard, staggerStyle(anims[4])]}>
          {(
            [
              {
                label: 'Eiwit',
                val: nutrition?.totalProtein ?? 0,
                tgt: g.dailyProteinTarget,
                color: colors.protein,
              },
              {
                label: 'Koolh.',
                val: nutrition?.totalCarbs ?? 0,
                tgt: g.dailyCarbsTarget,
                color: colors.carbs,
              },
              {
                label: 'Vet',
                val: nutrition?.totalFat ?? 0,
                tgt: g.dailyFatTarget,
                color: colors.fat,
              },
            ] as const
          ).map(m => (
            <View key={m.label} style={s.macroRow}>
              <Text style={s.macroLabel}>{m.label}</Text>
              <View style={s.macroTrack}>
                <View
                  style={[
                    s.macroFill,
                    {
                      width: `${Math.min((m.val / m.tgt) * 100, 100)}%` as any,
                      backgroundColor: m.color,
                    },
                  ]}
                />
              </View>
              <Text style={s.macroVal}>{Math.round(m.val)}g</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── Health pills (optional) ── */}
        {health && (health.heartRateAvg || health.sleepHours) && (
          <View style={s.healthRow}>
            {health.heartRateAvg ? (
              <HealthPill
                icon="heart"
                value={`${health.heartRateAvg} bpm`}
                color="#E05555"
                s={s}
              />
            ) : null}
            {health.sleepHours ? (
              <HealthPill
                icon="moon"
                value={`${health.sleepHours}u slaap`}
                color="#7B6FA0"
                s={s}
              />
            ) : null}
          </View>
        )}

        {/* ── Weekly Report promo ── */}
        <TouchableOpacity
          style={s.reportCard}
          onPress={() => navigation.navigate('WeeklyReport' as never)}
          activeOpacity={0.85}
        >
          <View style={s.reportLeft}>
            <View style={s.reportBadge}>
              <Text style={s.reportBadgeText}>PRO</Text>
            </View>
            <Text style={s.reportTitle}>AI Weekrapport</Text>
            <Text style={s.reportSub}>Persoonlijke analyse van je week</Text>
          </View>
          <View style={s.reportRight}>
            <Text style={s.reportEmoji}>📊</Text>
            <Icon name="chevron-forward" size={16} color={theme.primary} />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function CalStat({
  label,
  value,
  color,
  s,
}: {
  label: string;
  value: number;
  color: string;
  s: any;
}) {
  return (
    <View style={s.calStat}>
      <Text style={[s.calStatNum, { color }]}>
        {value.toLocaleString('nl')}
      </Text>
      <Text style={s.calStatLabel}>{label}</Text>
    </View>
  );
}

function HealthPill({
  icon,
  value,
  color,
  s,
}: {
  icon: string;
  value: string;
  color: string;
  s: any;
}) {
  return (
    <View style={[s.healthPill, { backgroundColor: color + '14' }]}>
      <Icon name={icon} size={14} color={color} />
      <Text style={[s.healthPillText, { color }]}>{value}</Text>
    </View>
  );
}

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Markdown from 'react-native-markdown-display';
import Icon from 'react-native-vector-icons/Ionicons';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { spacing, radius, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { aiService } from '../services/AIService';
import { nutritionService } from '../services/NutritionService';
import { fitnessService } from '../services/FitnessService';
import { useDailyHealthSummary } from '../hooks/useGoogleHealth';
import { useWaterTotal, useGoals } from '../hooks/useNutrition';
import { DEFAULT_GOALS } from '../types';
import { todayStr } from '../utils/helpers';

export function DailyReportScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const date: string = route.params?.date ?? todayStr();
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: health } = useDailyHealthSummary(date);
  const { data: waterMl = 0 } = useWaterTotal(date);
  const { data: goals } = useGoals();

  const dateLabel = useMemo(() => {
    try {
      return format(parseISO(date), 'd MMMM yyyy', { locale: nl });
    } catch {
      return date;
    }
  }, [date]);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const [nutrition, fitness] = await Promise.all([
        nutritionService.getSummary(date),
        fitnessService.getSummary(date),
      ]);

      const result = await aiService.generateDailyReport({
        date: dateLabel,
        nutrition: {
          calories: nutrition.totalCalories,
          protein: nutrition.totalProtein,
          carbs: nutrition.totalCarbs,
          fat: nutrition.totalFat,
          entries: nutrition.entries.map(e => ({
            name: e.name,
            calories: e.calories,
            mealType: e.mealType,
          })),
        },
        fitness: {
          caloriesBurned: fitness.totalCaloriesBurned,
          durationMinutes: fitness.totalDurationMinutes,
          workouts: fitness.workouts.map(w => ({
            name: w.name,
            durationMinutes: w.durationMinutes,
            caloriesBurned: w.caloriesBurned,
          })),
        },
        water: waterMl,
        goals: goals ?? DEFAULT_GOALS,
        health: health
          ? {
              steps: health.steps,
              heartRateAvg: health.heartRateAvg,
              sleepHours: health.sleepHours,
            }
          : null,
      });

      setReport(result);
    } catch (err: any) {
      Alert.alert('Fout', err.message);
    } finally {
      setLoading(false);
    }
  }, [date, dateLabel, waterMl, goals, health]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: theme.background },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: theme.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        backBtn: { padding: 4, marginRight: spacing.sm },
        headerCenter: { flex: 1 },
        headerTitle: { fontSize: 17, fontWeight: '700', color: theme.text },
        headerSub: { fontSize: 12, color: theme.textSecondary, marginTop: 1 },
        scroll: { flex: 1 },
        content: { padding: spacing.md, paddingBottom: spacing.xl },
        emptyState: { alignItems: 'center', paddingTop: spacing.xl * 1.5 },
        emptyEmoji: { fontSize: 52, marginBottom: spacing.md },
        emptyTitle: {
          fontSize: 20,
          fontWeight: '800',
          color: theme.text,
          marginBottom: spacing.sm,
          textAlign: 'center',
        },
        emptyDesc: {
          fontSize: 15,
          color: theme.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: spacing.lg,
        },
        statsRow: {
          flexDirection: 'row',
          gap: spacing.sm,
          marginBottom: spacing.lg,
          width: '100%',
        },
        statChip: {
          flex: 1,
          backgroundColor: theme.surface,
          borderRadius: radius.md,
          padding: spacing.sm,
          alignItems: 'center',
          gap: 2,
          ...shadow.sm,
        },
        statVal: { fontSize: 16, fontWeight: '800', color: theme.text },
        statLabel: { fontSize: 11, color: theme.textSecondary },
        loadingState: {
          alignItems: 'center',
          paddingTop: spacing.xl * 2,
          gap: spacing.md,
        },
        loadingText: { fontSize: 16, fontWeight: '600', color: theme.text },
        loadingSubText: { fontSize: 14, color: theme.textSecondary },
        footer: {
          padding: spacing.md,
          backgroundColor: theme.surface,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        },
        generateBtn: {
          backgroundColor: theme.primary,
          borderRadius: radius.lg,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
          ...shadow.md,
        },
        generateBtnDisabled: { opacity: 0.6 },
        generateBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
        regenerateBtn: {
          borderRadius: radius.lg,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
          borderWidth: 1.5,
          borderColor: theme.border,
        },
        regenerateBtnText: {
          color: theme.textSecondary,
          fontSize: 14,
          fontWeight: '600',
        },
      }),
    [theme],
  );

  const mdStyles = useMemo(
    () => ({
      body: { color: theme.text, fontSize: 15, lineHeight: 24 },
      heading1: {
        fontSize: 18,
        fontWeight: '800' as const,
        color: theme.text,
        marginBottom: 6,
        marginTop: 8,
      },
      heading2: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: theme.text,
        marginBottom: 4,
        marginTop: 12,
      },
      strong: { fontWeight: '700' as const, color: theme.text },
      bullet_list: { marginVertical: 4 },
      list_item: { marginVertical: 2 },
      paragraph: { marginVertical: 4 },
    }),
    [theme],
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Dagrapport</Text>
          <Text style={s.headerSub}>{dateLabel}</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {!report && !loading && (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>📋</Text>
            <Text style={s.emptyTitle}>Dagrapport {dateLabel}</Text>
            <Text style={s.emptyDesc}>
              Laat de AI je dag analyseren — wat ging goed, een tip voor morgen,
              en een score van je dag.
            </Text>
            <DayStats date={date} waterMl={waterMl} styles={s} />
          </View>
        )}

        {loading && (
          <View style={s.loadingState}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={s.loadingText}>Dag wordt geanalyseerd...</Text>
            <Text style={s.loadingSubText}>Even geduld</Text>
          </View>
        )}

        {report && !loading && (
          <>
            <Markdown style={mdStyles}>{report}</Markdown>
            <TouchableOpacity style={s.regenerateBtn} onPress={generate}>
              <Icon name="refresh" size={16} color={theme.textSecondary} />
              <Text style={s.regenerateBtnText}>Opnieuw genereren</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {!report && (
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.generateBtn, loading && s.generateBtnDisabled]}
            onPress={generate}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Icon name="sparkles" size={18} color="#fff" />
                <Text style={s.generateBtnText}>Dagrapport genereren</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function DayStats({
  date,
  waterMl,
  styles,
}: {
  date: string;
  waterMl: number;
  styles: any;
}) {
  const [stats, setStats] = useState<{
    calories: number;
    workouts: number;
  } | null>(null);

  React.useEffect(() => {
    Promise.all([
      nutritionService.getSummary(date),
      fitnessService.getSummary(date),
    ]).then(([n, f]) => {
      setStats({ calories: n.totalCalories, workouts: f.workouts.length });
    });
  }, [date]);

  if (!stats) return null;

  return (
    <View style={styles.statsRow}>
      <View style={styles.statChip}>
        <Text style={styles.statVal}>{stats.calories}</Text>
        <Text style={styles.statLabel}>kcal</Text>
      </View>
      <View style={styles.statChip}>
        <Text style={styles.statVal}>{stats.workouts}</Text>
        <Text style={styles.statLabel}>trainingen</Text>
      </View>
      <View style={styles.statChip}>
        <Text style={styles.statVal}>{(waterMl / 1000).toFixed(1)}L</Text>
        <Text style={styles.statLabel}>water</Text>
      </View>
    </View>
  );
}

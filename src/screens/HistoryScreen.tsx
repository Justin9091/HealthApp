import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeeklyNutrition } from '../hooks/useNutrition';
import { useWeeklyFitness } from '../hooks/useFitness';
import { colors, spacing, radius, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { formatDate } from '../utils/helpers';

export function HistoryScreen() {
  const { theme } = useTheme();
  const { data: nutritionWeek, isLoading: nutLoading } = useWeeklyNutrition();
  const { data: fitnessWeek, isLoading: fitLoading } = useWeeklyFitness();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: theme.background },
        scroll: { flex: 1 },
        content: { padding: spacing.md, gap: spacing.md },
        loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        title: { fontSize: 22, fontWeight: '800', color: theme.text },
        card: {
          backgroundColor: theme.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          gap: spacing.sm,
          ...shadow.sm,
        },
        cardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        dayLabel: { fontSize: 16, fontWeight: '700', color: theme.text },
        dayDate: { fontSize: 12, color: theme.textMuted },
        metricsRow: { flexDirection: 'row', justifyContent: 'space-around' },
        metric: { alignItems: 'center' },
        metricValue: { fontSize: 18, fontWeight: '700' },
        metricUnit: { fontSize: 11, color: theme.textSecondary },
        metricLabel: { fontSize: 11, color: theme.textMuted },
        workoutBadge: {
          backgroundColor: theme.secondaryLight,
          borderRadius: radius.sm,
          padding: spacing.sm,
          alignItems: 'center',
        },
        workoutBadgeText: {
          color: theme.secondary,
          fontWeight: '600',
          fontSize: 13,
        },
      }),
    [theme],
  );

  if (nutLoading || fitLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Afgelopen 7 dagen</Text>

        {nutritionWeek?.map((day, idx) => {
          const fitness = fitnessWeek?.[idx];
          const net = day.totalCalories - (fitness?.totalCaloriesBurned ?? 0);

          return (
            <View key={day.date} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.dayLabel}>{formatDate(day.date)}</Text>
                <Text style={styles.dayDate}>{day.date}</Text>
              </View>

              <View style={styles.metricsRow}>
                <Metric
                  label="Gegeten"
                  value={`${Math.round(day.totalCalories)}`}
                  unit="kcal"
                  color={theme.primary}
                  styles={styles}
                />
                <Metric
                  label="Verbrand"
                  value={`${Math.round(fitness?.totalCaloriesBurned ?? 0)}`}
                  unit="kcal"
                  color={theme.secondary}
                  styles={styles}
                />
                <Metric
                  label="Netto"
                  value={`${Math.round(net)}`}
                  unit="kcal"
                  color={net > 2200 ? colors.danger : theme.text}
                  styles={styles}
                />
              </View>

              <View style={styles.metricsRow}>
                <Metric
                  label="Eiwit"
                  value={`${Math.round(day.totalProtein)}`}
                  unit="g"
                  color={colors.protein}
                  styles={styles}
                />
                <Metric
                  label="Koolhyd."
                  value={`${Math.round(day.totalCarbs)}`}
                  unit="g"
                  color={colors.carbs}
                  styles={styles}
                />
                <Metric
                  label="Vetten"
                  value={`${Math.round(day.totalFat)}`}
                  unit="g"
                  color={colors.fat}
                  styles={styles}
                />
              </View>

              {(fitness?.totalDurationMinutes ?? 0) > 0 && (
                <View style={styles.workoutBadge}>
                  <Text style={styles.workoutBadgeText}>
                    💪 {fitness!.workouts.length} training
                    {fitness!.workouts.length !== 1 ? 'en' : ''} ·{' '}
                    {fitness!.totalDurationMinutes} min
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({
  label,
  value,
  unit,
  color,
  styles,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
  styles: any;
}) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricUnit}>{unit}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

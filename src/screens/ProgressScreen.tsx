import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWeeklyNutrition, useGoals } from '../hooks/useNutrition';
import { useWeeklyFitness } from '../hooks/useFitness';
import { weightService } from '../services/WeightService';
import { colors, spacing, radius, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { queryKeys } from '../utils/queryKeys';
import { todayStr } from '../utils/helpers';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

type Tab = 'Voeding' | 'Fitness' | 'Gewicht';
const TABS: Tab[] = ['Voeding', 'Fitness', 'Gewicht'];

const DAY_LABELS = ['Z', 'M', 'D', 'W', 'D', 'V', 'Z'];

// ─── Simple pure-RN bar chart ──────────────────────────────────────────────────

interface BarChartProps {
  data: { label: string; value: number; date: string }[];
  maxValue: number;
  goalValue?: number;
  color: string;
  unit: string;
}

function BarChart({ data, maxValue, goalValue, color, unit }: BarChartProps) {
  const { theme } = useTheme();
  const chartMax = Math.max(maxValue, goalValue ?? 0, 1);

  const chartStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginTop: spacing.sm,
          position: 'relative',
        },
        bars: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 6,
          height: 168,
          paddingTop: 24,
        },
        barCol: {
          flex: 1,
          alignItems: 'center',
          gap: 4,
        },
        barTrack: {
          width: '100%',
          height: 120,
          justifyContent: 'flex-end',
          borderRadius: 4,
          overflow: 'hidden',
        },
        bar: {
          width: '100%',
          borderRadius: 4,
          minHeight: 0,
        },
        dayLabel: { fontSize: 11, color: theme.textMuted, fontWeight: '500' },
        valueLabel: { fontSize: 9, color: theme.textSecondary, height: 14 },
        goalLine: {
          position: 'absolute',
          left: 0,
          right: 0,
          height: 1.5,
          backgroundColor: theme.secondary,
          opacity: 0.4,
          zIndex: 1,
        },
        goalLabel: {
          fontSize: 11,
          color: theme.textSecondary,
          marginTop: spacing.xs,
          textAlign: 'right',
        },
      }),
    [theme],
  );

  return (
    <View style={chartStyles.container}>
      {goalValue !== undefined && (
        <View
          style={[
            chartStyles.goalLine,
            { bottom: (goalValue / chartMax) * 120 + 24 },
          ]}
        />
      )}
      <View style={chartStyles.bars}>
        {data.map((item, i) => {
          const barHeight = Math.max(
            (item.value / chartMax) * 120,
            item.value > 0 ? 4 : 0,
          );
          return (
            <View key={i} style={chartStyles.barCol}>
              <Text style={chartStyles.valueLabel}>
                {item.value > 0
                  ? item.value >= 1000
                    ? `${Math.round(item.value / 100) / 10}k`
                    : item.value
                  : ''}
              </Text>
              <View style={chartStyles.barTrack}>
                <View
                  style={[
                    chartStyles.bar,
                    {
                      height: barHeight,
                      backgroundColor:
                        goalValue && item.value >= goalValue
                          ? theme.secondary
                          : color,
                    },
                  ]}
                />
              </View>
              <Text style={chartStyles.dayLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
      {goalValue !== undefined && (
        <Text style={chartStyles.goalLabel}>
          Doel: {goalValue} {unit}
        </Text>
      )}
    </View>
  );
}

// ─── Weight Tab ────────────────────────────────────────────────────────────────

function WeightTab() {
  const { theme } = useTheme();
  const qc = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  const wtStyles = useMemo(
    () =>
      StyleSheet.create({
        container: { gap: spacing.sm },
        loading: { paddingVertical: spacing.xl, alignItems: 'center' },
        trendCard: {
          backgroundColor: theme.primaryLight,
          borderRadius: radius.lg,
          padding: spacing.md,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        trendTitle: { fontSize: 12, color: theme.textSecondary },
        trendValue: {
          fontSize: 24,
          fontWeight: '700',
          color: theme.text,
          marginTop: 2,
        },
        trendBadge: { alignItems: 'flex-end' },
        trendArrow: { fontSize: 22, fontWeight: '700' },
        trendDelta: { fontSize: 12, fontWeight: '500' },
        addBtn: {
          backgroundColor: theme.primary,
          borderRadius: radius.lg,
          padding: spacing.sm + 2,
          alignItems: 'center',
        },
        addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
        empty: { alignItems: 'center', paddingVertical: spacing.xl },
        emptyText: { fontSize: 15, fontWeight: '600', color: theme.text },
        emptyHint: {
          fontSize: 13,
          color: theme.textSecondary,
          marginTop: 4,
          textAlign: 'center',
        },
        entryRow: {
          backgroundColor: theme.surface,
          borderRadius: radius.md,
          padding: spacing.sm + 2,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          ...shadow.sm,
        },
        entryDate: { fontSize: 14, fontWeight: '600', color: theme.text },
        entryNote: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
        entryWeight: { fontSize: 18, fontWeight: '700', color: theme.primary },
        modalOverlay: {
          flex: 1,
          backgroundColor: theme.isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
          justifyContent: 'flex-end',
        },
        modalCard: {
          backgroundColor: theme.surface,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          padding: spacing.lg,
          gap: spacing.sm,
        },
        modalTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: theme.text,
          marginBottom: 4,
        },
        modalLabel: {
          fontSize: 13,
          color: theme.textSecondary,
          fontWeight: '500',
        },
        modalInput: {
          backgroundColor: theme.surfaceAlt,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.sm,
          paddingVertical: 10,
          fontSize: 16,
          color: theme.text,
        },
        modalActions: {
          flexDirection: 'row',
          gap: spacing.sm,
          marginTop: spacing.xs,
        },
        modalBtn: {
          flex: 1,
          borderRadius: radius.lg,
          padding: spacing.sm,
          alignItems: 'center',
        },
        modalCancelBtn: { backgroundColor: theme.surfaceAlt },
        modalCancelText: {
          fontSize: 15,
          color: theme.textSecondary,
          fontWeight: '600',
        },
        modalSaveBtn: { backgroundColor: theme.primary },
        modalSaveText: { fontSize: 15, color: '#fff', fontWeight: '700' },
      }),
    [theme],
  );

  const { data: entries = [], isLoading } = useQuery({
    queryKey: queryKeys.weight.entries(),
    queryFn: () => weightService.getEntries(),
    staleTime: 30_000,
  });

  const { data: trend } = useQuery({
    queryKey: queryKeys.weight.trend(),
    queryFn: () => weightService.getTrend(),
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: ({ kg, note }: { kg: number; note?: string }) =>
      weightService.addEntry(kg, todayStr(), note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.weight.entries() });
      qc.invalidateQueries({ queryKey: queryKeys.weight.trend() });
      setModalVisible(false);
      setWeightInput('');
      setNoteInput('');
    },
  });

  const handleAdd = () => {
    const kg = parseFloat(weightInput.replace(',', '.'));
    if (isNaN(kg) || kg <= 0 || kg > 500) {
      Alert.alert(
        'Ongeldige waarde',
        'Voer een geldig gewicht in (bijv. 72.5).',
      );
      return;
    }
    addMutation.mutate({ kg, note: noteInput.trim() || undefined });
  };

  const trendArrow =
    trend?.delta === null
      ? null
      : trend!.delta! > 0
      ? { symbol: '↑', color: colors.danger }
      : trend!.delta! < 0
      ? { symbol: '↓', color: theme.secondary }
      : { symbol: '→', color: theme.textSecondary };

  if (isLoading) {
    return (
      <View style={wtStyles.loading}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={wtStyles.container}>
      {/* Trend card */}
      {trend && trend.avgLast7 !== null && (
        <View style={[wtStyles.trendCard]}>
          <View>
            <Text style={wtStyles.trendTitle}>Gemiddeld (laatste 7)</Text>
            <Text style={wtStyles.trendValue}>
              {trend.avgLast7.toFixed(1)} kg
            </Text>
          </View>
          {trendArrow && trend.delta !== null && (
            <View style={wtStyles.trendBadge}>
              <Text style={[wtStyles.trendArrow, { color: trendArrow.color }]}>
                {trendArrow.symbol}
              </Text>
              <Text style={[wtStyles.trendDelta, { color: trendArrow.color }]}>
                {Math.abs(trend.delta).toFixed(1)} kg vs vorige week
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Add button */}
      <TouchableOpacity
        style={wtStyles.addBtn}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={wtStyles.addBtnText}>+ Gewicht toevoegen</Text>
      </TouchableOpacity>

      {/* Entries list */}
      {entries.length === 0 ? (
        <View style={wtStyles.empty}>
          <Text style={wtStyles.emptyText}>Nog geen gewichtsmetingen.</Text>
          <Text style={wtStyles.emptyHint}>
            Voeg je eerste meting toe om je voortgang bij te houden.
          </Text>
        </View>
      ) : (
        entries.map(entry => (
          <View key={entry.id} style={wtStyles.entryRow}>
            <View>
              <Text style={wtStyles.entryDate}>
                {format(new Date(entry.date), 'd MMMM yyyy', { locale: nl })}
              </Text>
              {entry.note ? (
                <Text style={wtStyles.entryNote}>{entry.note}</Text>
              ) : null}
            </View>
            <Text style={wtStyles.entryWeight}>
              {entry.weightKg.toFixed(1)} kg
            </Text>
          </View>
        ))
      )}

      {/* Add weight modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={wtStyles.modalOverlay}>
          <View style={wtStyles.modalCard}>
            <Text style={wtStyles.modalTitle}>Gewicht toevoegen</Text>
            <Text style={wtStyles.modalLabel}>Gewicht (kg)</Text>
            <TextInput
              style={wtStyles.modalInput}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              placeholder="bijv. 72.5"
              placeholderTextColor={theme.textMuted}
              selectTextOnFocus
              autoFocus
            />
            <Text style={wtStyles.modalLabel}>Notitie (optioneel)</Text>
            <TextInput
              style={wtStyles.modalInput}
              value={noteInput}
              onChangeText={setNoteInput}
              placeholder="bijv. na ontbijt"
              placeholderTextColor={theme.textMuted}
              returnKeyType="done"
            />
            <View style={wtStyles.modalActions}>
              <TouchableOpacity
                style={[wtStyles.modalBtn, wtStyles.modalCancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={wtStyles.modalCancelText}>Annuleren</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[wtStyles.modalBtn, wtStyles.modalSaveBtn]}
                onPress={handleAdd}
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={wtStyles.modalSaveText}>Opslaan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Main ProgressScreen ───────────────────────────────────────────────────────

export function ProgressScreen() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('Voeding');

  const { data: weeklyNutrition = [], isLoading: nutLoading } =
    useWeeklyNutrition();
  const { data: weeklyFitness = [], isLoading: fitLoading } =
    useWeeklyFitness();
  const { data: goals } = useGoals();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: theme.background },
        tabBar: {
          flexDirection: 'row',
          backgroundColor: theme.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.xs,
        },
        tabItem: {
          flex: 1,
          paddingVertical: spacing.sm,
          alignItems: 'center',
          borderBottomWidth: 2,
          borderBottomColor: 'transparent',
        },
        tabItemActive: {
          borderBottomColor: theme.primary,
        },
        tabText: {
          fontSize: 14,
          fontWeight: '500',
          color: theme.textSecondary,
        },
        tabTextActive: {
          color: theme.primary,
          fontWeight: '700',
        },
        scroll: { flex: 1 },
        content: {
          padding: spacing.md,
          gap: spacing.md,
          paddingBottom: spacing.xl,
        },
        card: {
          backgroundColor: theme.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          ...shadow.sm,
        },
        cardTitle: {
          fontSize: 15,
          fontWeight: '700',
          color: theme.text,
          marginBottom: spacing.xs,
        },
        legendRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: spacing.sm,
          gap: 4,
        },
        legendDot: { width: 8, height: 8, borderRadius: 4 },
        legendText: { fontSize: 11, color: theme.textSecondary },
      }),
    [theme],
  );

  // weeklyNutrition is newest-first — reverse for chart display (oldest left)
  const nutritionChartData = [...weeklyNutrition].reverse().map(d => ({
    label: DAY_LABELS[new Date(d.date).getDay()],
    value: d.totalCalories,
    date: d.date,
  }));

  const fitnessChartData = [...weeklyFitness].reverse().map(d => ({
    label: DAY_LABELS[new Date(d.date).getDay()],
    value: d.totalDurationMinutes,
    date: d.date,
  }));

  const maxCalories = Math.max(...nutritionChartData.map(d => d.value), 1);
  const maxMinutes = Math.max(...fitnessChartData.map(d => d.value), 1);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'Voeding' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Calorieën — afgelopen 7 dagen</Text>
            {nutLoading ? (
              <ActivityIndicator
                color={theme.primary}
                style={{ marginVertical: spacing.lg }}
              />
            ) : (
              <BarChart
                data={nutritionChartData}
                maxValue={maxCalories}
                goalValue={goals?.dailyCaloriesTarget}
                color={colors.calories}
                unit="kcal"
              />
            )}
            <View style={styles.legendRow}>
              <View
                style={[styles.legendDot, { backgroundColor: colors.calories }]}
              />
              <Text style={styles.legendText}>Ingenomen kcal</Text>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: theme.secondary, marginLeft: 12 },
                ]}
              />
              <Text style={styles.legendText}>Doel gehaald</Text>
            </View>
          </View>
        )}

        {activeTab === 'Fitness' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Actieve minuten — afgelopen 7 dagen
            </Text>
            {fitLoading ? (
              <ActivityIndicator
                color={theme.primary}
                style={{ marginVertical: spacing.lg }}
              />
            ) : (
              <BarChart
                data={fitnessChartData}
                maxValue={maxMinutes}
                goalValue={goals?.dailyActiveMinutesTarget}
                color={theme.accent}
                unit="min"
              />
            )}
            <View style={styles.legendRow}>
              <View
                style={[styles.legendDot, { backgroundColor: theme.accent }]}
              />
              <Text style={styles.legendText}>Actieve minuten</Text>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: theme.secondary, marginLeft: 12 },
                ]}
              />
              <Text style={styles.legendText}>Doel gehaald</Text>
            </View>
          </View>
        )}

        {activeTab === 'Gewicht' && <WeightTab />}
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  achievementService,
  Achievement,
  AchievementCategory,
} from '../services/AchievementService';
import { spacing, radius, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

type Filter = 'all' | AchievementCategory;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Alles' },
  { key: 'streak', label: '🔥 Streaks' },
  { key: 'nutrition', label: '🍽️ Voeding' },
  { key: 'fitness', label: '💪 Fitness' },
  { key: 'weight', label: '⚖️ Gewicht' },
  { key: 'milestone', label: '📅 Mijlpalen' },
];

function ProgressBar({
  progress,
  unlocked,
}: {
  progress: number;
  unlocked: boolean;
}) {
  const { theme } = useTheme();
  return (
    <View style={[pb.track, { backgroundColor: theme.surfaceAlt }]}>
      <View
        style={[
          pb.fill,
          { width: `${progress}%` as any },
          unlocked
            ? { backgroundColor: theme.secondary }
            : { backgroundColor: theme.primary },
        ]}
      />
    </View>
  );
}

const pb = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
  },
  fill: { height: '100%', borderRadius: 3 },
});

function AchievementCard({ item }: { item: Achievement }) {
  const { theme } = useTheme();
  const card = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: theme.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
          ...shadow.sm,
        },
        locked: { opacity: 0.65 },
        icon: { fontSize: 32, marginTop: 2 },
        iconLocked: { opacity: 0.5 },
        body: { flex: 1 },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        },
        title: { fontSize: 15, fontWeight: '700', color: theme.text },
        titleLocked: { color: theme.textSecondary },
        badge: {
          backgroundColor: theme.secondary,
          borderRadius: radius.xl,
          paddingHorizontal: 8,
          paddingVertical: 2,
        },
        badgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
        desc: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
        progressText: { fontSize: 11, color: theme.textMuted, marginTop: 3 },
        unlockedDate: { fontSize: 11, color: theme.secondary, marginTop: 3 },
      }),
    [theme],
  );

  const unlocked = !!item.unlockedAt;

  return (
    <View style={[card.root, !unlocked && card.locked]}>
      <Text style={[card.icon, !unlocked && card.iconLocked]}>{item.icon}</Text>
      <View style={card.body}>
        <View style={card.titleRow}>
          <Text style={[card.title, !unlocked && card.titleLocked]}>
            {item.title}
          </Text>
          {unlocked && (
            <View style={card.badge}>
              <Text style={card.badgeText}>✓ Behaald</Text>
            </View>
          )}
        </View>
        <Text style={card.desc}>{item.description}</Text>
        {!unlocked && (
          <>
            <ProgressBar progress={item.progress} unlocked={false} />
            <Text style={card.progressText}>
              {item.current} / {item.target}
            </Text>
          </>
        )}
        {unlocked && item.unlockedAt && (
          <Text style={card.unlockedDate}>
            Behaald op{' '}
            {new Date(item.unlockedAt).toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        )}
      </View>
    </View>
  );
}

export function AchievementsScreen() {
  const { theme } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: theme.background },
        summaryCard: {
          backgroundColor: theme.primary,
          padding: spacing.md,
          paddingTop: spacing.sm,
        },
        summaryTitle: {
          fontSize: 13,
          color: 'rgba(255,255,255,0.8)',
          fontWeight: '600',
        },
        summaryCount: { marginTop: 2 },
        summaryNum: { fontSize: 28, fontWeight: '800', color: '#fff' },
        summaryTotal: { fontSize: 16, color: 'rgba(255,255,255,0.7)' },
        summaryBarTrack: {
          height: 6,
          backgroundColor: 'rgba(255,255,255,0.3)',
          borderRadius: 3,
          marginTop: 8,
          overflow: 'hidden',
        },
        summaryBarFill: {
          height: '100%',
          backgroundColor: '#fff',
          borderRadius: 3,
        },
        filterRow: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          gap: 8,
        },
        chip: {
          paddingHorizontal: 14,
          paddingVertical: 6,
          borderRadius: radius.xl,
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
        },
        chipActive: {
          backgroundColor: theme.primary,
          borderColor: theme.primary,
        },
        chipText: {
          fontSize: 13,
          color: theme.textSecondary,
          fontWeight: '500',
        },
        chipTextActive: { color: '#fff', fontWeight: '700' },
        loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        list: {
          padding: spacing.md,
          gap: spacing.sm,
          paddingBottom: spacing.xl,
        },
      }),
    [theme],
  );

  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => achievementService.evaluate(),
    staleTime: 60_000,
  });

  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const total = achievements.length;

  const filtered =
    filter === 'all'
      ? achievements
      : achievements.filter(a => a.category === filter);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Summary header */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>🏅 Achievements</Text>
        <Text style={styles.summaryCount}>
          <Text style={styles.summaryNum}>{unlockedCount}</Text>
          <Text style={styles.summaryTotal}> / {total} behaald</Text>
        </Text>
        <View style={styles.summaryBarTrack}>
          <View
            style={[
              styles.summaryBarFill,
              {
                width: `${
                  total > 0 ? (unlockedCount / total) * 100 : 0
                }%` as any,
              },
            ]}
          />
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.chipText,
                filter === f.key && styles.chipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map(item => (
            <AchievementCard key={item.id} item={item} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

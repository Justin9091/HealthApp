import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Markdown from 'react-native-markdown-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { format, subDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { spacing, radius, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { aiService } from '../services/AIService';
import { nutritionService } from '../services/NutritionService';
import { fitnessService } from '../services/FitnessService';
import { weightService } from '../services/WeightService';
import { DEFAULT_GOALS } from '../types';

const PRO_KEY = 'pro:unlocked';
const REPORT_CACHE_KEY = 'weekly_report:cache';
const REPORT_DATE_KEY = 'weekly_report:date';

export function WeeklyReportScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [cachedDate, setCachedDate] = useState<string | null>(null);

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
        proBadge: {
          backgroundColor: theme.primary,
          borderRadius: radius.sm,
          paddingHorizontal: 8,
          paddingVertical: 3,
        },
        proBadgeText: {
          color: '#fff',
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 0.5,
        },
        scroll: { flex: 1 },
        content: { padding: spacing.md, paddingBottom: spacing.xl },
        emptyState: { alignItems: 'center', paddingTop: spacing.xl },
        emptyEmoji: { fontSize: 56, marginBottom: spacing.md },
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
        previewCard: {
          width: '100%',
          backgroundColor: theme.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          ...shadow.sm,
        },
        previewTitle: {
          fontSize: 13,
          fontWeight: '700',
          color: theme.textSecondary,
          marginBottom: spacing.sm,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        previewItem: { fontSize: 15, color: theme.text, marginBottom: 8 },
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
      heading3: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: theme.text,
        marginBottom: 2,
        marginTop: 6,
      },
      strong: { fontWeight: '700' as const, color: theme.text },
      bullet_list: { marginVertical: 4 },
      list_item: { marginVertical: 2 },
      paragraph: { marginVertical: 4 },
    }),
    [theme],
  );

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(PRO_KEY),
      AsyncStorage.getItem(REPORT_CACHE_KEY),
      AsyncStorage.getItem(REPORT_DATE_KEY),
    ]).then(([pro, cached, date]) => {
      setIsPro(pro === 'true');
      if (cached) {
        setReport(cached);
        setCachedDate(date);
      }
    });
  }, []);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      const dates = Array.from({ length: 7 }, (_, i) =>
        format(subDays(today, 6 - i), 'yyyy-MM-dd'),
      );

      const [nutritionDays, fitnessDays, weightEntries] = await Promise.all([
        Promise.all(
          dates.map(async d => {
            const summary = await nutritionService.getSummary(d);
            return {
              date: d,
              calories: summary.totalCalories,
              protein: summary.totalProtein,
              carbs: summary.totalCarbs,
              fat: summary.totalFat,
              entries: summary.entries.length,
            };
          }),
        ),
        Promise.all(
          dates.map(async d => {
            const summary = await fitnessService.getSummary(d);
            return {
              date: d,
              caloriesBurned: summary.totalCaloriesBurned,
              durationMinutes: summary.totalDurationMinutes,
              workouts: summary.workouts.length,
            };
          }),
        ),
        weightService.getEntries(),
      ]);

      let weightChange: number | null = null;
      if (weightEntries.length >= 2) {
        weightChange =
          weightEntries[0].weightKg -
          weightEntries[Math.min(weightEntries.length - 1, 6)].weightKg;
      }

      const result = await aiService.generateWeeklyReport({
        nutrition: nutritionDays,
        fitness: fitnessDays,
        goals: DEFAULT_GOALS,
        weightChange,
      });

      setReport(result);
      setCachedDate(format(today, 'd MMMM', { locale: nl }));
      await AsyncStorage.setItem(REPORT_CACHE_KEY, result);
      await AsyncStorage.setItem(
        REPORT_DATE_KEY,
        format(today, 'd MMMM', { locale: nl }),
      );
    } catch (err: any) {
      Alert.alert('Fout', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGenerate = () => {
    if (!isPro) {
      setShowPaywall(true);
      return;
    }
    generate();
  };

  const handleUnlock = async () => {
    await AsyncStorage.setItem(PRO_KEY, 'true');
    setIsPro(true);
    setShowPaywall(false);
    generate();
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Weekrapport</Text>
          {cachedDate && (
            <Text style={s.headerSub}>Gegenereerd op {cachedDate}</Text>
          )}
        </View>
        <View style={s.proBadge}>
          <Text style={s.proBadgeText}>PRO</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {!report && !loading && (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>📊</Text>
            <Text style={s.emptyTitle}>Jouw AI Weekrapport</Text>
            <Text style={s.emptyDesc}>
              Krijg een persoonlijke analyse van je afgelopen week: wat ging
              goed, wat kan beter, en een concreet doel voor volgende week.
            </Text>
            <View style={s.previewCard}>
              <Text style={s.previewTitle}>Het rapport bevat:</Text>
              {[
                '🏆 Persoonlijke week samenvatting',
                '💪 Wat je goed hebt gedaan',
                '📈 Concrete verbeterpunten',
                '🎯 Focus voor volgende week',
              ].map(item => (
                <Text key={item} style={s.previewItem}>
                  {item}
                </Text>
              ))}
            </View>
          </View>
        )}

        {loading && (
          <View style={s.loadingState}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={s.loadingText}>AI analyseert je week...</Text>
            <Text style={s.loadingSubText}>
              Even geduld, dit duurt ~10 seconden
            </Text>
          </View>
        )}

        {report && !loading && <Markdown style={mdStyles}>{report}</Markdown>}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.generateBtn, loading && s.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Icon name="sparkles" size={18} color="#fff" />
              <Text style={s.generateBtnText}>
                {report ? 'Nieuw rapport genereren' : 'Rapport genereren'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUnlock={handleUnlock}
      />
    </SafeAreaView>
  );
}

function PaywallModal({
  visible,
  onClose,
  onUnlock,
}: {
  visible: boolean;
  onClose: () => void;
  onUnlock: () => void;
}) {
  const { theme } = useTheme();

  const pw = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: theme.isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.6)',
          justifyContent: 'flex-end',
        },
        card: {
          backgroundColor: theme.surface,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          padding: spacing.lg,
          gap: spacing.sm,
        },
        badge: {
          alignSelf: 'center',
          backgroundColor: theme.primary,
          borderRadius: radius.lg,
          paddingHorizontal: 16,
          paddingVertical: 6,
          marginBottom: spacing.xs,
        },
        badgeText: {
          color: '#fff',
          fontWeight: '800',
          fontSize: 14,
          letterSpacing: 1,
        },
        title: {
          fontSize: 22,
          fontWeight: '800',
          color: theme.text,
          textAlign: 'center',
        },
        desc: {
          fontSize: 15,
          color: theme.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
        },
        featureList: { gap: 8, marginVertical: spacing.xs },
        featureRow: { flexDirection: 'row' },
        featureText: { fontSize: 15, color: theme.text },
        unlockBtn: {
          backgroundColor: theme.primary,
          borderRadius: radius.lg,
          paddingVertical: 16,
          alignItems: 'center',
          marginTop: spacing.sm,
          ...shadow.md,
        },
        unlockText: { color: '#fff', fontSize: 16, fontWeight: '800' },
        closeBtn: { alignItems: 'center', paddingVertical: spacing.sm },
        closeText: { color: theme.textSecondary, fontSize: 14 },
      }),
    [theme],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={pw.overlay}>
        <View style={pw.card}>
          <View style={pw.badge}>
            <Text style={pw.badgeText}>⚡ PRO</Text>
          </View>
          <Text style={pw.title}>Unlock Weekly Reports</Text>
          <Text style={pw.desc}>
            Krijg elke week een persoonlijk AI-rapport dat je gezondheidsdata
            analyseert en je helpt groeien.
          </Text>
          <View style={pw.featureList}>
            {[
              '📊 Wekelijkse AI-analyse van voeding & training',
              '💡 Persoonlijke inzichten op basis van jouw data',
              '🎯 Concrete doelen voor de komende week',
              '📈 Trend-herkenning over meerdere weken',
            ].map(f => (
              <View key={f} style={pw.featureRow}>
                <Text style={pw.featureText}>{f}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={pw.unlockBtn}
            onPress={onUnlock}
            activeOpacity={0.85}
          >
            <Text style={pw.unlockText}>🚀 Unlock Pro — €4,99/maand</Text>
          </TouchableOpacity>
          <TouchableOpacity style={pw.closeBtn} onPress={onClose}>
            <Text style={pw.closeText}>Misschien later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

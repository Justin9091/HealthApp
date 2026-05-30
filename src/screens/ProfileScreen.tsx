import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, AuthUser } from '../services/AuthService';
import {
  achievementService,
  Achievement,
  AchievementCategory,
} from '../services/AchievementService';
import { spacing, radius, shadow } from '../constants/theme';
import { useTheme, THEMES, ThemeKey, AppTheme } from '../context/ThemeContext';
import { Card, SectionHeader, ListRow, EmptyState, PrimaryButton } from '../components/ui';

// ─── Auth ─────────────────────────────────────────────────────────────────────

function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ['auth:user'],
    queryFn: () => authService.getCachedUser(),
    staleTime: Infinity,
  });

  const signIn = useCallback(async () => {
    try {
      const u = await authService.signIn();
      queryClient.setQueryData(['auth:user'], u);
    } catch (e: any) {
      Alert.alert('Inloggen mislukt', e?.message ?? 'Probeer opnieuw');
    }
  }, [queryClient]);

  const signOut = useCallback(async () => {
    await authService.signOut();
    queryClient.setQueryData(['auth:user'], null);
  }, [queryClient]);

  return { user: user ?? null, isLoading, signIn, signOut };
}

// ─── Achievement helpers ──────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<AchievementCategory | 'all', string> = {
  all: 'Alles',
  streak: 'Streak',
  nutrition: 'Voeding',
  fitness: 'Fitness',
  weight: 'Gewicht',
  milestone: 'Mijlpaal',
};

function categoryStats(achievements: Achievement[]) {
  const cats: AchievementCategory[] = [
    'streak',
    'nutrition',
    'fitness',
    'weight',
    'milestone',
  ];
  return cats.map(cat => {
    const items = achievements.filter(a => a.category === cat);
    const unlocked = items.filter(a => !!a.unlockedAt).length;
    return { cat, label: CATEGORY_LABELS[cat], unlocked, total: items.length };
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GoogleSignInButton({
  onPress,
  loading,
}: {
  onPress: () => void;
  loading: boolean;
}) {
  const { theme } = useTheme();
  const s = useStyles();
  return (
    <TouchableOpacity
      style={s.googleBtn}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={theme.text} />
      ) : (
        <>
          <Text style={s.googleLogo}>G</Text>
          <Text style={s.googleBtnText}>Inloggen met Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function LoginCard({ onSignIn }: { onSignIn: () => void }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    await onSignIn();
    setLoading(false);
  };

  return (
    <Card style={{ alignItems: 'center', marginBottom: spacing.lg, gap: spacing.sm }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="person-outline" size={32} color={theme.primary} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>Log in voor je profiel</Text>
      <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 20 }}>
        Koppel je Google-account om je voortgang op te slaan en achievements te tonen.
      </Text>
      <PrimaryButton label="Inloggen met Google" onPress={handlePress} loading={loading} style={{ marginTop: spacing.xs, alignSelf: 'stretch' }} />
    </Card>
  );
}

function UserHeader({
  user,
  onSignOut,
}: {
  user: AuthUser;
  onSignOut: () => void;
}) {
  const { theme } = useTheme();
  const s = useStyles();
  return (
    <View style={s.userHeader}>
      {user.photo ? (
        <Image source={{ uri: user.photo }} style={s.avatar} />
      ) : (
        <View style={[s.avatar, s.avatarPlaceholder]}>
          <Text style={s.avatarInitial}>
            {(user.name ?? user.email)[0].toUpperCase()}
          </Text>
        </View>
      )}
      <View style={s.userInfo}>
        <Text style={s.userName}>{user.name ?? 'Gebruiker'}</Text>
        <Text style={s.userEmail}>{user.email}</Text>
      </View>
      <TouchableOpacity
        style={s.signOutBtn}
        onPress={onSignOut}
        activeOpacity={0.7}
      >
        <Icon name="log-out-outline" size={20} color={theme.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

function StatPill({
  value,
  label,
  color,
}: {
  value: number | string;
  label: string;
  color: string;
}) {
  const s = useStyles();
  return (
    <View style={s.statPill}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function AchievementBadge({ item }: { item: Achievement }) {
  const s = useStyles();
  const unlocked = !!item.unlockedAt;
  return (
    <View style={[s.badge, !unlocked && s.badgeLocked]}>
      <Text style={[s.badgeIcon, !unlocked && s.badgeIconLocked]}>
        {item.icon}
      </Text>
      <Text style={s.badgeName} numberOfLines={2}>
        {item.title}
      </Text>
      {unlocked && <View style={s.badgeDot} />}
    </View>
  );
}

function CategoryRow({
  label,
  unlocked,
  total,
}: {
  cat?: AchievementCategory;
  label: string;
  unlocked: number;
  total: number;
}) {
  const s = useStyles();
  const pct = total === 0 ? 0 : (unlocked / total) * 100;
  return (
    <View style={s.catRow}>
      <Text style={s.catLabel}>{label}</Text>
      <View style={s.catBarTrack}>
        <View style={[s.catBarFill, { width: `${pct}%` as any }]} />
      </View>
      <Text style={s.catCount}>
        {unlocked}/{total}
      </Text>
    </View>
  );
}

// ─── Theme picker ─────────────────────────────────────────────────────────────

function ThemePicker() {
  const { theme, themeKey, darkMode, setTheme, setDarkMode } = useTheme();
  return (
    <View style={tp.root}>
      <View style={tp.swatchRow}>
        {(Object.values(THEMES) as AppTheme[]).map(t => (
          <TouchableOpacity
            key={t.key}
            style={[
              tp.swatch,
              { backgroundColor: t.primary },
              themeKey === t.key && tp.swatchActive,
            ]}
            onPress={() => setTheme(t.key as ThemeKey)}
            activeOpacity={0.8}
          >
            {themeKey === t.key && (
              <Icon name="checkmark" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={[tp.darkRow, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
        <View style={tp.darkLeft}>
          <View style={[tp.darkIcon, { backgroundColor: theme.primaryLight }]}>
            <Icon name={darkMode ? 'moon' : 'sunny'} size={18} color={theme.primary} />
          </View>
          <View>
            <Text style={[tp.darkLabel, { color: theme.text }]}>Dark mode</Text>
            <Text style={[tp.darkSub, { color: theme.textMuted }]}>
              {darkMode ? 'Donker thema aan' : 'Licht thema aan'}
            </Text>
          </View>
        </View>
        <Switch
          value={darkMode}
          onValueChange={setDarkMode}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );
}

const tp = StyleSheet.create({
  root: { gap: 12, marginTop: spacing.sm },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchActive: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  darkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  darkLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  darkIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkLabel: { fontSize: 15, fontWeight: '700' },
  darkSub: { fontSize: 12, marginTop: 1 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const s = useStyles();
  const { user, isLoading, signIn, signOut } = useAuth();

  const { data: achievements = [], isLoading: achLoading } = useQuery<
    Achievement[]
  >({
    queryKey: ['achievements'],
    queryFn: () => achievementService.evaluate(),
    staleTime: 60_000,
  });

  const unlockedAll = achievements.filter(a => !!a.unlockedAt);
  const recentlyUnlocked = [...unlockedAll]
    .sort(
      (a, b) =>
        new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime(),
    )
    .slice(0, 6);

  const stats = categoryStats(achievements);

  if (isLoading) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator color={theme.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.topRow}>
          <Text style={s.screenTitle}>Profiel</Text>
        </View>

        {/* Auth section */}
        {!user ? (
          <LoginCard onSignIn={signIn} />
        ) : (
          <UserHeader user={user} onSignOut={signOut} />
        )}

        {/* Achievement overview */}
        <View style={s.section}>
          <SectionHeader
            title="Achievements"
            action="Alles zien →"
            onAction={() => navigation.navigate('Achievements')}
          />

          {achLoading ? (
            <ActivityIndicator
              color={theme.primary}
              style={{ marginVertical: spacing.lg }}
            />
          ) : (
            <>
              {/* Summary pills */}
              <View style={s.pillRow}>
                <StatPill
                  value={unlockedAll.length}
                  label="Behaald"
                  color={theme.primary}
                />
                <StatPill
                  value={achievements.length}
                  label="Totaal"
                  color={theme.textSecondary}
                />
                <StatPill
                  value={`${Math.round(
                    (unlockedAll.length / Math.max(achievements.length, 1)) *
                      100,
                  )}%`}
                  label="Compleet"
                  color={theme.secondary}
                />
              </View>

              {/* Per-category bars */}
              <View style={s.catCard}>
                {stats.map(st => (
                  <CategoryRow key={st.cat} {...st} />
                ))}
              </View>

              {/* Recently unlocked badges */}
              {recentlyUnlocked.length > 0 && (
                <>
                  <Text style={s.subTitle}>Recent behaald</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.badgeRow}
                  >
                    {recentlyUnlocked.map(a => (
                      <AchievementBadge key={a.id} item={a} />
                    ))}
                  </ScrollView>
                </>
              )}

              {unlockedAll.length === 0 && (
                <EmptyState icon="trophy-outline" message="Nog geen achievements behaald — ga aan de slag!" />
              )}
            </>
          )}
        </View>

        {/* Theme picker */}
        <View style={s.section}>
          <SectionHeader title="Thema" />
          <ThemePicker />
        </View>

        {/* Quick links */}
        <View style={s.section}>
          <SectionHeader title="Instellingen" />
          <ListRow
            icon="flag-outline"
            label="Doelen instellen"
            onPress={() => navigation.navigate('Goals')}
          />
          <ListRow
            icon="time-outline"
            label="Geschiedenis"
            onPress={() => navigation.navigate('History')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function useStyles() {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: theme.background },
        center: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.background,
        },
        scroll: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },

        topRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.lg,
          marginTop: spacing.sm,
        },
        screenTitle: { fontSize: 32, fontWeight: '900', color: theme.text, letterSpacing: -1 },

        loginCard: {
          backgroundColor: theme.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          alignItems: 'center',
          ...shadow.md,
          marginBottom: spacing.lg,
        },
        loginTitle: {
          fontSize: 20,
          fontWeight: '700',
          color: theme.text,
          marginBottom: spacing.sm,
        },
        loginSub: {
          fontSize: 14,
          color: theme.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
          marginBottom: spacing.lg,
        },

        googleBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface,
          borderWidth: 1.5,
          borderColor: theme.border,
          borderRadius: radius.full,
          paddingVertical: 12,
          paddingHorizontal: 24,
          gap: 10,
          ...shadow.sm,
        },
        googleLogo: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
        googleBtnText: { fontSize: 15, fontWeight: '600', color: theme.text },

        userHeader: {
          backgroundColor: theme.surface,
          borderRadius: radius.xl,
          padding: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.lg,
          borderWidth: 1,
          borderColor: theme.borderLight,
          ...shadow.md,
          gap: spacing.md,
        },
        avatar: { width: 56, height: 56, borderRadius: 28 },
        avatarPlaceholder: {
          backgroundColor: theme.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarInitial: { fontSize: 22, fontWeight: '900', color: theme.primary },
        userInfo: { flex: 1 },
        userName: { fontSize: 18, fontWeight: '800', color: theme.text },
        userEmail: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
        signOutBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: theme.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        },

        section: { marginBottom: spacing.lg },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        },
        sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
        seeAll: { fontSize: 14, fontWeight: '600', color: theme.primary },
        subTitle: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.textSecondary,
          marginTop: spacing.md,
          marginBottom: spacing.sm,
        },

        pillRow: {
          flexDirection: 'row',
          gap: spacing.sm,
          marginBottom: spacing.md,
        },
        statPill: {
          flex: 1,
          backgroundColor: theme.surface,
          borderRadius: radius.lg,
          paddingVertical: spacing.lg,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: theme.borderLight,
          ...shadow.sm,
        },
        statValue: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
        statLabel: {
          fontSize: 11,
          color: theme.textMuted,
          marginTop: 2,
          fontWeight: '600',
        },

        catCard: {
          backgroundColor: theme.surface,
          borderRadius: radius.md,
          padding: spacing.md,
          gap: spacing.sm,
          ...shadow.sm,
        },
        catRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
        catLabel: {
          width: 110,
          fontSize: 14,
          color: theme.textSecondary,
          fontWeight: '600',
        },
        catBarTrack: {
          flex: 1,
          height: 10,
          backgroundColor: theme.surfaceAlt,
          borderRadius: 5,
          overflow: 'hidden',
        },
        catBarFill: {
          height: '100%',
          backgroundColor: theme.primary,
          borderRadius: 5,
        },
        catCount: {
          width: 32,
          textAlign: 'right',
          fontSize: 12,
          color: theme.textMuted,
          fontWeight: '600',
        },

        badgeRow: { gap: spacing.sm, paddingVertical: spacing.xs },
        badge: {
          width: 88,
          backgroundColor: theme.surface,
          borderRadius: radius.md,
          padding: spacing.sm,
          alignItems: 'center',
          gap: 4,
          ...shadow.sm,
          position: 'relative',
        },
        badgeLocked: { backgroundColor: theme.surfaceAlt, opacity: 0.55 },
        badgeIcon: { fontSize: 28 },
        badgeIconLocked: { opacity: 0.4 },
        badgeName: {
          fontSize: 11,
          fontWeight: '600',
          color: theme.text,
          textAlign: 'center',
        },
        badgeDot: {
          position: 'absolute',
          top: 6,
          right: 6,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.secondary,
        },

        emptyAch: {
          backgroundColor: theme.surfaceAlt,
          borderRadius: radius.md,
          padding: spacing.md,
          alignItems: 'center',
        },
        emptyAchText: {
          fontSize: 14,
          color: theme.textSecondary,
          textAlign: 'center',
        },

        linkRow: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface,
          borderRadius: radius.md,
          padding: spacing.md,
          marginTop: spacing.sm,
          gap: spacing.sm,
          ...shadow.sm,
        },
        linkText: { fontSize: 15, fontWeight: '600', color: theme.text },
      }),
    [theme],
  );
}

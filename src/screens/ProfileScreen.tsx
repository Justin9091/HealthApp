import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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
import { colors, spacing, radius, shadow } from '../constants/theme';
import { useTheme, THEMES, ThemeKey, AppTheme } from '../context/ThemeContext';

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
  streak: '🔥 Streak',
  nutrition: '🍽️ Voeding',
  fitness: '💪 Fitness',
  weight: '⚖️ Gewicht',
  milestone: '📅 Mijlpaal',
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
  return (
    <TouchableOpacity
      style={s.googleBtn}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
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
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    await onSignIn();
    setLoading(false);
  };

  return (
    <View style={s.loginCard}>
      <Text style={s.loginEmoji}>👤</Text>
      <Text style={s.loginTitle}>Log in voor je profiel</Text>
      <Text style={s.loginSub}>
        Koppel je Google-account om je voortgang op te slaan en achievements te
        tonen.
      </Text>
      <GoogleSignInButton onPress={handlePress} loading={loading} />
    </View>
  );
}

function UserHeader({
  user,
  onSignOut,
}: {
  user: AuthUser;
  onSignOut: () => void;
}) {
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
        <Icon name="log-out-outline" size={20} color={colors.textMuted} />
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
  return (
    <View style={s.statPill}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function AchievementBadge({ item }: { item: Achievement }) {
  const unlocked = !!item.unlockedAt;
  return (
    <View style={[s.badge, !unlocked && s.badgeLocked]}>
      <Text style={[s.badgeIcon, !unlocked && s.badgeIconLocked]}>
        {item.icon}
      </Text>
      <Text
        style={[s.badgeName, !unlocked && s.badgeNameLocked]}
        numberOfLines={2}
      >
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
  const { theme, setTheme } = useTheme();
  return (
    <View style={tp.wrap}>
      {(Object.values(THEMES) as AppTheme[]).map(t => (
        <TouchableOpacity
          key={t.key}
          style={[
            tp.swatch,
            { backgroundColor: t.primary },
            theme.key === t.key && tp.swatchActive,
          ]}
          onPress={() => setTheme(t.key as ThemeKey)}
          activeOpacity={0.8}
        >
          {theme.key === t.key && (
            <Icon name="checkmark" size={16} color="#fff" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const tp = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: spacing.sm,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const navigation = useNavigation<any>();
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
        <ActivityIndicator color={colors.primary} size="large" />
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
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>🏆 Achievements</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Achievements')}
              activeOpacity={0.7}
            >
              <Text style={s.seeAll}>Alles zien →</Text>
            </TouchableOpacity>
          </View>

          {achLoading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginVertical: spacing.lg }}
            />
          ) : (
            <>
              {/* Summary pills */}
              <View style={s.pillRow}>
                <StatPill
                  value={unlockedAll.length}
                  label="Behaald"
                  color={colors.primary}
                />
                <StatPill
                  value={achievements.length}
                  label="Totaal"
                  color={colors.textSecondary}
                />
                <StatPill
                  value={`${Math.round(
                    (unlockedAll.length / Math.max(achievements.length, 1)) *
                      100,
                  )}%`}
                  label="Compleet"
                  color={colors.secondary}
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
                <View style={s.emptyAch}>
                  <Text style={s.emptyAchText}>
                    Nog geen achievements behaald — ga aan de slag! 💪
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Theme picker */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>🎨 Thema</Text>
          <ThemePicker />
        </View>

        {/* Quick links */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>⚙️ Instellingen</Text>
          <TouchableOpacity
            style={s.linkRow}
            onPress={() => navigation.navigate('Goals')}
            activeOpacity={0.7}
          >
            <Icon name="flag-outline" size={20} color={colors.primary} />
            <Text style={s.linkText}>Doelen instellen</Text>
            <Icon
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.linkRow}
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.7}
          >
            <Icon name="time-outline" size={20} color={colors.primary} />
            <Text style={s.linkText}>Geschiedenis</Text>
            <Icon
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  screenTitle: { fontSize: 28, fontWeight: '800', color: colors.text },

  // Login card
  loginCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.md,
    marginBottom: spacing.lg,
  },
  loginEmoji: { fontSize: 48, marginBottom: spacing.sm },
  loginTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  loginSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 10,
    ...shadow.sm,
  },
  googleLogo: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: colors.text },

  // User header
  userHeader: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadow.md,
    gap: spacing.md,
  },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarPlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 26, fontWeight: '800', color: colors.primary },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '700', color: colors.text },
  userEmail: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  signOutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sections
  section: { marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  seeAll: { fontSize: 14, fontWeight: '600', color: colors.primary },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  // Pills
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statPill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadow.sm,
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },

  // Category bars
  catCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.sm,
  },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  catLabel: {
    width: 110,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  catBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  catCount: {
    width: 32,
    textAlign: 'right',
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },

  // Badges
  badgeRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  badge: {
    width: 88,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
    ...shadow.sm,
    position: 'relative',
  },
  badgeLocked: { backgroundColor: colors.surfaceAlt, opacity: 0.55 },
  badgeIcon: { fontSize: 28 },
  badgeIconLocked: { opacity: 0.4 },
  badgeName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  badgeNameLocked: { color: colors.textMuted },
  badgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },

  emptyAch: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyAchText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Quick links
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
    ...shadow.sm,
  },
  linkText: { fontSize: 15, fontWeight: '600', color: colors.text },
});

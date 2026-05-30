import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { radius, shadow, spacing } from '../constants/theme';

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  activeOpacity?: number;
}

export function Card({ children, style, onPress, activeOpacity = 0.85 }: CardProps) {
  const { theme } = useTheme();
  const base = [card.root, { backgroundColor: theme.surface }, style];
  if (onPress) {
    return (
      <TouchableOpacity style={base} onPress={onPress} activeOpacity={activeOpacity}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={base}>{children}</View>;
}

const card = StyleSheet.create({
  root: {
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadow.md,
  },
});

// ─── SectionHeader ────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function SectionHeader({ title, action, onAction, style }: SectionHeaderProps) {
  const { theme } = useTheme();
  return (
    <View style={[sh.row, style]}>
      <View style={[sh.accent, { backgroundColor: theme.primary }]} />
      <Text style={[sh.title, { color: theme.text }]}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[sh.action, { color: theme.primary }]}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const sh = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingLeft: 0,
  },
  accent: { width: 3, height: 20, borderRadius: 2, marginRight: 8 },
  title: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  action: { fontSize: 14, fontWeight: '600' },
});

// ─── ScreenTitle ──────────────────────────────────────────────────────────────

interface ScreenTitleProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export function ScreenTitle({ title, subtitle, style }: ScreenTitleProps) {
  const { theme } = useTheme();
  return (
    <View style={style}>
      <Text style={[st.title, { color: theme.text }]}>{title}</Text>
      {subtitle && <Text style={[st.sub, { color: theme.textSecondary }]}>{subtitle}</Text>}
    </View>
  );
}

const st = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '900', letterSpacing: -1 },
  sub: { fontSize: 14, marginTop: 4, letterSpacing: 0.1 },
});

// ─── PrimaryButton ────────────────────────────────────────────────────────────

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  color?: string;
}

export function PrimaryButton({ label, onPress, loading, disabled, style, labelStyle, color }: ButtonProps) {
  const { theme } = useTheme();
  const bg = color ?? theme.primary;
  return (
    <TouchableOpacity
      style={[btn.root, { backgroundColor: bg }, (disabled || loading) && btn.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading
        ? <ActivityIndicator color="#fff" />
        : <Text style={[btn.label, labelStyle]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

export function GhostButton({ label, onPress, disabled, style, labelStyle }: ButtonProps) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[btn.ghost, { borderColor: theme.border }, disabled && btn.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[btn.ghostLabel, { color: theme.textSecondary }, labelStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

const btn = StyleSheet.create({
  root: {
    borderRadius: radius.full,
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  label: { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.2 },
  ghost: {
    borderRadius: radius.full,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  ghostLabel: { fontWeight: '600', fontSize: 15 },
  disabled: { opacity: 0.45 },
});

// ─── ListRow ──────────────────────────────────────────────────────────────────

interface ListRowProps {
  icon: string;
  iconColor?: string;
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function ListRow({ icon, iconColor, label, onPress, style }: ListRowProps) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[lr.root, { backgroundColor: theme.surface }, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[lr.iconWrap, { backgroundColor: (iconColor ?? theme.primary) + '18' }]}>
        <Icon name={icon} size={18} color={iconColor ?? theme.primary} />
      </View>
      <Text style={[lr.label, { color: theme.text }]}>{label}</Text>
      <Icon name="chevron-forward" size={16} color={theme.textMuted} />
    </TouchableOpacity>
  );
}

const lr = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.sm,
    marginTop: spacing.sm,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontSize: 15, fontWeight: '700' },
});

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ style }: { style?: ViewStyle }) {
  const { theme } = useTheme();
  return <View style={[{ height: 1, backgroundColor: theme.borderLight }, style]} />;
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: string;
  message: string;
  style?: ViewStyle;
}

export function EmptyState({ icon, message, style }: EmptyStateProps) {
  const { theme } = useTheme();
  return (
    <View style={[es.root, { backgroundColor: theme.surfaceAlt }, style]}>
      <Icon name={icon} size={28} color={theme.textMuted} />
      <Text style={[es.text, { color: theme.textMuted }]}>{message}</Text>
    </View>
  );
}

const es = StyleSheet.create({
  root: {
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  text: { fontSize: 15, fontWeight: '500', textAlign: 'center' },
});

// ─── FormField ────────────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  style?: ViewStyle;
  required?: boolean;
}

export function FormField({ label, children, style, required }: FormFieldProps) {
  const { theme } = useTheme();
  return (
    <View style={[{ marginBottom: spacing.sm }, style]}>
      <Text style={[ff.label, { color: theme.text }]}>
        {label}{required && <Text style={{ color: theme.danger }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

export function inputStyle(theme: any) {
  return {
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 15,
    color: theme.text,
    backgroundColor: theme.surface,
    minHeight: 48,
  } as const;
}

const ff = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
});

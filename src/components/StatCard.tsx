import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing } from '../constants/theme';

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
  color: string;
  style?: ViewStyle;
}

export function StatCard({ label, value, unit, icon, color, style }: Props) {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: color + '15' }, style]}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: color, borderTopLeftRadius: radius.lg, borderBottomLeftRadius: radius.lg }]} />

      {/* Large background icon */}
      <Icon
        name={icon}
        size={48}
        color={color}
        style={styles.bgIcon}
      />

      {/* Small icon in top-left circle */}
      <View style={[styles.iconCircle, { backgroundColor: color + '25' }]}>
        <Icon name={icon} size={20} color={color} />
      </View>

      <Text style={[styles.value, { color: theme.text }]}>
        {value}
        {unit && <Text style={[styles.unit, { color: theme.textSecondary }]}> {unit}</Text>}
      </Text>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  bgIcon: {
    position: 'absolute',
    right: 8,
    top: 8,
    opacity: 0.15,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  unit: { fontSize: 13, fontWeight: '400' },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
});

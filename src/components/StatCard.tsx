import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../constants/theme';

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
  color: string;
  style?: ViewStyle;
}

export function StatCard({ label, value, unit, icon, color, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconWrapper, { backgroundColor: color + '22' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.value}>
        {value}
        {unit && <Text style={styles.unit}> {unit}</Text>}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    flex: 1,
    ...shadow.sm,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  icon: { fontSize: 20 },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  unit: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
});

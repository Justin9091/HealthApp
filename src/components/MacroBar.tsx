import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { pct } from '../utils/helpers';
import { colors, radius } from '../constants/theme';

interface Props {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}

export function MacroBar({ label, value, target, unit, color }: Props) {
  const progress = pct(value, target);
  const over = value > target;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.value}>
          <Text style={{ color: over ? colors.danger : colors.text }}>
            {Math.round(value)}
          </Text>
          <Text style={styles.unit}>
            /{target}
            {unit}
          </Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: over ? colors.danger : color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  value: { fontSize: 13, color: colors.text, fontWeight: '700' },
  unit: { fontWeight: '400', color: colors.textMuted, fontSize: 12 },
  track: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.full },
});

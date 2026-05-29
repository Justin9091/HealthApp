import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoals } from '../hooks/useNutrition';
import { UserGoals } from '../types';
import { colors, spacing, radius, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

type GoalField = keyof UserGoals;

interface FieldConfig {
  key: GoalField;
  label: string;
  unit: string;
  description: string;
  color: string;
}

export function GoalsScreen() {
  const { theme } = useTheme();
  const { data: goals, isLoading, saveGoals } = useGoals();
  const [values, setValues] = useState<Record<GoalField, string>>({} as any);
  const [saving, setSaving] = useState(false);

  // Dynamic field colors using theme for the non-macro fields
  const fields: FieldConfig[] = useMemo(
    () => [
      {
        key: 'dailyCaloriesTarget',
        label: 'Calorieën',
        unit: 'kcal',
        description: 'Dagelijks calorie-doel',
        color: colors.calories,
      },
      {
        key: 'dailyProteinTarget',
        label: 'Eiwitten',
        unit: 'g',
        description: 'Dagelijks eiwitdoel',
        color: colors.protein,
      },
      {
        key: 'dailyCarbsTarget',
        label: 'Koolhydraten',
        unit: 'g',
        description: 'Dagelijks koolhydratendoel',
        color: colors.carbs,
      },
      {
        key: 'dailyFatTarget',
        label: 'Vetten',
        unit: 'g',
        description: 'Dagelijks vetdoel',
        color: colors.fat,
      },
      {
        key: 'dailyStepsTarget',
        label: 'Stappen',
        unit: 'stappen',
        description: 'Dagelijks stapdoel',
        color: theme.secondary,
      },
      {
        key: 'dailyActiveMinutesTarget',
        label: 'Actieve minuten',
        unit: 'min',
        description: 'Dagelijks bewegingsdoel',
        color: theme.accent,
      },
      {
        key: 'dailyWaterTarget',
        label: 'Water',
        unit: 'ml',
        description: 'Dagelijks waterdoel',
        color: theme.primary,
      },
    ],
    [theme],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: theme.background },
        scroll: { flex: 1 },
        content: {
          padding: spacing.md,
          gap: spacing.sm,
          paddingBottom: spacing.xl,
        },
        loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        intro: {
          fontSize: 14,
          color: theme.textSecondary,
          lineHeight: 20,
          marginBottom: spacing.xs,
        },
        card: {
          backgroundColor: theme.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          ...shadow.sm,
        },
        colorDot: {
          width: 10,
          height: 10,
          borderRadius: 5,
        },
        fieldBody: { flex: 1 },
        fieldLabel: { fontSize: 15, fontWeight: '600', color: theme.text },
        fieldDesc: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
        inputWrapper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
        input: {
          backgroundColor: theme.surfaceAlt,
          borderRadius: radius.sm,
          paddingHorizontal: 10,
          paddingVertical: 6,
          fontSize: 15,
          fontWeight: '700',
          color: theme.text,
          minWidth: 72,
          textAlign: 'right',
        },
        unitLabel: { fontSize: 12, color: theme.textSecondary, width: 36 },
        saveBtn: {
          backgroundColor: theme.primary,
          borderRadius: radius.lg,
          padding: spacing.md,
          alignItems: 'center',
          marginTop: spacing.sm,
          ...shadow.md,
        },
        saveBtnDisabled: { opacity: 0.6 },
        saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
      }),
    [theme],
  );

  useEffect(() => {
    if (goals) {
      const mapped: Record<string, string> = {};
      fields.forEach(f => {
        mapped[f.key] = String(goals[f.key]);
      });
      setValues(mapped as Record<GoalField, string>);
    }
  }, [goals, fields]);

  const handleChange = (key: GoalField, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    setValues(prev => ({ ...prev, [key]: cleaned }));
  };

  const handleSave = async () => {
    const updated: UserGoals = { ...goals! };
    for (const f of fields) {
      const num = parseInt(values[f.key], 10);
      if (isNaN(num) || num <= 0) {
        Alert.alert(
          'Ongeldige waarde',
          `Voer een geldig getal in voor "${f.label}".`,
        );
        return;
      }
      (updated as any)[f.key] = num;
    }
    setSaving(true);
    try {
      await saveGoals(updated);
      Alert.alert('Opgeslagen', 'Je doelen zijn bijgewerkt.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !goals) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.intro}>
            Stel je dagelijkse doelen in. Deze worden gebruikt voor je
            voortgangsoverzicht.
          </Text>

          {fields.map(field => (
            <View key={field.key} style={styles.card}>
              <View
                style={[styles.colorDot, { backgroundColor: field.color }]}
              />
              <View style={styles.fieldBody}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Text style={styles.fieldDesc}>{field.description}</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={values[field.key] ?? ''}
                  onChangeText={v => handleChange(field.key, v)}
                  keyboardType="numeric"
                  returnKeyType="done"
                  selectTextOnFocus
                  accessibilityLabel={field.label}
                />
                <Text style={styles.unitLabel}>{field.unit}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Opslaan</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

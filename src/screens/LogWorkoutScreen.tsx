import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from '@tanstack/react-form';
import {
  useAddWorkout,
  useFitnessWorkouts,
  useRemoveWorkout,
} from '../hooks/useFitness';
import { WorkoutEntry, WorkoutType } from '../types';
import { fitnessService } from '../services/FitnessService';
import { colors, spacing, radius, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { formatTime, todayStr } from '../utils/helpers';

const WORKOUT_TYPES: WorkoutType[] = [
  'running',
  'walking',
  'cycling',
  'swimming',
  'strength',
  'yoga',
  'hiit',
  'other',
];

export function LogWorkoutScreen() {
  const { theme } = useTheme();
  const today = todayStr();
  const { data: workouts = [] } = useFitnessWorkouts(today);
  const addWorkout = useAddWorkout(today);
  const removeWorkout = useRemoveWorkout(today);
  const [selectedType, setSelectedType] =
    React.useState<WorkoutType>('running');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: theme.background },
        scroll: { flex: 1 },
        content: { padding: spacing.md, gap: spacing.md },
        sectionTitle: {
          fontSize: 16,
          fontWeight: '700',
          color: theme.text,
          marginBottom: spacing.sm,
        },
        typeScroll: { marginBottom: spacing.sm },
        typeChip: {
          backgroundColor: theme.surface,
          borderRadius: radius.xl,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          marginRight: spacing.sm,
          borderWidth: 2,
          borderColor: 'transparent',
          ...shadow.sm,
        },
        typeChipActive: {
          borderColor: theme.secondary,
          backgroundColor: theme.secondaryLight,
        },
        typeLabel: {
          fontSize: 13,
          color: theme.textSecondary,
          fontWeight: '500',
        },
        typeLabelActive: { color: theme.secondary, fontWeight: '700' },
        card: {
          backgroundColor: theme.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          ...shadow.sm,
        },
        row: { flexDirection: 'row', gap: spacing.sm },
        fieldLabel: {
          fontSize: 12,
          color: theme.textSecondary,
          marginBottom: 4,
          fontWeight: '500',
        },
        input: {
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: radius.sm,
          padding: spacing.sm,
          fontSize: 15,
          color: theme.text,
          backgroundColor: theme.background,
        },
        textArea: { minHeight: 80, textAlignVertical: 'top' },
        submitBtn: {
          backgroundColor: theme.secondary,
          borderRadius: radius.md,
          padding: spacing.md,
          alignItems: 'center',
          marginTop: spacing.sm,
        },
        submitBtnDisabled: { opacity: 0.6 },
        submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
        workoutRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        workoutInfo: { flex: 1 },
        workoutName: { fontSize: 14, fontWeight: '600', color: theme.text },
        workoutMeta: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
        workoutNotes: {
          fontSize: 12,
          color: theme.textMuted,
          marginTop: 2,
          fontStyle: 'italic',
        },
        deleteBtn: { padding: spacing.sm },
        deleteText: { color: colors.danger, fontSize: 16, fontWeight: '700' },
      }),
    [theme],
  );

  const form = useForm({
    defaultValues: {
      name: '',
      durationMinutes: '',
      caloriesBurned: '',
      heartRateAvg: '',
      steps: '',
      notes: '',
    },
    onSubmit: async ({ value }) => {
      if (!value.name || !value.durationMinutes) {
        Alert.alert('Vul naam en duur in.');
        return;
      }

      const duration = Number(value.durationMinutes);
      const calories =
        Number(value.caloriesBurned) ||
        fitnessService.estimateCalories(selectedType, duration);

      await addWorkout.mutateAsync({
        name: value.name,
        type: selectedType,
        durationMinutes: duration,
        caloriesBurned: calories,
        heartRateAvg: Number(value.heartRateAvg) || undefined,
        steps: Number(value.steps) || undefined,
        notes: value.notes || undefined,
      });

      form.reset();
    },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          {/* Workout type picker */}
          <Text style={styles.sectionTitle}>Type training</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.typeScroll}
          >
            {WORKOUT_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeChip,
                  selectedType === type && styles.typeChipActive,
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text
                  style={[
                    styles.typeLabel,
                    selectedType === type && styles.typeLabelActive,
                  ]}
                >
                  {fitnessService.getWorkoutTypeLabel(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Form */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Training toevoegen</Text>

            <form.Field name="name">
              {field => (
                <FormField label="Naam *" styles={styles}>
                  <TextInput
                    style={styles.input}
                    placeholder="bijv. Ochtendrun"
                    placeholderTextColor={theme.textMuted}
                    value={field.state.value}
                    onChangeText={field.handleChange}
                  />
                </FormField>
              )}
            </form.Field>

            <View style={styles.row}>
              <form.Field name="durationMinutes">
                {field => (
                  <FormField
                    label="Duur (min) *"
                    style={{ flex: 1 }}
                    styles={styles}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="min"
                      keyboardType="numeric"
                      placeholderTextColor={theme.textMuted}
                      value={field.state.value}
                      onChangeText={field.handleChange}
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="caloriesBurned">
                {field => (
                  <FormField
                    label="Kcal verbrand"
                    style={{ flex: 1 }}
                    styles={styles}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="auto"
                      keyboardType="numeric"
                      placeholderTextColor={theme.textMuted}
                      value={field.state.value}
                      onChangeText={field.handleChange}
                    />
                  </FormField>
                )}
              </form.Field>
            </View>

            <View style={styles.row}>
              <form.Field name="heartRateAvg">
                {field => (
                  <FormField
                    label="Hartslag gem."
                    style={{ flex: 1 }}
                    styles={styles}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="bpm"
                      keyboardType="numeric"
                      placeholderTextColor={theme.textMuted}
                      value={field.state.value}
                      onChangeText={field.handleChange}
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="steps">
                {field => (
                  <FormField
                    label="Stappen"
                    style={{ flex: 1 }}
                    styles={styles}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="stappen"
                      keyboardType="numeric"
                      placeholderTextColor={theme.textMuted}
                      value={field.state.value}
                      onChangeText={field.handleChange}
                    />
                  </FormField>
                )}
              </form.Field>
            </View>

            <form.Field name="notes">
              {field => (
                <FormField label="Notities" styles={styles}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Optioneel..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                    numberOfLines={3}
                    value={field.state.value}
                    onChangeText={field.handleChange}
                  />
                </FormField>
              )}
            </form.Field>

            <form.Subscribe selector={s => s.isSubmitting}>
              {isSubmitting => (
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    isSubmitting && styles.submitBtnDisabled,
                  ]}
                  onPress={form.handleSubmit}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitText}>
                    {isSubmitting ? 'Opslaan...' : '+ Training toevoegen'}
                  </Text>
                </TouchableOpacity>
              )}
            </form.Subscribe>
          </View>

          {/* Logged workouts */}
          {workouts.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Vandaag gelogd</Text>
              {workouts.map(workout => (
                <WorkoutRow
                  key={workout.id}
                  workout={workout}
                  styles={styles}
                  onDelete={() => removeWorkout.mutate(workout.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormField({ label, children, style, styles }: any) {
  return (
    <View style={[{ marginBottom: spacing.sm }, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function WorkoutRow({
  workout,
  onDelete,
  styles,
}: {
  workout: WorkoutEntry;
  onDelete: () => void;
  styles: any;
}) {
  return (
    <View style={styles.workoutRow}>
      <View style={styles.workoutInfo}>
        <Text style={styles.workoutName}>
          {fitnessService.getWorkoutTypeLabel(workout.type).split(' ')[0]}{' '}
          {workout.name}
        </Text>
        <Text style={styles.workoutMeta}>
          {workout.durationMinutes} min · {workout.caloriesBurned} kcal ·{' '}
          {formatTime(workout.timestamp)}
        </Text>
        {workout.notes && (
          <Text style={styles.workoutNotes}>{workout.notes}</Text>
        )}
      </View>
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

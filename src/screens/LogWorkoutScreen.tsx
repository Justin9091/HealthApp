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
import { spacing, radius, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { formatTime, todayStr } from '../utils/helpers';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card, FormField as UIFormField, PrimaryButton, inputStyle } from '../components/ui';

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
          fontSize: 20,
          fontWeight: '900',
          letterSpacing: -0.5,
          color: theme.text,
          marginBottom: spacing.sm,
        },
        typeScroll: { marginBottom: spacing.sm },
        typeChip: {
          backgroundColor: theme.surface,
          borderRadius: radius.full,
          paddingHorizontal: spacing.md,
          paddingVertical: 10,
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
          fontWeight: '600',
        },
        typeLabelActive: { color: theme.secondary, fontWeight: '700' },
        card: {
          backgroundColor: theme.surface,
          borderRadius: radius.xl,
          padding: spacing.lg,
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
          borderRadius: radius.full,
          paddingVertical: 16,
          alignItems: 'center',
          marginTop: spacing.sm,
        },
        submitBtnDisabled: { opacity: 0.6 },
        submitText: { color: '#fff', fontWeight: '800', fontSize: 17, letterSpacing: 0.2 },
        workoutRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        workoutInfo: { flex: 1 },
        workoutName: { fontSize: 15, fontWeight: '700', color: theme.text },
        workoutMeta: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
        workoutNotes: {
          fontSize: 12,
          color: theme.textMuted,
          marginTop: 2,
          fontStyle: 'italic',
        },
        deleteBtn: { padding: spacing.sm },
        deleteText: { color: theme.danger, fontSize: 16, fontWeight: '700' },
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
          <Card style={{ gap: spacing.xs }}>
            <Text style={styles.sectionTitle}>Training toevoegen</Text>

            <form.Field name="name">
              {field => (
                <UIFormField label="Naam" required>
                  <TextInput
                    style={inputStyle(theme)}
                    placeholder="bijv. Ochtendrun"
                    placeholderTextColor={theme.textMuted}
                    value={field.state.value}
                    onChangeText={field.handleChange}
                  />
                </UIFormField>
              )}
            </form.Field>

            <View style={styles.row}>
              <form.Field name="durationMinutes">
                {field => (
                  <UIFormField label="Duur (min)" required style={{ flex: 1 }}>
                    <TextInput
                      style={inputStyle(theme)}
                      placeholder="min"
                      keyboardType="numeric"
                      placeholderTextColor={theme.textMuted}
                      value={field.state.value}
                      onChangeText={field.handleChange}
                    />
                  </UIFormField>
                )}
              </form.Field>

              <form.Field name="caloriesBurned">
                {field => (
                  <UIFormField label="Kcal verbrand" style={{ flex: 1 }}>
                    <TextInput
                      style={styles.input}
                      placeholder="auto"
                      keyboardType="numeric"
                      placeholderTextColor={theme.textMuted}
                      value={field.state.value}
                      onChangeText={field.handleChange}
                    />
                  </UIFormField>
                )}
              </form.Field>
            </View>

            <View style={styles.row}>
              <form.Field name="heartRateAvg">
                {field => (
                  <UIFormField label="Hartslag gem." style={{ flex: 1 }}>
                    <TextInput
                      style={inputStyle(theme)}
                      placeholder="bpm"
                      keyboardType="numeric"
                      placeholderTextColor={theme.textMuted}
                      value={field.state.value}
                      onChangeText={field.handleChange}
                    />
                  </UIFormField>
                )}
              </form.Field>

              <form.Field name="steps">
                {field => (
                  <UIFormField label="Stappen" style={{ flex: 1 }}>
                    <TextInput
                      style={inputStyle(theme)}
                      placeholder="stappen"
                      keyboardType="numeric"
                      placeholderTextColor={theme.textMuted}
                      value={field.state.value}
                      onChangeText={field.handleChange}
                    />
                  </UIFormField>
                )}
              </form.Field>
            </View>

            <form.Field name="notes">
              {field => (
                <UIFormField label="Notities">
                  <TextInput
                    style={[inputStyle(theme), { minHeight: 80, textAlignVertical: 'top' }]}
                    placeholder="Optioneel..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                    numberOfLines={3}
                    value={field.state.value}
                    onChangeText={field.handleChange}
                  />
                </UIFormField>
              )}
            </form.Field>

            <form.Subscribe selector={s => s.isSubmitting}>
              {isSubmitting => (
                <PrimaryButton
                  label={isSubmitting ? 'Opslaan...' : 'Training toevoegen'}
                  onPress={form.handleSubmit}
                  loading={isSubmitting}
                  color={theme.secondary}
                />
              )}
            </form.Subscribe>
          </Card>

          {/* Logged workouts */}
          {workouts.length > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>Vandaag gelogd</Text>
              {workouts.map(workout => (
                <WorkoutRow
                  key={workout.id}
                  workout={workout}
                  styles={styles}
                  onDelete={() => removeWorkout.mutate(workout.id)}
                />
              ))}
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="trash-outline" size={18} color={styles.deleteText.color} />
      </TouchableOpacity>
    </View>
  );
}

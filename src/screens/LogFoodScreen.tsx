import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAddFood,
  useNutritionSummary,
  useRemoveFood,
} from '../hooks/useNutrition';
import { FoodEntry, MealType } from '../types';
import { spacing, radius, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { FormField, inputStyle, PrimaryButton, GhostButton } from '../components/ui';
import { formatTime, todayStr } from '../utils/helpers';
import { FoodPhotoScanner } from '../components/FoodPhotoScanner';
import { ParsedFoodItem } from '../services/AIService';
import { nutritionService } from '../services/NutritionService';
import Icon from 'react-native-vector-icons/Ionicons';

const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: 'breakfast', label: 'Ontbijt', icon: 'partly-sunny-outline' },
  { value: 'lunch', label: 'Lunch', icon: 'sunny-outline' },
  { value: 'dinner', label: 'Diner', icon: 'moon-outline' },
  { value: 'snack', label: 'Snack', icon: 'nutrition-outline' },
];

export function LogFoodScreen(_props: any) {
  const { theme } = useTheme();
  const today = todayStr();
  const { data: summary } = useNutritionSummary(today);
  const addFood = useAddFood(today);
  const removeFood = useRemoveFood(today);

  const [selectedMeal, setSelectedMeal] = useState<MealType>(() => {
    const h = new Date().getHours();
    if (h < 10) return 'breakfast';
    if (h < 14) return 'lunch';
    if (h < 20) return 'dinner';
    return 'snack';
  });

  const [search, setSearch] = useState('');
  const [recentFoods, setRecentFoods] = useState<FoodEntry[]>([]);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    nutritionService.getRecentFoods(14).then(setRecentFoods);
  }, [summary]);

  const filtered = useMemo(() => {
    if (!search.trim()) return recentFoods.slice(0, 12);
    const q = search.toLowerCase();
    return recentFoods
      .filter(f => f.name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [search, recentFoods]);

  const handleQuickAdd = useCallback(
    async (item: FoodEntry) => {
      await addFood.mutateAsync({
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        mealType: selectedMeal,
        servingSize: item.servingSize,
        servingUnit: item.servingUnit,
      });
    },
    [addFood, selectedMeal],
  );

  const handlePhotoItems = useCallback(
    async (items: ParsedFoodItem[]) => {
      for (const item of items) {
        await addFood.mutateAsync({
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          mealType: item.mealType ?? selectedMeal,
          servingSize: item.servingSize,
          servingUnit: item.servingUnit,
        });
      }
    },
    [addFood, selectedMeal],
  );

  const entriesByMeal = useMemo(
    () =>
      MEAL_TYPES.map(meal => ({
        ...meal,
        entries: (summary?.entries ?? []).filter(
          e => e.mealType === meal.value,
        ),
      })).filter(m => m.entries.length > 0),
    [summary],
  );

  const totalCals = summary?.totalCalories ?? 0;

  const s = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: theme.background },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
          paddingTop: spacing.md,
          backgroundColor: theme.background,
        },
        headerTitle: {
          flex: 1,
          fontSize: 20,
          fontWeight: '900',
          letterSpacing: -0.5,
          color: theme.text,
        },
        headerCal: { fontSize: 13, color: theme.textSecondary },
        scroll: { flex: 1 },
        content: { padding: spacing.md, gap: spacing.md, paddingBottom: 32 },

        // Meal picker
        mealRow: { flexDirection: 'row', gap: spacing.sm },
        mealChip: {
          flex: 1,
          backgroundColor: theme.surface,
          borderRadius: radius.full,
          paddingVertical: 10,
          alignItems: 'center',
          borderWidth: 2,
          borderColor: 'transparent',
          ...shadow.sm,
        },
        mealChipActive: {
          borderColor: theme.primary,
          backgroundColor: theme.primaryLight,
        },
        mealLabel: {
          fontSize: 11,
          color: theme.textSecondary,
          marginTop: 2,
          fontWeight: '600',
        },
        mealLabelActive: { color: theme.primary, fontWeight: '700' },

        // Search
        searchBox: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface,
          borderRadius: radius.full,
          paddingHorizontal: spacing.md,
          gap: spacing.xs,
          ...shadow.sm,
          borderWidth: 1,
          borderColor: theme.border,
          height: 48,
        },
        searchInput: {
          flex: 1,
          paddingVertical: 11,
          fontSize: 15,
          color: theme.text,
        },

        // Section
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.xs,
        },
        sectionTitle: {
          fontSize: 11,
          fontWeight: '800',
          color: theme.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },

        // Recent item
        recentItem: {
          backgroundColor: theme.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          ...shadow.sm,
        },
        recentItemName: {
          fontSize: 15,
          fontWeight: '700',
          color: theme.text,
          flex: 1,
        },
        recentItemMeta: { fontSize: 12, color: theme.textSecondary },
        addBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: theme.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
        },
        emptyRecent: {
          alignItems: 'center',
          paddingVertical: spacing.lg,
          gap: spacing.xs,
        },
        emptyRecentText: { fontSize: 14, color: theme.textMuted },

        // Manual add button
        manualBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
          padding: spacing.md,
          borderRadius: radius.full,
          borderWidth: 1.5,
          borderColor: theme.border,
          borderStyle: 'dashed' as any,
        },
        manualBtnText: {
          fontSize: 14,
          color: theme.textSecondary,
          fontWeight: '600',
        },

        // Logged entries
        mealSection: {
          backgroundColor: theme.surface,
          borderRadius: radius.xl,
          overflow: 'hidden',
          ...shadow.sm,
        },
        mealSectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.borderLight,
        },
        mealSectionTitle: {
          fontSize: 15,
          fontWeight: '800',
          color: theme.text,
        },
        mealSectionCal: { fontSize: 13, color: theme.textSecondary },
        entryRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.borderLight,
        },
        entryInfo: { flex: 1 },
        entryName: { fontSize: 14, fontWeight: '600', color: theme.text },
        entryMeta: { fontSize: 12, color: theme.textSecondary, marginTop: 1 },
        deleteBtn: { padding: spacing.xs },
      }),
    [theme],
  );

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Eten loggen</Text>
        {totalCals > 0 && (
          <Text style={s.headerCal}>{totalCals} kcal vandaag</Text>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Meal picker */}
          <View style={s.mealRow}>
            {MEAL_TYPES.map(m => (
              <TouchableOpacity
                key={m.value}
                style={[
                  s.mealChip,
                  selectedMeal === m.value && s.mealChipActive,
                ]}
                onPress={() => setSelectedMeal(m.value)}
              >
                <Icon
                  name={m.icon}
                  size={18}
                  color={
                    selectedMeal === m.value ? theme.primary : theme.textMuted
                  }
                />
                <Text
                  style={[
                    s.mealLabel,
                    selectedMeal === m.value && s.mealLabelActive,
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search */}
          <View style={s.searchBox}>
            <Icon name="search" size={18} color={theme.textMuted} />
            <TextInput
              style={s.searchInput}
              placeholder="Zoek eerder gegeten..."
              placeholderTextColor={theme.textMuted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Icon name="close-circle" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* AI Scanner */}
          <FoodPhotoScanner onItemsDetected={handlePhotoItems} />

          {/* Recent / search results */}
          <View>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>
                {search.trim()
                  ? `Resultaten (${filtered.length})`
                  : 'Recentelijk gegeten'}
              </Text>
            </View>
            {filtered.length > 0 ? (
              <View style={{ gap: spacing.xs }}>
                {filtered.map((item, idx) => (
                  <TouchableOpacity
                    key={`${item.name}-${idx}`}
                    style={s.recentItem}
                    onPress={() => handleQuickAdd(item)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.recentItemName}>{item.name}</Text>
                      <Text style={s.recentItemMeta}>
                        {item.calories} kcal · {Math.round(item.protein)}g eiwit
                        · {Math.round(item.carbs)}g koolh. ·{' '}
                        {Math.round(item.fat)}g vet
                      </Text>
                    </View>
                    <View style={s.addBtn}>
                      <Icon name="add" size={20} color={theme.primary} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={s.emptyRecent}>
                <Text style={s.emptyRecentText}>
                  {search.trim()
                    ? 'Niets gevonden'
                    : 'Nog niets gelogd deze week'}
                </Text>
              </View>
            )}
          </View>

          {/* Manual add */}
          <TouchableOpacity
            style={s.manualBtn}
            onPress={() => setShowManual(true)}
          >
            <Icon name="create-outline" size={18} color={theme.textSecondary} />
            <Text style={s.manualBtnText}>Handmatig invullen</Text>
          </TouchableOpacity>

          {/* Logged today */}
          {entriesByMeal.length > 0 && (
            <View style={{ gap: spacing.sm }}>
              <Text style={s.sectionTitle}>Vandaag gelogd</Text>
              {entriesByMeal.map(meal => (
                <View key={meal.value} style={s.mealSection}>
                  <View style={s.mealSectionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Icon name={meal.icon} size={14} color={theme.textSecondary} />
                      <Text style={s.mealSectionTitle}>{meal.label}</Text>
                    </View>
                    <Text style={s.mealSectionCal}>
                      {meal.entries.reduce((t, e) => t + e.calories, 0)} kcal
                    </Text>
                  </View>
                  {meal.entries.map(entry => (
                    <View key={entry.id} style={s.entryRow}>
                      <View style={s.entryInfo}>
                        <Text style={s.entryName}>{entry.name}</Text>
                        <Text style={s.entryMeta}>
                          {entry.calories} kcal · {Math.round(entry.protein)}g
                          eiwit · {formatTime(entry.timestamp)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={s.deleteBtn}
                        onPress={() => removeFood.mutate(entry.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon
                          name="trash-outline"
                          size={18}
                          color={theme.danger}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <ManualAddModal
        visible={showManual}
        onClose={() => setShowManual(false)}
        onAdd={async data => {
          await addFood.mutateAsync({ ...data, mealType: selectedMeal });
          setShowManual(false);
        }}
        theme={theme}
      />
    </SafeAreaView>
  );
}

// ─── Manual Add Modal ─────────────────────────────────────────────────────────

function ManualAddModal({
  visible,
  onClose,
  onAdd,
  theme,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (
    data: Omit<FoodEntry, 'id' | 'timestamp' | 'mealType'>,
  ) => Promise<void>;
  theme: any;
}) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
  };

  const handleAdd = async () => {
    if (!name.trim() || !calories.trim()) {
      Alert.alert('Vul minimaal naam en calorieën in.');
      return;
    }
    setSaving(true);
    try {
      await onAdd({
        name: name.trim(),
        calories: Number(calories),
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        servingSize: 100,
        servingUnit: 'g',
      });
      reset();
    } finally {
      setSaving(false);
    }
  };

  const ms = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: theme.isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        },
        sheet: {
          backgroundColor: theme.surface,
          borderTopLeftRadius: radius.xl + 4,
          borderTopRightRadius: radius.xl + 4,
          padding: spacing.lg,
          gap: spacing.sm,
        },
        title: {
          fontSize: 20,
          fontWeight: '900',
          letterSpacing: -0.5,
          color: theme.text,
          marginBottom: spacing.xs,
        },
        row: { flexDirection: 'row', gap: spacing.sm },
        handle: {
          width: 36,
          height: 4,
          backgroundColor: theme.border,
          borderRadius: 2,
          alignSelf: 'center',
          marginBottom: spacing.sm,
        },
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={ms.overlay}>
          <View style={ms.sheet}>
            <View style={ms.handle} />
            <Text style={ms.title}>Handmatig toevoegen</Text>

            <FormField label="Naam" required>
              <TextInput
                style={inputStyle(theme)}
                placeholder="bijv. Kipfilet"
                placeholderTextColor={theme.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </FormField>

            <View style={ms.row}>
              <FormField label="Calorieën" required style={{ flex: 1 }}>
                <TextInput
                  style={inputStyle(theme)}
                  placeholder="kcal"
                  keyboardType="numeric"
                  placeholderTextColor={theme.textMuted}
                  value={calories}
                  onChangeText={setCalories}
                />
              </FormField>
              <FormField label="Eiwit (g)" style={{ flex: 1 }}>
                <TextInput
                  style={inputStyle(theme)}
                  placeholder="g"
                  keyboardType="numeric"
                  placeholderTextColor={theme.textMuted}
                  value={protein}
                  onChangeText={setProtein}
                />
              </FormField>
            </View>

            <View style={ms.row}>
              <FormField label="Koolhydraten (g)" style={{ flex: 1 }}>
                <TextInput
                  style={inputStyle(theme)}
                  placeholder="g"
                  keyboardType="numeric"
                  placeholderTextColor={theme.textMuted}
                  value={carbs}
                  onChangeText={setCarbs}
                />
              </FormField>
              <FormField label="Vetten (g)" style={{ flex: 1 }}>
                <TextInput
                  style={inputStyle(theme)}
                  placeholder="g"
                  keyboardType="numeric"
                  placeholderTextColor={theme.textMuted}
                  value={fat}
                  onChangeText={setFat}
                />
              </FormField>
            </View>

            <PrimaryButton label={saving ? 'Opslaan...' : 'Toevoegen'} onPress={handleAdd} loading={saving} style={{ marginTop: spacing.xs }} />
            <GhostButton label="Annuleren" onPress={onClose} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

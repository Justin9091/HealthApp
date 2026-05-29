import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useQueryClient } from '@tanstack/react-query';
import {
  aiService,
  AIResponse,
  ParsedFoodItem,
  ParsedWorkout,
} from '../services/AIService';
import { nutritionService } from '../services/NutritionService';
import { fitnessService } from '../services/FitnessService';
import { colors, spacing, radius, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { queryKeys } from '../utils/queryKeys';
import { todayStr } from '../utils/helpers';

// ─── Types ─────────────────────────────────────────────────────────────────────

type MessageRole = 'user' | 'assistant' | 'system';

interface Message {
  id: string;
  role: MessageRole;
  text: string;
  aiResponse?: AIResponse;
  confirmed?: boolean;
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  text: 'Hoi! 👋 Ik ben je AI gezondheids-assistent. Vertel me wat je gegeten of gedaan hebt en ik log het voor je!\n\nBijvoorbeeld:\n• "Ik heb 3 boterhammen met hagelsla gegeten"\n• "30 minuten hardgelopen"\n• "Hoeveel calorieën zitten er in een banaan?"',
};

// ─── Food confirm card ─────────────────────────────────────────────────────────

function FoodConfirmCard({
  items,
  onConfirm,
  onCancel,
  confirmed,
}: {
  items: ParsedFoodItem[];
  onConfirm: () => void;
  onCancel: () => void;
  confirmed?: boolean;
}) {
  const { theme } = useTheme();
  const fc = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: theme.surfaceAlt,
          borderRadius: radius.md,
          padding: spacing.sm,
          marginTop: spacing.xs,
          gap: 6,
        },
        itemRow: { gap: 4 },
        itemName: { fontSize: 14, fontWeight: '600', color: theme.text },
        macroRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
        total: {
          fontSize: 13,
          fontWeight: '700',
          color: theme.text,
          marginTop: 2,
        },
        actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
        cancelBtn: {
          flex: 1,
          paddingVertical: 8,
          borderRadius: radius.sm,
          backgroundColor: theme.surface,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: theme.border,
        },
        cancelText: { fontSize: 13, color: theme.textSecondary },
        confirmBtn: {
          flex: 2,
          paddingVertical: 8,
          borderRadius: radius.sm,
          backgroundColor: theme.secondary,
          alignItems: 'center',
        },
        confirmText: { fontSize: 13, color: '#fff', fontWeight: '700' },
        confirmedBadge: {
          backgroundColor: theme.secondary,
          borderRadius: radius.sm,
          padding: 8,
          alignItems: 'center',
          marginTop: 4,
        },
        confirmedText: { color: '#fff', fontWeight: '700', fontSize: 13 },
      }),
    [theme],
  );

  const total = items.reduce((s, i) => s + i.calories, 0);
  return (
    <View style={fc.card}>
      {items.map((item, idx) => (
        <View key={idx} style={fc.itemRow}>
          <Text style={fc.itemName}>{item.name}</Text>
          <View style={fc.macroRow}>
            <MacroPill
              label="kcal"
              value={item.calories}
              color={colors.calories}
            />
            <MacroPill
              label="eiwit"
              value={item.protein}
              color={colors.protein}
              unit="g"
            />
            <MacroPill
              label="koolh."
              value={item.carbs}
              color={colors.carbs}
              unit="g"
            />
            <MacroPill
              label="vet"
              value={item.fat}
              color={colors.fat}
              unit="g"
            />
          </View>
        </View>
      ))}
      {items.length > 1 && <Text style={fc.total}>Totaal: {total} kcal</Text>}
      {!confirmed ? (
        <View style={fc.actions}>
          <TouchableOpacity style={fc.cancelBtn} onPress={onCancel}>
            <Text style={fc.cancelText}>Niet loggen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={fc.confirmBtn} onPress={onConfirm}>
            <Text style={fc.confirmText}>✓ Loggen</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={fc.confirmedBadge}>
          <Text style={fc.confirmedText}>✓ Gelogd!</Text>
        </View>
      )}
    </View>
  );
}

function WorkoutConfirmCard({
  workout,
  onConfirm,
  onCancel,
  confirmed,
}: {
  workout: ParsedWorkout;
  onConfirm: () => void;
  onCancel: () => void;
  confirmed?: boolean;
}) {
  const { theme } = useTheme();
  const fc = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: theme.surfaceAlt,
          borderRadius: radius.md,
          padding: spacing.sm,
          marginTop: spacing.xs,
          gap: 6,
        },
        itemName: { fontSize: 14, fontWeight: '600', color: theme.text },
        macroRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
        actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
        cancelBtn: {
          flex: 1,
          paddingVertical: 8,
          borderRadius: radius.sm,
          backgroundColor: theme.surface,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: theme.border,
        },
        cancelText: { fontSize: 13, color: theme.textSecondary },
        confirmBtn: {
          flex: 2,
          paddingVertical: 8,
          borderRadius: radius.sm,
          backgroundColor: theme.secondary,
          alignItems: 'center',
        },
        confirmText: { fontSize: 13, color: '#fff', fontWeight: '700' },
        confirmedBadge: {
          backgroundColor: theme.secondary,
          borderRadius: radius.sm,
          padding: 8,
          alignItems: 'center',
          marginTop: 4,
        },
        confirmedText: { color: '#fff', fontWeight: '700', fontSize: 13 },
      }),
    [theme],
  );

  return (
    <View style={fc.card}>
      <Text style={fc.itemName}>{workout.name}</Text>
      <View style={fc.macroRow}>
        <MacroPill
          label="min"
          value={workout.durationMinutes}
          color={colors.accent}
        />
        <MacroPill
          label="kcal"
          value={workout.caloriesBurned}
          color={colors.calories}
        />
      </View>
      {!confirmed ? (
        <View style={fc.actions}>
          <TouchableOpacity style={fc.cancelBtn} onPress={onCancel}>
            <Text style={fc.cancelText}>Niet loggen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={fc.confirmBtn} onPress={onConfirm}>
            <Text style={fc.confirmText}>✓ Loggen</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={fc.confirmedBadge}>
          <Text style={fc.confirmedText}>✓ Gelogd!</Text>
        </View>
      )}
    </View>
  );
}

function MacroPill({
  label,
  value,
  color,
  unit = '',
}: {
  label: string;
  value: number;
  color: string;
  unit?: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={[mp.pill, { borderColor: color }]}>
      <Text style={[mp.value, { color }]}>
        {Math.round(value)}
        {unit}
      </Text>
      <Text style={[mp.label, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

const mp = StyleSheet.create({
  pill: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
    minWidth: 44,
  },
  value: { fontSize: 13, fontWeight: '700' },
  label: { fontSize: 10 },
});

// ─── API Key Modal ─────────────────────────────────────────────────────────────

function ApiKeyModal({
  visible,
  onSave,
  onClose,
}: {
  visible: boolean;
  onSave: (key: string) => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const [value, setValue] = useState('');

  const ak = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: theme.isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        },
        card: {
          backgroundColor: theme.surface,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          padding: spacing.lg,
          gap: spacing.sm,
        },
        title: { fontSize: 18, fontWeight: '700', color: theme.text },
        desc: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 },
        link: { color: theme.primary, fontWeight: '600' },
        input: {
          backgroundColor: theme.surfaceAlt,
          borderRadius: radius.sm,
          padding: spacing.sm,
          fontSize: 14,
          color: theme.text,
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        },
        actions: { flexDirection: 'row', gap: spacing.sm },
        cancelBtn: {
          flex: 1,
          padding: spacing.sm,
          borderRadius: radius.lg,
          backgroundColor: theme.surfaceAlt,
          alignItems: 'center',
        },
        cancelText: { color: theme.textSecondary, fontWeight: '600' },
        saveBtn: {
          flex: 2,
          padding: spacing.sm,
          borderRadius: radius.lg,
          backgroundColor: theme.primary,
          alignItems: 'center',
        },
        saveBtnDisabled: { opacity: 0.4 },
        saveText: { color: '#fff', fontWeight: '700' },
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
      <View style={ak.overlay}>
        <View style={ak.card}>
          <Text style={ak.title}>🔑 Anthropic API Sleutel</Text>
          <Text style={ak.desc}>
            Om de AI chatbot te gebruiken heb je een Anthropic API sleutel
            nodig. Maak gratis een account aan op{'\n'}
            <Text style={ak.link}>console.anthropic.com</Text>
          </Text>
          <TextInput
            style={ak.input}
            value={value}
            onChangeText={setValue}
            placeholder="sk-ant-..."
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          <View style={ak.actions}>
            <TouchableOpacity style={ak.cancelBtn} onPress={onClose}>
              <Text style={ak.cancelText}>Annuleren</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                ak.saveBtn,
                !value.startsWith('sk-') && ak.saveBtnDisabled,
              ]}
              onPress={() => value.startsWith('sk-') && onSave(value)}
            >
              <Text style={ak.saveText}>Opslaan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── ChatScreen ────────────────────────────────────────────────────────────────

export function ChatScreen() {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const qc = useQueryClient();
  const today = todayStr();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: theme.background },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: theme.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        headerTitle: { fontSize: 17, fontWeight: '700', color: theme.text },
        headerSub: { fontSize: 12, color: theme.textSecondary, marginTop: 1 },
        keyBtn: {
          backgroundColor: theme.surfaceAlt,
          borderRadius: radius.xl,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: theme.border,
        },
        keyBtnText: { fontSize: 13, color: theme.text, fontWeight: '500' },
        scroll: { flex: 1 },
        scrollContent: {
          padding: spacing.md,
          gap: spacing.sm,
          paddingBottom: spacing.sm,
        },
        bubble: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
        bubbleUser: { justifyContent: 'flex-end' },
        bubbleAssistant: { justifyContent: 'flex-start' },
        bubbleAvatar: { fontSize: 20, marginBottom: 2 },
        bubbleContent: {
          maxWidth: '80%',
          borderRadius: radius.lg,
          padding: spacing.sm,
        },
        bubbleContentUser: {
          backgroundColor: theme.primary,
          borderBottomRightRadius: 4,
        },
        bubbleContentAssistant: {
          backgroundColor: theme.surface,
          borderBottomLeftRadius: 4,
          ...shadow.sm,
        },
        bubbleText: { fontSize: 15, lineHeight: 21 },
        bubbleTextUser: { color: '#fff' },
        bubbleTextAssistant: { color: theme.text },
        inputBar: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          padding: spacing.sm,
          backgroundColor: theme.surface,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          gap: spacing.xs,
        },
        input: {
          flex: 1,
          backgroundColor: theme.surfaceAlt,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.sm,
          paddingVertical: 10,
          fontSize: 15,
          color: theme.text,
          maxHeight: 100,
        },
        sendBtn: {
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: theme.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        sendBtnDisabled: { opacity: 0.4 },
        sendBtnText: {
          color: '#fff',
          fontSize: 20,
          fontWeight: '700',
          marginTop: -2,
        },
      }),
    [theme],
  );

  const mdStyles = useMemo(
    () => ({
      body: { color: theme.text, fontSize: 15, lineHeight: 22 },
      heading1: {
        fontSize: 17,
        fontWeight: '800' as const,
        color: theme.text,
        marginBottom: 4,
        marginTop: 4,
      },
      heading2: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: theme.text,
        marginBottom: 2,
        marginTop: 4,
      },
      heading3: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: theme.text,
        marginBottom: 2,
        marginTop: 2,
      },
      strong: { fontWeight: '700' as const, color: theme.text },
      em: { fontStyle: 'italic' as const },
      code_inline: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 13,
        backgroundColor: theme.borderLight,
        color: theme.primary,
      },
      fence: {
        backgroundColor: theme.surfaceAlt,
        borderRadius: radius.sm,
        padding: spacing.sm,
        marginVertical: 4,
        borderLeftWidth: 3,
        borderLeftColor: theme.border,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: theme.textSecondary,
      },
      bullet_list: { marginVertical: 2 },
      ordered_list: { marginVertical: 2 },
      list_item: { marginVertical: 1 },
      paragraph: { marginVertical: 2 },
    }),
    [theme],
  );

  useEffect(() => {
    aiService.getApiKey().then(k => setHasApiKey(!!k));
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = () => sendText(input);

  const handleConfirmFood = async (msgId: string, items: ParsedFoodItem[]) => {
    try {
      for (const item of items) {
        await nutritionService.addFoodEntry(today, {
          name: item.name,
          calories: Math.round(item.calories),
          protein: Math.round(item.protein),
          carbs: Math.round(item.carbs),
          fat: Math.round(item.fat),
          mealType: item.mealType,
          servingSize: item.servingSize,
          servingUnit: item.servingUnit,
        });
      }
      qc.invalidateQueries({ queryKey: queryKeys.nutrition.summary(today) });
      qc.invalidateQueries({ queryKey: queryKeys.nutrition.food(today) });
      setMessages(prev =>
        prev.map(m => (m.id === msgId ? { ...m, confirmed: true } : m)),
      );
    } catch (err: any) {
      Alert.alert('Fout', 'Kon niet loggen: ' + err.message);
    }
  };

  const handleConfirmWorkout = async (
    msgId: string,
    workout: ParsedWorkout,
  ) => {
    try {
      await fitnessService.addWorkout(today, {
        name: workout.name,
        type: workout.type,
        durationMinutes: workout.durationMinutes,
        caloriesBurned: workout.caloriesBurned,
        notes: workout.notes,
      });
      qc.invalidateQueries({ queryKey: queryKeys.fitness.summary(today) });
      qc.invalidateQueries({ queryKey: queryKeys.fitness.workouts(today) });
      setMessages(prev =>
        prev.map(m => (m.id === msgId ? { ...m, confirmed: true } : m)),
      );
    } catch (err: any) {
      Alert.alert('Fout', 'Kon niet loggen: ' + err.message);
    }
  };

  const handleApiKeySave = async (key: string) => {
    await aiService.saveApiKey(key);
    setHasApiKey(true);
    setShowApiModal(false);
  };

  const sendText = async (text: string) => {
    if (!text.trim() || loading) return;
    if (!hasApiKey) {
      setShowApiModal(true);
      return;
    }
    setInput('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    scrollToBottom();
    try {
      const history = messages
        .filter(m => m.role !== 'system' && m.id !== 'welcome')
        .slice(-6)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.text }));
      const aiResp = await aiService.chat(text, history);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: aiResp.message,
          aiResponse: aiResp,
        },
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          text: `Er ging iets mis: ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AI Assistent</Text>
          <Text style={styles.headerSub}>
            Log voeding & trainingen met tekst
          </Text>
        </View>
        <TouchableOpacity
          style={styles.keyBtn}
          onPress={() => setShowApiModal(true)}
        >
          <Text style={styles.keyBtnText}>
            {hasApiKey ? '🔑 ✓' : '🔑 Instellen'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 8 }]}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(msg => (
            <View
              key={msg.id}
              style={[
                styles.bubble,
                msg.role === 'user'
                  ? styles.bubbleUser
                  : styles.bubbleAssistant,
              ]}
            >
              {msg.role === 'assistant' && (
                <Text style={styles.bubbleAvatar}>🤖</Text>
              )}
              <View
                style={[
                  styles.bubbleContent,
                  msg.role === 'user'
                    ? styles.bubbleContentUser
                    : styles.bubbleContentAssistant,
                ]}
              >
                {msg.role === 'user' ? (
                  <Text style={[styles.bubbleText, styles.bubbleTextUser]}>
                    {msg.text}
                  </Text>
                ) : (
                  <Markdown style={mdStyles}>{msg.text}</Markdown>
                )}

                {/* Food confirm card */}
                {msg.aiResponse?.kind === 'food' &&
                  (() => {
                    const resp = msg.aiResponse;
                    return (
                      <FoodConfirmCard
                        items={resp.items}
                        confirmed={msg.confirmed}
                        onConfirm={() => handleConfirmFood(msg.id, resp.items)}
                        onCancel={() =>
                          setMessages(prev =>
                            prev.map(m =>
                              m.id === msg.id
                                ? {
                                    ...m,
                                    aiResponse: {
                                      kind: 'chat',
                                      message: m.text,
                                    },
                                  }
                                : m,
                            ),
                          )
                        }
                      />
                    );
                  })()}

                {/* Workout confirm card */}
                {msg.aiResponse?.kind === 'workout' &&
                  (() => {
                    const resp = msg.aiResponse;
                    return (
                      <WorkoutConfirmCard
                        workout={resp.workout}
                        confirmed={msg.confirmed}
                        onConfirm={() =>
                          handleConfirmWorkout(msg.id, resp.workout)
                        }
                        onCancel={() =>
                          setMessages(prev =>
                            prev.map(m =>
                              m.id === msg.id
                                ? {
                                    ...m,
                                    aiResponse: {
                                      kind: 'chat',
                                      message: m.text,
                                    },
                                  }
                                : m,
                            ),
                          )
                        }
                      />
                    );
                  })()}
              </View>
            </View>
          ))}

          {/* Typing indicator */}
          {loading && (
            <View style={[styles.bubble, styles.bubbleAssistant]}>
              <Text style={styles.bubbleAvatar}>🤖</Text>
              <View
                style={[styles.bubbleContent, styles.bubbleContentAssistant]}
              >
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.sm },
          ]}
        >
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Typ wat je gegeten of gedaan hebt..."
            placeholderTextColor={theme.textMuted}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!input.trim() || loading) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ApiKeyModal
        visible={showApiModal}
        onSave={handleApiKeySave}
        onClose={() => setShowApiModal(false)}
      />
    </SafeAreaView>
  );
}

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import Markdown from 'react-native-markdown-display';
import { aiService, ParsedFoodItem } from '../services/AIService';
import { colors, spacing, radius, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface Props {
  onItemsDetected: (items: ParsedFoodItem[]) => void;
}

type ScanState = 'idle' | 'scanning' | 'done' | 'error';

export function FoodPhotoScanner({ onItemsDetected }: Props) {
  const { theme } = useTheme();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<ParsedFoodItem[]>([]);
  const [aiMessage, setAiMessage] = useState('');
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        // Idle
        scanButton: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.primaryLight,
          borderRadius: radius.md,
          padding: spacing.md,
          borderWidth: 1.5,
          borderColor: theme.primary + '40',
          borderStyle: 'dashed',
          gap: spacing.sm,
        },
        scanIconWrap: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: theme.surface,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadow.sm,
        },
        scanTitle: {
          fontSize: 15,
          fontWeight: '700',
          color: theme.text,
        },
        scanSub: {
          fontSize: 12,
          color: theme.textSecondary,
          marginTop: 2,
        },
        premiumBadge: {
          backgroundColor: theme.primary,
          borderRadius: radius.sm,
          paddingHorizontal: 8,
          paddingVertical: 4,
        },
        premiumText: {
          color: '#fff',
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 0.5,
        },

        // Scanning
        scanningCard: {
          borderRadius: radius.lg,
          overflow: 'hidden',
          height: 200,
          backgroundColor: theme.text,
          ...shadow.md,
        },
        previewImage: {
          width: '100%',
          height: '100%',
          position: 'absolute',
          opacity: 0.5,
        },
        scanningOverlay: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
        },
        scanningSpinner: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: theme.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        scanningText: {
          color: '#fff',
          fontSize: 17,
          fontWeight: '700',
        },
        scanningSubText: {
          color: 'rgba(255,255,255,0.7)',
          fontSize: 13,
        },

        // Result
        resultCard: {
          backgroundColor: theme.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          gap: spacing.sm,
          ...shadow.sm,
          borderWidth: 1,
          borderColor: theme.borderLight,
        },
        errorCard: {
          alignItems: 'center',
          borderColor: colors.dangerLight,
          backgroundColor: colors.dangerLight,
        },
        previewImageSmall: {
          width: '100%',
          height: 140,
          borderRadius: radius.md,
          marginBottom: spacing.xs,
        },
        resultHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        resultTitle: {
          fontSize: 16,
          fontWeight: '800',
          color: theme.text,
        },
        aiMessage: {
          fontSize: 13,
          color: theme.textSecondary,
          lineHeight: 19,
        },
        itemsList: { gap: spacing.xs },
        detectedItem: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surfaceAlt,
          borderRadius: radius.sm,
          padding: spacing.sm,
        },
        itemName: {
          fontSize: 14,
          fontWeight: '700',
          color: theme.text,
        },
        itemMacros: {
          fontSize: 12,
          color: theme.textSecondary,
          marginTop: 2,
        },
        resultActions: { gap: spacing.xs, marginTop: spacing.xs },
        confirmBtn: {
          backgroundColor: theme.primary,
          borderRadius: radius.xl,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
          ...shadow.sm,
        },
        confirmBtnText: {
          color: '#fff',
          fontWeight: '700',
          fontSize: 15,
        },
        cancelBtn: {
          alignItems: 'center',
          paddingVertical: 8,
        },
        cancelBtnText: {
          color: theme.textMuted,
          fontSize: 14,
        },
        errorText: {
          color: colors.danger,
          fontSize: 14,
          textAlign: 'center',
          lineHeight: 20,
        },
        retryBtn: {
          marginTop: spacing.sm,
          backgroundColor: theme.surface,
          borderRadius: radius.xl,
          paddingVertical: 12,
          paddingHorizontal: spacing.lg,
        },
        retryBtnText: {
          color: theme.primary,
          fontWeight: '700',
          fontSize: 14,
        },
      }),
    [theme],
  );

  const photoMdStyles = useMemo(
    () => ({
      body: { color: theme.textSecondary, fontSize: 13, lineHeight: 19 },
      paragraph: { marginTop: 0, marginBottom: 4 },
      strong: { fontWeight: '700' as const, color: theme.text },
      code_inline: {
        backgroundColor: theme.surfaceAlt,
        borderRadius: 4,
        paddingHorizontal: 4,
        fontSize: 12,
        color: theme.primary,
      },
      bullet_list: { marginVertical: 2 },
      list_item: { marginVertical: 1 },
    }),
    [theme],
  );

  const photoMdErrorStyles = useMemo(
    () => ({
      body: {
        color: colors.danger,
        fontSize: 14,
        textAlign: 'center' as const,
        lineHeight: 20,
      },
      paragraph: { marginTop: 0, marginBottom: 0 },
    }),
    [],
  );

  React.useEffect(() => {
    if (scanState === 'scanning') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [scanState, pulseAnim]);

  const handlePickImage = (fromCamera: boolean) => {
    const action = fromCamera ? launchCamera : launchImageLibrary;
    action(
      {
        mediaType: 'photo',
        includeBase64: true,
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.8,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (!asset?.base64 || !asset?.uri) return;
        setPhotoUri(asset.uri);
        analyzeImage(asset.base64, asset.type ?? 'image/jpeg');
      },
    );
  };

  const analyzeImage = async (base64: string, mimeType: string) => {
    setScanState('scanning');
    setDetectedItems([]);
    try {
      const result = await aiService.analyzePhoto(base64, mimeType as any);
      if (result.kind === 'food' && result.items.length > 0) {
        setDetectedItems(result.items);
        setAiMessage(result.message);
        setScanState('done');
      } else {
        setAiMessage(
          result.kind === 'chat'
            ? result.message
            : 'Geen voeding herkend op deze foto.',
        );
        setScanState('error');
      }
    } catch {
      setAiMessage('Er ging iets mis. Probeer het opnieuw.');
      setScanState('error');
    }
  };

  const handleConfirm = () => {
    onItemsDetected(detectedItems);
    reset();
  };

  const reset = () => {
    setScanState('idle');
    setPhotoUri(null);
    setDetectedItems([]);
    setAiMessage('');
  };

  const showImageOptions = () => {
    Alert.alert('Foto toevoegen', 'Kies een optie', [
      { text: 'Camera', onPress: () => handlePickImage(true) },
      { text: 'Fotobibliotheek', onPress: () => handlePickImage(false) },
      { text: 'Annuleer', style: 'cancel' },
    ]);
  };

  // ── Idle state ──────────────────────────────────────────────────────────────
  if (scanState === 'idle') {
    return (
      <TouchableOpacity
        style={styles.scanButton}
        onPress={showImageOptions}
        activeOpacity={0.8}
      >
        <View style={styles.scanIconWrap}>
          <Icon name="camera" size={22} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.scanTitle}>Foto scannen</Text>
          <Text style={styles.scanSub}>AI herkent je maaltijd automatisch</Text>
        </View>
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumText}>AI</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // ── Scanning state ──────────────────────────────────────────────────────────
  if (scanState === 'scanning') {
    return (
      <View style={styles.scanningCard}>
        {photoUri && (
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
        )}
        <View style={styles.scanningOverlay}>
          <Animated.View
            style={[styles.scanningSpinner, { opacity: pulseAnim }]}
          >
            <ActivityIndicator size="large" color="#fff" />
          </Animated.View>
          <Text style={styles.scanningText}>Maaltijd analyseren…</Text>
          <Text style={styles.scanningSubText}>
            AI berekent calorieën en macros
          </Text>
        </View>
      </View>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (scanState === 'error') {
    return (
      <View style={[styles.resultCard, styles.errorCard]}>
        {photoUri && (
          <Image source={{ uri: photoUri }} style={styles.previewImageSmall} />
        )}
        <Icon
          name="alert-circle"
          size={28}
          color={colors.danger}
          style={{ marginBottom: 8 }}
        />
        <Markdown style={photoMdErrorStyles}>{aiMessage}</Markdown>
        <TouchableOpacity style={styles.retryBtn} onPress={reset}>
          <Text style={styles.retryBtnText}>Opnieuw proberen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Done state ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.resultCard}>
      {photoUri && (
        <Image source={{ uri: photoUri }} style={styles.previewImageSmall} />
      )}

      <View style={styles.resultHeader}>
        <Icon name="checkmark-circle" size={22} color={theme.secondary} />
        <Text style={styles.resultTitle}>Maaltijd herkend</Text>
      </View>

      {aiMessage ? (
        <Markdown style={photoMdStyles}>{aiMessage}</Markdown>
      ) : null}

      <View style={styles.itemsList}>
        {detectedItems.map((item, i) => (
          <View key={i} style={styles.detectedItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMacros}>
                {item.calories} kcal · {item.protein}g eiwit · {item.carbs}g
                koolh · {item.fat}g vet
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.resultActions}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <Icon name="add-circle" size={18} color="#fff" />
          <Text style={styles.confirmBtnText}>Toevoegen aan dagboek</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={reset}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelBtnText}>Annuleer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

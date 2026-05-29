# React Native Coding Guidelines

## Projectstructuur

```
src/
  components/       # Herbruikbare UI-componenten
  screens/          # Schermcomponenten (één per route)
  navigation/       # Navigator-configuraties
  hooks/            # Custom React hooks
  store/            # State management (Redux / Zustand)
  services/         # API-calls en externe integraties
  utils/            # Pure helperfuncties
  constants/        # Kleuren, fonts, maten, routes
  types/            # Gedeelde TypeScript types/interfaces
  assets/           # Afbeeldingen, fonts, iconen
```

## TypeScript

- Gebruik **altijd** TypeScript; vermijd `any`.
- Definieer props via een `interface`, geen inline type-literal.
- Gebruik `FC<Props>` alleen als je `children` nodig hebt; anders gewoon een getypede functie.

```tsx
interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

function PrimaryButton({ label, onPress, disabled = false }: ButtonProps) { ... }
```

## Componenten

- Één component per bestand; bestandsnaam = componentnaam (PascalCase).
- Houd componenten klein en gefocust op één verantwoordelijkheid.
- Gebruik **functionele componenten** — geen class components.
- Exporteer altijd als **named export**; vermijd default exports voor componenten.
- Splits presentatie-componenten (dumb) en container-componenten (smart).

## Naamgeving

| Type                | Conventie                | Voorbeeld       |
| ------------------- | ------------------------ | --------------- |
| Component           | PascalCase               | `UserCard`      |
| Hook                | camelCase + `use`-prefix | `useAuthState`  |
| Bestand (component) | PascalCase               | `UserCard.tsx`  |
| Bestand (util/hook) | camelCase                | `formatDate.ts` |
| Constante           | UPPER_SNAKE_CASE         | `MAX_RETRIES`   |
| Variabele/functie   | camelCase                | `fetchUserData` |

## Styling

- Gebruik **StyleSheet.create()** — nooit inline objecten in de render.
- Definieer kleuren en spacing in een centrale `theme`-constante.
- Vermijd hardcoded pixelwaarden; gebruik een spacing-schaal (`4, 8, 16, 24, 32`).
- Gebruik `Platform.select()` voor platform-specifieke stijlen in plaats van losse if-checks.

```tsx
const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
});
```

## Performance

- Wikkel lijstitems in `React.memo` om onnodige re-renders te voorkomen.
- Gebruik `useCallback` voor handlers die als prop worden doorgegeven.
- Gebruik `useMemo` alleen wanneer de berekening aantoonbaar duur is.
- Gebruik **FlatList** (nooit ScrollView) voor lange lijsten; stel `keyExtractor` altijd in.
- Vermijd anonieme functies en objectliterals in JSX-props.
- Gebruik `InteractionManager.runAfterInteractions` voor zware operaties na animaties.

## State Management

- Lokale UI-state → `useState` / `useReducer`.
- Gedeelde app-state → Zustand of Redux Toolkit.
- Server-state → React Query (`@tanstack/react-query`).
- Houd de store zo plat mogelijk; vermijd geneste objecten.

## Navigation (React Navigation)

- Definieer alle route-namen als constanten in `src/constants/routes.ts`.
- Typeer elke navigator met een `ParamList`-interface.
- Houd navigatielogica buiten componenten; gebruik een `useNavigation`-wrapper hook.

```ts
export type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
};
```

## Hooks

- Eén hook = één verantwoordelijkheid.
- Houd side-effects (fetch, timers) binnen hooks, niet in componenten.
- Retourneer altijd een consistent object of tuple; wissel niet van patroon.
- Cleanup altijd in `useEffect` (abortController, timers, listeners).

```ts
function useUser(id: string) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchUser(id, controller.signal).then(setUser);
    return () => controller.abort();
  }, [id]);

  return user;
}
```

## Error Handling

- Gebruik een **Error Boundary** op scherm-niveau.
- Toon altijd een gebruiksvriendelijke foutmelding; log de technische fout apart.
- Gebruik `try/catch` in async functies; propageer fouten niet stilzwijgend.

## Testing

- **Unit tests**: Jest + React Native Testing Library voor componenten en hooks.
- **E2E tests**: Detox voor kritieke gebruikersflows.
- Noem testbestanden `ComponentName.test.tsx` naast het bronbestand.
- Test gedrag, niet implementatiedetails (vermijd `instance` en `state`-checks).
- Streef naar >80% dekking op `utils/` en `hooks/`.

## Toegankelijkheid (a11y)

- Voeg `accessibilityLabel` toe aan interactieve elementen zonder zichtbare tekst.
- Gebruik `accessibilityRole` op knoppen, links en invoervelden.
- Zorg dat focusvolgorde logisch is met `accessible` en `accessibilityViewIsModal`.

## Git & Code Review

- Commits volgen Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`.
- Elke PR bevat: wijziging, testbewijs, screenshot (bij UI-wijzigingen).
- Geen PR groter dan ~400 regelwijziging; splits anders op.
- Linting via ESLint (`@react-native/eslint-config`) + Prettier; draai vóór commit via Husky.

## Overige Best Practices

- Importeer altijd via absolute paden (geconfigureerd via `tsconfig` of `babel-plugin-module-resolver`); geen lange `../../..`-paden.
- Verwijder `console.log` voor productie; gebruik een logger-abstractie.
- Sla gevoelige data op met `react-native-keychain`, nooit in AsyncStorage.
- Gebruik `react-native-reanimated` voor vloeiende animaties (60 fps op de UI thread).

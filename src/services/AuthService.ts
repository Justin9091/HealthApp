import {
  GoogleSignin,
  statusCodes,
  type User,
} from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = 'auth:google_user';

// Configure once – webClientId is required for Android.
// Set GOOGLE_WEB_CLIENT_ID in your environment / CI secrets.
GoogleSignin.configure({
  webClientId: process.env.GOOGLE_WEB_CLIENT_ID ?? '',
  scopes: ['profile', 'email'],
});

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  photo: string | null;
}

function toAuthUser(user: User['data']): AuthUser {
  return {
    id: user.user.id,
    name: user.user.name ?? null,
    email: user.user.email,
    photo: user.user.photo ?? null,
  };
}

export class AuthService {
  private static instance: AuthService;
  static getInstance() {
    if (!AuthService.instance) AuthService.instance = new AuthService();
    return AuthService.instance;
  }

  /** Return the cached user from storage (fast, no network). */
  async getCachedUser(): Promise<AuthUser | null> {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  private async saveUser(user: AuthUser | null) {
    if (user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(USER_KEY);
    }
  }

  /** Sign in interactively. Throws on error. */
  async signIn(): Promise<AuthUser> {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    if (!result.data) throw new Error('Sign-in cancelled');
    const user = toAuthUser(result.data);
    await this.saveUser(user);
    return user;
  }

  /** Silent sign-in on app start. Returns null if not previously signed in. */
  async signInSilently(): Promise<AuthUser | null> {
    try {
      const result = await GoogleSignin.signInSilently();
      if (!result.data) return null;
      const user = toAuthUser(result.data);
      await this.saveUser(user);
      return user;
    } catch (e: any) {
      if (e.code === statusCodes.SIGN_IN_REQUIRED) return null;
      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch {
      // ignore
    }
    await this.saveUser(null);
  }

  async isSignedIn(): Promise<boolean> {
    return GoogleSignin.hasPreviousSignIn();
  }
}

export const authService = AuthService.getInstance();

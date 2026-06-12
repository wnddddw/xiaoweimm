/**
 * Secure Token Storage
 *
 * For production, use react-native-keychain or expo-secure-store.
 * This is a drop-in wrapper: swap AsyncStorage for keychain in production
 * by changing the import in ONE place.
 *
 * Install for production:
 *   npm install react-native-keychain
 * Then uncomment the keychain import and comment AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// import * as Keychain from 'react-native-keychain';

const TOKEN_KEY = 'xiaoweimm_token';
const USER_KEY = 'xiaoweimm_user';

export const secureStore = {
  async setToken(token: string): Promise<void> {
    // Production: await Keychain.setGenericPassword('token', token, { service: TOKEN_KEY });
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    // Production:
    //   const creds = await Keychain.getGenericPassword({ service: TOKEN_KEY });
    //   return creds ? creds.password : null;
    return AsyncStorage.getItem(TOKEN_KEY);
  },

  async removeToken(): Promise<void> {
    // Production: await Keychain.resetGenericPassword({ service: TOKEN_KEY });
    await AsyncStorage.removeItem(TOKEN_KEY);
  },

  async setUser(user: object): Promise<void> {
    const json = JSON.stringify(user);
    // Production: await Keychain.setGenericPassword('user', json, { service: USER_KEY });
    await AsyncStorage.setItem(USER_KEY, json);
  },

  async getUser<T>(): Promise<T | null> {
    // Production:
    //   const creds = await Keychain.getGenericPassword({ service: USER_KEY });
    //   return creds ? JSON.parse(creds.password) : null;
    const json = await AsyncStorage.getItem(USER_KEY);
    return json ? JSON.parse(json) : null;
  },

  async removeUser(): Promise<void> {
    // Production: await Keychain.resetGenericPassword({ service: USER_KEY });
    await AsyncStorage.removeItem(USER_KEY);
  },

  async clear(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
  },
};

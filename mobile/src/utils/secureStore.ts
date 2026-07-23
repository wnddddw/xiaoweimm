/**
 * Secure Token Storage
 *
 * TODO(安全加固)：当前实现为 AsyncStorage + 异或混淆，属于"防随手翻"级别，
 * 无法抵御 root 设备 / 备份提取 / 有针对性逆向。合并正式版前应切换为
 * react-native-keychain（iOS Keychain / Android Keystore 硬件级加密）：
 *   npm install react-native-keychain
 * 然后按下方各方法的注释替换实现即可（调用方无需改动）。
 *
 * 已知限制：
 *  - 混淆密钥内置于代码中，反编译可还原明文，仅提高读取门槛；
 *  -  rooted / 越狱设备上任何本地存储都不安全，敏感操作应依赖服务端校验。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// import * as Keychain from 'react-native-keychain';

const TOKEN_KEY = 'xiaoweimm_token';
const REFRESH_TOKEN_KEY = 'xiaoweimm_refresh_token';
const USER_KEY = 'xiaoweimm_user';

// 混淆密钥（仅用于提高明文直读门槛，非加密；见文件头 TODO）
const OBFUSCATE_KEY = 'xwmm$store#2026';

// RN（Hermes）无 Buffer/atob 保证，使用自包含 base64 实现
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function toBase64(input: string): string {
  let output = '';
  for (let i = 0; i < input.length; i += 3) {
    const a = input.charCodeAt(i);
    const b = i + 1 < input.length ? input.charCodeAt(i + 1) : NaN;
    const c = i + 2 < input.length ? input.charCodeAt(i + 2) : NaN;
    output += B64_CHARS[a >> 2];
    output += B64_CHARS[((a & 3) << 4) | (isNaN(b) ? 0 : b >> 4)];
    output += isNaN(b) ? '=' : B64_CHARS[((b & 15) << 2) | (isNaN(c) ? 0 : c >> 6)];
    output += isNaN(c) ? '=' : B64_CHARS[c & 63];
  }
  return output;
}

function fromBase64(input: string): string {
  let output = '';
  const clean = input.replace(/=+$/, '');
  for (let i = 0; i < clean.length; i += 4) {
    const n = [0, 1, 2, 3].map(k => (i + k < clean.length ? B64_CHARS.indexOf(clean[i + k]) : 0));
    output += String.fromCharCode((n[0] << 2) | (n[1] >> 4));
    if (i + 2 < clean.length) output += String.fromCharCode(((n[1] & 15) << 4) | (n[2] >> 2));
    if (i + 3 < clean.length) output += String.fromCharCode(((n[2] & 3) << 6) | n[3]);
  }
  return output;
}

function xorLatin1(input: string): string {
  return Array.from(input)
    .map((ch, i) => String.fromCharCode(ch.charCodeAt(0) ^ OBFUSCATE_KEY.charCodeAt(i % OBFUSCATE_KEY.length)))
    .join('');
}

function encode(plain: string): string {
  // encodeURIComponent 先把中文等非 Latin1 字符转成 ASCII，保证 XOR/base64 可逆
  return toBase64(xorLatin1(unescape(encodeURIComponent(plain))));
}

function decode(encoded: string): string {
  return decodeURIComponent(escape(xorLatin1(fromBase64(encoded))));
}

export const secureStore = {
  async setToken(token: string): Promise<void> {
    // Production: await Keychain.setGenericPassword('token', token, { service: TOKEN_KEY });
    await AsyncStorage.setItem(TOKEN_KEY, encode(token));
  },

  async getToken(): Promise<string | null> {
    // Production:
    //   const creds = await Keychain.getGenericPassword({ service: TOKEN_KEY });
    //   return creds ? creds.password : null;
    const raw = await AsyncStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    try {
      return decode(raw);
    } catch {
      return null;
    }
  },

  async removeToken(): Promise<void> {
    // Production: await Keychain.resetGenericPassword({ service: TOKEN_KEY });
    await AsyncStorage.removeItem(TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, encode(token));
  },

  async getRefreshToken(): Promise<string | null> {
    const raw = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!raw) return null;
    try {
      return decode(raw);
    } catch {
      return null;
    }
  },

  async removeRefreshToken(): Promise<void> {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  async setUser(user: object): Promise<void> {
    const json = JSON.stringify(user);
    // Production: await Keychain.setGenericPassword('user', json, { service: USER_KEY });
    await AsyncStorage.setItem(USER_KEY, encode(json));
  },

  async getUser<T>(): Promise<T | null> {
    // Production:
    //   const creds = await Keychain.getGenericPassword({ service: USER_KEY });
    //   return creds ? JSON.parse(creds.password) : null;
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(decode(raw)) as T;
    } catch {
      // 数据损坏时安全返回 null（静默登出，不再启动即抛）
      return null;
    }
  },

  async removeUser(): Promise<void> {
    // Production: await Keychain.resetGenericPassword({ service: USER_KEY });
    await AsyncStorage.removeItem(USER_KEY);
  },

  async clear(): Promise<void> {
    await this.removeToken();
    await this.removeRefreshToken();
    await this.removeUser();
  },
};

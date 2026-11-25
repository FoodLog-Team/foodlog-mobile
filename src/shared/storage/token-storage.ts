import * as SecureStore from "expo-secure-store";

/**
 * Persists the auth token in the device keychain (iOS) / Keystore-backed storage (Android).
 *
 * Never store tokens in AsyncStorage or other unencrypted storage.
 *
 * The backend currently returns only the access token in the response body;
 * the refresh token is an HttpOnly cookie (see docs/ARCHITECTURE.md, "Authentication").
 */

// SecureStore keys may only contain letters, digits, ".", "-" and "_".
const ACCESS_TOKEN_KEY = "foodlog.accessToken";

export const tokenStorage = {
  getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string): Promise<void> {
    return SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  clear(): Promise<void> {
    return SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  },
};

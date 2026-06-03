import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export interface AuthTokens {
  access: {
    token: string;
    expires: string;
  };
  refresh: {
    token: string;
    expires: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  classes: any[];
  courses: any[];
  progress: any[];
  subjects: any[];
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

// Cookie names
const ACCESS_TOKEN_COOKIE = "access_token";
const ACCESS_TOKEN_EXPIRES_COOKIE = "access_token_expires";
const REFRESH_TOKEN_COOKIE = "refresh_token";
const USER_COOKIE = "user_data";

function parseJwtExpiry(token: string): Date | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    ) as { exp?: number };
    if (typeof decoded.exp !== "number") return null;
    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
}

// Cookie expiry (360 days)
const COOKIE_EXPIRY = 360;

export class AuthService {
  /**
   * Store authentication tokens in cookies
   */
  static setTokens(tokens: AuthTokens): void {
    // Store access token
    Cookies.set(ACCESS_TOKEN_COOKIE, tokens.access.token, {
      expires: COOKIE_EXPIRY,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    Cookies.set(ACCESS_TOKEN_EXPIRES_COOKIE, tokens.access.expires, {
      expires: COOKIE_EXPIRY,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Store refresh token
    Cookies.set(REFRESH_TOKEN_COOKIE, tokens.refresh.token, {
      expires: COOKIE_EXPIRY,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  }

  /**
   * Store user data in cookie
   */
  static setUser(user: User): void {
    Cookies.set(USER_COOKIE, JSON.stringify(user), {
      expires: COOKIE_EXPIRY,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  }

  /**
   * Get access token from cookie (undefined if missing or expired)
   */
  static getAccessToken(): string | undefined {
    const token = Cookies.get(ACCESS_TOKEN_COOKIE);
    if (!token || this.isAccessTokenExpired(token)) {
      return undefined;
    }
    return token;
  }

  /**
   * Get refresh token from cookie
   */
  static getRefreshToken(): string | undefined {
    return Cookies.get(REFRESH_TOKEN_COOKIE);
  }

  /**
   * Get user data from cookie
   */
  static getUser(): User | null {
    const userData = Cookies.get(USER_COOKIE);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error("Error parsing user data from cookie:", error);
        return null;
      }
    }
    return null;
  }

  /**
   * Resolve access token expiry from cookie or JWT payload
   */
  static getAccessTokenExpiry(token?: string): Date | null {
    const expires = Cookies.get(ACCESS_TOKEN_EXPIRES_COOKIE);
    if (expires) {
      const date = new Date(expires);
      if (!Number.isNaN(date.getTime())) return date;
    }

    const accessToken = token ?? Cookies.get(ACCESS_TOKEN_COOKIE);
    return accessToken ? parseJwtExpiry(accessToken) : null;
  }

  /**
   * Check if access token is missing or past expiry
   */
  static isAccessTokenExpired(token?: string): boolean {
    const accessToken = token ?? Cookies.get(ACCESS_TOKEN_COOKIE);
    if (!accessToken) return true;

    const expiry = this.getAccessTokenExpiry(accessToken);
    if (!expiry) return true;

    return expiry.getTime() <= Date.now();
  }

  /**
   * Check if user is authenticated; clears stale session when invalid
   */
  static isAuthenticated(): boolean {
    const accessToken = Cookies.get(ACCESS_TOKEN_COOKIE);
    if (!accessToken || this.isAccessTokenExpired(accessToken)) {
      this.clearAuth();
      return false;
    }

    const user = this.getUser();
    if (!user) {
      this.clearAuth();
      return false;
    }

    return true;
  }

  /**
   * Clear all authentication data
   */
  static clearAuth(): void {
    Cookies.remove(ACCESS_TOKEN_COOKIE);
    Cookies.remove(ACCESS_TOKEN_EXPIRES_COOKIE);
    Cookies.remove(REFRESH_TOKEN_COOKIE);
    Cookies.remove(USER_COOKIE);
  }

  /**
   * Clear session and redirect to login (client-side only)
   */
  static handleSessionExpired(): void {
    this.clearAuth();
    if (typeof window === "undefined") return;

    const loginPath = "/login";
    if (!window.location.pathname.startsWith(loginPath)) {
      window.location.assign(loginPath);
    }
  }

  /**
   * Handle successful login
   */
  static handleLoginSuccess(loginData: LoginResponse): void {
    this.setTokens(loginData.tokens);
    this.setUser(loginData.user);
  }

  /**
   * Get authorization header for API requests
   */
  static getAuthHeader(): { Authorization: string } | {} {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

/**
 * Custom hook to check authentication status
 */
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = AuthService.isAuthenticated();
      setIsAuthenticated(authStatus);
      setUser(authStatus ? AuthService.getUser() : null);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const logout = () => {
    AuthService.clearAuth();
    setIsAuthenticated(false);
    setUser(null);
    // route to login page
    router.push("/login");
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    logout,
  };
};

export default AuthService;

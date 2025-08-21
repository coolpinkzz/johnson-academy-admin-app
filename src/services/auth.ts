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
const REFRESH_TOKEN_COOKIE = "refresh_token";
const USER_COOKIE = "user_data";

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
   * Get access token from cookie
   */
  static getAccessToken(): string | undefined {
    return Cookies.get(ACCESS_TOKEN_COOKIE);
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
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    if (!accessToken) return false;

    // Check if access token is expired
    const user = this.getUser();
    if (user) {
      // You might want to add additional token expiry validation here
      return true;
    }

    return false;
  }

  /**
   * Clear all authentication data
   */
  static clearAuth(): void {
    Cookies.remove(ACCESS_TOKEN_COOKIE);
    Cookies.remove(REFRESH_TOKEN_COOKIE);
    Cookies.remove(USER_COOKIE);
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
      const userData = AuthService.getUser();

      setIsAuthenticated(authStatus);
      setUser(userData);
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

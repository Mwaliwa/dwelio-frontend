import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface User {
  id: string | number;
  name: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /*
   * =========================================================
   * RESTORE EXISTING LOGIN
   * =========================================================
   */
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      console.log("AUTH RESTORE:", {
        hasToken: !!token,
        hasUser: !!storedUser,
      });

      if (token && storedUser) {
        const parsedUser: User = JSON.parse(storedUser);

        setUser(parsedUser);

        console.log("AUTH RESTORED:", parsedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("AUTH RESTORE ERROR:", error);

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * =========================================================
   * LOGIN
   * =========================================================
   */
  const login = (token: string, userData: User) => {
    console.log("AUTH LOGIN:", userData);

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));

    if (userData.role) {
      localStorage.setItem("role", userData.role);
    }

    // IMPORTANT:
    // This immediately updates ProtectedRoute.
    setUser(userData);
  };

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */
  const logout = () => {
    console.log("AUTH LOGOUT");

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
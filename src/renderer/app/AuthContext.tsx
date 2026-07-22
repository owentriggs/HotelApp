import React, { createContext, useContext, useState } from "react";
import type { User } from "@shared/types";

interface AuthContextValue {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  return (
    <AuthContext.Provider value={{ user, login: setUser, logout: () => setUser(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Which nav sections a role can see.
export type NavSection = "bookings" | "rooms" | "guests" | "pos" | "settings" | "reports";

export function canAccess(role: User["role"], section: NavSection): boolean {
  if (role === "admin" || role === "manager") return true;
  if (role === "front_desk") return section !== "settings" && section !== "reports";
  if (role === "pos_staff") return section === "pos";
  return false;
}

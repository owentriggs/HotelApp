import React from "react";
import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import RoomsPage from "../features/rooms/RoomsPage";
import BookingsPage from "../features/bookings/BookingsPage";
import GuestsPage from "../features/guests/GuestsPage";
import SettingsPage from "../features/settings/SettingsPage";
import PosPage from "../features/pos/PosPage";
import ReportsPage from "../features/reports/ReportsPage";
import LoginPage from "./LoginPage";
import { canAccess, useAuth } from "./AuthContext";

const NAV_ITEMS = [
  { to: "/bookings", label: "Bookings", section: "bookings" as const },
  { to: "/rooms", label: "Rooms", section: "rooms" as const },
  { to: "/guests", label: "Guests", section: "guests" as const },
  { to: "/pos", label: "POS", section: "pos" as const },
  { to: "/reports", label: "Reports", section: "reports" as const },
  { to: "/settings", label: "Settings", section: "settings" as const },
];

export default function App() {
  const { user, logout } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  const visibleNav = NAV_ITEMS.filter((item) => canAccess(user.role, item.section));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>HotelApp</h1>
        <nav>
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, color: "var(--muted)", padding: "0 8px" }}>
            {user.name} ({user.role})
          </div>
          <button className="btn secondary" style={{ width: "100%", marginTop: 6 }} onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to={visibleNav[0]?.to ?? "/bookings"} replace />} />
          {canAccess(user.role, "bookings") && <Route path="/bookings" element={<BookingsPage />} />}
          {canAccess(user.role, "rooms") && <Route path="/rooms" element={<RoomsPage />} />}
          {canAccess(user.role, "guests") && <Route path="/guests" element={<GuestsPage />} />}
          {canAccess(user.role, "pos") && <Route path="/pos" element={<PosPage />} />}
          {canAccess(user.role, "reports") && <Route path="/reports" element={<ReportsPage />} />}
          {canAccess(user.role, "settings") && <Route path="/settings" element={<SettingsPage />} />}
        </Routes>
      </main>
    </div>
  );
}

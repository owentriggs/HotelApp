import React, { useState } from "react";
import { getApi } from "../lib/api";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const user = await getApi().users.login(username, password);
      if (!user) {
        setError("Incorrect username or password.");
        return;
      }
      login(user);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <form className="card" style={{ width: 320 }} onSubmit={submit}>
        <h2 style={{ marginTop: 0 }}>HotelApp</h2>
        <div className="form-row">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div className="form-row">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
        <button className="btn" type="submit" disabled={!username || !password || submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>
          First time? Default login is <strong>admin</strong> / <strong>admin</strong>.
        </p>
      </form>
    </div>
  );
}

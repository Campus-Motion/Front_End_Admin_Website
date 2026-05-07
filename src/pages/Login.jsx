import { useState } from "react";
import { authApi } from "../api";
import { Icon } from "../components/ui/Icons";
import "./Login.css";

export function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem("access_token", data.access_token);
      console.log(
        "Login successful, token stored",
        localStorage.getItem("access_token"),
      );

      const profile = await authApi.getMe();
      if (profile.role !== "admin" && profile.role !== "moderator") {
        localStorage.removeItem("access_token");
        setError("Access denied — admins and moderators only.");
        return;
      }
      onLogin(profile);
    } catch (err) {
      setError(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <svg
            width="48"
            height="48"
            viewBox="0 0 32 32"
            fill="none"
            aria-label="Campus Motion"
          >
            <rect width="32" height="32" rx="10" fill="var(--color-primary)" />
            <path
              d="M8 22c2-4 4-8 8-8s6 4 8 4"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle cx="16" cy="10" r="2.5" fill="#fff" />
          </svg>
        </div>
        <h1 className="login-title">Campus Motion</h1>
        <p className="login-subtitle">Admin workspace</p>

        {error && (
          <div
            className="alert alert-error"
            role="alert"
            style={{ marginBottom: "var(--space-5)" }}
          >
            <Icon name="alert" size={15} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div
            className="form-field"
            style={{ marginBottom: "var(--space-4)" }}
          >
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@epfl.ch"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div
            className="form-field"
            style={{ marginBottom: "var(--space-6)" }}
          >
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: "var(--space-12)" }}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "var(--space-3)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-faint)",
                  padding: "var(--space-1)",
                }}
              >
                <Icon name={showPwd ? "eye-off" : "eye"} size={17} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", minHeight: 44 }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

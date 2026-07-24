"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="admin-scope flex min-h-screen items-center justify-center bg-sand px-5">
      <div className="w-full max-w-sm rounded-xl3 bg-white p-8 shadow-lift">
        <p className="font-display text-2xl tracking-widest2 text-ink">AURELIA</p>
        <p className="mt-1 font-body text-xs uppercase tracking-widest2 text-ink/50">
          Admin Panel
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl2 border border-line bg-cream px-4 py-3 font-body text-sm focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl2 border border-line bg-cream px-4 py-3 font-body text-sm focus:border-gold focus:outline-none"
            />
          </div>
          {error && (
            <p className="font-body text-sm text-red-600">{error}</p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

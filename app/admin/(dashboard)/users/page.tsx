"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Check, Pencil } from "lucide-react";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "CONFIRMATION_AGENT" | "STOCK_MANAGER" | "FINANCE_MANAGER";
  lastLoginAt: string | null;
};

const roleLabels: Record<UserRow["role"], string> = {
  OWNER: "Owner",
  CONFIRMATION_AGENT: "Confirmation Agent",
  STOCK_MANAGER: "Stock Manager",
  FINANCE_MANAGER: "Finance Manager",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CONFIRMATION_AGENT" as UserRow["role"],
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editError, setEditError] = useState("");

  function load() {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []));
  }

  useEffect(load, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create user");
      return;
    }
    setForm({ name: "", email: "", password: "", role: "CONFIRMATION_AGENT" });
    setShowForm(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remove this team member?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(u: UserRow) {
    setEditingId(u.id);
    setEditEmail(u.email);
    setEditError("");
  }

  async function saveEmail(id: string) {
    setEditError("");
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: editEmail }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setEditError(data.error ?? "Failed to update email");
      return;
    }
    setEditingId(null);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Team & Roles</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary !px-5 !py-3 text-xs">
          <Plus size={15} className="mr-1.5" /> Add Team Member
        </button>
      </div>

      {showForm && (
        <form onSubmit={createUser} className="mt-6 grid grid-cols-1 gap-4 rounded-xl3 bg-white p-6 shadow-soft sm:grid-cols-2">
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="input"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="input"
          />
          <input
            required
            type="password"
            placeholder="Password (min 8 chars)"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="input"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRow["role"] }))}
            className="input"
          >
            <option value="OWNER">Owner — full access</option>
            <option value="CONFIRMATION_AGENT">Confirmation Agent — orders & earnings</option>
            <option value="STOCK_MANAGER">Stock Manager — products & stock</option>
            <option value="FINANCE_MANAGER">Finance Manager — costs, pricing, commissions</option>
          </select>
          {error && <p className="col-span-full font-body text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary col-span-full disabled:opacity-50">
            {saving ? "Creating…" : "Create Account"}
          </button>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl3 bg-white shadow-soft">
        <table className="w-full text-left font-body text-sm">
          <thead>
            <tr className="border-b border-line text-ink/50">
              <th className="px-5 py-4 font-normal">Name</th>
              <th className="px-5 py-4 font-normal">Email</th>
              <th className="px-5 py-4 font-normal">Role</th>
              <th className="px-5 py-4 font-normal">Last Login</th>
              <th className="px-5 py-4 font-normal" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-5 py-4 text-ink">{u.name}</td>
                <td className="px-5 py-4 text-ink/70">
                  {editingId === u.id ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEmail(u.id)}
                          autoFocus
                          className="input !py-1.5 text-xs"
                        />
                        <button onClick={() => saveEmail(u.id)} className="text-emerald-600 hover:text-emerald-700">
                          <Check size={16} />
                        </button>
                      </div>
                      {editError && <p className="mt-1 font-body text-xs text-red-600">{editError}</p>}
                      <p className="mt-1 font-body text-[11px] text-ink/40">This is also their login email and where order notifications go.</p>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(u)} className="flex items-center gap-1.5 hover:text-ink">
                      {u.email}
                      <Pencil size={12} className="text-ink/30" />
                    </button>
                  )}
                </td>
                <td className="px-5 py-4 text-ink/70">{roleLabels[u.role]}</td>
                <td className="px-5 py-4 text-ink/40">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                </td>
                <td className="px-5 py-4">
                  <button onClick={() => remove(u.id)} className="text-ink/50 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

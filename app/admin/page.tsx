"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Stats = {
  totalUsers: number;
  totalLeads: number;
  statuses: Array<{ status: string; count: number }>;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<Array<{ _id: string; name: string; phone: string; role: string }>>([]);
  const [leads, setLeads] = useState<Array<{ _id: string; name: string; phone: string; status: string; userId: string }>>([]);
  const [version, setVersion] = useState({
    latestVersion: "",
    minRequiredVersion: "",
    message: "",
    defaultUrl: "",
    androidUrl: "",
    iosUrl: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("adminToken") || "";
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("/api/admin/stats", { headers }).then((r) => r.json()),
      fetch("/api/admin/users", { headers }).then((r) => r.json()),
      fetch("/api/admin/leads", { headers }).then((r) => r.json()),
      fetch("/api/admin/app-version", { headers }).then((r) => r.json()),
    ]).then(([s, u, l, v]) => {
      if (s?.success) setStats(s.stats);
      if (u?.success) setUsers(u.users || []);
      if (l?.success) setLeads(l.leads || []);
      if (v?.success && v.config) {
        setVersion({
          latestVersion: v.config.latestVersion || "",
          minRequiredVersion: v.config.minRequiredVersion || "",
          message: v.config.message || "",
          defaultUrl: v.config.defaultUrl || "",
          androidUrl: v.config.androidUrl || "",
          iosUrl: v.config.iosUrl || "",
        });
      }
    });
  }, [router]);

  const leadsByUser = useMemo(() => {
    const map = new Map<string, number>();
    leads.forEach((l) => map.set(l.userId, (map.get(l.userId) || 0) + 1));
    return map;
  }, [leads]);

  async function saveVersion() {
    const token = localStorage.getItem("adminToken") || "";
    if (!token) return;
    await fetch("/api/admin/app-version", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(version),
    });
    alert("Version settings saved");
  }

  function logout() {
    localStorage.removeItem("adminToken");
    router.replace("/admin/login");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
          <h1 className="text-xl font-bold">Master CRM Admin Panel</h1>
          <button className="rounded-md bg-rose-500 px-3 py-2 text-sm font-semibold text-white" onClick={logout}>
            Logout
          </button>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
            <p className="text-sm text-slate-300">Total Users</p>
            <p className="mt-2 text-3xl font-bold">{stats?.totalUsers || 0}</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
            <p className="text-sm text-slate-300">Total Contacts</p>
            <p className="mt-2 text-3xl font-bold">{stats?.totalLeads || 0}</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
            <p className="text-sm text-slate-300">Lead Status</p>
            <div className="mt-2 space-y-1 text-sm">
              {(stats?.statuses || []).slice(0, 4).map((s) => (
                <p key={s.status}>
                  {s.status}: <span className="font-semibold">{s.count}</span>
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
          <h2 className="text-lg font-semibold">Force Update Popup Control</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input className="rounded-md bg-black/20 px-3 py-2" placeholder="Latest version" value={version.latestVersion} onChange={(e) => setVersion((p) => ({ ...p, latestVersion: e.target.value }))} />
            <input className="rounded-md bg-black/20 px-3 py-2" placeholder="Minimum required version" value={version.minRequiredVersion} onChange={(e) => setVersion((p) => ({ ...p, minRequiredVersion: e.target.value }))} />
            <input className="rounded-md bg-black/20 px-3 py-2 md:col-span-2" placeholder="Popup message" value={version.message} onChange={(e) => setVersion((p) => ({ ...p, message: e.target.value }))} />
            <input className="rounded-md bg-black/20 px-3 py-2" placeholder="Android update URL" value={version.androidUrl} onChange={(e) => setVersion((p) => ({ ...p, androidUrl: e.target.value }))} />
            <input className="rounded-md bg-black/20 px-3 py-2" placeholder="iOS update URL" value={version.iosUrl} onChange={(e) => setVersion((p) => ({ ...p, iosUrl: e.target.value }))} />
            <input className="rounded-md bg-black/20 px-3 py-2 md:col-span-2" placeholder="Default update URL (fallback)" value={version.defaultUrl} onChange={(e) => setVersion((p) => ({ ...p, defaultUrl: e.target.value }))} />
          </div>
          <button className="mt-3 rounded-md bg-cyan-500 px-4 py-2 font-semibold text-slate-950" onClick={saveVersion}>
            Save Version Settings
          </button>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
            <h2 className="text-lg font-semibold">App Users</h2>
            <div className="mt-3 max-h-[360px] overflow-auto">
              {users.map((u) => (
                <div key={u._id} className="mb-2 rounded-md bg-black/20 p-3 text-sm">
                  <p className="font-medium">{u.name || "Unnamed User"}</p>
                  <p>{u.phone}</p>
                  <p>Role: {u.role} | Contacts: {leadsByUser.get(u._id) || 0}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
            <h2 className="text-lg font-semibold">Recent Contacts</h2>
            <div className="mt-3 max-h-[360px] overflow-auto">
              {leads.slice(0, 120).map((l) => (
                <div key={l._id} className="mb-2 rounded-md bg-black/20 p-3 text-sm">
                  <p className="font-medium">{l.name || "Unnamed Contact"}</p>
                  <p>{l.phone || "-"}</p>
                  <p>Status: {l.status || "New"}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

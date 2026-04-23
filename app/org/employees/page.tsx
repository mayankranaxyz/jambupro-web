"use client";

import { useEffect, useMemo, useState } from "react";

type Employee = {
  _id: string;
  phone: string;
  name: string;
  email: string;
  userType: string;
  organizationId: string;
  companyName: string;
  city: string;
  state: string;
  address: string;
  pincode: string;
  country: string;
  altPhone: string;
  disabled: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
  employeeStatus: string;
  leadStats?: {
    total: number;
    statuses: Record<string, number>;
    recent: Array<{
      clientId: unknown;
      name: unknown;
      phone: unknown;
      property: unknown;
      status: unknown;
      createdAt: unknown;
    }>;
  };
};

export default function OrgEmployeesReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [org, setOrg] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leadSummary, setLeadSummary] = useState<{
    total: number;
    unassigned: { total: number; statuses: Record<string, number> };
  } | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<Employee | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    setLoading(true);
    setError("");
    fetch("/api/org/employees", { headers })
      .then((r) => r.json())
      .then((data) => {
        if (!data?.success) throw new Error(data?.message || "Failed to load");
        setOrg(data.organization || null);
        setLeadSummary(data.leads || null);
        setEmployees(data.employees || []);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return employees.filter((e) => {
      if (status !== "all" && e.employeeStatus !== status) return false;
      if (!query) return true;
      const hay = [
        e.name,
        e.phone,
        e.email,
        e.city,
        e.state,
        e.companyName,
        e.employeeStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [employees, q, status]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    employees.forEach((e) => map.set(e.employeeStatus, (map.get(e.employeeStatus) || 0) + 1));
    return map;
  }, [employees]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">Employees Report</h1>
              <p className="mt-1 text-sm text-slate-300">
                {org?.name ? (
                  <>
                    Organization: <span className="font-semibold text-white">{org.name}</span>{" "}
                    <span className="text-slate-400">({org.phone || "-"})</span>
                  </>
                ) : (
                  <span className="text-slate-400">Organization context not loaded yet.</span>
                )}
              </p>
              {leadSummary ? (
                <p className="mt-1 text-xs text-slate-400">
                  Org leads: <span className="text-slate-200 font-semibold">{leadSummary.total}</span> • Unassigned:{" "}
                  <span className="text-slate-200 font-semibold">{leadSummary.unassigned?.total || 0}</span>
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name/phone/email/city/status…"
                className="w-[280px] max-w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-cyan-400/60"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-400/60"
              >
                <option value="all">All statuses ({employees.length})</option>
                <option value="active">Active ({counts.get("active") || 0})</option>
                <option value="never_logged_in">Never logged in ({counts.get("never_logged_in") || 0})</option>
                <option value="incomplete_profile">Incomplete profile ({counts.get("incomplete_profile") || 0})</option>
                <option value="disabled">Disabled ({counts.get("disabled") || 0})</option>
              </select>
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
            {error}
            <div className="mt-2 text-xs text-rose-200/90">
              Tip: token missing/expired ho sakta hai. `localStorage.token` set karke reload karein.
            </div>
          </div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Employees</h2>
              <p className="text-sm text-slate-300">
                {loading ? "Loading…" : `${filtered.length} of ${employees.length}`}
              </p>
            </div>

            <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
              <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr_0.7fr] gap-2 bg-black/30 px-3 py-2 text-xs font-semibold text-slate-200">
                <div>Name</div>
                <div>Phone / Email</div>
                <div>Location</div>
                <div>Status</div>
              </div>
              <div className="max-h-[560px] overflow-auto">
                {!loading && filtered.length === 0 ? (
                  <div className="px-3 py-10 text-center text-sm text-slate-300">No employees found.</div>
                ) : null}
                {filtered.map((e) => (
                  <button
                    key={e._id}
                    onClick={() => setSelected(e)}
                    className="grid w-full grid-cols-[1.2fr_0.9fr_0.9fr_0.7fr] gap-2 border-t border-white/10 px-3 py-3 text-left text-sm hover:bg-white/5"
                  >
                    <div>
                      <p className="font-medium">{e.name || "Unnamed"}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Joined: {e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "-"}
                      </p>
                      <p className="mt-1 text-xs text-slate-300">
                        Leads: <span className="font-semibold text-white">{e.leadStats?.total || 0}</span>
                      </p>
                    </div>
                    <div className="text-slate-200">
                      <p>{e.phone || "-"}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{e.email || "-"}</p>
                    </div>
                    <div className="text-slate-200">
                      <p className="truncate">{[e.city, e.state].filter(Boolean).join(", ") || "-"}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{e.address || "-"}</p>
                    </div>
                    <div>
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
                          e.employeeStatus === "active"
                            ? "bg-emerald-500/15 text-emerald-200"
                            : e.employeeStatus === "disabled"
                              ? "bg-rose-500/15 text-rose-200"
                              : e.employeeStatus === "never_logged_in"
                                ? "bg-amber-500/15 text-amber-200"
                                : "bg-slate-500/15 text-slate-200",
                        ].join(" ")}
                      >
                        {e.employeeStatus}
                      </span>
                      <p className="mt-1 text-xs text-slate-400">
                        Last login: {e.lastLoginAt ? new Date(e.lastLoginAt).toLocaleString() : "-"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
            <h2 className="text-lg font-semibold">Employee details</h2>
            {!selected ? (
              <p className="mt-3 text-sm text-slate-300">Select an employee to view full report.</p>
            ) : (
              <div className="mt-3 space-y-3 text-sm">
                <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                  <p className="text-xs font-semibold text-slate-300">Basic</p>
                  <div className="mt-2 grid gap-1">
                    <p>
                      <span className="text-slate-400">Name:</span> {selected.name || "-"}
                    </p>
                    <p>
                      <span className="text-slate-400">Phone:</span> {selected.phone || "-"}
                    </p>
                    <p>
                      <span className="text-slate-400">Alt phone:</span> {selected.altPhone || "-"}
                    </p>
                    <p className="break-words">
                      <span className="text-slate-400">Email:</span> {selected.email || "-"}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                  <p className="text-xs font-semibold text-slate-300">Status</p>
                  <div className="mt-2 grid gap-1">
                    <p>
                      <span className="text-slate-400">Employee status:</span> {selected.employeeStatus}
                    </p>
                    <p>
                      <span className="text-slate-400">Disabled:</span> {selected.disabled ? "Yes" : "No"}
                    </p>
                    <p>
                      <span className="text-slate-400">Last login:</span>{" "}
                      {selected.lastLoginAt ? new Date(selected.lastLoginAt).toLocaleString() : "-"}
                    </p>
                    <p>
                      <span className="text-slate-400">Created:</span>{" "}
                      {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "-"}
                    </p>
                    <p>
                      <span className="text-slate-400">Updated:</span>{" "}
                      {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : "-"}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                  <p className="text-xs font-semibold text-slate-300">Leads summary</p>
                  <div className="mt-2 grid gap-1">
                    <p>
                      <span className="text-slate-400">Assigned leads:</span>{" "}
                      {selected.leadStats?.total || 0}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {Object.entries(selected.leadStats?.statuses || {}).length
                        ? Object.entries(selected.leadStats?.statuses || {})
                            .slice(0, 6)
                            .map(([k, v]) => `${k}:${v}`)
                            .join(" • ")
                        : "No status data"}
                    </p>
                  </div>
                </div>

                {selected.leadStats?.recent?.length ? (
                  <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                    <p className="text-xs font-semibold text-slate-300">Recent assigned leads</p>
                    <div className="mt-2 space-y-2 max-h-[220px] overflow-auto">
                      {selected.leadStats.recent.map((l, idx) => (
                        <div key={idx} className="rounded-md border border-white/10 bg-black/20 p-2">
                          <p className="text-sm font-semibold text-slate-100">
                            {String(l.name || "Unnamed")}{" "}
                            <span className="text-xs font-medium text-slate-400">
                              ({String(l.phone || "-")})
                            </span>
                          </p>
                          <p className="text-xs text-slate-300">
                            {String(l.property || "-")}
                          </p>
                          <p className="text-xs text-slate-400">
                            Status: <span className="text-slate-200">{String(l.status || "New")}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                  <p className="text-xs font-semibold text-slate-300">Address</p>
                  <div className="mt-2 grid gap-1">
                    <p className="break-words">
                      <span className="text-slate-400">Address:</span> {selected.address || "-"}
                    </p>
                    <p>
                      <span className="text-slate-400">City:</span> {selected.city || "-"}
                    </p>
                    <p>
                      <span className="text-slate-400">State:</span> {selected.state || "-"}
                    </p>
                    <p>
                      <span className="text-slate-400">Pincode:</span> {selected.pincode || "-"}
                    </p>
                    <p>
                      <span className="text-slate-400">Country:</span> {selected.country || "-"}
                    </p>
                  </div>
                </div>

                {selected.notes ? (
                  <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                    <p className="text-xs font-semibold text-slate-300">Internal notes</p>
                    <p className="mt-2 whitespace-pre-wrap text-slate-200">{selected.notes}</p>
                  </div>
                ) : null}

                <button
                  onClick={() => setSelected(null)}
                  className="w-full rounded-md bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
                >
                  Clear selection
                </button>
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}


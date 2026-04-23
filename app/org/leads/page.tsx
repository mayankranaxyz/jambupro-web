"use client";

import { useEffect, useMemo, useState } from "react";

type Person = { id: string; name: string; phone: string; userType: string };
type LeadRow = {
  clientId: unknown;
  name: string;
  phone: string;
  property: string;
  status: string;
  notes: string;
  followUp: string;
  createdAt: number;
  assignedTo: Person | null;
  lastStatusUpdatedAt: string;
  lastStatusUpdatedBy: Person | null;
};

export default function OrgLeadsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [employees, setEmployees] = useState<Person[]>([]);
  const [q, setQ] = useState("");
  const [assignee, setAssignee] = useState<string>("all"); // all | unassigned | employeeId
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkAssignee, setBulkAssignee] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const token = localStorage.getItem("token") || "";
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    setLoading(true);
    setError("");
    try {
      const [l, e] = await Promise.all([
        fetch("/api/org/leads", { headers }).then((r) => r.json()),
        fetch("/api/org/employees", { headers }).then((r) => r.json()),
      ]);
      if (!l?.success) throw new Error(l?.message || "Failed to load leads");
      if (!e?.success) throw new Error(e?.message || "Failed to load employees");
      setLeads(Array.isArray(l.leads) ? l.leads : []);
      setEmployees(
        Array.isArray(e.employees)
          ? e.employees.map((x: any) => ({
              id: String(x._id),
              name: String(x.name || ""),
              phone: String(x.phone || ""),
              userType: String(x.userType || ""),
            }))
          : []
      );
      setSelected({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (assignee === "unassigned" && l.assignedTo) return false;
      if (assignee !== "all" && assignee !== "unassigned") {
        if (!l.assignedTo || l.assignedTo.id !== assignee) return false;
      }
      if (!query) return true;
      const hay = [l.name, l.phone, l.property, l.status, l.assignedTo?.name, l.assignedTo?.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [leads, q, assignee]);

  const selectedIds = useMemo(() => {
    return Object.keys(selected).filter((k) => selected[k]);
  }, [selected]);

  async function assignOne(clientId: unknown, assigneeUserId: string) {
    const token = localStorage.getItem("token") || "";
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
    await fetch("/api/org/leads/assign", {
      method: "POST",
      headers,
      body: JSON.stringify({ clientId, assigneeUserId }),
    }).then((r) => r.json());
  }

  async function bulkTransfer() {
    if (selectedIds.length === 0) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token") || "";
      const headers: Record<string, string> = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };

      const clientIds = filtered
        .filter((l) => selected[String(l.clientId)])
        .map((l) => l.clientId);

      const res = await fetch("/api/org/leads/assign", {
        method: "POST",
        headers,
        body: JSON.stringify({ clientIds, assigneeUserId: bulkAssignee }),
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.message || "Transfer failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transfer failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">Organization Leads</h1>
              <p className="mt-1 text-sm text-slate-300">
                Assign/transfer leads between employees. Selected:{" "}
                <span className="font-semibold text-white">{selectedIds.length}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name/phone/property/status/assignee…"
                className="w-[320px] max-w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-cyan-400/60"
              />
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-400/60"
              >
                <option value="all">All</option>
                <option value="unassigned">Unassigned</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name || e.phone || e.id}
                  </option>
                ))}
              </select>
              <button
                onClick={load}
                className="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
              >
                Refresh
              </button>
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <section className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Bulk transfer</h2>
              <p className="text-xs text-slate-300">
                Select multiple leads then transfer to an employee (or Unassign).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={bulkAssignee}
                onChange={(e) => setBulkAssignee(e.target.value)}
                className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-400/60"
              >
                <option value="">Choose employee…</option>
                <option value="">Unassign (no owner)</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name || e.phone || e.id}
                  </option>
                ))}
              </select>
              <button
                disabled={saving || selectedIds.length === 0}
                onClick={bulkTransfer}
                className="rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
              >
                {saving ? "Transferring…" : "Transfer selected"}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/15 bg-white/10 p-0 backdrop-blur-md overflow-hidden">
          <div className="grid grid-cols-[40px_1.2fr_0.8fr_0.8fr_0.7fr_0.9fr] gap-2 bg-black/30 px-3 py-2 text-xs font-semibold text-slate-200">
            <div />
            <div>Lead</div>
            <div>Property</div>
            <div>Status</div>
            <div>Assignee</div>
            <div>Last status update</div>
          </div>
          <div className="max-h-[640px] overflow-auto">
            {loading ? (
              <div className="px-3 py-10 text-center text-sm text-slate-300">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-10 text-center text-sm text-slate-300">No leads found.</div>
            ) : (
              filtered.map((l) => {
                const key = String(l.clientId);
                return (
                  <div
                    key={key}
                    className="grid grid-cols-[40px_1.2fr_0.8fr_0.8fr_0.7fr_0.9fr] gap-2 border-t border-white/10 px-3 py-3 text-sm"
                  >
                    <div className="flex items-start pt-1">
                      <input
                        type="checkbox"
                        checked={Boolean(selected[key])}
                        onChange={(e) => setSelected((p) => ({ ...p, [key]: e.target.checked }))}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{l.name || "Unnamed"}</p>
                      <p className="text-xs text-slate-400">{l.phone || "-"}</p>
                    </div>
                    <div className="text-slate-200">{l.property || "-"}</div>
                    <div className="text-slate-200">{l.status || "New"}</div>
                    <div>
                      <select
                        className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-2 text-xs outline-none focus:border-cyan-400/60"
                        value={l.assignedTo?.id || ""}
                        onChange={async (e) => {
                          const to = e.target.value; // "" => unassign
                          setSaving(true);
                          try {
                            await assignOne(l.clientId, to);
                            await load();
                          } finally {
                            setSaving(false);
                          }
                        }}
                      >
                        <option value="">Unassigned</option>
                        {employees.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name || e.phone || e.id}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {l.assignedTo ? l.assignedTo.name || l.assignedTo.phone : "—"}
                      </p>
                    </div>
                    <div className="text-xs text-slate-300">
                      {l.lastStatusUpdatedBy ? (
                        <>
                          <p className="font-semibold text-slate-100">
                            {l.lastStatusUpdatedBy.name || l.lastStatusUpdatedBy.phone}
                          </p>
                          <p className="text-slate-400">
                            {l.lastStatusUpdatedAt ? new Date(l.lastStatusUpdatedAt).toLocaleString() : "-"}
                          </p>
                        </>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}


"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "@/components/ThemeContext";
import { SageCreamOneUIBackground } from "@/components/SageCreamOneUIBackground";
import { MousePointerAura } from "@/components/MousePointerAura";
import {
  AdminStats,
  CandidateWithTask,
  DailyTask,
  AuditLog,
  CandidateSafe,
} from "@/lib/types";
import { getTodayDateString, formatKolkataDateTime, formatKolkataTime } from "@/lib/timezone";
import {
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Upload,
  UserPlus,
  Search,
  Filter,
  Calendar,
  KeyRound,
  RotateCcw,
  ShieldAlert,
  ArrowUpDown,
  X,
  FileText,
  Activity,
  History,
  Check,
  AlertCircle,
  Eye,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();

  // Authentication & Stats
  const [currentUser, setCurrentUser] = useState<CandidateSafe | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Filters & Table Data
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [candidates, setCandidates] = useState<CandidateWithTask[]>([]);
  const [totalCandidatesCount, setTotalCandidatesCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [sortBy, setSortBy] = useState<"admission_no" | "name" | "today_count" | "status">("admission_no");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isLoadingTable, setIsLoadingTable] = useState(true);

  // Modals & Panels
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [historyCandidate, setHistoryCandidate] = useState<{ candidate: any; history: DailyTask[] } | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<{ name: string; admission: string; tempPass: string } | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[] | null>(null);
  const [activeTab, setActiveTab] = useState<"candidates" | "audit">("candidates");

  // Verify Admin Access
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (data.user?.role !== "admin") {
          router.push("/");
          return;
        }
        setCurrentUser(data.user);
      } catch {
        router.push("/login");
      }
    }
    checkAuth();
  }, [router]);

  // Load Admin Stats for Selected Date
  const loadStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch(`/api/admin/stats?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [selectedDate]);

  // Load Candidate Records
  const loadCandidates = useCallback(async () => {
    setIsLoadingTable(true);
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        status: statusFilter,
        search: searchTerm,
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/admin/candidates?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates);
        setTotalCandidatesCount(data.total);
      }
    } catch (err) {
      console.error("Failed to load candidates:", err);
    } finally {
      setIsLoadingTable(false);
    }
  }, [selectedDate, statusFilter, searchTerm, page, limit, sortBy, sortOrder]);

  // Load Audit Logs
  const loadAuditLogs = async () => {
    try {
      const res = await fetch("/api/admin/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    }
  };

  useEffect(() => {
    loadStats();
    loadCandidates();
  }, [loadStats, loadCandidates]);

  // View Candidate History
  const handleViewHistory = async (candidateId: string) => {
    try {
      const res = await fetch(`/api/admin/candidate-history/${candidateId}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryCandidate(data);
      }
    } catch (err) {
      console.error("Failed to load candidate history:", err);
    }
  };

  // Reset Candidate Password
  const handleResetPassword = async (candidate: CandidateWithTask) => {
    if (!confirm(`Reset password for ${candidate.admission_no} (${candidate.name})?`)) return;

    try {
      const res = await fetch(`/api/admin/candidates/${candidate.id}/reset-password`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetPasswordResult({
          name: candidate.name,
          admission: candidate.admission_no,
          tempPass: data.temporaryPassword,
        });
      }
    } catch (err) {
      alert("Failed to reset password.");
    }
  };

  // Toggle Candidate Active/Disabled Status
  const handleToggleActive = async (candidate: CandidateWithTask) => {
    const nextStatus = !candidate.is_active;
    const msg = nextStatus
      ? `Re-activate ${candidate.admission_no}?`
      : `Disable account for ${candidate.admission_no}? They won't be able to log in.`;

    if (!confirm(msg)) return;

    try {
      const res = await fetch(`/api/admin/candidates/${candidate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextStatus }),
      });
      if (res.ok) {
        loadCandidates();
        loadStats();
      }
    } catch {
      alert("Failed to update candidate status.");
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const params = new URLSearchParams({
      date: selectedDate,
      status: statusFilter,
      search: searchTerm,
    });
    window.open(`/api/admin/export?${params.toString()}`, "_blank");
  };

  const totalPages = Math.ceil(totalCandidatesCount / limit);

  return (
    <ThemeProvider>
      <div className="min-h-screen relative text-forest pb-16 selection:bg-[#E9EDC9]/60">
        <SageCreamOneUIBackground />
        <MousePointerAura />
        {/* Admin Navigation Bar */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-emerald-900/10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white p-1.5 border border-emerald-900/20 flex items-center justify-center shadow overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Swalath Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-forest tracking-tight flex items-center gap-2">
                  <span>SIBAQ ADMIN PORTAL</span>
                  <span className="text-[10px] bg-gold/20 text-forest px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Convenor Panel
                  </span>
                </h1>
                <p className="text-xs text-emerald-800">
                  Real-time Nariath Swalath tracking &amp; candidate management
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-white text-xs font-semibold text-emerald-900 hover:bg-emerald-50 transition-colors"
              >
                Candidate View 📿
              </Link>
              <button
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  router.push("/login");
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
          {/* Top Bar: Date Selector & Quick Actions */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/80 backdrop-blur p-4 rounded-3xl border border-emerald-500/15 shadow-sm">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-emerald-700" />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">
                  Task Date (Asia/Kerala)
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs font-bold text-forest bg-emerald-50/70 border border-emerald-300/80 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsAddCandidateOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Candidate</span>
              </button>

              <button
                onClick={() => setIsCsvModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-forest hover:bg-forest/90 text-ivory text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Import CSV (151)</span>
              </button>

              <button
                onClick={handleExportCsv}
                className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export Report (CSV)</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab(activeTab === "candidates" ? "audit" : "candidates");
                  if (activeTab === "candidates" && !auditLogs) loadAuditLogs();
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all ${
                  activeTab === "audit"
                    ? "bg-gold text-forest font-bold"
                    : "bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>{activeTab === "audit" ? "View Candidates" : "Audit Logs"}</span>
              </button>
            </div>
          </div>

          {/* Statistics Cards (Section 13) */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4">
            {/* Total Candidates */}
            <div className="bg-white/90 rounded-2xl p-4 border border-emerald-500/15 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Total Candidates
                </span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-forest">
                {stats?.totalCandidates ?? "..."}
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">151 target seats</span>
            </div>

            {/* Completed Today */}
            <div className="bg-white/90 rounded-2xl p-4 border border-emerald-500/20 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Completed (33)
                </span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700">
                {stats?.completedToday ?? "..."}
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">Full daily task</span>
            </div>

            {/* In Progress */}
            <div className="bg-white/90 rounded-2xl p-4 border border-emerald-500/15 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  In Progress
                </span>
                <Clock className="w-4 h-4 text-gold-dark" />
              </div>
              <div className="text-2xl font-black text-amber-600">
                {stats?.inProgressToday ?? "..."}
              </div>
              <span className="text-[10px] text-gray-500 font-medium">1 to 32 recitations</span>
            </div>

            {/* Not Started */}
            <div className="bg-white/90 rounded-2xl p-4 border border-emerald-500/15 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Not Started
                </span>
                <AlertTriangle className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-black text-gray-600">
                {stats?.notStartedToday ?? "..."}
              </div>
              <span className="text-[10px] text-gray-500 font-medium">0 recitations</span>
            </div>

            {/* Incomplete Total */}
            <div className="bg-white/90 rounded-2xl p-4 border border-emerald-500/15 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Incomplete
                </span>
                <span className="text-xs">😢</span>
              </div>
              <div className="text-2xl font-black text-rose-600">
                {stats?.incompleteToday ?? "..."}
              </div>
              <span className="text-[10px] text-rose-500 font-medium">Awaiting 33/33</span>
            </div>

            {/* Completion Percentage */}
            <div className="bg-white/90 rounded-2xl p-4 border border-emerald-500/15 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Completion Rate
                </span>
                <span className="text-xs font-bold text-emerald-700">%</span>
              </div>
              <div className="text-2xl font-black text-emerald-800">
                {stats?.completionPercentage ?? "0"}%
              </div>
              {/* Progress bar */}
              <div className="w-full bg-emerald-100 rounded-full h-1.5 mt-1 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.completionPercentage || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* VIEW: AUDIT LOGS */}
          {activeTab === "audit" && (
            <div className="bg-white/90 rounded-3xl p-6 border border-emerald-500/15 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-forest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Administrative Audit Logs
                </h3>
                <button
                  onClick={loadAuditLogs}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
                >
                  Refresh Logs
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-emerald-50/70 border-b border-emerald-200 text-emerald-900">
                    <tr>
                      <th className="p-3">Timestamp (IST)</th>
                      <th className="p-3">Actor</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Target</th>
                      <th className="p-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    {auditLogs && auditLogs.length > 0 ? (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-emerald-50/30">
                          <td className="p-3 font-mono text-[11px] text-gray-600">
                            {formatKolkataDateTime(log.created_at)}
                          </td>
                          <td className="p-3 font-semibold text-emerald-950">
                            {log.actor_name || log.actor_id}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px]">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3 text-gray-700 font-mono text-[11px]">
                            {log.target_type}:{log.target_id}
                          </td>
                          <td className="p-3 text-gray-600">{log.details || "—"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-gray-500">
                          No audit logs recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: CANDIDATE TABLE (Section 13) */}
          {activeTab === "candidates" && (
            <div className="bg-white/90 rounded-3xl p-6 border border-emerald-500/15 shadow-sm space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-emerald-700/60 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search by admission number (e.g. 1070), chest no (e.g. C1064), or student name..."
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-emerald-300/80 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Status Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  {[
                    { id: "all", label: "All Candidates" },
                    { id: "completed", label: "Completed (33)" },
                    { id: "in_progress", label: "In Progress" },
                    { id: "not_started", label: "Not Started (0)" },
                    { id: "incomplete", label: "All Incomplete" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setStatusFilter(f.id);
                        setPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                        statusFilter === f.id
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-emerald-500/15">
                <table className="w-full text-xs text-left">
                  <thead className="bg-emerald-50/70 border-b border-emerald-200 text-emerald-950 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th
                        className="p-3 cursor-pointer hover:bg-emerald-100/60"
                        onClick={() => {
                          setSortBy("admission_no");
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        }}
                      >
                        <span className="flex items-center gap-1">
                          Admission No
                          <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </th>
                      <th
                        className="p-3 cursor-pointer hover:bg-emerald-100/60"
                        onClick={() => {
                          setSortBy("name");
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        }}
                      >
                        <span className="flex items-center gap-1">
                          Candidate Name
                          <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </th>
                      <th
                        className="p-3 cursor-pointer hover:bg-emerald-100/60 text-center"
                        onClick={() => {
                          setSortBy("today_count");
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        }}
                      >
                        <span className="inline-flex items-center justify-center gap-1">
                          Today&apos;s Count
                          <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3">Last Recitation</th>
                      <th className="p-3">Completion Time</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100 bg-white">
                    {isLoadingTable ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-emerald-800">
                          Loading candidate records...
                        </td>
                      </tr>
                    ) : candidates.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500">
                          No candidates found matching filter criteria.
                        </td>
                      </tr>
                    ) : (
                      candidates.map((c) => {
                        const isDone = c.today_count >= 33;
                        return (
                          <tr
                            key={c.id}
                            className={`hover:bg-emerald-50/40 transition-colors ${
                              !c.is_active ? "opacity-50 bg-gray-50" : ""
                            }`}
                          >
                            {/* Admission Number & Chest No */}
                            <td className="p-3 font-mono font-bold text-forest">
                              <div className="flex items-center gap-1.5">
                                <span>{c.admission_no}</span>
                                {c.chest_no && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold font-mono">
                                    {c.chest_no}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Candidate Name & Class */}
                            <td className="p-3 font-semibold text-emerald-950">
                              <div>{c.name}</div>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-normal mt-0.5">
                                {c.class_name && (
                                  <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-semibold">
                                    Class: {c.class_name}
                                  </span>
                                )}
                                {c.phone && <span>{c.phone}</span>}
                              </div>
                            </td>

                            {/* Today's Count */}
                            <td className="p-3 text-center">
                              <span
                                className={`inline-block font-mono font-bold px-2.5 py-1 rounded-full text-xs ${
                                  isDone
                                    ? "bg-emerald-100 text-emerald-800"
                                    : c.today_count > 0
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {c.today_count} / {c.target_count}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="p-3 text-center">
                              {isDone ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-sm">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>Completed</span>
                                </span>
                              ) : c.today_count > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white">
                                  <span>In Progress</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                                  <span>Not Started</span>
                                </span>
                              )}
                            </td>

                            {/* Last Recitation */}
                            <td className="p-3 text-[11px] text-gray-600 font-mono">
                              {formatKolkataTime(c.last_activity)}
                            </td>

                            {/* Completion Time */}
                            <td className="p-3 text-[11px] font-mono">
                              {c.completed_at ? (
                                <span className="text-emerald-700 font-semibold">
                                  {formatKolkataTime(c.completed_at)}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="p-3 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                {/* View History */}
                                <button
                                  onClick={() => handleViewHistory(c.id)}
                                  className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-800 transition-colors"
                                  title="View Task History"
                                >
                                  <History className="w-4 h-4" />
                                </button>

                                {/* Reset Password */}
                                <button
                                  onClick={() => handleResetPassword(c)}
                                  className="p-1.5 rounded-lg hover:bg-gold/20 text-forest transition-colors"
                                  title="Reset Password"
                                >
                                  <KeyRound className="w-4 h-4" />
                                </button>

                                {/* Toggle Active/Disabled */}
                                <button
                                  onClick={() => handleToggleActive(c)}
                                  className={`p-1.5 rounded-lg transition-colors text-xs font-semibold ${
                                    c.is_active
                                      ? "text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                                      : "text-emerald-600 hover:bg-emerald-50"
                                  }`}
                                  title={c.is_active ? "Disable Account" : "Activate Account"}
                                >
                                  {c.is_active ? "Disable" : "Enable"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-2 text-xs text-emerald-900">
                <span>
                  Showing {candidates.length} of {totalCandidatesCount} registered candidates
                </span>

                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 rounded-lg border border-emerald-300 disabled:opacity-40 hover:bg-emerald-50 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="font-semibold">
                    Page {page} of {Math.max(1, totalPages)}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 rounded-lg border border-emerald-300 disabled:opacity-40 hover:bg-emerald-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* MODAL: IMPORT CSV */}
        {isCsvModalOpen && (
          <CsvImportModal
            isOpen={isCsvModalOpen}
            onClose={() => setIsCsvModalOpen(false)}
            onSuccess={() => {
              setIsCsvModalOpen(false);
              loadCandidates();
              loadStats();
            }}
          />
        )}

        {/* MODAL: ADD CANDIDATE */}
        {isAddCandidateOpen && (
          <AddCandidateModal
            isOpen={isAddCandidateOpen}
            onClose={() => setIsAddCandidateOpen(false)}
            onSuccess={() => {
              setIsAddCandidateOpen(false);
              loadCandidates();
              loadStats();
            }}
          />
        )}

        {/* MODAL: CANDIDATE HISTORY */}
        {historyCandidate && (
          <CandidateHistoryModal
            data={historyCandidate}
            onClose={() => setHistoryCandidate(null)}
          />
        )}

        {/* MODAL: PASSWORD RESET SUCCESS */}
        {resetPasswordResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-emerald-500/20">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-forest mb-1">
                Password Reset Successfully
              </h3>
              <p className="text-xs text-emerald-800 mb-4">
                Password for <strong>{resetPasswordResult.admission}</strong> ({resetPasswordResult.name}) has been set to:
              </p>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl font-mono text-sm font-bold text-forest select-all mb-5">
                {resetPasswordResult.tempPass}
              </div>

              <button
                onClick={() => setResetPasswordResult(null)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

// Subcomponent: CSV Import Modal
function CsvImportModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [csvContent, setCsvContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSampleDownload = () => {
    const sample = `admission_no,name,password,phone,email\r\nSBQ-2001,Ahmad Bilal,Sibaq@Candidate2026!,+91 98470 20001,sbq2001@sibaq.edu\r\nSBQ-2002,Zayan Shareef,Sibaq@Candidate2026!,+91 98470 20002,sbq2002@sibaq.edu`;
    const blob = new Blob([sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sibaq_candidates_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setCsvContent(String(evt.target?.result || ""));
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!csvContent.trim()) {
      setError("Please paste CSV data or select a file.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData: csvContent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "CSV Import failed.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error while importing candidates.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-emerald-500/20 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="text-base font-bold text-forest flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-600" />
            Import Sibaq Candidates (CSV)
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 pt-4">
          <p className="text-xs text-emerald-800 leading-relaxed">
            Upload or paste CSV with columns: <strong>admission_no</strong>, <strong>name</strong>, and optional <strong>password</strong>, <strong>phone</strong>, <strong>email</strong>.
          </p>

          <div className="flex items-center justify-between">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            <button
              type="button"
              onClick={handleSampleDownload}
              className="text-xs text-emerald-700 hover:underline font-semibold"
            >
              Download Sample CSV
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              rows={6}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="admission_no,name,password,phone,email&#10;SBQ-1152,Ameen Farooq,Sibaq@Candidate2026!,+91 98470 12345,ameen@sibaq.edu"
              className="w-full text-xs font-mono p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1 text-emerald-700">
                  <Check className="w-4 h-4" />
                  <span>Import Finished!</span>
                </div>
                <div>Imported: {result.imported} candidates</div>
                <div>Skipped: {result.skipped} rows</div>
                {result.errors?.length > 0 && (
                  <div className="text-[11px] text-amber-700 mt-1">
                    Warnings: {result.errors.join("; ")}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow disabled:opacity-60 transition-colors"
              >
                {isSubmitting ? "Importing Candidates..." : "Run CSV Import"}
              </button>
              {result && (
                <button
                  type="button"
                  onClick={onSuccess}
                  className="px-4 py-2.5 rounded-xl bg-forest text-ivory text-xs font-semibold"
                >
                  Close &amp; Refresh
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Subcomponent: Add Candidate Modal
function AddCandidateModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [admissionNo, setAdmissionNo] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Sibaq@Candidate2026!");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!admissionNo.trim() || !name.trim()) {
      setError("Admission number and name are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admission_no: admissionNo.trim(),
          name: name.trim(),
          password,
          phone: phone.trim() || null,
          email: email.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add candidate.");
      } else {
        onSuccess();
      }
    } catch {
      setError("Network error while creating candidate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-emerald-500/20">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="text-base font-bold text-forest flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            Add Sibaq Candidate
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold uppercase text-emerald-900 block mb-1">
              Admission Number *
            </label>
            <input
              type="text"
              required
              value={admissionNo}
              onChange={(e) => setAdmissionNo(e.target.value.toUpperCase())}
              placeholder="e.g. SBQ-1152"
              className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-emerald-900 block mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ameen Rashid"
              className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-emerald-900 block mb-1">
              Initial Password
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs font-mono p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-emerald-900 block mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98460 00000"
              className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-emerald-900 block mb-1">
              Email (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="candidate@sibaq.edu"
              className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? "Creating..." : "Save Candidate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Subcomponent: Candidate History Modal
function CandidateHistoryModal({
  data,
  onClose,
}: {
  data: { candidate: any; history: DailyTask[] };
  onClose: () => void;
}) {
  const { candidate, history } = data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-emerald-500/20 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-forest">
              {candidate.name} ({candidate.admission_no})
            </h3>
            <p className="text-xs text-emerald-700">30-Day Swalath Task History</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="pt-4 space-y-2">
          {history.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">
              No historical tasks recorded yet.
            </p>
          ) : (
            history.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/40 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-forest font-mono">{t.task_date}</span>
                  <div className="text-[10px] text-gray-500">
                    {t.completed_at ? `Completed at ${formatKolkataTime(t.completed_at)}` : "Incomplete"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono font-bold px-2.5 py-0.5 rounded-full text-xs ${
                      t.completed_count >= 33
                        ? "bg-emerald-600 text-white"
                        : t.completed_count > 0
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {t.completed_count} / {t.target_count}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

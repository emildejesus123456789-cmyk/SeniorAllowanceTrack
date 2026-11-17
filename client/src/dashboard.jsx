import { useState, useEffect } from "react";
import axios from "axios";
import Beneficiaries from "./beneficiary";

const API_URL = "http://localhost:5000/api";

const formatPeso = (amount) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount || 0);

export default function Dashboard({ token, admin, onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [data, setData] = useState({
    kpis: {
      total_beneficiaries: 0,
      total_credited: 0,
      total_withdrawn: 0,
      total_unclaimed_balance: 0,
    },
    barangayBreakdown: [],
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to fetch dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchDashboard();
    }
  }, [token, activeTab]);

  const { kpis, barangayBreakdown, recentTransactions } = data;
  const payoutRate =
    kpis.total_credited > 0
      ? Math.round((kpis.total_withdrawn / kpis.total_credited) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-400 flex">
      {/* Sidebar with Municipal Logo & Brand */}
      <aside className="w-64 bg-gray-200 text-black flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <img
            className="w-8 h-8 rounded-full object-cover bg-white p-0.5 shrink-0"
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGnAWmZ3UbJ_B2F0JEFklx7tjEDM74VL9xBFERwIHHupCzWp_FcYa8Cmc&s=10"
            alt="Municipality of Obando Logo"
          />
          <div>
            <h2 className="text-sm font-bold tracking-tight leading-snug">
              SeniorAllowanceTrack
            </h2>
            <p className="text-[11px] text-black-400">Municipality of Obando</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: "dashboard", label: "Dashboard Overview" },
            { id: "beneficiaries", label: "Beneficiaries" },
            { id: "disbursements", label: "Deposits & Withdrawals" },
            { id: "reports", label: "Financial Reports" },
            {
              id: "registration",
              label: "Register New Senior Citizen Account",
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === item.id
                  ? "bg-emerald-600 text-white"
                  : "text-black-300 hover:bg-emerald-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="mb-3">
            <p className="text-sm font-medium text-black">{admin?.full_name}</p>
            <p className="text-xs text-blue-400">{admin?.role}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-2 px-3 bg-emerald-800 hover:bg-rose-600 text-xs font-semibold rounded-lg transition text-white"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <header className="mb-6 flex items-center justify-between bg-emerald-600 text-white px-6 py-6 shadow-md">
          <h1 className="text-2xl font-bold capitalize">
            {activeTab.replace("-", " ")}
          </h1>
          <span className="text-xs text-blue-100 px-3 py-1.5">
            Logged in as{" "}
            <span className="font-semibold text-white">{admin?.full_name}</span>
          </span>
        </header>

        {/* Dashboard Overview Tab Content */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Top Action Bar */}
            <div className="flex items-center justify-between pl-8 pr-8">
              <p className="text-sm text-slate-500">
                Overview of Municipal senior citizen allowance funds and claims.
              </p>
              <button
                onClick={fetchDashboard}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Refresh Data
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* 4 KPI Summary Cards */}
            <div className="bg-emerald-300 p-4 m-4 rounded-4xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 p-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-black-500">
                      Active Beneficiaries
                    </span>
                  </div>
                  <div className="bg-gradient-to-r from-white to-yellow-300 p-4 rounded-xl">
                    <p className="text-2xl font-bold text-black text-4xl pb-4">
                      {kpis.total_beneficiaries}
                    </p>
                    <p className="text-xs text-black mt-1">
                      Registered senior citizens
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-black-500">
                      Total Funds Credited
                    </span>
                  </div>
                  <div className="bg-gradient-to-r from-white to-blue-300 p-4 rounded-xl">
                    <p className="text-2xl font-bold text-slate-800 pb-4">
                      {formatPeso(kpis.total_credited)}
                    </p>
                    <p className="text-xs text-black-400 mt-1">
                      Cumulative monthly deposits
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-black-500">
                      Total Cash Disbursed
                    </span>
                  </div>
                  <div className="bg-gradient-to-r from-white to-emerald-300 p-4 rounded-xl">
                    <p className="text-2xl font-bold text-black pb-4">
                      {formatPeso(kpis.total_withdrawn)}
                    </p>
                    <p className="text-xs text-black mt-1">
                      {payoutRate}% of credited funds claimed
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-black-500">
                      Unclaimed Balances
                    </span>
                  </div>
                  <div className="bg-gradient-to-r from-white to-orange-300 p-4 rounded-xl">
                    <p className="text-2xl font-bold text-black-600 pb-4">
                      {formatPeso(kpis.total_unclaimed_balance)}
                    </p>
                    <p className="text-xs text-black-400 mt-1">
                      Held in beneficiary accounts
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Two-Column Section: Barangay Progress & Recent Ledger */}
            <div className="bg-emerald-300 p-8 m-4 rounded-4xl mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Barangay Disbursement Breakdown */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h2 className="text-base font-bold text-slate-800 mb-1">
                    Disbursement by Barangay
                  </h2>
                  <p className="text-xs text-slate-500 mb-4">Claimed</p>

                  {barangayBreakdown.length === 0 ? (
                    <p className="text-sm text-slate-400 py-8 text-center">
                      No barangay data yet. Register beneficiaries to see
                      breakdown.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {barangayBreakdown.link === undefined &&
                        barangayBreakdown.map((b) => {
                          const total =
                            Number(b.total_withdrawn) +
                            Number(b.unclaimed_balance);
                          const pct =
                            total > 0
                              ? Math.round(
                                  (Number(b.total_withdrawn) / total) * 100,
                                )
                              : 0;

                          return (
                            <div key={b.barangay}>
                              <div className="flex justify-between text-xs font-medium mb-1">
                                <span className="text-slate-700">
                                  {b.barangay} ({b.senior_count} seniors)
                                </span>
                                <span className="text-slate-500">
                                  {pct}% claimed
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Recent Transactions Feed */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h2 className="text-base font-bold text-slate-800 mb-1">
                    Recent Ledger Activity
                  </h2>
                  <p className="text-xs text-slate-500 mb-4">
                    Latest deposits and cash withdrawals
                  </p>

                  {recentTransactions.length === 0 ? (
                    <p className="text-sm text-slate-400 py-8 text-center">
                      No transactions recorded yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                            <th className="py-2.5 pr-3">Ref No.</th>
                            <th className="py-2.5 px-3">Beneficiary</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3 text-right">Amount</th>
                            <th className="py-2.5 pl-3">Claimed By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {recentTransactions.map((tx) => (
                            <tr
                              key={tx.transaction_id}
                              className="hover:bg-slate-50"
                            >
                              <td className="py-3 pr-3 font-mono text-xs text-slate-500">
                                {tx.reference_no}
                              </td>
                              <td className="py-3 px-3">
                                <p className="font-medium text-slate-800">
                                  {tx.beneficiary_name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {tx.osca_id} • {tx.barangay}
                                </p>
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                                    tx.type === "DEPOSIT"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-emerald-100 text-emerald-700"
                                  }`}
                                >
                                  {tx.type}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-semibold text-slate-800">
                                {formatPeso(tx.amount)}
                              </td>
                              <td className="py-3 pl-3 text-xs text-slate-500">
                                {tx.claimed_by}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {activeTab === "beneficiaries" && (
          <div className="p-8">
            <Beneficiaries token={token} />
          </div>
        )}
      </main>
    </div>
  );
}

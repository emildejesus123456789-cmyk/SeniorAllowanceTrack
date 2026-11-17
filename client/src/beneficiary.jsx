import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const OBANDO_BARANGAYS = [
  "Binuangan",
  "Catanghalan",
  "Hulo",
  "Lawa",
  "Paco",
  "Pag-asa",
  "Paliwas",
  "Panghulo",
  "Poblacion",
  "Salambao",
  "Tawiran",
];

const formatPeso = (amount) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount || 0);

export default function Beneficiaries({ token }) {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter & Sort States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("DEFAULT");

  const fetchBeneficiaries = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/beneficiaries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBeneficiaries(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load beneficiaries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, [token]);

  // Filter and Sort Logic
  const filteredBeneficiaries = beneficiaries
    .filter((b) => {
      const matchesSearch = `${b.card_id} ${b.full_name} ${b.barangay}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesBarangay =
        selectedBarangay === "ALL" || b.barangay === selectedBarangay;

      return matchesSearch && matchesBarangay;
    })
    .sort((a, b) => {
      if (sortOrder === "BARANGAY_ASC") {
        return a.barangay.localeCompare(b.barangay);
      }
      if (sortOrder === "BARANGAY_DESC") {
        return b.barangay.localeCompare(a.barangay);
      }
      return 0; // Keeps default order from backend
    });

  return (
    <div className="space-y-6">
      {/* Top Action Bar with Search, Barangay Filter, and Sort Dropdowns */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-600">
            Manage registered senior citizens, ID card numbers, and account
            balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search name, card ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3.5 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          />

          {/* Filter by Barangay Dropdown */}
          <select
            value={selectedBarangay}
            onChange={(e) => setSelectedBarangay(e.target.value)}
            className="px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
          >
            <option value="ALL">All Barangays</option>
            {OBANDO_BARANGAYS.map((brgy) => (
              <option key={brgy} value={brgy}>
                {brgy}
              </option>
            ))}
          </select>

          {/* Sort Order Dropdown */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
          >
            <option value="DEFAULT">Sort: Latest Added</option>
            <option value="BARANGAY_ASC">Barangay (A–Z)</option>
            <option value="BARANGAY_DESC">Barangay (Z–A)</option>
          </select>

          <button
            onClick={fetchBeneficiaries}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shrink-0"
          >
            Refresh List
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Beneficiaries Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-sm text-slate-400 py-12 text-center">
            Loading beneficiaries...
          </p>
        ) : filteredBeneficiaries.length === 0 ? (
          <p className="text-sm text-slate-400 py-12 text-center">
            No beneficiaries match your current filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Card ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Barangay</th>
                  <th className="py-3 px-4">Representative</th>
                  <th className="py-3 px-4 text-right">Account Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredBeneficiaries.map((b) => (
                  <tr
                    key={b.beneficiary_id}
                    className="hover:bg-slate-50 transition"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {b.card_id}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {b.full_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{b.barangay}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {b.representative_name ? (
                        <>
                          <span className="font-medium text-slate-700">
                            {b.representative_name}
                          </span>
                          <span className="text-slate-400">
                            {" "}
                            ({b.representative_relation})
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      {formatPeso(b.account_balance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          b.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

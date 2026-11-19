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

  // Modal State for ID Popup
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);

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
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-600">
            Click any row to view the beneficiary's digital ID card and details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <input
            type="text"
            placeholder="Search name, card ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3.5 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          />

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
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shrink-0"
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

      {/* Beneficiaries Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-sm text-slate-400 py-12 text-center">
            Loading beneficiaries...
          </p>
        ) : filteredBeneficiaries.length === 0 ? (
          <p className="text-sm text-slate-400 py-12 text-center">
            No beneficiaries found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-300 border-b border-slate-200 text-xs font-semibold text-black-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Card ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Barangay</th>
                  <th className="py-3 px-4">Account Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredBeneficiaries.map((b) => (
                  <tr
                    key={b.beneficiary_id}
                    onClick={() => setSelectedBeneficiary(b)}
                    className="hover:bg-blue-50/50 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {b.card_id}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 flex items-center gap-3">
                      <img
                        src={
                          b.photo_url ||
                          "https://via.placeholder.com/40?text=SC"
                        }
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      {b.full_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{b.barangay}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
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

      {/*DIGITAL ID POPUP MODAL CARD */}
      {selectedBeneficiary && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-300 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* ID Header Bar */}
            <div className="bg-amber-400 text-black px-6 py-4 flex flex-col items-center justify-center text-center">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-black/70 font-semibold">
                  Republic of the Philippines • Municipality of Obando
                </p>
                <h3 className="text-base font-bold uppercase">
                  Senior Citizen Digital ID Card
                </h3>
              </div>
            </div>

            {/* ID Card Body with Blurred Background */}
            <div className="relative p-6 overflow-hidden flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              {/* 1. Background Image with CSS Blur */}
              <div
                className="absolute inset-0 bg-cover bg-center filter blur-[3px] scale-105"
                style={{
                  backgroundImage: `url('https://obando.gov.ph/wp-content/uploads/2022/11/ObandoHeader.jpg')`,
                }}
              ></div>

              {/* 2. Semi-transparent white/slate overlay so text is crisp and readable */}
              <div className="absolute inset-0 bg-white/85 backdrop-blur-xs"></div>

              {/* 3. Actual Content (must be 'relative z-10' to float above the background) */}
              <div className="relative z-10 flex flex-col sm:flex-row gap-6 w-full items-center sm:items-start">
                {/* Beneficiary Photo */}
                <div className="shrink-0 flex flex-col items-center">
                  <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                    OSCA Card ID No.
                  </p>
                  <p className="text-sm font-mono font-bold text-slate-900 mb-1">
                    {selectedBeneficiary.card_id}
                  </p>
                  <img
                    src={
                      selectedBeneficiary.photo_url ||
                      "https://via.placeholder.com/120?text=No+Photo"
                    }
                    alt={selectedBeneficiary.full_name}
                    className="w-36 h-40 object-cover rounded-xl border-4 border-white shadow-md bg-slate-200"
                  />
                  <span className="mt-2 text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                    {selectedBeneficiary.status}
                  </span>
                </div>

                {/* ID Details */}
                <div className="flex-1 space-y-3 w-full text-left pt-2 sm:pt-6">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                        Full Name
                      </p>
                      <p className="text-base font-bold text-blue-900">
                        {selectedBeneficiary.full_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                        Sex
                      </p>
                      <p className="text-base font-bold text-slate-900">
                        {selectedBeneficiary.sex}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                        Contact Number
                      </p>
                      <p className="text-xs font-medium text-slate-700">
                        {selectedBeneficiary.contact_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                        Birth Date
                      </p>
                      <p className="text-xs font-medium text-slate-700">
                        {selectedBeneficiary.birthdate
                          ? new Date(
                              selectedBeneficiary.birthdate,
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                        Address
                      </p>
                      <p className="text-xs font-medium text-slate-700">
                        {selectedBeneficiary.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                        Barangay
                      </p>
                      <p className="text-xs font-medium text-slate-700">
                        {selectedBeneficiary.barangay}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                        Representative
                      </p>
                      <p className="text-xs font-medium text-slate-700">
                        {selectedBeneficiary.representative_name || "None"}
                        {selectedBeneficiary.representative_relation &&
                          ` (${selectedBeneficiary.representative_relation})`}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                        Account Balance
                      </p>
                      <p className="text-sm font-bold text-emerald-600">
                        {formatPeso(selectedBeneficiary.account_balance)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                      Created At
                    </p>
                    <p className="text-xs font-medium text-slate-700">
                      {selectedBeneficiary.created_at &&
                      !isNaN(new Date(selectedBeneficiary.created_at))
                        ? new Date(
                            selectedBeneficiary.created_at,
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 px-6 py-3.5 flex justify-end border-t border-slate-200">
              <button
                onClick={() => setSelectedBeneficiary(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition"
              >
                Close ID Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

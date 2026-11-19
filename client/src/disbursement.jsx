import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const formatPeso = (amount) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount || 0);

export default function Disbursements({ token }) {
  const [transactions, setTransactions] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Single Transaction Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    beneficiary_id: "",
    type: "DEPOSIT",
    amount: "",
    claimed_by: "",
  });

  // Typed Beneficiary Search States
  const [beneficiaryQuery, setBeneficiaryQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Batch Deposit Modal State (All Active Beneficiaries)
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchData, setBatchData] = useState({
    amount: "",
    claimed_by: "Municipal Batch Treasury",
  });
  const [batchError, setBatchError] = useState("");
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  const activeBeneficiaries = beneficiaries.filter(
    (b) => b.status === "ACTIVE",
  );

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [txRes, benRes] = await Promise.all([
        axios.get(`${API_URL}/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/beneficiaries`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setTransactions(txRes.data);
      setBeneficiaries(benRes.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load disbursement records.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleOpenModal = () => {
    setSuccessMsg("");
    setFormData({
      beneficiary_id: "",
      type: "DEPOSIT",
      amount: "",
      claimed_by: "",
    });
    setBeneficiaryQuery("");
    setShowSuggestions(false);
    setFormError("");
    setShowModal(true);
  };

  const handleSelectBeneficiary = (b) => {
    setFormData({ ...formData, beneficiary_id: b.beneficiary_id });
    setBeneficiaryQuery(
      `${b.full_name} (${b.card_id}) | Bal: ${formatPeso(b.account_balance)}`,
    );
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.beneficiary_id) {
      setFormError(
        "Please type and select an active beneficiary from the list.",
      );
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(`${API_URL}/transactions`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModal(false);
      setSuccessMsg("Transaction recorded and beneficiary balance updated.");
      fetchData();
    } catch (err) {
      setFormError(
        err.response?.data?.message || "Failed to process transaction.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenBatchModal = () => {
    setSuccessMsg("");
    setBatchData({
      amount: "",
      claimed_by: "Municipal Batch Treasury",
    });
    setBatchError("");
    setShowBatchModal(true);
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    setBatchError("");

    const numericAmount = Number(batchData.amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setBatchError("Please enter a valid deposit amount greater than ₱0.");
      return;
    }

    if (activeBeneficiaries.length === 0) {
      setBatchError("There are no active beneficiaries to credit.");
      return;
    }

    setBatchSubmitting(true);
    try {
      const res = await axios.post(
        `${API_URL}/transactions/batch-deposit`,
        batchData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setShowBatchModal(false);
      setSuccessMsg(
        res.data.message ||
          `Deposited ${formatPeso(numericAmount)} to ${activeBeneficiaries.length} active beneficiaries.`,
      );
      fetchData();
    } catch (err) {
      setBatchError(
        err.response?.data?.message || "Failed to process batch deposit.",
      );
    } finally {
      setBatchSubmitting(false);
    }
  };

  // Filter transactions by reference number, beneficiary name, or barangay
  const filteredTransactions = transactions.filter((tx) =>
    `${tx.reference_no} ${tx.beneficiary_name} ${tx.barangay} ${tx.type}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  // Filter active beneficiaries by typed name, card ID, or barangay
  const matchingBeneficiaries = activeBeneficiaries.filter((b) =>
    `${b.full_name} ${b.card_id} ${b.barangay}`
      .toLowerCase()
      .includes(beneficiaryQuery.toLowerCase()),
  );

  const batchTotalPreview =
    (Number(batchData.amount) > 0 ? Number(batchData.amount) : 0) *
    activeBeneficiaries.length;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mx-4">
        <div>
          <p className="text-sm text-slate-600">
            Record and monitor municipal allowance credits and cash
            disbursements.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search ref no, name, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3.5 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          />
          <button
            onClick={handleOpenBatchModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shrink-0 shadow-sm"
          >
            + Deposit All Active ({activeBeneficiaries.length})
          </button>
          <button
            onClick={handleOpenModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shrink-0 shadow-sm"
          >
            + New Transaction
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mx-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-medium">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="mx-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Transactions Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-sm text-slate-400 py-12 text-center">
            Loading transactions...
          </p>
        ) : filteredTransactions.length === 0 ? (
          <p className="text-sm text-slate-400 py-12 text-center">
            No transactions recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Ref No.</th>
                  <th className="py-3 px-4">Beneficiary</th>
                  <th className="py-3 px-4">Barangay</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Claimed By</th>
                  <th className="py-3 px-4">Processed By</th>
                  <th className="py-3 px-4 text-right">Date / Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTransactions.map((tx) => (
                  <tr
                    key={tx.transaction_id}
                    className="hover:bg-slate-50 transition"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {tx.reference_no}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {tx.beneficiary_name}
                      <span className="block text-xs font-mono text-slate-400">
                        {tx.card_id}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{tx.barangay}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          tx.type === "DEPOSIT"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      {formatPeso(tx.amount)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {tx.claimed_by}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {tx.processed_by_name}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-400">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BATCH DEPOSIT MODAL (ALL ACTIVE BENEFICIARIES) */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  Batch Deposit to All Active Beneficiaries
                </h3>
                <p className="text-[11px] text-emerald-100">
                  Applies to {activeBeneficiaries.length} active senior citizen
                  accounts
                </p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="w-8 h-8 rounded-full bg-emerald-700 hover:bg-emerald-800 flex items-center justify-center text-white font-bold transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBatchSubmit} className="p-6 space-y-4">
              {batchError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                  {batchError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Deposit Amount per Beneficiary (₱)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="e.g. 1000.00"
                  value={batchData.amount}
                  onChange={(e) =>
                    setBatchData({ ...batchData, amount: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Source / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Municipal Allowance"
                  value={batchData.claimed_by}
                  onChange={(e) =>
                    setBatchData({ ...batchData, claimed_by: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Batch Summary Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Active Beneficiaries:</span>
                  <span className="font-bold text-slate-800">
                    {activeBeneficiaries.length}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Amount per Senior:</span>
                  <span className="font-bold text-slate-800">
                    {formatPeso(batchData.amount)}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 text-sm">
                  <span className="font-bold text-slate-800">
                    Total Allocation:
                  </span>
                  <span className="font-bold text-emerald-700">
                    {formatPeso(batchTotalPreview)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchSubmitting || activeBeneficiaries.length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {batchSubmitting
                    ? "Crediting All..."
                    : `Deposit ${formatPeso(batchData.amount)} to All`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW TRANSACTION MODAL (SINGLE BENEFICIARY) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-visible flex flex-col">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-base font-bold">Process New Transaction</h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-blue-700 hover:bg-blue-800 flex items-center justify-center text-white font-bold transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                  {formError}
                </div>
              )}

              {/* Typed Beneficiary Search */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Search Beneficiary (Name, Card ID, Barangay)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Type senior citizen name or card ID..."
                    value={beneficiaryQuery}
                    onFocus={() => setShowSuggestions(true)}
                    onChange={(e) => {
                      setBeneficiaryQuery(e.target.value);
                      setFormData({ ...formData, beneficiary_id: "" });
                      setShowSuggestions(true);
                    }}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 pr-8"
                  />
                  {beneficiaryQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setBeneficiaryQuery("");
                        setFormData({ ...formData, beneficiary_id: "" });
                        setShowSuggestions(true);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {formData.beneficiary_id && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                    ✓ Beneficiary selected
                  </p>
                )}

                {showSuggestions && !formData.beneficiary_id && (
                  <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl z-50 divide-y divide-slate-100">
                    {matchingBeneficiaries.length === 0 ? (
                      <p className="px-3.5 py-2.5 text-xs text-slate-400">
                        No active beneficiary matches "{beneficiaryQuery}"
                      </p>
                    ) : (
                      matchingBeneficiaries.map((b) => (
                        <button
                          key={b.beneficiary_id}
                          type="button"
                          onClick={() => handleSelectBeneficiary(b)}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 transition flex items-center justify-between gap-2"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {b.full_name}
                            </p>
                            <p className="text-[11px] font-mono text-slate-500">
                              {b.card_id} - Brgy. {b.barangay}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-emerald-600 shrink-0">
                            {formatPeso(b.account_balance)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="DEPOSIT">Deposit (Credit Allowance)</option>
                    <option value="WITHDRAWAL">Withdrawal (Cash Payout)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Amount (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {formData.type === "WITHDRAWAL" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Claimed By
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Self or Representative Name"
                    value={formData.claimed_by}
                    onChange={(e) =>
                      setFormData({ ...formData, claimed_by: e.target.value })
                    }
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Confirm & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

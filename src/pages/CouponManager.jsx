import React, { useState } from "react";
import { useCouponContext } from "../context/CouponContext";
import { useAuditLog } from "../context/AuditLogContext";

export default function CouponManager() {
  const { coupons = [], addCoupon, usageLogs = [] } = useCouponContext(); // Default to empty arrays
  const { addLog } = useAuditLog();

  const [form, setForm] = useState({
    code: "",
    discountType: "amount",
    discountValue: "",
    validTill: "",
    usageLimit: "",
    perUserLimit: "",
    applicableTo: "All"
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!form.code || !form.discountValue) {
      addLog("COUPON_CREATION_FAILED", "COUPON", {
        reason: "Missing required fields",
        missing_fields: {
          code: !form.code,
          discountValue: !form.discountValue
        }
      });
      return alert("Please fill in all required fields");
    }

    const couponData = {
      ...form,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    addCoupon(couponData);
    
    // Log successful creation
    addLog("COUPON_CREATED", "COUPON", {
      code: form.code,
      discount_type: form.discountType,
      discount_value: form.discountValue,
      valid_till: form.validTill || "No expiry",
      usage_limit: form.usageLimit || "Unlimited",
      per_user_limit: form.perUserLimit || "Unlimited",
      applicable_to: form.applicableTo
    });

    // Reset form
    setForm({
      code: "",
      discountType: "amount",
      discountValue: "",
      validTill: "",
      usageLimit: "",
      perUserLimit: "",
      applicableTo: "All"
    });
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Create New Coupon</h2>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <input 
          name="code" 
          value={form.code} 
          onChange={handleChange} 
          placeholder="Coupon Code" 
          required 
          className="border p-2 rounded" 
        />
        <select 
          name="discountType" 
          value={form.discountType} 
          onChange={handleChange} 
          className="border p-2 rounded"
        >
          <option value="amount">Amount</option>
          <option value="percent">Percentage</option>
        </select>
        <input 
          name="discountValue" 
          value={form.discountValue} 
          onChange={handleChange} 
          placeholder={form.discountType === "amount" ? "Amount (₹)" : "Percentage (%)"} 
          required 
          type="number" 
          min="0"
          className="border p-2 rounded" 
        />
        <input 
          name="validTill" 
          value={form.validTill} 
          onChange={handleChange} 
          type="date" 
          min={new Date().toISOString().split('T')[0]}
          className="border p-2 rounded" 
        />
        <input 
          name="usageLimit" 
          value={form.usageLimit} 
          onChange={handleChange} 
          placeholder="Global Usage Limit" 
          type="number" 
          min="0"
          className="border p-2 rounded" 
        />
        <input 
          name="perUserLimit" 
          value={form.perUserLimit} 
          onChange={handleChange} 
          placeholder="Per User Limit" 
          type="number" 
          min="0"
          className="border p-2 rounded" 
        />
        <input 
          name="applicableTo" 
          value={form.applicableTo} 
          onChange={handleChange} 
          placeholder="Applicable Class/Course/Plan" 
          className="border p-2 rounded" 
        />
        <button 
          type="submit" 
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Add Coupon
        </button>
      </form>

      <h3 className="text-lg font-semibold mt-8">Available Coupons</h3>
      <ul className="mt-2 space-y-2">
        {Array.isArray(coupons) && coupons.length > 0 ? (
          coupons.map((coupon) => (
            <li key={coupon.code} className="border p-2 rounded shadow">
              <div className="flex justify-between items-start">
                <div>
                  <strong>{coupon.code}</strong> - 
                  {coupon.discountType === "amount" ? ` ₹${coupon.discountValue}` : ` ${coupon.discountValue}%`}
                  {coupon.validTill && ` - Valid till: ${new Date(coupon.validTill).toLocaleDateString()}`}
                </div>
                <span className="text-sm text-gray-500">
                  Uses: {coupon.usageCount || 0}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
                </span>
              </div>
              {coupon.applicableTo && coupon.applicableTo !== "All" && (
                <div className="text-sm text-gray-600 mt-1">
                  Applicable to: {coupon.applicableTo}
                </div>
              )}
            </li>
          ))
        ) : (
          <li className="text-gray-500">No coupons available</li>
        )}
      </ul>

      <h3 className="text-lg font-semibold mt-8">Usage Logs</h3>
      <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
        {Array.isArray(usageLogs) && usageLogs.length > 0 ? (
          usageLogs.map((log, idx) => (
            <div key={idx} className="text-sm border-b pb-2">
              <div className="flex justify-between">
                <span className="font-medium">{log.userId}</span>
                <span className="text-gray-500 text-xs">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              <div>
                Used <strong>{log.code}</strong> on {log.plan || 'unknown plan'}
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500">No usage logs yet</div>
        )}
      </div>
    </div>
  );
}
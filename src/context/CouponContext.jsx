import React, { createContext, useContext, useState, useEffect } from 'react';

const CouponContext = createContext();

export const CouponProvider = ({ children }) => {
  const [coupons, setCoupons] = useState([]);
  const [logs, setLogs] = useState([]);

const [usageLogs, setUsageLogs] = useState([]);

  useEffect(() => {
    const savedCoupons = localStorage.getItem('coupons');
    const savedLogs = localStorage.getItem('couponLogs');
    if (savedCoupons) setCoupons(JSON.parse(savedCoupons));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  useEffect(() => {
    localStorage.setItem('coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('couponLogs', JSON.stringify(logs));
  }, [logs]);

  const addCoupon = (coupon) => {
    setCoupons(prev => [...prev, { ...coupon, id: Date.now() }]);
  };

  const logCouponUsage = (code, userId) => {
    const newLog = { code, userId, usedAt: new Date().toISOString() };
    setLogs(prev => [...prev, newLog]);
  };

  const getUsageCount = (code) => {
    return logs.filter(log => log.code === code).length;
  };

  const getUserUsageCount = (code, userId) => {
    return logs.filter(log => log.code === code && log.userId === userId).length;
  };

  const isCouponValid = (coupon, userId) => {
    const now = new Date().toISOString().split('T')[0];
    const validDate = coupon.validTill >= now;
    const underLimit = getUsageCount(coupon.code) < coupon.usageLimit;
    const underUserLimit = getUserUsageCount(coupon.code, userId) < coupon.usageLimitPerUser;

    return validDate && underLimit && underUserLimit;
  };

  return (
    <CouponContext.Provider value={{
      coupons,
      logs,
      addCoupon,
      logCouponUsage,
      getUsageCount,
      getUserUsageCount,
      isCouponValid
    }}>
      {children}
    </CouponContext.Provider>
  );
};

export const useCouponContext = () => {
  const context = useContext(CouponContext);
  if (!context) throw new Error("useCouponContext must be used within CouponProvider");
  return context;
};

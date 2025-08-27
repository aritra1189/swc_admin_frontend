// context/AuditLogContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const AuditLogContext = createContext();

export const AuditLogProvider = ({ children }) => {
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('auditLogs');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever logs change
  useEffect(() => {
    localStorage.setItem('auditLogs', JSON.stringify(logs));
  }, [logs]);

  const addLog = (action, entity, details) => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      userId: JSON.parse(localStorage.getItem('user'))?.email || 'unknown',
      action,
      entity,
      details
    };
    setLogs(prev => [newLog, ...prev].slice(0, 1000)); // Keep last 1000 logs
  };

  const exportLogs = () => {
    const csvContent = [
      'Timestamp,User,Action,Entity,Details',
      ...logs.map(log => 
        `"${log.timestamp}","${log.userId}","${log.action}","${log.entity}","${JSON.stringify(log.details).replace(/"/g, '""')}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AuditLogContext.Provider value={{ logs, addLog, exportLogs }}>
      {children}
    </AuditLogContext.Provider>
  );
};

export const useAuditLog = () => useContext(AuditLogContext);
import React, { useState, useEffect } from 'react';
import { useAuditLog } from '../context/AuditLogContext';
import { Search, Download, Plus, X, Check, Clock, AlertCircle } from 'lucide-react';
import { usersData } from './mockUsers';

const PaymentsManager = () => {
  const { addLog } = useAuditLog();
  const [transactions, setTransactions] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [filters, setFilters] = useState({
    student: '',
    dateFrom: '',
    dateTo: '',
    plan: '',
    class: '',
    status: ''
  });
  const [newPlan, setNewPlan] = useState({
    name: '',
    duration: 30,
    price: 0,
    features: '',
    description: ''
  });
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize data from usersData
  useEffect(() => {
    // Safely extract transactions from users' payment history
    const allTransactions = usersData.flatMap(user => 
      (user.paymentHistory || []).map(payment => ({
        ...payment,
        student: user.name || '',
        email: user.email || '',
        class: Array.isArray(user.class) ? user.class[0] : '',
        plan: user.plan?.name || '',
        status: payment.status ? payment.status.toLowerCase() : '',
        studentId: user.id || ''
      }))
    ).filter(txn => txn.invoiceId);

    // Safely create subscription plans
    const uniquePlans = [...new Set(
      usersData
        .filter(user => user.plan?.name)
        .map(user => user.plan.name)
    )];
    
    const mockPlans = uniquePlans.map((planName, index) => {
      const sampleUser = usersData.find(user => user.plan?.name === planName);
      const startDate = sampleUser?.plan?.startDate ? new Date(sampleUser.plan.startDate) : null;
      const endDate = sampleUser?.plan?.endDate ? new Date(sampleUser.plan.endDate) : null;
      const duration = startDate && endDate ? 
        Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) : 30;

      return {
        id: `plan_${index + 1}`,
        name: planName,
        duration,
        price: planName === 'Premium' ? 120 : planName === 'Basic' ? 80 : 0,
        features: sampleUser?.plan?.features?.join(', ') || '',
        active: true,
        subscribers: usersData.filter(user => user.plan?.name === planName).length
      };
    });

    setTransactions(allTransactions);
    setSubscriptionPlans(mockPlans);
    // addLog('PAYMENTS_PAGE_LOADED', 'PAYMENTS', {
    //   transactionCount: allTransactions.length,
    //   planCount: mockPlans.length
    // });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once on mount

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    addLog('PAYMENTS_FILTER_CHANGED', 'PAYMENTS', { filter: name, value });
  };

  const handlePlanSubmit = (e) => {
    e.preventDefault();
    if (!newPlan.name || newPlan.price <= 0) {
      addLog('PLAN_CREATION_FAILED', 'SUBSCRIPTIONS', { reason: 'Invalid plan data' });
      return;
    }

    const plan = {
      ...newPlan,
      id: `plan_${Date.now()}`,
      active: true,
      createdAt: new Date().toISOString(),
      subscribers: 0
    };

    setSubscriptionPlans(prev => [...prev, plan]);
    addLog('PLAN_CREATED', 'SUBSCRIPTIONS', {
      plan: plan.name,
      duration: plan.duration,
      price: plan.price,
      features: plan.features
    });

    setNewPlan({
      name: '',
      duration: 30,
      price: 0,
      features: '',
      description: ''
    });
    setShowPlanForm(false);
  };

  const togglePlanStatus = (planId) => {
    setSubscriptionPlans(prev =>
      prev.map(plan =>
        plan.id === planId ? { ...plan, active: !plan.active } : plan
      )
    );
    const plan = subscriptionPlans.find(p => p.id === planId);
    addLog('PLAN_STATUS_CHANGED', 'SUBSCRIPTIONS', {
      plan: plan.name,
      newStatus: !plan.active ? 'active' : 'inactive'
    });
  };

  const exportTransactions = () => {
    addLog('TRANSACTIONS_EXPORTED', 'PAYMENTS', {
      filter: filters,
      count: filteredTransactions.length
    });
    
    const headers = ['Student', 'Email', 'Date', 'Amount', 'Plan', 'Class', 'Status', 'Invoice ID'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(txn => 
        [
          `"${txn.student}"`,
          `"${txn.email}"`,
          `"${new Date(txn.date).toLocaleString()}"`,
          `"₹${txn.amount}"`,
          `"${txn.plan}"`,
          `"${txn.class}"`,
          `"${txn.status}"`,
          `"${txn.invoiceId}"`
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <Check className="text-green-500" size={16} />;
      case 'pending': return <Clock className="text-yellow-500" size={16} />;
      case 'failed': return <AlertCircle className="text-red-500" size={16} />;
      default: return null;
    }
  };

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = searchQuery === '' || 
      txn.student.toLowerCase().includes(searchQuery.toLowerCase()) || 
      txn.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.invoiceId.toLowerCase().includes(searchQuery.toLowerCase());

    return (
      matchesSearch &&
      (filters.student === '' || txn.student.toLowerCase().includes(filters.student.toLowerCase())) &&
      (filters.dateFrom === '' || new Date(txn.date) >= new Date(filters.dateFrom)) &&
      (filters.dateTo === '' || new Date(txn.date) <= new Date(filters.dateTo)) &&
      (filters.plan === '' || txn.plan.toLowerCase() === filters.plan.toLowerCase()) &&
      (filters.class === '' || txn.class.toLowerCase() === filters.class.toLowerCase()) &&
      (filters.status === '' || txn.status === filters.status.toLowerCase())
    );
  });

  const getPlanRevenue = (planName) => {
    return transactions
      .filter(txn => txn.plan === planName && txn.status === 'paid')
      .reduce((sum, txn) => sum + parseInt(txn.amount), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Payments & Subscriptions</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transactions Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow">
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <h2 className="text-xl font-semibold">Payment Transactions</h2>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-grow md:flex-grow-0 md:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        className="pl-10 pr-4 py-2 border rounded-lg w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={exportTransactions}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                    >
                      <Download size={18} /> Export CSV
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date Range</label>
                    <div className="flex gap-1">
                      <input
                        type="date"
                        name="dateFrom"
                        value={filters.dateFrom}
                        onChange={handleFilterChange}
                        className="w-1/2 p-2 border rounded"
                      />
                      <input
                        type="date"
                        name="dateTo"
                        value={filters.dateTo}
                        onChange={handleFilterChange}
                        className="w-1/2 p-2 border rounded"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Plan</label>
                    <select
                      name="plan"
                      value={filters.plan}
                      onChange={handleFilterChange}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">All Plans</option>
                      {subscriptionPlans.map(plan => (
                        <option key={plan.id} value={plan.name}>{plan.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">All Statuses</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800">Total Transactions</h3>
                    <p className="text-2xl font-bold">{filteredTransactions.length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-green-800">Total Revenue</h3>
                    <p className="text-2xl font-bold">
                      ₹{filteredTransactions
                        .filter(txn => txn.status === 'paid')
                        .reduce((sum, txn) => sum + parseInt(txn.amount), 0)}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-800">Active Subscribers</h3>
                    <p className="text-2xl font-bold">
                      {usersData.filter(user => user.status === 'active').length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scrollable Transactions Table */}
              <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr className="text-left">
                      <th className="p-3 font-medium border-b">Invoice</th>
                      <th className="p-3 font-medium border-b">Student</th>
                      <th className="p-3 font-medium border-b">Date</th>
                      <th className="p-3 font-medium border-b">Amount</th>
                      <th className="p-3 font-medium border-b">Plan</th>
                      <th className="p-3 font-medium border-b">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map(txn => (
                        <tr key={txn.invoiceId} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-mono text-sm">#{txn.invoiceId}</td>
                          <td className="p-3">
                            <div className="font-medium">{txn.student}</div>
                            <div className="text-sm text-gray-500">{txn.class}</div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {new Date(txn.date).toLocaleDateString()}
                          </td>
                          <td className="p-3 font-medium">₹{txn.amount}</td>
                          <td className="p-3">{txn.plan}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(txn.status)}
                              <span className={`capitalize ${
                                txn.status === 'paid' ? 'text-green-600' :
                                txn.status === 'pending' ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {txn.status}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-gray-500">
                          No transactions found matching your filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Subscription Plans Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6 sticky top-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Subscription Plans</h2>
                <button
                  onClick={() => setShowPlanForm(!showPlanForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {showPlanForm ? <X size={18} /> : <Plus size={18} />}
                  {showPlanForm ? 'Cancel' : 'New Plan'}
                </button>
              </div>
              
              {showPlanForm && (
                <form onSubmit={handlePlanSubmit} className="space-y-4 mb-6 border-t pt-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Plan Name*</label>
                    <input
                      type="text"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., Premium Annual"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Duration (days)*</label>
                      <input
                        type="number"
                        value={newPlan.duration}
                        onChange={(e) => setNewPlan({...newPlan, duration: parseInt(e.target.value) || 0})}
                        className="w-full p-2 border rounded"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Price (₹)*</label>
                      <input
                        type="number"
                        value={newPlan.price}
                        onChange={(e) => setNewPlan({...newPlan, price: parseFloat(e.target.value) || 0})}
                        className="w-full p-2 border rounded"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Features*</label>
                    <textarea
                      value={newPlan.features}
                      onChange={(e) => setNewPlan({...newPlan, features: e.target.value})}
                      className="w-full p-2 border rounded"
                      rows={3}
                      placeholder="One feature per line"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={newPlan.description}
                      onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                      className="w-full p-2 border rounded"
                      rows={2}
                      placeholder="Plan description for students"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create Plan
                  </button>
                </form>
              )}

              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {subscriptionPlans.map(plan => (
                  <div key={plan.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{plan.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          ₹{plan.price} for {plan.duration} days
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {plan.subscribers} subscribers • ₹{getPlanRevenue(plan.name)} revenue
                        </p>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={plan.active}
                          onChange={() => togglePlanStatus(plan.id)}
                          className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {plan.features && (
                      <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
                        {plan.features.split('\n').map((feature, i) => (
                          <li key={i}>{feature}</li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3 flex justify-between items-center text-xs">
                      <button className="text-blue-600 hover:underline">View subscribers</button>
                      <span className={`px-2 py-1 rounded-full ${
                        plan.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {plan.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Summary */}
            <div className="bg-white rounded-xl shadow p-6 sticky top-[calc(6rem+400px)]">
              <h2 className="text-xl font-semibold mb-4">Revenue Summary</h2>
              <div className="space-y-4">
                {subscriptionPlans.map(plan => (
                  <div key={plan.id} className="flex justify-between items-center">
                    <span>{plan.name}</span>
                    <span className="font-medium">₹{getPlanRevenue(plan.name)}</span>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3 font-bold flex justify-between">
                  <span>Total Revenue</span>
                  <span>
                    ₹{subscriptionPlans.reduce((sum, plan) => sum + getPlanRevenue(plan.name), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsManager;
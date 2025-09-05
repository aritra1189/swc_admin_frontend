import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';

const AdminPaymentPanel = () => {
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('email'); // Default search field

  useEffect(() => {
    fetchPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, statusFilter]);

  useEffect(() => {
    filterPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, searchField, purchases]);

  const fetchPurchases = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page,
        limit: limit,
        offset:0,
        ...(statusFilter && { status: statusFilter })
      });
      
      // Call the API endpoint using API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/purchase/admin/history?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch purchases: ${response.status}`);
      }
      
      const data = await response.json();
      // Updated to match your API response structure
      setPurchases(data.result || []);
      setTotal(data.total || data.result?.length || 0);
    } catch (err) {
      setError(err.message || 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const filterPurchases = () => {
    if (!searchTerm) {
      setFilteredPurchases(purchases);
      return;
    }

    const filtered = purchases.filter(purchase => {
      const searchValue = searchTerm.toLowerCase();
      
      switch(searchField) {
        case 'email':
          return purchase.account?.email?.toLowerCase().includes(searchValue) || 
                 purchase.accountId?.toLowerCase().includes(searchValue);
        case 'orderId':
          return purchase.id?.toLowerCase().includes(searchValue);
        case 'transactionId':
          return purchase.transactionId?.toLowerCase().includes(searchValue);
        case 'itemName':
          const itemName = getPurchaseItemName(purchase).toLowerCase();
          return itemName.includes(searchValue);
        case 'purchaseType':
          return purchase.purchaseType?.toLowerCase().includes(searchValue);
        default:
          return true;
      }
    });

    setFilteredPurchases(filtered);
  };

  const openRefundModal = (purchase) => {
    setSelected(purchase);
    setRefundAmount(purchase.amount || '');
    setShowRefundModal(true);
  };

  const closeRefundModal = () => {
    setShowRefundModal(false);
    setSelected(null);
    setRefundAmount('');
  };

  const submitRefund = async () => {
    if (!selected) return;
    const merchantOrderId = selected.id; // Using id as merchantOrderId
    const amount = parseFloat(refundAmount);
    
    if (isNaN(amount) || amount <= 0) {
      alert('Enter a valid refund amount');
      return;
    }

    setIsRefunding(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/payment/admin/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ merchantOrderId, refundAmount: amount }),
      });

      if (!response.ok) {
        throw new Error(`Refund failed: ${response.status}`);
      }

      const data = await response.json();
      alert(`Refund processed. RefundId: ${data.refundId || data.merchantRefundId || 'N/A'}`);
      closeRefundModal();
      fetchPurchases(); // Refresh the list
    } catch (err) {
      setError(err.message || 'Refund failed');
    } finally {
      setIsRefunding(false);
    }
  };

  const verifyPayment = async (merchantOrderId) => {
    setVerifying(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/payment/verify/${merchantOrderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`Verification failed: ${response.status}`);
      }
      
      const data = await response.json();
      alert(`Verification result: ${data.status} — amount: ${data.amount}`);
      fetchPurchases(); // Refresh the list
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const exportCSV = () => {
    const dataToExport = searchTerm ? filteredPurchases : purchases;
    if (!dataToExport.length) return;
    
    const headers = ['Order ID', 'User', 'Purchase Type', 'Item', 'Amount', 'Status', 'TransactionID', 'Created At'];
    const rows = dataToExport.map(p => [
      p.id,
      p.account?.email || p.accountId || 'N/A',
      p.purchaseType,
      getPurchaseItemName(p),
      p.amount,
      p.paymentStatus,
      p.transactionId || 'N/A',
      new Date(p.createdAt).toLocaleString()
    ]);
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(field => `"${field}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchases_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPurchaseItemName = (purchase) => {
    if (purchase.audioLecture) return purchase.audioLecture.title;
    if (purchase.course) return purchase.course.title;
    if (purchase.studyMaterial) return purchase.studyMaterial.title;
    if (purchase.mcqTest) return purchase.mcqTest.title;
    return 'N/A';
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchField('email');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Payment Management</h1>
          
          <div className="flex flex-wrap gap-2">
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            <button
              className="bg-white border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50 transition-colors"
              onClick={fetchPurchases}
            >
              Refresh
            </button>

            <button
              className="bg-white border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50 transition-colors"
              onClick={exportCSV}
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex flex-col md:flex-row gap-2 w-full">
              <div className="flex-1">
                <label htmlFor="searchField" className="block text-sm font-medium text-gray-700 mb-1">
                  Search By
                </label>
                <select
                  id="searchField"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                >
                  <option value="email">User Email</option>
                  <option value="orderId">Order ID</option>
                  <option value="transactionId">Transaction ID</option>
                  <option value="itemName">Item Name</option>
                  <option value="purchaseType">Purchase Type</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Term
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="searchTerm"
                    placeholder={`Search by ${searchField}...`}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="bg-gray-200 text-gray-700 rounded-md px-3 py-2 hover:bg-gray-300 transition-colors"
                      title="Clear search"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {searchTerm && (
            <div className="mt-3 text-sm text-gray-600">
              Showing {filteredPurchases.length} of {purchases.length} purchases matching "{searchTerm}" in {searchField}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Purchases Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : (searchTerm ? filteredPurchases : purchases).length > 0 ? (
                  (searchTerm ? filteredPurchases : purchases).map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {purchase.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {purchase.account?.email || purchase.accountId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {purchase.purchaseType}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getPurchaseItemName(purchase)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${purchase.amount || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${purchase.paymentStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                            purchase.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                            purchase.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' : 
                            purchase.paymentStatus === 'REFUNDED' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                          {purchase.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {purchase.transactionId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(purchase.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 disabled:text-gray-400"
                            onClick={() => verifyPayment(purchase.id)}
                            disabled={verifying}
                          >
                            Verify
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => openRefundModal(purchase)}
                          >
                            Refund
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm ? 'No purchases found matching your search' : 'No purchases found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
          <div className="flex items-center">
            <span className="text-sm text-gray-700 mr-2">Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} {total ? `of ${Math.ceil(total / limit)}` : ''}
            </span>
            <button
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
              onClick={() => setPage(page + 1)}
              disabled={(searchTerm ? filteredPurchases : purchases).length < limit}
            >
              Next
            </button>
          </div>
        </div>

        {/* Refund Modal */}
        {showRefundModal && selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Process Refund</h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Order ID:</p>
                  <p className="font-medium">{selected.id}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">User:</p>
                  <p className="font-medium">{selected.account?.email || selected.accountId || 'N/A'}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Item:</p>
                  <p className="font-medium">{getPurchaseItemName(selected)}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Original Amount:</p>
                  <p className="font-medium">${selected.amount || '0.00'}</p>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="refundAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    Refund Amount
                  </label>
                  <input
                    type="number"
                    id="refundAmount"
                    step="0.01"
                    min="0.01"
                    max={selected.amount}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    onClick={closeRefundModal}
                    disabled={isRefunding}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    onClick={submitRefund}
                    disabled={isRefunding}
                  >
                    {isRefunding ? 'Processing...' : 'Confirm Refund'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPaymentPanel;
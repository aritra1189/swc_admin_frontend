import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../config/api';
import { FiBell, FiCheck, FiX, FiSend, FiUsers, FiUser } from 'react-icons/fi';

const VALID_NOTIFICATION_TYPES = [
  'NEW PRODUCT', 'NEW ACCOUNT', 'CONTACT US', 'QNA', 'FEEDBACK', 
  'INVOICE', 'STAFF', 'TICKET', 'PRODUCT', 'PRODUCT VIEW', 
  'VENDOR RATING', 'VENDOR ACCOUNT', 'VENDOR INVOICE', 'VENDOR PAYMENT', 
  'VENDOR TICKET', 'USER PRODUCT', 'USER ACCOUNT', 'USER INVOICE', 
  'USER PAYMENT', 'USER TICKET', 'OFFER', 'LOGIN', 'DEMO'
];

const NotificationsManager = () => {
  // Get user from Redux store
  const { user, token, isAuthenticated } = useSelector(state => state.auth);
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showMultiModal, setShowMultiModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    desc: '',
    type: 'NEW PRODUCT',
    accountId: '',
    deviceId: ''
  });

  const itemsPerPage = 10;

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchNotifications();
      fetchUsers();
    }
  }, [currentPage, isAuthenticated, token]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/notifications/list`, {
        params: {
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setNotifications(response.data.result);
      setTotalNotifications(response.data.total);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAllUsers(response.data.result);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNotificationForm({
      ...notificationForm,
      [name]: value
    });
  };

  const handleUserSelect = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const sendBulkNotification = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/notifications/bulk`,
        {
          title: notificationForm.title,
          desc: notificationForm.desc,
          type: notificationForm.type
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      toast.success('Bulk notification sent successfully');
      setShowBulkModal(false);
      resetForm();
      fetchNotifications();
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      toast.error('Failed to send bulk notification');
    }
  };

  const sendSingleNotification = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/notifications/single`,
        {
          title: notificationForm.title,
          desc: notificationForm.desc,
          type: notificationForm.type,
          accountId: notificationForm.accountId,
          deviceId: notificationForm.deviceId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      toast.success('Notification sent successfully');
      setShowCreateModal(false);
      resetForm();
      fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const sendMultiNotification = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/notifications/multi`,
        {
          title: notificationForm.title,
          desc: notificationForm.desc,
          type: notificationForm.type,
          accountId: selectedUsers
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      toast.success('Notifications sent successfully');
      setShowMultiModal(false);
      resetForm();
      setSelectedUsers([]);
      fetchNotifications();
    } catch (error) {
      console.error('Error sending multiple notifications:', error);
      toast.error('Failed to send notifications');
    }
  };

  const resetForm = () => {
    setNotificationForm({
      title: '',
      desc: '',
      type: 'NEW PRODUCT',
      accountId: '',
      deviceId: ''
    });
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access the notification manager.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold flex items-center">
          <FiBell className="mr-2" /> Notifications Manager
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            <FiUser className="mr-1" /> Send to User
          </button>
          <button
            onClick={() => setShowMultiModal(true)}
            className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            <FiUsers className="mr-1" /> Send to Multiple
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
          >
            <FiSend className="mr-1" /> Broadcast
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No notifications found
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="p-4 rounded-lg border bg-white shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{notification.title}</h3>
                  <p className="text-gray-600 mt-1">{notification.desc}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded mr-2">
                      {notification.type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalNotifications > itemsPerPage && (
        <div className="flex justify-center mt-8">
          <nav className="inline-flex rounded-md shadow">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-l-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.ceil(totalNotifications / itemsPerPage) }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 border-t border-b border-gray-300 ${currentPage === i + 1 ? 'bg-blue-50 text-blue-600 border-blue-500' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalNotifications / itemsPerPage)))}
              disabled={currentPage === Math.ceil(totalNotifications / itemsPerPage)}
              className="px-4 py-2 rounded-r-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Create Notification Modal (Single User) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-medium">Send to User</h3>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-800">
                <FiX />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={notificationForm.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="desc"
                    value={notificationForm.desc}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border rounded"
                    required
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    name="type"
                    value={notificationForm.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded"
                  >
                    {VALID_NOTIFICATION_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">User ID</label>
                  <input
                    type="text"
                    name="accountId"
                    value={notificationForm.accountId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Device ID (optional)</label>
                  <input
                    type="text"
                    name="deviceId"
                    value={notificationForm.deviceId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                <button
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={sendSingleNotification}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Notification Modal (All Users) */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-medium">Broadcast Notification</h3>
              <button onClick={() => { setShowBulkModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-800">
                <FiX />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={notificationForm.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="desc"
                    value={notificationForm.desc}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border rounded"
                    required
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    name="type"
                    value={notificationForm.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded"
                  >
                    {VALID_NOTIFICATION_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                <button
                  onClick={() => { setShowBulkModal(false); resetForm(); }}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={sendBulkNotification}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Broadcast
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi Notification Modal (Selected Users) */}
      {showMultiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-medium">Send to Multiple Users</h3>
              <button onClick={() => { setShowMultiModal(false); resetForm(); setSelectedUsers([]); }} className="text-gray-500 hover:text-gray-800">
                <FiX />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={notificationForm.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="desc"
                    value={notificationForm.desc}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border rounded"
                    required
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    name="type"
                    value={notificationForm.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded"
                  >
                    {VALID_NOTIFICATION_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Select Users</label>
                  <div className="border rounded max-h-60 overflow-y-auto">
                    {allUsers.map(user => (
                      <div key={user.id} className="p-2 border-b hover:bg-gray-50">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleUserSelect(user.id)}
                            className="rounded"
                          />
                          <span>{user.name} ({user.email})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                <button
                  onClick={() => { setShowMultiModal(false); resetForm(); setSelectedUsers([]); }}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={sendMultiNotification}
                  disabled={selectedUsers.length === 0}
                  className={`px-4 py-2 rounded-md ${selectedUsers.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white`}
                >
                  Send to {selectedUsers.length} Users
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsManager;
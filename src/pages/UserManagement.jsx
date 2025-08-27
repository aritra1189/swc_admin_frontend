import React, { useState, useEffect } from "react";
import {
  Eye,
  Ban,
  Unlock,
  MonitorSmartphone,
  School,
  Trash2,
  FileText,
  Download,
  RefreshCw
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useLocation } from "react-router-dom";
import { userAPI } from "./userApi";

// Hook to get URL query parameters
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const UserManagement = () => {
  const query = useQuery();
  const statusFromQuery = query.get("status");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showDeviceHistory, setShowDeviceHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // ---------------- Fetch Users ----------------
  const fetchUsers = async (limit = 50, offset = 0) => {
    try {
      setLoading(true);
      setError(null);

      const usersArray = await userAPI.getAllUsers(limit, offset);
      setUsers(usersArray);
    } catch (err) {
      setError(err.message || "Failed to fetch users");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (statusFromQuery) {
      setFilterStatus(statusFromQuery.toUpperCase());
    }
  }, [statusFromQuery]);

  // ---------------- User Actions ----------------
  const handleAssignAccess = async (userId) => {
    const accessClass = prompt("Enter class to give access:");
    if (!accessClass) return;

    try {
      await userAPI.assignClassAccess(userId, accessClass);

      const updated = users.map((user) =>
        user.id === userId
          ? {
              ...user,
              class: Array.isArray(user.class)
                ? [...new Set([...user.class, accessClass])]
                : [user.class, accessClass],
            }
          : user
      );
      setUsers(updated);
      alert("Class access assigned successfully!");
    } catch (err) {
      alert("Failed to assign class access: " + err.message);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      const newStatus = user.status === "ACTIVE" ? "inactive" : "ACTIVE";
      await userAPI.updateUserStatus(userId, newStatus);

      const updated = users.map((user) =>
        user.id === userId ? { ...user, status: newStatus } : user
      );
      setUsers(updated);
      alert(`User status updated to ${newStatus}`);
    } catch (err) {
      alert("Failed to update user status: " + err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await userAPI.deleteUser(userId);
      setUsers(users.filter((user) => user.id !== userId));
      alert("User deleted successfully!");
    } catch (err) {
      alert("Failed to delete user: " + err.message);
    }
  };

  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setShowProfile(true);
  };

  const handleDeviceHistory = (user) => {
    setSelectedUser(user);
    setShowDeviceHistory(true);
  };

  // ---------------- Export ----------------
  const handleExportExcel = () => {
    const formatted = users.map((user) => ({
      ID: user.id,
      Name: user.userDetail?.name || "N/A",
      Email: user.email,
      Mobile: user.userDetail?.mobileNumber || "N/A",
      Institution: user.userDetail?.institution || "N/A",
      Status: user.status,
      Created: user.createdAt,
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "users.xlsx");
  };

  const handleExportPDF = () => {
    const input = document.getElementById("user-table");
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let position = 0;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save("users.pdf");
    });
  };

  // ---------------- Filtering ----------------
  const filteredUsers = Array.isArray(users)
    ? users.filter((user) => {
        const matchesSearch =
          (user.userDetail?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesClass =
          !filterClass ||
          (user.userDetail?.institution || "").toLowerCase().includes(filterClass.toLowerCase());

        const matchesStatus =
          !filterStatus || user.status === filterStatus.toUpperCase();

        return matchesSearch && matchesClass && matchesStatus;
      })
    : [];

  // ---------------- Loading / Error ----------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 mx-auto text-blue-500" />
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button
            onClick={fetchUsers}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ---------------- Render ----------------
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            User Management Dashboard
          </h2>
          <div className="flex gap-2">
            <button
              onClick={fetchUsers}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 flex items-center gap-2"
            >
              <RefreshCw size={18} /> Refresh
            </button>
            <button
              onClick={handleExportExcel}
              className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600 flex items-center gap-2"
            >
              <FileText size={18} /> Export Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-600 flex items-center gap-2"
            >
              <Download size={18} /> Export PDF
            </button>
          </div>
        </div>

        <p className="text-gray-600 mb-6">
          Manage all users, view their profiles, and handle their access and status.
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Filter by institution..."
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="border border-gray-300 p-2.5 rounded-lg bg-white"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 p-2.5 rounded-lg bg-white"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table id="user-table" className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200 text-gray-700 uppercase tracking-wider">
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left hidden md:table-cell">Mobile</th>
                <th className="p-4 text-left">Institution</th>
                <th className="p-4 text-left hidden lg:table-cell">Age/Gender</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b border-gray-200 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-gray-100`}
                  >
                    <td className="p-4 font-medium text-gray-900">{user.userDetail?.name || "N/A"}</td>
                    <td className="p-4 text-gray-700">{user.email}</td>
                    <td className="p-4 text-gray-700 hidden md:table-cell">
                      {user.userDetail?.mobileNumber || "N/A"}
                    </td>
                    <td className="p-4 text-gray-700">
                      {user.userDetail?.institution || "N/A"}
                    </td>
                    <td className="p-4 text-gray-700 hidden lg:table-cell">
                      {user.userDetail?.age ? `${user.userDetail.age}/${user.userDetail.gender || ''}` : "N/A"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                          user.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-3 items-center text-gray-500">
                        <button 
                          onClick={() => handleAssignAccess(user.id)} 
                          title="Assign Class"
                          className="hover:text-blue-600 transition-colors duration-150"
                        >
                          <School size={20} />
                        </button>
                        <button 
                          onClick={() => handleViewProfile(user)} 
                          title="View Profile"
                          className="hover:text-green-600 transition-colors duration-150"
                        >
                          <Eye size={20} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          title={user.status === "ACTIVE" ? "Block User" : "Unblock User"}
                          className={`transition-colors duration-150 ${
                            user.status === "ACTIVE"
                              ? "hover:text-red-600"
                              : "hover:text-yellow-600"
                          }`}
                        >
                          {user.status === "ACTIVE" ? <Ban size={20} /> : <Unlock size={20} />}
                        </button>
                        <button 
                          onClick={() => handleDeviceHistory(user)} 
                          title="Device History"
                          className="hover:text-purple-600 transition-colors duration-150"
                        >
                          <MonitorSmartphone size={20} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)} 
                          title="Delete User"
                          className="hover:text-red-600 transition-colors duration-150"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-gray-500">
                    No users found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* User Profile Modal */}
        {showProfile && selectedUser && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm m-4">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">User Profile</h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>Name:</strong> {selectedUser.userDetail?.name || "N/A"}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Mobile:</strong> {selectedUser.userDetail?.mobileNumber || "N/A"}</p>
                <p><strong>Gender:</strong> {selectedUser.userDetail?.gender || "N/A"}</p>
                <p><strong>Age:</strong> {selectedUser.userDetail?.age || "N/A"}</p>
                <p><strong>Institution:</strong> {selectedUser.userDetail?.institution || "N/A"}</p>
                <p><strong>Address:</strong> {selectedUser.userDetail?.address || "N/A"}</p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                    selectedUser.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {selectedUser.status}
                  </span>
                </p>
                <p><strong>Created:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => setShowProfile(false)}
                className="mt-6 w-full bg-gray-700 text-white px-4 py-2.5 rounded-lg shadow hover:bg-gray-800 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Device History Modal */}
        {showDeviceHistory && selectedUser && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md m-4">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Device History</h3>
              <div className="space-y-2 text-gray-700">
                <p className="flex items-center gap-2"><MonitorSmartphone size={18} /> Device 1: Chrome - Windows 10</p>
                <p className="flex items-center gap-2"><MonitorSmartphone size={18} /> Device 2: Safari - iPhone</p>
                <p className="flex items-center gap-2"><MonitorSmartphone size={18} /> Device 3: Edge - Windows 11</p>
              </div>
              <button
                onClick={() => setShowDeviceHistory(false)}
                className="mt-6 w-full bg-gray-700 text-white px-4 py-2.5 rounded-lg shadow hover:bg-gray-800 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
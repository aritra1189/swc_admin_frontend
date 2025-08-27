// src/pages/AdminSemesterManagement.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from "../config/api";

export default function AdminSemesterManagement() {
  const [semesters, setSemesters] = useState([]);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    total: 0,
    status: "ACTIVE"
  });

  const token = localStorage.getItem("token");

  // ------------------------
  // Axios API Functions
  // ------------------------

  // GET: Get Semester List
  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/semester/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit: pagination.limit,
          offset: pagination.offset,
          status: pagination.status,
          keyword: ""
        }
      });
      setSemesters(response.data.result || []);
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch semesters");
    } finally {
      setLoading(false);
    }
  };

  // POST: Create Semester
  const createSemester = async (name) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/semester`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Semester created successfully");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create semester");
      throw error;
    }
  };

  // PATCH: Update Semester
  const updateSemester = async (id, name) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/semester/${id}`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Semester updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update semester");
      throw error;
    }
  };

  // PUT: Update Semester Status
  const updateSemesterStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "DEACTIVE" : "ACTIVE";
    try {
      await axios.put(
        `${API_BASE_URL}/semester/status/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
      throw error;
    }
  };

  // ------------------------
  // Component Logic
  // ------------------------
  useEffect(() => {
    fetchSemesters();
  }, [pagination.offset, pagination.status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning("Please enter a semester name");
      return;
    }

    try {
      if (editId) {
        await updateSemester(editId, name);
        setEditId(null);
      } else {
        await createSemester(name);
      }

      setName("");
      fetchSemesters();
    } catch (error) {
      console.error("Operation failed:", error);
    }
  };

  const handleEdit = (semester) => {
    setName(semester.name);
    setEditId(semester.id);
  };

  const handleStatusToggle = async (id, currentStatus) => {
    await updateSemesterStatus(id, currentStatus);
    fetchSemesters();
  };

  const handlePageChange = (newOffset) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  const handleStatusFilter = (status) => {
    setPagination(prev => ({ ...prev, status, offset: 0 }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Semester Management</h1>

      {/* Semester Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editId ? "Edit Semester" : "Create New Semester"}
        </h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Semester Name*</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
            required
          />
        </div>
        
        <div className="mt-6 flex justify-end space-x-4">
          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setName("");
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            {editId ? "Update Semester" : "Create Semester"}
          </button>
        </div>
      </form>

      {/* Status Filter */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => handleStatusFilter("ACTIVE")}
          className={`px-4 py-2 rounded ${
            pagination.status === "ACTIVE" 
              ? "bg-green-500 text-white" 
              : "bg-gray-200"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => handleStatusFilter("PENDING")}
          className={`px-4 py-2 rounded ${
            pagination.status === "PENDING" 
              ? "bg-yellow-500 text-white" 
              : "bg-gray-200"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => handleStatusFilter("DEACTIVE")}
          className={`px-4 py-2 rounded ${
            pagination.status === "DEACTIVE" 
              ? "bg-red-500 text-white" 
              : "bg-gray-200"
          }`}
        >
          Deactive
        </button>
      </div>

      {/* Semesters Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Semesters List</h2>
        
        {loading ? (
          <div className="text-center py-8">Loading semesters...</div>
        ) : semesters.length === 0 ? (
          <div className="text-center py-8">No semesters found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {semesters.map((semester, index) => (
                    <tr key={semester.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{pagination.offset + index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{semester.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                            semester.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : semester.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                          onClick={() => handleStatusToggle(semester.id, semester.status)}
                        >
                          {semester.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap space-x-2">
                        <button
                          onClick={() => handleEdit(semester)}
                          className="flex items-center px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 hover:bg-yellow-100 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <div>
                Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} semesters
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                  disabled={pagination.offset === 0}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                  disabled={pagination.offset + pagination.limit >= pagination.total}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
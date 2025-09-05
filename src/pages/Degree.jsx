// src/pages/AdminDegreeManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import Redux actions and selectors
import {
  fetchDegrees,
  createDegree,
  updateDegree,
  updateDegreeStatus,
  fetchAllUniversities,
  fetchConnectedUniversities,
  connectUniversitiesToDegree,
  removeUniversityConnection,
  selectDegrees,
  selectPagination,
  selectUniversities,
  selectConnectedUniversities,
  selectLoading,
  selectLoadingUniversities,
  selectLoadingConnections,
  resetDegreeState,
  updatePagination
} from "../store/degreeSlice";

export default function AdminDegreeManagement() {
  const dispatch = useDispatch();
  
  // Select state from Redux store
  const degrees = useSelector(selectDegrees);
  const pagination = useSelector(selectPagination);
  const universities = useSelector(selectUniversities);
  const connectedUniversities = useSelector(selectConnectedUniversities);
  const loading = useSelector(selectLoading);
  const loadingUniversities = useSelector(selectLoadingUniversities);
  const loadingConnections = useSelector(selectLoadingConnections);
  
  // Local component state
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [selectedDegree, setSelectedDegree] = useState(null);
  const [showUniversityModal, setShowUniversityModal] = useState(false);
  const [selectedUniversities, setSelectedUniversities] = useState([]);

  // Memoized fetch function to prevent infinite re-renders
  const fetchDegreesData = useCallback(() => {
    dispatch(fetchDegrees({
      limit: pagination.limit,
      offset: pagination.offset,
      status: pagination.status,
      keyword: ""
    }));
  }, [dispatch, pagination.limit, pagination.offset, pagination.status]);

  // ------------------------
  // Component Logic
  // ------------------------
  useEffect(() => {
    fetchDegreesData();
  }, [fetchDegreesData]);

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      dispatch(resetDegreeState());
    };
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning("Please enter a degree name");
      return;
    }

    try {
      if (editId) {
        await dispatch(updateDegree({ id: editId, name })).unwrap();
        setEditId(null);
      } else {
        await dispatch(createDegree({ name })).unwrap();
      }

      setName("");
      fetchDegreesData();
    } catch (error) {
      console.error("Operation failed:", error);
    }
  };

  const handleEdit = (degree) => {
    setName(degree.name);
    setEditId(degree.id);
  };

  const handleStatusToggle = async (id, currentStatus) => {
    await dispatch(updateDegreeStatus({ id, currentStatus })).unwrap();
    fetchDegreesData();
  };

  const handlePageChange = (newOffset) => {
    dispatch(updatePagination({ offset: newOffset }));
  };

  const handleStatusFilter = (status) => {
    dispatch(updatePagination({ status, offset: 0 }));
  };

  const handleOpenUniversityModal = async (degree) => {
    setSelectedDegree(degree);
    await dispatch(fetchAllUniversities()).unwrap();
    await dispatch(fetchConnectedUniversities(degree.id)).unwrap();
    setShowUniversityModal(true);
  };

  const handleUniversitySelection = (universityId) => {
    setSelectedUniversities(prev => 
      prev.includes(universityId) 
        ? prev.filter(id => id !== universityId) 
        : [...prev, universityId]
    );
  };

  const handleConnectUniversities = async () => {
    if (selectedUniversities.length === 0) {
      toast.warning("Please select at least one university");
      return;
    }
    await dispatch(connectUniversitiesToDegree({
      degreeId: selectedDegree.id,
      universityIds: selectedUniversities
    })).unwrap();
    setSelectedUniversities([]);
  };

  const handleRemoveUniversityConnection = async (connectionId) => {
    await dispatch(removeUniversityConnection({
      connectionId,
      degreeId: selectedDegree.id
    })).unwrap();
  };

  const handleCloseModal = () => {
    setShowUniversityModal(false);
    setSelectedDegree(null);
    setSelectedUniversities([]);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Degree Management</h1>

      {/* Degree Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editId ? "Edit Degree" : "Create New Degree"}
        </h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Degree Name*</label>
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
            {editId ? "Update Degree" : "Create Degree"}
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

      {/* Degrees Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Degrees List</h2>
        
        {loading ? (
          <div className="text-center py-8">Loading degrees...</div>
        ) : degrees.length === 0 ? (
          <div className="text-center py-8">No degrees found</div>
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
                  {degrees.map((degree, index) => (
                    <tr key={degree.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{pagination.offset + index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{degree.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                            degree.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : degree.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                          onClick={() => handleStatusToggle(degree.id, degree.status)}
                        >
                          {degree.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap space-x-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleEdit(degree)}
                            className="flex items-center px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 hover:bg-yellow-100 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>

                          <button
                            onClick={() => handleOpenUniversityModal(degree)}
                            className="flex items-center px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                            </svg>
                            Connect Universities
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <div>
                Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} degrees
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

      {/* University Connection Modal */}
      {showUniversityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Manage Universities for Degree: {selectedDegree?.name}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {/* Connected Universities */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Connected Universities</h3>
                {loadingConnections ? (
                  <div className="text-center py-4">Loading connections...</div>
                ) : connectedUniversities.length === 0 ? (
                  <p className="text-gray-500">No universities connected to this degree</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {connectedUniversities.map((connection) => (
                      <div key={connection.id} className="border rounded p-3 flex justify-between items-center">
                        <div className="flex items-center">
                          {connection.university?.icon && (
                            <img
                              src={connection.university.icon}
                              alt={connection.university.name}
                              className="h-8 w-8 rounded-full mr-2"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/32?text=U";
                              }}
                            />
                          )}
                          <span>{connection.university?.name}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveUniversityConnection(connection.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Universities */}
              <div>
                <h3 className="text-lg font-medium mb-2">Available Universities</h3>
                {loadingUniversities ? (
                  <div className="text-center py-4">Loading universities...</div>
                ) : universities.length === 0 ? (
                  <p className="text-gray-500">No available universities</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 max-h-60 overflow-y-auto">
                      {universities
                        .filter(university => !connectedUniversities.some(cu => cu.university.id === university.id))
                        .map(university => (
                          <div key={university.id} className="border rounded p-3 flex items-center">
                            <input
                              type="checkbox"
                              id={`university-${university.id}`}
                              checked={selectedUniversities.includes(university.id)}
                              onChange={() => handleUniversitySelection(university.id)}
                              className="mr-2"
                            />
                            <label htmlFor={`university-${university.id}`} className="flex items-center cursor-pointer">
                              {university.icon && (
                                <img
                                  src={university.icon}
                                  alt={university.name}
                                  className="h-8 w-8 rounded-full mr-2"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://via.placeholder.com/32?text=U";
                                  }}
                                />
                              )}
                              <span>{university.name}</span>
                            </label>
                          </div>
                        ))}
                    </div>
                    <button
                      onClick={handleConnectUniversities}
                      disabled={selectedUniversities.length === 0}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Connect Selected Universities
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
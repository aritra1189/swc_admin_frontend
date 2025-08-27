// src/components/SubjectMaster.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSubjects,
  createSubject,
  updateSubject,
  updateSubjectStatus,
  uploadSubjectImage,
  setSearch,
  setStatusFilter,
  setCurrentPage,
  clearError,
} from '../store/subjects/subjectSlice';
import { API_BASE_URL } from '../config/api';

const SubjectMaster = () => {
  const dispatch = useDispatch();
  const {
    items: subjects,
    loading,
    error,
    currentPage,
    total,
    statusFilter,
    search,
  } = useSelector((state) => state.subjects);

  const [modalOpen, setModalOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    status: 'ACTIVE',
    imageFile: null,
    imagePreview: '',
    existingImage: ''
  });

  // Get token from localStorage
  const getAuthToken = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.token;
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    }
    return null;
  };

  // Fetch subjects when page, filter, or search changes
  useEffect(() => {
    dispatch(fetchSubjects({ page: currentPage, statusFilter, search }));
  }, [dispatch, currentPage, statusFilter, search]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 'ACTIVE' : 'PENDING') : value
    }));
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      dispatch(clearError());
      // You might want to set a specific error here
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      dispatch(clearError());
      // You might want to set a specific error here
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData(prev => ({
      ...prev,
      imageFile: file,
      imagePreview: previewUrl,
      existingImage: ''
    }));
  };

  // Toggle subject status
  const handleStatusToggle = async (subjectId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PENDING' : 'ACTIVE';
    dispatch(updateSubjectStatus({ id: subjectId, status: newStatus }));
  };

  // Handle search input
  const handleSearch = (e) => {
    dispatch(setSearch(e.target.value));
    dispatch(setCurrentPage(1));
  };

  // Edit subject
  const handleEdit = (subject) => {
    setCurrentSubject(subject);
    setFormData({
      name: subject.name,
      status: subject.status,
      imageFile: null,
      imagePreview: '',
      existingImage: subject.image || ''
    });
    setModalOpen(true);
  };

  // Delete subject
  const handleDelete = async () => {
    if (subjectToDelete) {
      dispatch(updateSubjectStatus({ id: subjectToDelete.id, status: 'DELETED' }));
      setDeleteConfirm(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      status: 'ACTIVE',
      imageFile: null,
      imagePreview: '',
      existingImage: ''
    });
    setCurrentSubject(null);
    setModalOpen(false);
    dispatch(clearError());
  };

  // Upload image only (separate API call)
  const uploadImage = async (imageFile, subjectId) => {
    try {
      setUploadingImage(true);
      await dispatch(uploadSubjectImage({ id: subjectId, imageFile })).unwrap();
    } catch (err) {
      throw err;
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const subjectPayload = {
        name: formData.name,
        status: formData.status,
        image: formData.existingImage
      };

      if (currentSubject) {
        // Update existing subject
        await dispatch(updateSubject({ id: currentSubject.id, ...subjectPayload })).unwrap();
        
        // Upload new image if provided
        if (formData.imageFile) {
          await uploadImage(formData.imageFile, currentSubject.id);
        }
      } else {
        // Create new subject
        const newSubject = await dispatch(createSubject(subjectPayload)).unwrap();
        
        // Upload image if provided for new subject
        if (formData.imageFile && newSubject.id) {
          await uploadImage(formData.imageFile, newSubject.id);
        }
      }
      
      resetForm();
      // Refresh the list
      dispatch(fetchSubjects({ page: currentPage, statusFilter, search }));
    } catch (err) {
      // Error is already handled by the thunk
    }
  };

  // Remove image from form
  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: '',
      existingImage: ''
    }));
  };

  // Check if user is authenticated
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      // You might want to redirect to login or handle this differently
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Subject Management</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          {error.includes('session') || error.includes('log in') ? (
            <button 
              onClick={() => window.location.href = '/login'}
              className="ml-4 bg-blue-600 text-white px-3 py-1 rounded"
            >
              Login
            </button>
          ) : null}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            disabled={!getAuthToken()}
          >
            + Add Subject
          </button>

          <select
            value={statusFilter}
            onChange={(e) => dispatch(setStatusFilter(e.target.value))}
            className="border rounded px-3 py-2"
            disabled={!getAuthToken()}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING">PENDING</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Search subjects..."
          value={search}
          onChange={handleSearch}
          className="border rounded px-3 py-2 w-full md:w-64"
          disabled={!getAuthToken()}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <tr key={subject.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {subject.image ? (
                          <img
                            src={subject.image}
                            alt={subject.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-500">No Image</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {subject.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleStatusToggle(subject.id, subject.status)}
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            subject.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                          disabled={!getAuthToken()}
                        >
                          {subject.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(subject)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          disabled={!getAuthToken()}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSubjectToDelete(subject);
                            setDeleteConfirm(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          disabled={!getAuthToken()}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      {getAuthToken() ? 'No subjects found' : 'Please log in to view subjects'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {subjects.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * 10, total)}</span> of{' '}
                <span className="font-medium">{total}</span> results
              </p>
              <div className="space-x-2">
                <button
                  onClick={() => dispatch(setCurrentPage(Math.max(1, currentPage - 1)))}
                  disabled={currentPage === 1 || !getAuthToken()}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => dispatch(setCurrentPage(currentPage + 1))}
                  disabled={currentPage * 10 >= total || !getAuthToken()}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {currentSubject ? 'Edit Subject' : 'Add New Subject'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                    Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="border rounded w-full py-2 px-3"
                    required
                    disabled={!getAuthToken()}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Subject Image
                  </label>
                  <div className="flex items-center gap-4">
                    {formData.imagePreview ? (
                      <>
                        <div className="relative">
                          <img
                            src={formData.imagePreview}
                            alt="Preview"
                            className="h-16 w-16 rounded-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formData.imageFile?.name || 'New image'}
                        </span>
                      </>
                    ) : formData.existingImage ? (
                      <>
                        <div className="relative">
                          <img
                            src={formData.existingImage}
                            alt="Current"
                            className="h-16 w-16 rounded-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                        <span className="text-sm text-gray-500">Current image</span>
                      </>
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-500">No Image</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mt-2 border rounded w-full py-2 px-3"
                    disabled={uploadingImage || !getAuthToken()}
                  />
                  {uploadingImage && (
                    <p className="text-sm text-gray-500 mt-1">Uploading image...</p>
                  )}
                </div>

                <div className="mb-4 flex items-center">
                  <input
                    id="status"
                    name="status"
                    type="checkbox"
                    checked={formData.status === 'ACTIVE'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    disabled={!getAuthToken()}
                  />
                  <label htmlFor="status" className="ml-2 text-sm text-gray-700">
                    ACTIVE
                  </label>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    disabled={uploadingImage || !getAuthToken()}
                  >
                    {currentSubject ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
              <p className="mb-6">Are you sure you want to delete "{subjectToDelete?.name}"?</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  disabled={!getAuthToken()}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectMaster;
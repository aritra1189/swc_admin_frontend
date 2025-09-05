import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../config/api';

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBanners, setTotalBanners] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [editMode, setEditMode] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 10;

  // Get token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Configure axios defaults
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const statusOptions = [
    // { value: 'ALL', label: 'All Banners' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'PENDING', label: 'Pending Approval' },
    { value: 'SUSPENDED', label: 'Suspended' },
    { value: 'DEACTIVE', label: 'Inactive' },
    { value: 'DELETED', label: 'Deleted' }
  ];

  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    SUSPENDED: 'bg-purple-100 text-purple-800',
    DEACTIVE: 'bg-gray-200 text-gray-700',
    DELETED: 'bg-black text-white'
  };

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      const response = await axios.get(`${API_BASE_URL}/banner/list`, {
        params: {
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
          status: statusFilter === 'ALL' ? undefined : statusFilter
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Defensive checks for API response
      if (!response?.data) {
        throw new Error('No data received from server');
      }

      const bannersData = Array.isArray(response.data?.result) 
        ? response.data.result 
        : [];
      const total = response.data?.total || bannersData.length;

      const normalizedBanners = bannersData.map(banner => ({
        ...banner,
        image: banner?.image ? banner.image.replace(/\\/g, '/') : '',
        imagePath: banner?.imagePath ? banner.imagePath.replace(/\\/g, '/') : '',
        status: banner?.status || 'PENDING',
        createdAt: banner?.createdAt || new Date().toISOString()
      }));

      setBanners(normalizedBanners);
      setTotalBanners(total);
    } catch (error) {
      console.error('Error fetching banners:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        // You might want to redirect to login page here
      } else {
        toast.error(error.response?.data?.message || 'Failed to load banners');
      }
      setBanners([]);
      setTotalBanners(0);
    } finally {
      setLoading(false);
    }
  };

  const createBanner = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      toast.warning('Please select an image file');
      return;
    }

    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('file', imageFile);

      await axios.post(`${API_BASE_URL}/banner`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      toast.success('Banner uploaded for approval');
      setShowModal(false);
      setImageFile(null);
      fetchBanners();
    } catch (error) {
      console.error('Error creating banner:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to upload banner');
      }
    }
  };

  const updateBannerImage = async (e) => {
    e.preventDefault();
    if (!currentBanner?.id || !imageFile) {
      toast.warning('Missing required data');
      return;
    }

    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('file', imageFile);

      await axios.put(`${API_BASE_URL}/banner/update/${currentBanner.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      toast.success('Banner image updated successfully');
      setShowModal(false);
      setImageFile(null);
      setCurrentBanner(null);
      setEditMode(false);
      fetchBanners();
    } catch (error) {
      console.error('Error updating banner:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update banner');
      }
    }
  };

  const updateBannerStatus = async (id, newStatus) => {
    if (!id || !newStatus) return;

    try {
      const token = getAuthToken();
      await axios.put(`${API_BASE_URL}/banner/status/${id}`, { status: newStatus }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success(`Banner status updated to ${newStatus}`);
      fetchBanners();
    } catch (error) {
      console.error('Error updating status:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update banner status');
      }
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [currentPage, statusFilter]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Banner Management</h1>
        <button
          onClick={() => {
            setShowModal(true);
            setEditMode(false);
            setImageFile(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-900 text-white font-semibold rounded-md shadow hover:bg-indigo-700 transition duration-200"
        >
          Upload New Banner
        </button>
      </div>

      {/* Filter Section */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <label className="mr-3 font-medium">Filter:</label>
          <select
            className="border rounded-md px-3 py-2 w-64"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Banner List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-900"></div>
            <p className="mt-2">Loading banners...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No banners found matching your criteria
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded On</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {banners.map((banner) => (
                <tr key={banner.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {banner.image ? (
                      <img
                        src={banner.image}
                        alt="Banner"
                        className="h-16 w-auto object-cover rounded"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                        }}
                      />
                    ) : (
                      <div className="h-16 w-24 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[banner.status] || 'bg-gray-100 text-gray-800'}`}>
                      {banner.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(banner.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    <button
                      onClick={() => {
                        setEditMode(true);
                        setCurrentBanner(banner);
                        setShowModal(true);
                        setImageFile(null);
                      }}
                      className="px-4 py-2 bg-violet-600 text-white rounded-md shadow hover:bg-violet-500 transition text-sm"
                    >
                      Edit Image
                    </button>

                    {banner.status === 'PENDING' && (
                      <button
                        onClick={() => updateBannerStatus(banner.id, 'SUSPENDED')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-500 transition text-sm"
                      >
                        Reject
                      </button>
                    )}

                    <select
                      value={banner.status}
                      onChange={(e) => updateBannerStatus(banner.id, e.target.value)}
                      className="border rounded px-2 py-1 text-sm bg-white"
                    >
                      {statusOptions.filter(opt => opt.value !== 'ALL').map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalBanners > itemsPerPage && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          
          {Array.from({ length: Math.ceil(totalBanners / itemsPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-indigo-900 text-white' : 'bg-gray-200'}`}
            >
              {i + 1}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalBanners / itemsPerPage)))}
            disabled={currentPage === Math.ceil(totalBanners / itemsPerPage)}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-medium">
                {editMode ? 'Update Banner Image' : 'Upload New Banner'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setImageFile(null);
                  setCurrentBanner(null);
                  setEditMode(false);
                }}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={editMode ? updateBannerImage : createBanner}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Banner Image
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setImageFile(e.target.files?.[0])}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    JPEG, PNG, or WEBP (Max 5MB)
                  </p>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setImageFile(null);
                      setCurrentBanner(null);
                      setEditMode(false);
                    }}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!imageFile}
                    className={`px-4 py-2 rounded-md shadow transition ${!imageFile ? 'bg-gray-300 cursor-not-allowed' : 'bg-teal-700 text-white hover:bg-teal-600'}`}
                  >
                    {editMode ? 'Update Image' : 'Upload Banner'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerManagement;
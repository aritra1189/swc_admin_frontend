import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const AdminPages = () => {
  const [pages, setPages] = useState([]);
  const [editingPage, setEditingPage] = useState(null);
  const [formData, setFormData] = useState({ title: '', desc: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/pages/all`);
      if (!response.ok) {
        throw new Error('Failed to fetch pages.');
      }
      const data = await response.json();
      setPages(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (page) => {
    setEditingPage(page.id);
    setFormData({ title: page.title, desc: page.desc || page.content || '' });
    setValidationError(null);
  };

  const handleCancelClick = () => {
    setEditingPage(null);
    setFormData({ title: '', desc: '' });
    setValidationError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    // Clear validation error when user starts typing
    if (validationError) setValidationError(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      setError('Authentication token not found. Please log in.');
      return;
    }

    // Client-side validation
    if (!formData.desc || formData.desc.trim().length < 50) {
      setValidationError('Description must be at least 50 characters long.');
      return;
    }

    if (formData.desc.length > 100000) {
      setValidationError('Description must be less than 100,000 characters.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/pages/${editingPage}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          desc: formData.desc
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update page.');
      }

      await fetchPages();
      handleCancelClick();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Admin Page Management</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">All Pages</h2>
        {pages.length === 0 ? (
          <p className="text-gray-500">No pages found.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {pages.map((page) => (
              <li key={page.id} className="py-4">
                {editingPage === page.id ? (
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="desc" className="block text-sm font-medium text-gray-700">
                        Content
                        <span className="text-xs text-gray-500 ml-1">
                          ({formData.desc.length}/100,000 characters)
                        </span>
                      </label>
                      <textarea
                        name="desc"
                        value={formData.desc}
                        onChange={handleInputChange}
                        rows="8"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                      {validationError && (
                        <p className="mt-1 text-sm text-red-600">{validationError}</p>
                      )}
                      {formData.desc.length < 50 && (
                        <p className="mt-1 text-sm text-amber-600">
                          Minimum {50 - formData.desc.length} more characters required.
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        disabled={formData.desc.length < 50 || formData.desc.length > 100000}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelClick}
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{page.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {page.desc ? (
                          page.desc.substring(0, 150) + (page.desc.length > 150 ? '...' : '')
                        ) : (
                          page.content ? (
                            page.content.substring(0, 150) + (page.content.length > 150 ? '...' : '')
                          ) : 'No content'
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEditClick(page)}
                      className="inline-flex justify-center rounded-md border border-transparent bg-yellow-500 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminPages;
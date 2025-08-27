import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../config/api';

const NewsManagement = () => {
  const { user } = useAuth();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalNews, setTotalNews] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentNews, setCurrentNews] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    heading: '',
    desc: '',
  });

  useEffect(() => {
    fetchNews();
  }, [currentPage, searchKeyword]);

  const placeholderImage =
    'https://via.placeholder.com/300x200?text=Image+Not+Available';

  const buildImageUrl = (imagePath) => {
    if (!imagePath || imagePath.includes('index.html')) {
      return placeholderImage;
    }
    return imagePath.startsWith('http')
      ? imagePath
      : `${API_BASE_URL}${imagePath}`;
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/news/list`, {
        params: {
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
          keyword: searchKeyword,
        },
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const processedNews = response.data.result.map((item) => ({
        ...item,
        image: buildImageUrl(item.image),
      }));

      setNews(processedNews);
      setTotalNews(response.data.total);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/news`, formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const createdNews = response.data;

      let finalNews = {
        ...createdNews,
        image: buildImageUrl(createdNews.image),
      };

      if (imageFile) {
        const imgFormData = new FormData();
        imgFormData.append('file', imageFile);

        await axios.put(`${API_BASE_URL}/news/image/${createdNews.id}`, imgFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user.token}`,
          },
        });

        const updatedResponse = await axios.get(
          `${API_BASE_URL}/news/${createdNews.id}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        finalNews = {
          ...updatedResponse.data,
          image: buildImageUrl(updatedResponse.data.image),
        };
      }

      setNews((prevNews) => [finalNews, ...prevNews]);
      toast.success('News created successfully');
      resetForm();
    } catch (error) {
      console.error('Error creating news:', error);
      toast.error(error.response?.data?.message || 'Failed to create news');
    }
  };

  const handleEdit = (newsItem) => {
    setEditMode(true);
    setCurrentNews(newsItem);
    setFormData({
      heading: newsItem.heading,
      desc: newsItem.desc,
    });
    setImagePreview(newsItem.image !== placeholderImage ? newsItem.image : '');
    setShowModal(true);
  };

  const updateNews = async (e) => {
    e.preventDefault();
    try {
      // First update the news data
      const updatedData = { ...formData };
      await axios.patch(`${API_BASE_URL}/news/${currentNews.id}`, updatedData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      // Then update the image if a new one was selected
      if (imageFile) {
        const imgFormData = new FormData();
        imgFormData.append('file', imageFile);

        await axios.put(`${API_BASE_URL}/news/image/${currentNews.id}`, imgFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user.token}`,
          },
        });
      }

      toast.success('News updated successfully');
      resetForm();
      fetchNews(); // Refresh the list to show updated data
    } catch (error) {
      console.error('Error updating news:', error);
      toast.error(error.response?.data?.message || 'Failed to update news');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this news item?')) {
      try {
        await axios.delete(`${API_BASE_URL}/news/${id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        toast.success('News deleted successfully');
        fetchNews();
      } catch (error) {
        console.error('Error deleting news:', error);
        toast.error('Failed to delete news');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      heading: '',
      desc: '',
    });
    setImageFile(null);
    setImagePreview('');
    setCurrentNews(null);
    setEditMode(false);
    setShowModal(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">News Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Add News
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search news..."
          value={searchKeyword}
          onChange={(e) => {
            setSearchKeyword(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full max-w-md px-4 py-2 border rounded"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading news...</p>
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No news found</div>
      ) : (
        <div className="grid gap-6">
          {news.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="md:flex">
                {item.image && (
                  <div className="md:w-1/3">
                    <img
                      src={item.image}
                      alt={item.heading}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.src = placeholderImage;
                      }}
                    />
                  </div>
                )}
                <div
                  className={`p-6 ${
                    item.image ? 'md:w-2/3' : 'w-full'
                  }`}
                >
                  <h2 className="text-xl font-bold mb-2">{item.heading}</h2>
                  <p className="text-gray-600 mb-4">{item.desc}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalNews > itemsPerPage && (
        <div className="flex justify-center mt-8">
          <nav className="inline-flex rounded-md shadow">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-l-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from(
              { length: Math.ceil(totalNews / itemsPerPage) },
              (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-4 py-2 border-t border-b border-gray-300 ${
                    currentPage === i + 1
                      ? 'bg-blue-50 text-blue-600 border-blue-500'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              )
            )}
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, Math.ceil(totalNews / itemsPerPage))
                )
              }
              disabled={currentPage === Math.ceil(totalNews / itemsPerPage)}
              className="px-4 py-2 rounded-r-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-medium">
                {editMode ? 'Edit News' : 'Add New News'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={editMode ? updateNews : handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Heading
                  </label>
                  <input
                    type="text"
                    name="heading"
                    value={formData.heading}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Description
                  </label>
                  <textarea
                    name="desc"
                    value={formData.desc}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border rounded"
                    required
                  ></textarea>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border rounded"
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-32 object-contain"
                        onError={(e) => {
                          e.target.src = placeholderImage;
                        }}
                      />
                    </div>
                  )}
                  {editMode &&
                    currentNews?.image &&
                    !imagePreview &&
                    currentNews.image !== placeholderImage && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">Current Image:</p>
                        <img
                          src={currentNews.image}
                          alt="Current"
                          className="h-32 object-contain"
                          onError={(e) => {
                            e.target.src = placeholderImage;
                          }}
                        />
                      </div>
                    )}
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editMode ? 'Update News' : 'Add News'}
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

export default NewsManagement;
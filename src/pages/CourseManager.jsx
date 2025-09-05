// components/CourseManager.js
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  searchCourses,
  setFilters,
  setThumbnailUpdating,
} from '../store/courseSlice';
import { uploadImage } from '../config/imageUpload';

const CourseManager = () => {
  const dispatch = useDispatch();
  const { courses, loading, error, totalCount, filters, thumbnailUpdating } = useSelector(state => state.courses);
  
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDiscount, setShowDiscount] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    price: 0,
    discountPrice: 0,
    accessType: 'FREE',
    status: 'ACTIVE',
    totalDuration: 0,
    totalLectures: 0,
    level: '',
    requirements: '',
    whatYouWillLearn: '',
    unitIds: []
  });

  useEffect(() => {
    dispatch(fetchCourses(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    if (formData.accessType === 'FREE') {
      setFormData(prev => ({
        ...prev,
        price: 0,
        discountPrice: 0
      }));
      setShowDiscount(false);
    }
  }, [formData.accessType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const submitData = { ...formData };
    
    if (submitData.accessType === 'FREE') {
      submitData.price = 0;
      submitData.discountPrice = 0;
    }
    
    if (!showDiscount && submitData.accessType === 'PAID') {
      submitData.discountPrice = submitData.price;
    }
    
    try {
      if (editingCourse) {
        // For editing, update the course
        await dispatch(updateCourse({ id: editingCourse.id, data: submitData })).unwrap();
      } else {
        // For new course, create it
        await dispatch(createCourse(submitData)).unwrap();
      }
      
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save course:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    try {
      dispatch(setThumbnailUpdating(true));
      
      // Upload the image using the correct field name
      const imageUrl = await uploadImage(file, editingCourse?.id || null);
      
      // Update form data with the uploaded image URL
      setFormData(prev => ({
        ...prev,
        imageUrl: imageUrl
      }));
      
      // If editing an existing course, update it with the new image URL
      if (editingCourse) {
        await dispatch(updateCourse({
          id: editingCourse.id,
          data: { ...formData, imageUrl }
        })).unwrap();
      }
      
    } catch (error) {
      alert('Failed to upload image: ' + error.message);
      setImagePreview(null);
    } finally {
      dispatch(setThumbnailUpdating(false));
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      imageUrl: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    
    const hasDiscount = course.discountPrice !== course.price && course.discountPrice > 0;
    
    setFormData({
      name: course.name,
      description: course.description || '',
      imageUrl: course.imageUrl || '',
      price: course.price || 0,
      discountPrice: course.discountPrice || 0,
      accessType: course.accessType || 'FREE',
      status: course.status || 'ACTIVE',
      totalDuration: course.totalDuration || 0,
      totalLectures: course.totalLectures || 0,
      level: course.level || '',
      requirements: course.requirements || '',
      whatYouWillLearn: course.whatYouWillLearn || '',
      unitIds: course.units ? course.units.map(unit => unit.id) : []
    });
    
    // Set image preview if editing a course with an image
    if (course.imageUrl) {
      setImagePreview(course.imageUrl);
    }
    
    setShowDiscount(hasDiscount);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      dispatch(deleteCourse(id));
    }
  };

  const handleSearch = () => {
    if (searchQuery) {
      dispatch(setFilters({ 
        keyword: searchQuery,
        offset: 0 // Reset to first page when searching
      }));
    } else {
      dispatch(setFilters({ keyword: '' }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      price: 0,
      discountPrice: 0,
      accessType: 'FREE',
      status: 'ACTIVE',
      totalDuration: 0,
      totalLectures: 0,
      level: '',
      requirements: '',
      whatYouWillLearn: '',
      unitIds: []
    });
    setShowDiscount(false);
    setEditingCourse(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleDiscount = () => {
    setShowDiscount(!showDiscount);
    if (showDiscount) {
      setFormData(prev => ({
        ...prev,
        discountPrice: prev.price
      }));
    }
  };

  const updateFilter = (key, value) => {
    dispatch(setFilters({ [key]: value, offset: 0 }));
  };

  const handlePagination = (direction) => {
    const newOffset = direction === 'next' 
      ? filters.offset + filters.limit
      : Math.max(0, filters.offset - filters.limit);
    
    dispatch(setFilters({ offset: newOffset }));
  };

  const PriceDisplay = ({ course }) => {
    if (course.accessType === 'FREE') {
      return <span className="text-green-600 font-medium">Free</span>;
    }
    
    const hasDiscount = course.discountPrice !== course.price && course.discountPrice > 0;
    
    return (
      <div className="flex flex-col items-end">
        {hasDiscount ? (
          <>
            <span className="text-red-600 line-through text-sm">₹{course.price}</span>
            <span className="text-green-600 font-medium">₹{course.discountPrice}</span>
          </>
        ) : (
          <span className="text-green-600 font-medium">₹{course.price}</span>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Course Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full sm:w-auto"
        >
          Add New Course
        </button>
      </div>

      {/* Filters and Search Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="DELETED">Deleted</option>
            </select>
          </div>
          
          {/* Access Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Access Type</label>
            <select
              value={filters.accessType}
              onChange={(e) => updateFilter('accessType', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Types</option>
              <option value="FREE">Free</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
          
          {/* Search Input */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Courses</label>
            <div className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search courses..."
                className="flex-1 p-2 border border-gray-300 rounded-l-md"
              />
              <button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md"
              >
                Search
              </button>
            </div>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex flex-col gap-2 md:col-span-2 md:flex-row md:justify-end">
            <button
              onClick={() => updateFilter('accessType', 'FREE')}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm"
            >
              Free Courses
            </button>
            <button
              onClick={() => updateFilter('accessType', 'PAID')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm"
            >
              Paid Courses
            </button>
            <button
              onClick={() => {
                dispatch(setFilters({
                  status: '',
                  accessType: '',
                  keyword: '',
                  offset: 0
                }));
                setSearchQuery('');
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
        
        {/* Pagination Controls */}
        {totalCount > 10 && (
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Showing {filters.offset + 1} to {Math.min(filters.offset + filters.limit, totalCount)} of {totalCount} courses
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePagination('prev')}
                disabled={filters.offset === 0}
                className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300"
              >
                Previous
              </button>
              <button
                onClick={() => handlePagination('next')}
                disabled={filters.offset + filters.limit >= totalCount}
                className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading courses...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error.message || 'An error occurred'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses && courses.length > 0 ? (
            courses.map(course => (
              <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {course.imageUrl && (
                  <img 
                    src={course.imageUrl} 
                    alt={course.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">{course.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      course.accessType === 'FREE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {course.accessType}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {course.description}
                  </p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-500">
                      {course.totalLectures} lectures • {course.totalDuration} mins
                    </span>
                    <PriceDisplay course={course} />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      course.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : course.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                    {course.status}
                    </span>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(course)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">No courses found. Try adjusting your filters or add a new course.</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Access Type *</label>
                    <select
                      name="accessType"
                      value={formData.accessType}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="FREE">Free</option>
                      <option value="PAID">Paid</option>
                    </select>
                  </div>
                  
                  {formData.accessType === 'PAID' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          required
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div className="flex flex-col">
                        <div className="flex items-center mb-1">
                          <input
                            type="checkbox"
                            id="applyDiscount"
                            checked={showDiscount}
                            onChange={toggleDiscount}
                            className="mr-2"
                          />
                          <label htmlFor="applyDiscount" className="text-sm font-medium text-gray-700">
                            Apply Discount
                          </label>
                        </div>
                        
                        {showDiscount ? (
                          <input
                            type="number"
                            name="discountPrice"
                            value={formData.discountPrice}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            max={formData.price}
                            required
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="Discount price"
                          />
                        ) : (
                          <input
                            type="number"
                            value={formData.price}
                            disabled
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                          />
                        )}
                      </div>
                    </>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                    <input
                      type="text"
                      name="level"
                      value={formData.level}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  {/* Image Upload Section */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Image</label>
                    
                    {imagePreview ? (
                      <div className="relative mb-3">
                        <img 
                          src={imagePreview} 
                          alt="Course preview" 
                          className="w-full h-48 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {thumbnailUpdating ? (
                              <>
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mb-2 text-sm text-gray-500">Uploading image...</p>
                              </>
                            ) : (
                              <>
                                <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                </svg>
                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 5MB)</p>
                              </>
                            )}
                          </div>
                          <input 
                            id="dropzone-file" 
                            type="file" 
                            className="hidden" 
                            onChange={handleImageUpload}
                            accept="image/*"
                            ref={fileInputRef}
                            disabled={thumbnailUpdating}
                          />
                        </label>
                      </div>
                    )}
                    
                    {/* Hidden input to store the image URL for form submission */}
                    <input
                      type="hidden"
                      name="imageUrl"
                      value={formData.imageUrl}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                    <textarea
                      name="requirements"
                      value={formData.requirements}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Separate requirements with commas"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">What You'll Learn</label>
                    <textarea
                      name="whatYouWillLearn"
                      value={formData.whatYouWillLearn}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Separate learning points with commas"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Duration (minutes)</label>
                    <input
                      type="number"
                      name="totalDuration"
                      value={formData.totalDuration}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Lectures</label>
                    <input
                      type="number"
                      name="totalLectures"
                      value={formData.totalLectures}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    disabled={thumbnailUpdating}
                  >
                    {thumbnailUpdating ? 'Uploading...' : (editingCourse ? 'Update' : 'Create')} Course
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

export default CourseManager;
// src/components/McqTestManagement.js
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSubjects,
  fetchUnits,
  fetchMcqTests,
  fetchMcqTestsByUser,
  addMcqTest,
  updateMcqTest,
  uploadThumbnail,
  setSelectedSubject,
  setSelectedUnit,
  setTitle,
  setDescription,
  setTimeLimit,
  setPrice,
  setAccessTypes,
  setEditingTest,
  setFilter,
  clearFilters,
  setMessage,
  resetForm,
  setUserView,
} from "../store/McqTestSlice";
import { API_BASE_URL } from "../config/api";

// Safe selector hook
const useMcqTestState = () => {
  const state = useSelector((state) => state.mcqTest || {});
  
  return {
    subjects: state.subjects || [],
    units: state.units || [],
    filteredSubjects: state.filteredSubjects || [],
    mcqTests: state.mcqTests || [],
    loading: state.loading || false,
    selectedSubject: state.selectedSubject || "",
    selectedUnit: state.selectedUnit || "",
    message: state.message || "",
    title: state.title || "",
    description: state.description || "",
    timeLimit: state.timeLimit || 30,
    price: state.price || 0,
    accessTypes: state.accessTypes || "FREE",
    editingTest: state.editingTest || null,
    filters: state.filters || {
      grade: "",
      stream: "",
      semester: "",
      degree: "",
      university: "",
      subjectName: "",
      accessTypes: ""
    },
    filterOptions: state.filterOptions || {
      grades: [],
      streams: [],
      semesters: [],
      degrees: [],
      universities: [],
      subjectNames: []
    },
    userView: state.userView || false,
  };
};

const McqTestManagement = () => {
  const dispatch = useDispatch();
  const state = useMcqTestState();
  
  const {
    subjects,
    units,
    filteredSubjects,
    mcqTests,
    loading,
    selectedSubject,
    selectedUnit,
    message,
    title,
    description,
    timeLimit,
    price,
    accessTypes,
    editingTest,
    filters,
    filterOptions,
    userView,
  } = state;

  // Fetch subjects on mount
  useEffect(() => {
    dispatch(fetchSubjects());
  }, [dispatch]);

  // Fetch units when subject is selected
  useEffect(() => {
    if (selectedSubject) {
      dispatch(fetchUnits(selectedSubject));
    }
  }, [selectedSubject, dispatch]);

  // Fetch MCQ tests when unit is selected or filters change
  useEffect(() => {
    if (selectedUnit) {
      if (userView) {
        dispatch(fetchMcqTestsByUser({ 
          unitId: selectedUnit, 
          accessTypeFilter: filters.accessTypes 
        }));
      } else {
        dispatch(fetchMcqTests({ 
          unitId: selectedUnit, 
          accessTypeFilter: filters.accessTypes 
        }));
      }
    }
  }, [selectedUnit, filters.accessTypes, userView, dispatch]);

  // Function to fix thumbnail URL
  const fixThumbnailUrl = (url) => {
    if (!url) return null;
    
    // Replace backslashes with forward slashes
    let fixedUrl = url.replace(/\\/g, '/');
    
    // If the URL contains localhost but our API_BASE_URL is different, replace it
    if (fixedUrl.includes('localhost') && !API_BASE_URL.includes('localhost')) {
      const urlPath = fixedUrl.split('/').slice(3).join('/');
      fixedUrl = `${API_BASE_URL}/${urlPath}`;
    }
    
    return fixedUrl;
  };

  // Add new MCQ test
  const handleAddMcqTest = async (e) => {
    e.preventDefault();
    if (!selectedSubject || !selectedUnit || !title.trim()) {
      dispatch(setMessage("Please fill all required fields."));
      return;
    }

    try {
      await dispatch(addMcqTest({
        subjectId: selectedSubject,
        unitId: selectedUnit,
        title,
        description,
        timeLimit: parseInt(timeLimit) || 30,
        price: accessTypes === "PAID" ? parseFloat(price) : 0,
        accessTypes
      })).unwrap();
      
      dispatch(resetForm());
      if (userView) {
        dispatch(fetchMcqTestsByUser({ 
          unitId: selectedUnit, 
          accessTypeFilter: filters.accessTypes 
        }));
      } else {
        dispatch(fetchMcqTests({ 
          unitId: selectedUnit, 
          accessTypeFilter: filters.accessTypes 
        }));
      }
    } catch (err) {
      console.error("Error adding MCQ test:", err);
    }
  };

  // Update MCQ test
  const handleUpdateMcqTest = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      dispatch(setMessage("Please fill all required fields."));
      return;
    }

    try {
      await dispatch(updateMcqTest({
        id: editingTest.id,
        data: {
          title,
          description,
          timeLimit: parseInt(timeLimit) || 30,
          price: accessTypes === "PAID" ? parseFloat(price) : 0,
          accessTypes
        }
      })).unwrap();
      
      dispatch(resetForm());
      if (userView) {
        dispatch(fetchMcqTestsByUser({ 
          unitId: selectedUnit, 
          accessTypeFilter: filters.accessTypes 
        }));
      } else {
        dispatch(fetchMcqTests({ 
          unitId: selectedUnit, 
          accessTypeFilter: filters.accessTypes 
        }));
      }
    } catch (err) {
      console.error("Error updating MCQ test:", err);
    }
  };

  // Handle edit MCQ test
  const handleEditMcqTest = (test) => {
    dispatch(setEditingTest(test));
  };

  // Cancel edit
  const cancelEdit = () => {
    dispatch(resetForm());
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = async (file, testId) => {
    try {
      dispatch(setMessage("⏳ Uploading thumbnail..."));
      await dispatch(uploadThumbnail({ testId, file })).unwrap();
      if (userView) {
        dispatch(fetchMcqTestsByUser({ 
          unitId: selectedUnit, 
          accessTypeFilter: filters.accessTypes 
        }));
      } else {
        dispatch(fetchMcqTests({ 
          unitId: selectedUnit, 
          accessTypeFilter: filters.accessTypes 
        }));
      }
    } catch (err) {
      console.error("Error uploading thumbnail:", err);
    }
  };

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    dispatch(setFilter({ filterType, value }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  // Toggle between admin and user view
  const toggleView = () => {
    dispatch(setUserView(!userView));
    dispatch(resetForm());
    dispatch(setSelectedSubject(""));
    dispatch(setSelectedUnit(""));
  };

  // Format subject display name with all relevant information
  const formatSubjectName = (subject) => {
    let name = subject.subMaster?.name || 'Unknown Subject';
    if (subject.grade?.name) name += ` - ${subject.grade.name}`;
    if (subject.stream?.name) name += ` - ${subject.stream.name}`;
    if (subject.semester?.name) name += ` - ${subject.semester.name}`;
    if (subject.degree?.name) name += ` - ${subject.degree.name}`;
    if (subject.university?.name) name += ` - ${subject.university.name}`;
    return name;
  };

  // Safely format price with toFixed
  const formatPrice = (priceValue) => {
    if (priceValue === null || priceValue === undefined) return "0.00";
    
    const numericPrice = typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue;
    
    if (isNaN(numericPrice)) return "0.00";
    
    return numericPrice.toFixed(2);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white shadow rounded-lg p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">MCQ Test Management</h2>
          <button
            onClick={toggleView}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            {userView ? 'Admin View' : 'User View'}
          </button>
        </div>

        {/* Filters Section */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Filter Subjects</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filters.subjectName}
                onChange={(e) => handleFilterChange('subjectName', e.target.value)}
              >
                <option value="">All Subjects</option>
                {filterOptions.subjectNames.map((name, index) => (
                  <option key={index} value={name}>{name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filters.grade}
                onChange={(e) => handleFilterChange('grade', e.target.value)}
              >
                <option value="">All Grades</option>
                {filterOptions.grades.map((grade, index) => (
                  <option key={index} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filters.stream}
                onChange={(e) => handleFilterChange('stream', e.target.value)}
              >
                <option value="">All Streams</option>
                {filterOptions.streams.map((stream, index) => (
                  <option key={index} value={stream}>{stream}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filters.semester}
                onChange={(e) => handleFilterChange('semester', e.target.value)}
              >
                <option value="">All Semesters</option>
                {filterOptions.semesters.map((semester, index) => (
                  <option key={index} value={semester}>{semester}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filters.degree}
                onChange={(e) => handleFilterChange('degree', e.target.value)}
              >
                <option value="">All Degrees</option>
                {filterOptions.degrees.map((degree, index) => (
                  <option key={index} value={degree}>{degree}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filters.university}
                onChange={(e) => handleFilterChange('university', e.target.value)}
              >
                <option value="">All Universities</option>
                {filterOptions.universities.map((university, index) => (
                  <option key={index} value={university}>{university}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Access Type</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filters.accessTypes}
                onChange={(e) => handleFilterChange('accessTypes', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="FREE">Free</option>
                <option value="PAID">Paid</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </div>
          </div>
          
          <div className="mt-3">
            <button
              onClick={handleClearFilters}
              className="bg-gray-500 text-white px-4 py-2 rounded text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Subject and Unit Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Subject
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2"
              value={selectedSubject}
              onChange={(e) => {
                dispatch(setSelectedSubject(e.target.value));
                if (e.target.value) {
                  dispatch(fetchUnits(e.target.value));
                }
              }}
            >
              <option value="">-- Select Subject --</option>
              {filteredSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {formatSubjectName(subject)}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {filteredSubjects.length} subject(s) found
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Unit
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2"
              value={selectedUnit}
              onChange={(e) => {
                dispatch(setSelectedUnit(e.target.value));
                if (e.target.value) {
                  if (userView) {
                    dispatch(fetchMcqTestsByUser({ 
                      unitId: e.target.value, 
                      accessTypeFilter: filters.accessTypes 
                    }));
                  } else {
                    dispatch(fetchMcqTests({ 
                      unitId: e.target.value, 
                      accessTypeFilter: filters.accessTypes 
                    }));
                  }
                }
              }}
              disabled={!selectedSubject}
            >
              <option value="">-- Select Unit --</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add/Edit MCQ Test Form (Only in Admin View) */}
        {!userView && selectedUnit && (
          <form onSubmit={editingTest ? handleUpdateMcqTest : handleAddMcqTest} className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              {editingTest ? 'Edit MCQ Test' : 'Add New MCQ Test'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={title}
                  onChange={(e) => dispatch(setTitle(e.target.value))}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (minutes) *</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={timeLimit}
                  onChange={(e) => dispatch(setTimeLimit(e.target.value))}
                  min="1"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-2"
                value={description}
                onChange={(e) => dispatch(setDescription(e.target.value))}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Access Type</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={accessTypes}
                  onChange={(e) => dispatch(setAccessTypes(e.target.value))}
                >
                  <option value="FREE">Free</option>
                  <option value="PAID">Paid</option>
                  <option value="PREMIUM">Premium</option>
                </select>
              </div>
              
              {accessTypes !== "FREE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={price}
                    onChange={(e) => dispatch(setPrice(e.target.value))}
                    min="0"
                    step="0.01"
                    required={accessTypes !== "FREE"}
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {editingTest ? 'Update MCQ Test' : 'Add MCQ Test'}
              </button>
              {editingTest && (
                <button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        {/* Show message */}
        {message && (
          <p
            className={`text-sm mb-4 p-2 rounded ${
              message.includes("✅") || message.includes("⏳") ? "text-green-700 bg-green-100" : 
              message.includes("❌") ? "text-red-700 bg-red-100" :
              "text-blue-700 bg-blue-100"
            }`}
          >
            {message}
          </p>
        )}

        {/* MCQ Tests List */}
        {selectedUnit && (
          <>
            <h3 className="text-lg font-semibold mb-4">MCQ Tests</h3>
            {loading ? (
              <p>Loading MCQ tests...</p>
            ) : mcqTests.length === 0 ? (
              <p>No MCQ tests found for this unit.</p>
            ) : (
              <div className="space-y-4">
                {mcqTests.map((test) => (
                  <div key={test.id} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        {/* Thumbnail */}
                        {test.thumbnailUrl && (
                          <img
                            src={fixThumbnailUrl(test.thumbnailUrl)}
                            alt="Thumbnail"
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        
                        <div>
                          <h4 className="text-md font-semibold">{test.title}</h4>
                          <p className="text-sm text-gray-600">{test.description}</p>
                          <p className="text-sm text-gray-600">
                            Time Limit: {test.timeLimit || 'N/A'} mins | Access: {test.accessTypes} | Price: ${formatPrice(test.price)}
                          </p>
                        </div>
                      </div>
                      
                      {!userView && (
                        <div className="mt-3 md:mt-0 flex items-center gap-3">
                          {/* Upload Thumbnail */}
                          <label className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg cursor-pointer">
                            Upload Thumbnail
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files.length > 0) {
                                  handleThumbnailUpload(e.target.files[0], test.id);
                                  e.target.value = null; // Reset file input
                                }
                              }}
                            />
                          </label>
                          
                          {/* Edit Button */}
                          <button
                            onClick={() => handleEditMcqTest(test)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg"
                          >
                            Edit
                          </button>
                          
                          {/* View Questions Button */}
                          <button
                            onClick={() => {
                              // Navigate to questions management for this test
                              console.log("Navigate to questions for test:", test.id);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg"
                          >
                            Questions
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default McqTestManagement;
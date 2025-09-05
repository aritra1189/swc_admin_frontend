// src/components/McqTestManagement.js
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSubjectsAndCourses,
  fetchUnits,
  fetchMcqTests,
  addMcqTest,
  updateMcqTest,
  uploadThumbnail,
  setActiveTab,
  setSelectedSubject,
  setSelectedCourse,
  setSelectedSubjectUnit,
  setSelectedCourseUnit,
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
  setvalidityDays, // Add this import
} from "../store/McqTestSlice";
import { API_BASE_URL } from "../config/api";

// Safe selector hook
const useMcqTestState = () => {
  const state = useSelector((state) => state.mcqTest || {});
  
  return {
    activeTab: state.activeTab || "subjects",
    subjects: state.subjects || [],
    courses: state.courses || [],
    subjectUnits: state.subjectUnits || [],
    courseUnits: state.courseUnits || [],
    subjectMcqTests: state.subjectMcqTests || [],
    courseMcqTests: state.courseMcqTests || [],
    loading: state.loading || false,
    selectedSubject: state.selectedSubject || "",
    selectedCourse: state.selectedCourse || "",
    selectedSubjectUnit: state.selectedSubjectUnit || "",
    selectedCourseUnit: state.selectedCourseUnit || "",
    message: state.message || "",
    title: state.title || "",
    description: state.description || "",
    timeLimit: state.timeLimit || 30,
    price: state.price || 0,
    accessTypes: state.accessTypes || "FREE",
    editingTest: state.editingTest || null,
    validityDays: state.validityDays || 0, // Add this line
    filters: state.filters || {
      grade: "",
      stream: "",
      semester: "",
      degree: "",
      university: "",
      name: "",
      accessTypes: "",
      exam: ""
    },
    filterOptions: state.filterOptions || {
      grades: [],
      streams: [],
      semesters: [],
      degrees: [],
      universities: [],
      names: [],
      exams: []
    },
    filteredSubjects: state.filteredSubjects || [],
    filteredCourses: state.filteredCourses || [],
  };
};

const McqTestManagement = () => {
  const dispatch = useDispatch();
  const state = useMcqTestState();
  
  const {
    activeTab,
    subjects,
    courses,
    subjectUnits,
    courseUnits,
    subjectMcqTests,
    courseMcqTests,
    loading,
    selectedSubject,
    selectedCourse,
    selectedSubjectUnit,
    selectedCourseUnit,
    message,
    title,
    description,
    timeLimit,
    price,
    accessTypes,
    editingTest,
    validityDays, // Add this line
    filters,
    filterOptions,
    filteredSubjects,
    filteredCourses,
  } = state;

  // Fetch subjects and courses on mount
  useEffect(() => {
    dispatch(fetchSubjectsAndCourses());
  }, [dispatch]);

  // Function to fix thumbnail URL
  const fixThumbnailUrl = (url) => {
    if (!url) return null;
    
    // Replace backslashes with forward slashes
    let fixedUrl = url.replace(/\\/g, '/');
    
    // If the URL contains localhost but our API_BASE_URL is different, replace it
    if (fixedUrl.includes('localhost') && !API_BASE_URL.includes('localhost')) {
      // Extract the path part after the host
      const urlPath = fixedUrl.split('/').slice(3).join('/');
      // Construct new URL with the correct base
      fixedUrl = `${API_BASE_URL}/${urlPath}`;
    }
    
    return fixedUrl;
  };

  // Fetch units when subject/course is selected
  const handleSelectItem = (id) => {
    if (activeTab === "subjects") {
      dispatch(setSelectedSubject(id));
    } else {
      dispatch(setSelectedCourse(id));
    }
    
    if (id) {
      dispatch(fetchUnits({ id, type: activeTab }));
    }
  };

  // Fetch MCQ tests when unit is selected
  const handleSelectUnit = (unitId) => {
    if (activeTab === "subjects") {
      dispatch(setSelectedSubjectUnit(unitId));
    } else {
      dispatch(setSelectedCourseUnit(unitId));
    }
    
    if (unitId) {
      dispatch(fetchMcqTests({ unitId, accessTypeFilter: filters.accessTypes }));
    }
  };

  // Add new MCQ test
  const handleAddMcqTest = async (e) => {
    e.preventDefault();
    
    const selectedId = activeTab === "subjects" ? selectedSubject : selectedCourse;
    const selectedUnit = activeTab === "subjects" ? selectedSubjectUnit : selectedCourseUnit;
    
    if (!selectedId || !selectedUnit || !title.trim()) {
      dispatch(setMessage("Please fill all required fields."));
      return;
    }

    try {
      const testData = {
        title,
        description,
        timeLimit: parseInt(timeLimit) || 30,
        price: accessTypes === "PAID" ? parseFloat(price) : 0,
        accessTypes,
        unitId: selectedUnit,
        validityDays: parseInt(validityDays) || 0, // Add this line
      };
      
      // Add the appropriate ID based on active tab
      if (activeTab === "subjects") {
        testData.subjectId = selectedSubject;
      } else {
        testData.courseId = selectedCourse;
      }

      await dispatch(addMcqTest(testData)).unwrap();
      
      dispatch(resetForm());
      dispatch(fetchMcqTests({ unitId: selectedUnit, accessTypeFilter: filters.accessTypes }));
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
      const updateData = {
        title,
        description,
        timeLimit: parseInt(timeLimit) || 30,
        price: accessTypes === "PAID" ? parseFloat(price) : 0,
        accessTypes,
        validityDays: parseInt(validityDays) || 0, // Add this line
      };

      await dispatch(updateMcqTest({
        id: editingTest.id,
        data: updateData
      })).unwrap();
      
      dispatch(resetForm());
      const selectedUnit = activeTab === "subjects" ? selectedSubjectUnit : selectedCourseUnit;
      dispatch(fetchMcqTests({ unitId: selectedUnit, accessTypeFilter: filters.accessTypes }));
    } catch (err) {
      console.error("Error updating MCQ test:", err);
    }
  };

  // Handle edit MCQ test
  const handleEditMcqTest = (test) => {
    dispatch(setEditingTest(test));
    dispatch(setTitle(test.title || ""));
    dispatch(setDescription(test.description || ""));
    dispatch(setTimeLimit(test.timeLimit || 30));
    dispatch(setPrice(test.price || 0));
    dispatch(setAccessTypes(test.accessTypes || "FREE"));
    dispatch(setvalidityDays(test.validityDays || 0)); // Add this line
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
      const selectedUnit = activeTab === "subjects" ? selectedSubjectUnit : selectedCourseUnit;
      dispatch(fetchMcqTests({ unitId: selectedUnit, accessTypeFilter: filters.accessTypes }));
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

  // Format display name with all relevant information
  const formatName = (item) => {
    let name = "";
    
    if (activeTab === "subjects") {
      name = item.subMaster?.name || "Unnamed Subject";
    } else {
      name = item.name || "Unnamed Course";
    }
    
    if (item.grade?.name) name += ` - ${item.grade.name}`;
    if (item.stream?.name) name += ` - ${item.stream.name}`;
    if (item.semester?.name) name += ` - ${item.semester.name}`;
    if (item.degree?.name) name += ` - ${item.degree.name}`;
    if (item.university?.name) name += ` - ${item.university.name}`;
    if (item.exam?.name) name += ` - ${item.exam.name}`;
    return name;
  };

  // Safely format price with toFixed
  const formatPrice = (priceValue) => {
    if (priceValue === null || priceValue === undefined) return "0.00";
    
    // Convert to number if it's a string
    const numericPrice = typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue;
    
    // Check if it's a valid number
    if (isNaN(numericPrice)) return "0.00";
    
    return numericPrice.toFixed(2);
  };

  // Get current MCQ tests based on active tab
  const getCurrentMcqTests = () => {
    return activeTab === "subjects" ? subjectMcqTests : courseMcqTests;
  };

  // Get current units based on active tab
  const getCurrentUnits = () => {
    return activeTab === "subjects" ? subjectUnits : courseUnits;
  };

  // Get current selected ID based on active tab
  const getCurrentSelectedId = () => {
    return activeTab === "subjects" ? selectedSubject : selectedCourse;
  };

  // Get current selected unit based on active tab
  const getCurrentSelectedUnit = () => {
    return activeTab === "subjects" ? selectedSubjectUnit : selectedCourseUnit;
  };

  // Get current filtered items based on active tab
  const getCurrentFilteredItems = () => {
    return activeTab === "subjects" ? filteredSubjects : filteredCourses;
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto mb-6">
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px] rounded-xl shadow-lg">
          <div className="bg-white rounded-xl p-6 relative">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">📋</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Test Naming Convention
                  </span>
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-full animate-pulse">
                    Required
                  </span>
                </h3>
                <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                  Every test name must be <strong>unique</strong> and follow this exact format:
                </p>
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4">
                  <code className="text-sm font-mono text-gray-800 break-all">
                    Subject Name - Grade/Degree - Board/University - Grade/Semester - Stream(for Higher Secondary) - Semester(for WBCHSE Only) - Exam
                  </code>
                </div>
                <div className="mt-3 flex items-center text-xs text-gray-500">
                  <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  This ensures proper organization and prevents duplicates
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">MCQ Test Management</h2>

        {/* Tabs for Subjects and Courses */}
        <div className="flex border-b mb-6">
          <button
            className={`py-2 px-4 font-medium ${activeTab === "subjects" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
            onClick={() => dispatch(setActiveTab("subjects"))}
          >
            Subject Tests
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === "courses" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
            onClick={() => dispatch(setActiveTab("courses"))}
          >
            Course Tests
          </button>
        </div>

        {/* Filters Section */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Filter {activeTab === "subjects" ? "Subjects" : "Courses"}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {activeTab === "subjects" ? "Subject Name" : "Course Name"}
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
              >
                <option value="">All {activeTab === "subjects" ? "Subjects" : "Courses"}</option>
                {filterOptions.names.map((name, index) => (
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filters.exam}
                onChange={(e) => handleFilterChange('exam', e.target.value)}
              >
                <option value="">All Exams</option>
                {filterOptions.exams.map((exam, index) => (
                  <option key={index} value={exam}>{exam}</option>
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

        {/* Subject/Course and Unit Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select {activeTab === "subjects" ? "Subject" : "Course"}
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2"
              value={getCurrentSelectedId()}
              onChange={(e) => handleSelectItem(e.target.value)}
            >
              <option value="">-- Select {activeTab === "subjects" ? "Subject" : "Course"} --</option>
              {getCurrentFilteredItems().map((item) => (
                <option key={item.id} value={item.id}>
                  {formatName(item)}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {getCurrentFilteredItems().length} {activeTab === "subjects" ? "subject(s)" : "course(s)"} found
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Unit
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2"
              value={getCurrentSelectedUnit()}
              onChange={(e) => handleSelectUnit(e.target.value)}
              disabled={!getCurrentSelectedId()}
            >
              <option value="">-- Select Unit --</option>
              {getCurrentUnits().map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add/Edit MCQ Test Form */}
        {getCurrentSelectedUnit() && (
          <form onSubmit={editingTest ? handleUpdateMcqTest : handleAddMcqTest} className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              {editingTest ? 'Edit MCQ Test' : `Add New MCQ Test to ${activeTab === "subjects" ? "Subject" : "Course"}`}
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
                </select>
              </div>
              
              {accessTypes === "PAID" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={price}
                    onChange={(e) => dispatch(setPrice(e.target.value))}
                    min="0"
                    step="0.01"
                    required={accessTypes === "PAID"}
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Validity (days) *</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={validityDays}
                  onChange={(e) => dispatch(setvalidityDays(parseInt(e.target.value) || 0))}
                  min="1"
                  required
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Processing...' : (editingTest ? 'Update MCQ Test' : 'Add MCQ Test')}
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
        {getCurrentSelectedUnit() && (
          <>
            <h3 className="text-lg font-semibold mb-4">MCQ Tests</h3>
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : getCurrentMcqTests().length === 0 ? (
              <p>No MCQ tests found for this unit.</p>
            ) : (
              <div className="space-y-4">
                {getCurrentMcqTests().map((test) => (
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
                            Time Limit: {test.timeLimit || 'N/A'} mins | Access: {test.accessTypes} | 
                            Price: ${formatPrice(test.price)} | Validity: {test.validityDays || 0} days
                          </p>
                        </div>
                      </div>
                      
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
};

export default McqTestManagement;
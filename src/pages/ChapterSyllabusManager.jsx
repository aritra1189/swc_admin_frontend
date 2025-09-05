import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const UnitManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [unitName, setUnitName] = useState("");
  const [unitDescription, setUnitDescription] = useState("");
  const [accessType, setAccessType] = useState("FREE");
  const [price, setPrice] = useState(0);
  const [validityDays, setValidityDays] = useState(0);
  const [units, setUnits] = useState([]);
  const [message, setMessage] = useState("");
  const [editingUnit, setEditingUnit] = useState(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [contentData, setContentData] = useState({
    videoLectures: [],
    audioLectures: [],
    studyMaterials: [],
    mcqTests: []
  });
  
  // Filter states for subjects
  const [filters, setFilters] = useState({
    grade: "",
    stream: "",
    semester: "",
    degree: "",
    university: "",
    subjectName: "",
    exam: ""
  });
  
  // Filter states for courses
  const [courseFilters, setCourseFilters] = useState({
    courseName: "",
    exam: ""
  });
  
  // Available options for filters
  const [filterOptions, setFilterOptions] = useState({
    grades: [],
    streams: [],
    semesters: [],
    degrees: [],
    universities: [],
    subjectNames: [],
    courseNames: [],
    exams: []
  });

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const res = await api.get('/subject/list', {
          params: {
            limit: 100,
            offset: 0,
            status: 'ACTIVE'
          }
        });
        
        // Extract subject data from the response
        const subjectData = res.data?.result || [];
        setSubjects(subjectData);
        setFilteredSubjects(subjectData);
        
        // Extract unique values for filters
        const grades = [...new Set(subjectData.map(item => item.grade?.name).filter(Boolean))];
        const streams = [...new Set(subjectData.map(item => item.stream?.name).filter(Boolean))];
        const semesters = [...new Set(subjectData.map(item => item.semester?.name).filter(Boolean))];
        const degrees = [...new Set(subjectData.map(item => item.degree?.name).filter(Boolean))];
        const universities = [...new Set(subjectData.map(item => item.university?.name).filter(Boolean))];
        const subjectNames = [...new Set(subjectData.map(item => item.subMaster?.name).filter(Boolean))];
        const exams = [...new Set(subjectData.map(item => item.exam?.name).filter(Boolean))];
        
        setFilterOptions(prev => ({
          ...prev,
          grades,
          streams,
          semesters,
          degrees,
          universities,
          subjectNames,
          exams
        }));
      } catch (err) {
        console.error("Error fetching subjects:", err);
        setMessage("Failed to load subjects.");
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await api.get('/course', {
          params: {
            limit: 100,
            offset: 0,
            status: 'ACTIVE'
          }
        });
        
        // Extract course data from the response
        const courseData = res.data?.result || [];
        setCourses(courseData);
        setFilteredCourses(courseData);
        
        // Extract unique values for course filters
        const courseNames = [...new Set(courseData.map(item => item.name).filter(Boolean))];
        const exams = [...new Set(courseData.map(item => item.exam?.name).filter(Boolean))];
        
        setFilterOptions(prev => ({
          ...prev,
          courseNames,
          exams: [...new Set([...prev.exams, ...exams])] // Merge with existing exams
        }));
      } catch (err) {
        console.error("Error fetching courses:", err);
        setMessage("Failed to load courses.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Apply filters to subjects
  useEffect(() => {
    let filtered = [...subjects];
    
    if (filters.grade) {
      filtered = filtered.filter(item => item.grade?.name === filters.grade);
    }
    
    if (filters.stream) {
      filtered = filtered.filter(item => item.stream?.name === filters.stream);
    }
    
    if (filters.semester) {
      filtered = filtered.filter(item => item.semester?.name === filters.semester);
    }
    
    if (filters.degree) {
      filtered = filtered.filter(item => item.degree?.name === filters.degree);
    }
    
    if (filters.university) {
      filtered = filtered.filter(item => item.university?.name === filters.university);
    }
    
    if (filters.subjectName) {
      filtered = filtered.filter(item => item.subMaster?.name === filters.subjectName);
    }
    
    if (filters.exam) {
      filtered = filtered.filter(item => item.exam?.name === filters.exam);
    }
    
    setFilteredSubjects(filtered);
  }, [filters, subjects]);

  // Apply filters to courses
  useEffect(() => {
    let filtered = [...courses];
    
    if (courseFilters.courseName) {
      filtered = filtered.filter(item => item.name === courseFilters.courseName);
    }
    
    if (courseFilters.exam) {
      filtered = filtered.filter(item => item.exam?.name === courseFilters.exam);
    }
    
    setFilteredCourses(filtered);
  }, [courseFilters, courses]);

  // Fetch units for a subject or course
  const fetchUnits = async (id, type) => {
    try {
      setLoading(true);
      const endpoint = type === 'subject' 
        ? `/unit/list?subjectId=${id}&limit=100&offset=0`
        : `/unit/list?courseId=${id}&limit=100&offset=0`;
      
      const res = await api.get(endpoint);
      setUnits(res.data?.result || []);
    } catch (err) {
      console.error("Error fetching units:", err);
      setMessage("Failed to load units.");
    } finally {
      setLoading(false);
    }
  };

  // Add new unit
  const handleAddUnit = async (e) => {
    e.preventDefault();
    if ((!selectedSubject && !selectedCourse) || !unitName.trim()) {
      setMessage("Please select a subject/course and enter a unit name.");
      return;
    }

    try {
      const requestData = selectedSubject 
        ? { subjectId: selectedSubject, name: unitName, description: unitDescription, accessType, price: accessType === "PAID" ? parseFloat(price) : 0, validityDays: parseInt(validityDays) || 0 }
        : { courseId: selectedCourse, name: unitName, description: unitDescription, accessType, price: accessType === "PAID" ? parseFloat(price) : 0, validityDays: parseInt(validityDays) || 0 };
      
      await api.post("/unit", requestData);
      setMessage("✅ Unit added successfully!");
      setUnitName("");
      setUnitDescription("");
      
      // Refresh the unit list
      if (selectedSubject) {
        fetchUnits(selectedSubject, 'subject');
      } else {
        fetchUnits(selectedCourse, 'course');
      }
    } catch (err) {
      console.error("Error adding unit:", err);
      setMessage("❌ Failed to add unit.");
    }
  };

  // Update unit
  const handleUpdateUnit = async (e) => {
    e.preventDefault();
    if (!unitName.trim()) {
      setMessage("Please enter a unit name.");
      return;
    }

    try {
      await api.put(`/unit/${editingUnit.id}`, {
        name: unitName,
        description: unitDescription,
        accessType,
        price: accessType === "PAID" ? parseFloat(price) : 0,
        validityDays: parseInt(validityDays) || 0
      });
      setMessage("✅ Unit updated successfully!");
      setEditingUnit(null);
      setUnitName("");
      setUnitDescription("");
      
      // Refresh the unit list
      if (selectedSubject) {
        fetchUnits(selectedSubject, 'subject');
      } else {
        fetchUnits(selectedCourse, 'course');
      }
    } catch (err) {
      console.error("Error updating unit:", err);
      setMessage("❌ Failed to update unit.");
    }
  };

  // Toggle unit status
  const toggleUnitStatus = async (unit) => {
    try {
      await api.put(`/unit/status/${unit.id}`, {
        status: unit.status === 'ACTIVE' ? 'DEACTIVE' : 'ACTIVE'
      });
      setMessage(`✅ Unit status updated successfully!`);
      
      // Refresh the unit list
      if (selectedSubject) {
        fetchUnits(selectedSubject, 'subject');
      } else {
        fetchUnits(selectedCourse, 'course');
      }
    } catch (err) {
      console.error("Error updating unit status:", err);
      setMessage("❌ Failed to update unit status.");
    }
  };

  // Handle edit unit
  const handleEditUnit = (unit) => {
    setEditingUnit(unit);
    setUnitName(unit.name);
    setUnitDescription(unit.description || "");
    setAccessType(unit.accessType || "FREE");
    setPrice(unit.price || 0);
    setValidityDays(unit.validityDays || 0);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingUnit(null);
    setUnitName("");
    setUnitDescription("");
    setAccessType("FREE");
    setPrice(0);
    setValidityDays(0);
  };

  // Handle content addition
  const handleAddContent = (unit) => {
    setSelectedUnit(unit);
    setShowContentModal(true);
  };

  // Submit content to unit
  const handleSubmitContent = async (e) => {
    e.preventDefault();
    try {
      await api.post("/unit/add-content", {
        unitId: selectedUnit.id,
        ...contentData
      });
      setMessage("✅ Content added successfully!");
      setShowContentModal(false);
      setContentData({
        videoLectures: [],
        audioLectures: [],
        studyMaterials: [],
        mcqTests: []
      });
    } catch (err) {
      console.error("Error adding content:", err);
      setMessage("❌ Failed to add content.");
    }
  };

  // Fix URL format
  const fixUrl = (url) => {
    if (!url) return null;
    return url.replace(/\\/g, '/');
  };

  // Handle PDF download
  const handlePdfDownload = async (pdfUrl, unitName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(fixUrl(pdfUrl), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${unitName}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setMessage('❌ Failed to download PDF');
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setMessage('❌ Failed to download PDF');
    }
  };

  // Handle file upload
  const handleFileUpload = async (file, type, unitId) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      let endpoint = '';
      if (type === 'image') {
        endpoint = `/unit/img/${unitId}`;
      } else if (type === 'pdf') {
        endpoint = `/unit/pdf/${unitId}`;
      }
      
      await api.put(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessage(`✅ ${type.toUpperCase()} uploaded successfully!`);
      
      // Refresh the unit list
      if (selectedSubject) {
        fetchUnits(selectedSubject, 'subject');
      } else {
        fetchUnits(selectedCourse, 'course');
      }
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      setMessage(`❌ Failed to upload ${type}.`);
    }
  };

  // Handle filter change for subjects
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Handle filter change for courses
  const handleCourseFilterChange = (filterType, value) => {
    setCourseFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all subject filters
  const clearFilters = () => {
    setFilters({
      grade: "",
      stream: "",
      semester: "",
      degree: "",
      university: "",
      subjectName: "",
      exam: ""
    });
  };

  // Clear all course filters
  const clearCourseFilters = () => {
    setCourseFilters({
      courseName: "",
      exam: ""
    });
  };

  // Handle subject selection
  const handleSubjectSelect = (subjectId) => {
    setSelectedSubject(subjectId);
    setSelectedCourse(""); // Clear course selection
    if (subjectId) {
      fetchUnits(subjectId, 'subject');
    } else {
      setUnits([]);
    }
  };

  // Handle course selection
  const handleCourseSelect = (courseId) => {
    setSelectedCourse(courseId);
    setSelectedSubject(""); // Clear subject selection
    if (courseId) {
      fetchUnits(courseId, 'course');
    } else {
      setUnits([]);
    }
  };

  // Render content modal
  const renderContentModal = () => {
    if (!showContentModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
          <h3 className="text-xl font-bold mb-4">Add Content to {selectedUnit?.name}</h3>
          
          <form onSubmit={handleSubmitContent}>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Video Lectures</h4>
              <button 
                type="button" 
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm mb-2"
                onClick={() => setContentData({
                  ...contentData,
                  videoLectures: [...contentData.videoLectures, { title: '', url: '', accessTypes: 'FREE' }]
                })}
              >
                Add Video Lecture
              </button>
              {contentData.videoLectures.map((video, index) => (
                <div key={index} className="border p-2 rounded mb-2">
                  <input
                    type="text"
                    placeholder="Title"
                    className="border p-1 rounded w-full mb-2"
                    value={video.title}
                    onChange={(e) => {
                      const newVideos = [...contentData.videoLectures];
                      newVideos[index].title = e.target.value;
                      setContentData({ ...contentData, videoLectures: newVideos });
                    }}
                  />
                  <input
                    type="text"
                    placeholder="URL"
                    className="border p-1 rounded w-full mb-2"
                    value={video.url}
                    onChange={(e) => {
                      const newVideos = [...contentData.videoLectures];
                      newVideos[index].url = e.target.value;
                      setContentData({ ...contentData, videoLectures: newVideos });
                    }}
                  />
                  <select
                    className="border p-1 rounded w-full"
                    value={video.accessTypes}
                    onChange={(e) => {
                      const newVideos = [...contentData.videoLectures];
                      newVideos[index].accessTypes = e.target.value;
                      setContentData({ ...contentData, videoLectures: newVideos });
                    }}
                  >
                    <option value="FREE">Free</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
              ))}
            </div>

            {/* Similar sections for audioLectures, studyMaterials, and mcqTests */}

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={() => setShowContentModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Add Content
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Format subject display name with all relevant information
  const formatSubjectName = (subject) => {
    let name = subject.subMaster?.name || "Unnamed Subject";
    if (subject.grade?.name) name += ` - ${subject.grade.name}`;
    if (subject.stream?.name) name += ` - ${subject.stream.name}`;
    if (subject.semester?.name) name += ` - ${subject.semester.name}`;
    if (subject.degree?.name) name += ` - ${subject.degree.name}`;
    if (subject.university?.name) name += ` - ${subject.university.name}`;
    if (subject.exam?.name) name += ` - ${subject.exam.name}`;
    return name;
  };

  // Format course display name
  const formatCourseName = (course) => {
    let name = course.name || "Unnamed Course";
    if (course.exam?.name) name += ` - ${course.exam.name}`;
    return name;
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white shadow rounded-lg p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Unit Management</h2>

        {/* Subjects Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Subject Management</h3>
          
          {/* Filters Section for Subjects */}
          <div className="p-4 border rounded-lg bg-gray-50 mb-4">
            <h4 className="text-md font-semibold mb-3">Filter Subjects</h4>
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
            </div>
            
            <div className="mt-3">
              <button
                onClick={clearFilters}
                className="bg-gray-500 text-white px-4 py-2 rounded text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Dropdown for subjects */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Subject
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2"
              value={selectedSubject}
              onChange={(e) => handleSubjectSelect(e.target.value)}
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
        </div>

        {/* Courses Section - Separate from Subjects */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Course Management</h3>
          
          {/* Filters Section for Courses */}
          <div className="p-4 border rounded-lg bg-gray-50 mb-4">
            <h4 className="text-md font-semibold mb-3">Filter Courses</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={courseFilters.courseName}
                  onChange={(e) => handleCourseFilterChange('courseName', e.target.value)}
                >
                  <option value="">All Courses</option>
                  {filterOptions.courseNames.map((name, index) => (
                    <option key={index} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={courseFilters.exam}
                  onChange={(e) => handleCourseFilterChange('exam', e.target.value)}
                >
                  <option value="">All Exams</option>
                  {filterOptions.exams.map((exam, index) => (
                    <option key={index} value={exam}>{exam}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-3">
              <button
                onClick={clearCourseFilters}
                className="bg-gray-500 text-white px-4 py-2 rounded text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Dropdown for courses */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Course
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2"
              value={selectedCourse}
              onChange={(e) => handleCourseSelect(e.target.value)}
            >
              <option value="">-- Select Course --</option>
              {filteredCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {formatCourseName(course)}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {filteredCourses.length} course(s) found
            </p>
          </div>
        </div>

        {/* Add/Edit Unit Form */}
        {(selectedSubject || selectedCourse) && (
          <form onSubmit={editingUnit ? handleUpdateUnit : handleAddUnit} className="mb-6">
            <h3 className="text-lg font-semibold mb-2">
              {editingUnit ? 'Edit Unit' : 'Add New Unit'}
            </h3>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Enter Unit Name"
                className="w-full border border-gray-300 rounded-lg p-2 mb-2"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                required
              />
              <textarea
                placeholder="Unit Description (Optional)"
                className="w-full border border-gray-300 rounded-lg p-2 mb-2"
                value={unitDescription}
                onChange={(e) => setUnitDescription(e.target.value)}
                rows={3}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access Type</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={accessType}
                    onChange={(e) => setAccessType(e.target.value)}
                  >
                    <option value="FREE">Free</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
                
                {accessType === "PAID" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-lg p-2"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      min="0"
                      step="0.01"
                      required={accessType === "PAID"}
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Validity Days</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value)}
                    min="0"
                    placeholder="0 = No expiry"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {editingUnit ? 'Update Unit' : 'Add Unit'}
              </button>
              {editingUnit && (
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
            className={`text-sm mb-4 ${
              message.includes("✅") ? "text-green-600" : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}

        {/* Unit List */}
        {(selectedSubject || selectedCourse) && (
          <>
            <h3 className="text-lg font-semibold mb-2">Units</h3>
            {loading ? (
              <p>Loading...</p>
            ) : units.length > 0 ? (
              <ul className="space-y-4">
                {units.map((unit) => (
                  <li
                    key={unit.id}
                    className="border p-4 rounded-lg"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="font-semibold">{unit.name}</span>
                        {unit.description && (
                          <p className="text-sm text-gray-600 mt-1">{unit.description}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          Status: <span className={unit.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}>
                            {unit.status}
                          </span> | Access: {unit.accessType || 'FREE'} | Price: ${(parseFloat(unit.price) || 0).toFixed(2)} | Validity: {unit.validityDays || 'No expiry'} days
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditUnit(unit)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleUnitStatus(unit)}
                          className={`px-3 py-1 rounded text-sm ${
                            unit.status === 'ACTIVE' 
                              ? 'bg-red-500 text-white' 
                              : 'bg-green-500 text-white'
                          }`}
                        >
                          {unit.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleAddContent(unit)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                        >
                          Add Content
                        </button>
                      </div>
                    </div>
                    
                    {/* File uploads */}
                    <div className="mt-3 flex gap-2">
                      <label className="bg-gray-200 px-3 py-1 rounded text-sm cursor-pointer">
                        Upload Image
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              handleFileUpload(e.target.files[0], 'image', unit.id);
                            }
                          }}
                        />
                      </label>
                      <label className="bg-gray-200 px-3 py-1 rounded text-sm cursor-pointer">
                        Upload PDF
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              handleFileUpload(e.target.files[0], 'pdf', unit.id);
                            }
                          }}
                        />
                      </label>
                    </div>
                    
                    {/* Display uploaded files */}
                    <div className="mt-3 text-sm">
                      {unit.imgUrl && (
                        <p>Image: <a href={unit.imgUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">View</a></p>
                      )}
                      {unit.pdfUrl ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span>PDF:</span>
                          <button 
                            onClick={() => window.open(fixUrl(unit.pdfUrl), '_blank')}
                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                          >
                            View PDF
                          </button>
                          <button 
                            onClick={() => handlePdfDownload(unit.pdfUrl, unit.name)}
                            className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                          >
                            Download PDF
                          </button>
                        </div>
                      ) : (
                        <p className="text-gray-400">No PDF uploaded yet</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No units found.</p>
            )}
          </>
        )}
      </div>
      
      {renderContentModal()}
    </div>
  );
};

export default UnitManagement;
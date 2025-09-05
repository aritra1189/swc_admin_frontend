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

const VideoLectureManagement = () => {
  const [activeTab, setActiveTab] = useState("subjects"); // 'subjects' or 'courses'
  
  // State for subjects
  const [subjects, setSubjects] = useState([]);
  const [subjectUnits, setSubjectUnits] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSubjectUnit, setSelectedSubjectUnit] = useState("");
  const [subjectVideoLectures, setSubjectVideoLectures] = useState([]);
  
  // State for courses
  const [courses, setCourses] = useState([]);
  const [courseUnits, setCourseUnits] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedCourseUnit, setSelectedCourseUnit] = useState("");
  const [courseVideoLectures, setCourseVideoLectures] = useState([]);
  
  // Common states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState(0);
  const [accessTypes, setAccessTypes] = useState("FREE");
  const [editingVideo, setEditingVideo] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    grade: "",
    stream: "",
    semester: "",
    degree: "",
    university: "",
    name: "",
    accessTypes: "",
    exam: ""
  });
  
  // Available options for filters
  const [filterOptions, setFilterOptions] = useState({
    grades: [],
    streams: [],
    semesters: [],
    degrees: [],
    universities: [],
    names: [],
    exams: []
  });

  // Fetch subjects and courses
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch subjects
        const subjectsRes = await api.get('/subject/list', {
          params: {
            limit: 100,
            offset: 0,
            status: 'ACTIVE'
          }
        });
        
        const subjectData = subjectsRes.data?.result || [];
        setSubjects(subjectData);
        setFilteredSubjects(subjectData);
        
        // Fetch courses
        const coursesRes = await api.get('/course/admin', {
          params: {
            limit: 100,
            offset: 0,
            status: 'ACTIVE'
          }
        });
        
        const courseData = coursesRes.data?.result || [];
        setCourses(courseData);
        setFilteredCourses(courseData);
        
        // Extract unique values for filters from both subjects and courses
        const allItems = [...subjectData, ...courseData];
        const grades = [...new Set(allItems.map(item => item.grade?.name).filter(Boolean))];
        const streams = [...new Set(allItems.map(item => item.stream?.name).filter(Boolean))];
        const semesters = [...new Set(allItems.map(item => item.semester?.name).filter(Boolean))];
        const degrees = [...new Set(allItems.map(item => item.degree?.name).filter(Boolean))];
        const universities = [...new Set(allItems.map(item => item.university?.name).filter(Boolean))];
        const names = [...new Set(allItems.map(item => 
          item.subMaster?.name || item.name
        ).filter(Boolean))];
        const exams = [...new Set(allItems.map(item => item.exam?.name).filter(Boolean))];
        
        setFilterOptions({
          grades,
          streams,
          semesters,
          degrees,
          universities,
          names,
          exams
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        setMessage("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Apply filters to subjects or courses based on active tab
  useEffect(() => {
    if (activeTab === "subjects") {
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
      
      if (filters.name) {
        filtered = filtered.filter(item => item.subMaster?.name === filters.name);
      }
      
      if (filters.exam) {
        filtered = filtered.filter(item => item.exam?.name === filters.exam);
      }
      
      setFilteredSubjects(filtered);
    } else {
      let filtered = [...courses];
      
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
      
      if (filters.name) {
        filtered = filtered.filter(item => item.name === filters.name);
      }
      
      if (filters.exam) {
        filtered = filtered.filter(item => item.exam?.name === filters.exam);
      }
      
      setFilteredCourses(filtered);
    }
  }, [filters, subjects, courses, activeTab]);

  // Fetch units for a subject or course
  const fetchUnits = async (id) => {
    try {
      setLoading(true);
      let endpoint = '';
      
      if (activeTab === "subjects") {
        endpoint = `/unit/list?subjectId=${id}&limit=100&offset=0`;
      } else {
        endpoint = `/unit/list?courseId=${id}&limit=100&offset=0`;
      }
      
      const res = await api.get(endpoint);
      
      if (activeTab === "subjects") {
        setSubjectUnits(res.data?.result || []);
      } else {
        setCourseUnits(res.data?.result || []);
      }
    } catch (err) {
      console.error("Error fetching units:", err);
      setMessage("Failed to load units.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch video lectures
  const fetchVideoLectures = async (unitId, accessTypeFilter = "") => {
    try {
      setLoading(true);
      const params = {};
      if (unitId) params.unitId = unitId;
      if (accessTypeFilter) params.accessTypes = accessTypeFilter;
      
      const res = await api.get('/video-lecture/list', { params });
      
      if (activeTab === "subjects") {
        setSubjectVideoLectures(res.data?.result || []);
      } else {
        setCourseVideoLectures(res.data?.result || []);
      }
    } catch (err) {
      console.error("Error fetching video lectures:", err);
      setMessage("Failed to load video lectures.");
    } finally {
      setLoading(false);
    }
  };

  // Add new video lecture
  const handleAddVideoLecture = async (e) => {
    e.preventDefault();
    
    const selectedId = activeTab === "subjects" ? selectedSubject : selectedCourse;
    const selectedUnit = activeTab === "subjects" ? selectedSubjectUnit : selectedCourseUnit;
    
    if (!selectedId || !selectedUnit || !title.trim() || !videoUrl.trim()) {
      setMessage("Please fill all required fields.");
      return;
    }

    try {
      const payload = {
        title,
        description,
        videoUrl,
        duration: parseInt(duration) || 0,
        price: accessTypes === "PAID" ? parseFloat(price) : 0,
        accessTypes
      };
      
      // Add the appropriate ID based on active tab
      if (activeTab === "subjects") {
        payload.subjectId = selectedSubject;
      } else {
        payload.courseId = selectedCourse;
      }
      
      payload.unitId = selectedUnit;
      
      await api.post("/video-lecture", payload);
      setMessage("✅ Video lecture added successfully!");
      resetForm();
      fetchVideoLectures(selectedUnit, filters.accessTypes);
    } catch (err) {
      console.error("Error adding video lecture:", err);
      setMessage("❌ Failed to add video lecture.");
    }
  };

  // Update video lecture
  const handleUpdateVideoLecture = async (e) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      setMessage("Please fill all required fields.");
      return;
    }

    try {
      await api.put(`/video-lecture/${editingVideo.id}`, {
        title,
        description,
        videoUrl,
        duration: parseInt(duration) || 0,
        price: accessTypes === "PAID" ? parseFloat(price) : 0,
        accessTypes
      });
      setMessage("✅ Video lecture updated successfully!");
      setEditingVideo(null);
      resetForm();
      
      const selectedUnit = activeTab === "subjects" ? selectedSubjectUnit : selectedCourseUnit;
      fetchVideoLectures(selectedUnit, filters.accessTypes);
    } catch (err) {
      console.error("Error updating video lecture:", err);
      setMessage("❌ Failed to update video lecture.");
    }
  };

  // Handle edit video lecture
  const handleEditVideoLecture = (video) => {
    setEditingVideo(video);
    setTitle(video.title);
    setDescription(video.description || "");
    setVideoUrl(video.videoUrl);
    setDuration(video.duration || "");
    setAccessTypes(video.accessTypes);
    setPrice(video.price || 0);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingVideo(null);
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setDuration("");
    setAccessTypes("FREE");
    setPrice(0);
  };

  // Handle file upload
  const handleThumbnailUpload = async (file, videoId) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await api.put(`/video-lecture/thumbnail/${videoId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessage("✅ Thumbnail uploaded successfully!");
      
      const selectedUnit = activeTab === "subjects" ? selectedSubjectUnit : selectedCourseUnit;
      fetchVideoLectures(selectedUnit, filters.accessTypes);
    } catch (err) {
      console.error("Error uploading thumbnail:", err);
      setMessage("❌ Failed to upload thumbnail.");
    }
  };

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      grade: "",
      stream: "",
      semester: "",
      degree: "",
      university: "",
      name: "",
      accessTypes: "",
      exam: ""
    });
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

  // Get current video lectures based on active tab
  const getCurrentVideoLectures = () => {
    return activeTab === "subjects" ? subjectVideoLectures : courseVideoLectures;
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
      <div className="bg-white shadow rounded-lg p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Video Lecture Management</h2>

        {/* Tabs for Subjects and Courses */}
        <div className="flex border-b mb-6">
          <button
            className={`py-2 px-4 font-medium ${activeTab === "subjects" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("subjects")}
          >
            Subject Videos
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === "courses" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("courses")}
          >
            Course Videos
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
              onClick={clearFilters}
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
              onChange={(e) => {
                if (activeTab === "subjects") {
                  setSelectedSubject(e.target.value);
                  setSelectedSubjectUnit("");
                  setSubjectVideoLectures([]);
                } else {
                  setSelectedCourse(e.target.value);
                  setSelectedCourseUnit("");
                  setCourseVideoLectures([]);
                }
                
                if (e.target.value) {
                  fetchUnits(e.target.value);
                } else {
                  if (activeTab === "subjects") {
                    setSubjectUnits([]);
                  } else {
                    setCourseUnits([]);
                  }
                }
              }}
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
              onChange={(e) => {
                if (activeTab === "subjects") {
                  setSelectedSubjectUnit(e.target.value);
                } else {
                  setSelectedCourseUnit(e.target.value);
                }
                
                if (e.target.value) {
                  fetchVideoLectures(e.target.value, filters.accessTypes);
                } else {
                  if (activeTab === "subjects") {
                    setSubjectVideoLectures([]);
                  } else {
                    setCourseVideoLectures([]);
                  }
                }
              }}
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

        {/* Add/Edit Video Lecture Form */}
        {getCurrentSelectedUnit() && (
          <form onSubmit={editingVideo ? handleUpdateVideoLecture : handleAddVideoLecture} className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              {editingVideo ? 'Edit Video Lecture' : `Add New Video Lecture to ${activeTab === "subjects" ? "Subject" : "Course"}`}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Video URL *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Access Type</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={accessTypes}
                  onChange={(e) => setAccessTypes(e.target.value)}
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
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    required={accessTypes === "PAID"}
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {editingVideo ? 'Update Video Lecture' : 'Add Video Lecture'}
              </button>
              {editingVideo && (
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

        {/* Video Lectures List */}
        {getCurrentSelectedUnit() && (
          <>
            <h3 className="text-lg font-semibold mb-4">Video Lectures</h3>
            {loading ? (
              <p>Loading...</p>
            ) : getCurrentVideoLectures().length > 0 ? (
              <div className="grid gap-4">
                {getCurrentVideoLectures().map((video) => (
                  <div key={video.id} className="border p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{video.title}</h4>
                        <p className="text-gray-600">{video.description}</p>
                        <div className="mt-2 flex gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            video.accessTypes === 'FREE' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {video.accessTypes === 'FREE' ? 'FREE' : `$${formatPrice(video.price)}`}
                          </span>
                          {video.duration > 0 && (
                            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              {video.duration} min
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditVideoLecture(video)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        <label className="bg-gray-200 px-3 py-1 rounded text-sm cursor-pointer">
                          Upload Thumbnail
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                handleThumbnailUpload(e.target.files[0], video.id);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <a 
                        href={video.videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 text-sm"
                      >
                        Watch Video
                      </a>
                      {video.thumbnailUrl && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">Thumbnail:</p>
                          <img 
                            src={video.thumbnailUrl} 
                            alt="Thumbnail" 
                            className="h-20 object-cover rounded mt-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No video lectures found for this unit.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VideoLectureManagement;
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
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [videoLectures, setVideoLectures] = useState([]);
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
    subjectName: "",
    accessTypes: ""
  });
  
  // Available options for filters
  const [filterOptions, setFilterOptions] = useState({
    grades: [],
    streams: [],
    semesters: [],
    degrees: [],
    universities: [],
    subjectNames: []
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
        
        setFilterOptions({
          grades,
          streams,
          semesters,
          degrees,
          universities,
          subjectNames
        });
      } catch (err) {
        console.error("Error fetching subjects:", err);
        setMessage("Failed to load subjects.");
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
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
    
    setFilteredSubjects(filtered);
  }, [filters, subjects]);

  // Fetch units for a subject
  const fetchUnits = async (subjectId) => {
    try {
      setLoading(true);
      const res = await api.get(`/unit/list?subjectId=${subjectId}&limit=100&offset=0`);
      setUnits(res.data?.result || []);
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
      setVideoLectures(res.data?.result || []);
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
    if (!selectedSubject || !selectedUnit || !title.trim() || !videoUrl.trim()) {
      setMessage("Please fill all required fields.");
      return;
    }

    try {
      await api.post("/video-lecture", {
        subjectId: selectedSubject,
        unitId: selectedUnit,
        title,
        description,
        videoUrl,
        duration: parseInt(duration) || 0,
        price: accessTypes === "PAID" ? parseFloat(price) : 0,
        accessTypes
      });
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
      subjectName: "",
      accessTypes: ""
    });
  };

  // Format subject display name with all relevant information
  const formatSubjectName = (subject) => {
    let name = subject.subMaster.name;
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
    
    // Convert to number if it's a string
    const numericPrice = typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue;
    
    // Check if it's a valid number
    if (isNaN(numericPrice)) return "0.00";
    
    return numericPrice.toFixed(2);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white shadow rounded-lg p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Video Lecture Management</h2>

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
                setSelectedSubject(e.target.value);
                setSelectedUnit("");
                setVideoLectures([]);
                if (e.target.value) {
                  fetchUnits(e.target.value);
                } else {
                  setUnits([]);
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
                setSelectedUnit(e.target.value);
                if (e.target.value) {
                  fetchVideoLectures(e.target.value, filters.accessTypes);
                } else {
                  setVideoLectures([]);
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

        {/* Add/Edit Video Lecture Form */}
        {selectedUnit && (
          <form onSubmit={editingVideo ? handleUpdateVideoLecture : handleAddVideoLecture} className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              {editingVideo ? 'Edit Video Lecture' : 'Add New Video Lecture'}
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
        {selectedUnit && (
          <>
            <h3 className="text-lg font-semibold mb-4">Video Lectures</h3>
            {loading ? (
              <p>Loading...</p>
            ) : videoLectures.length > 0 ? (
              <div className="grid gap-4">
                {videoLectures.map((video) => (
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
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
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [unitName, setUnitName] = useState("");
  const [unitDescription, setUnitDescription] = useState("");
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
  
  // Filter states
  const [filters, setFilters] = useState({
    grade: "",
    stream: "",
    semester: "",
    degree: "",
    university: "",
    subjectName: ""
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

  // Add new unit
  const handleAddUnit = async (e) => {
    e.preventDefault();
    if (!selectedSubject || !unitName.trim()) {
      setMessage("Please select a subject and enter a unit name.");
      return;
    }

    try {
      await api.post("/unit", {
        subjectId: selectedSubject,
        name: unitName,
        description: unitDescription
      });
      setMessage("✅ Unit added successfully!");
      setUnitName("");
      setUnitDescription("");
      fetchUnits(selectedSubject); // refresh list
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
        description: unitDescription
      });
      setMessage("✅ Unit updated successfully!");
      setEditingUnit(null);
      setUnitName("");
      setUnitDescription("");
      fetchUnits(selectedSubject); // refresh list
    } catch (err) {
      console.error("Error updating unit:", err);
      setMessage("❌ Failed to update unit.");
    }
  };

  // Toggle unit status
  const toggleUnitStatus = async (unit) => {
    try {
      await api.put(`/unit/status/${unit.id}`, {
        status: unit.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      });
      setMessage(`✅ Unit status updated successfully!`);
      fetchUnits(selectedSubject); // refresh list
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
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingUnit(null);
    setUnitName("");
    setUnitDescription("");
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
      fetchUnits(selectedSubject); // refresh list
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      setMessage(`❌ Failed to upload ${type}.`);
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
      subjectName: ""
    });
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
    let name = subject.subMaster.name;
    if (subject.grade?.name) name += ` - ${subject.grade.name}`;
    if (subject.stream?.name) name += ` - ${subject.stream.name}`;
    if (subject.semester?.name) name += ` - ${subject.semester.name}`;
    if (subject.degree?.name) name += ` - ${subject.degree.name}`;
    if (subject.university?.name) name += ` - ${subject.university.name}`;
    return name;
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white shadow rounded-lg p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Unit Management</h2>

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
            onChange={(e) => {
              setSelectedSubject(e.target.value);
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

        {/* Add/Edit Unit Form */}
        {selectedSubject && (
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
                className="w-full border border-gray-300 rounded-lg p-2"
                value={unitDescription}
                onChange={(e) => setUnitDescription(e.target.value)}
                rows={3}
              />
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
        {selectedSubject && (
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
                          </span>
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
                    
                    {/* Display uploaded files if available */}
                    {(unit.imgUrl || unit.pdfUrl) && (
                      <div className="mt-3 text-sm">
                        {unit.imgUrl && (
                          <p>Image: <a href={unit.imgUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">View</a></p>
                        )}
                        {unit.pdfUrl && (
                          <p>PDF: <a href={unit.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">View</a></p>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No units found for this subject.</p>
            )}
          </>
        )}
      </div>
      
      {renderContentModal()}
    </div>
  );
};

export default UnitManagement;
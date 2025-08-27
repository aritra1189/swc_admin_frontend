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

const StudyMaterialManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [studyMaterials, setStudyMaterials] = useState([]);
  const [message, setMessage] = useState("");
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [accessTypes, setAccessTypes] = useState("FREE");
  const [editingMaterial, setEditingMaterial] = useState(null);
  
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

  // Supported file formats
  const supportedFormats = ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx'];
  
  // Function to fix file URL - replace backslashes with forward slashes
  const fixFileUrl = (url) => {
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

  // Check if file format is supported
  const isSupportedFormat = (filename) => {
    if (!filename) return false;
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return supportedFormats.includes(extension);
  };

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

  // Fetch study materials
  const fetchStudyMaterials = async (unitId, accessTypeFilter = "") => {
    try {
      setLoading(true);
      const params = {};
      if (unitId) params.unitId = unitId;
      if (accessTypeFilter) params.accessTypes = accessTypeFilter;
      
      const res = await api.get('/study-material/list', { params });
      
      // Process the materials data - fix the file URLs
      const materialsWithFixedUrls = (res.data?.result || []).map(material => ({
        ...material,
        // Fix the file and thumbnail URLs
        fileUrl: fixFileUrl(material.fileUrl),
        thumbnailUrl: fixFileUrl(material.thumbnailUrl),
        // Store the original file name for display
        fileName: material.filePath ? material.filePath.split('/').pop() : null,
        // Check if file format is supported based on file extension
        isSupported: material.filePath ? isSupportedFormat(material.filePath) : false
      }));
      
      setStudyMaterials(materialsWithFixedUrls);
    } catch (err) {
      console.error("Error fetching study materials:", err);
      setMessage("Failed to load study materials.");
    } finally {
      setLoading(false);
    }
  };

  // Add new study material
  const handleAddStudyMaterial = async (e) => {
    e.preventDefault();
    if (!selectedSubject || !selectedUnit || !title.trim()) {
      setMessage("Please fill all required fields.");
      return;
    }

    try {
      await api.post("/study-material", {
        subjectId: selectedSubject,
        unitId: selectedUnit,
        title,
        description,
        price: accessTypes === "PAID" ? parseFloat(price) : 0,
        accessTypes
      });
      setMessage("✅ Study material added successfully!");
      resetForm();
      fetchStudyMaterials(selectedUnit, filters.accessTypes);
    } catch (err) {
      console.error("Error adding study material:", err);
      setMessage("❌ Failed to add study material.");
    }
  };

  // Update study material
  const handleUpdateStudyMaterial = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setMessage("Please fill all required fields.");
      return;
    }

    try {
      await api.put(`/study-material/${editingMaterial.id}`, {
        title,
        description,
        price: accessTypes === "PAID" ? parseFloat(price) : 0,
        accessTypes
      });
      setMessage("✅ Study material updated successfully!");
      setEditingMaterial(null);
      resetForm();
      fetchStudyMaterials(selectedUnit, filters.accessTypes);
    } catch (err) {
      console.error("Error updating study material:", err);
      setMessage("❌ Failed to update study material.");
    }
  };

  // Handle edit study material
  const handleEditStudyMaterial = (material) => {
    setEditingMaterial(material);
    setTitle(material.title);
    setDescription(material.description || "");
    setAccessTypes(material.accessTypes);
    setPrice(material.price || 0);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingMaterial(null);
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAccessTypes("FREE");
    setPrice(0);
  };

  // Handle file upload with format validation
  const handleFileUpload = async (file, materialId) => {
    // Check if file format is supported
    if (!isSupportedFormat(file.name)) {
      setMessage(`❌ Unsupported file format. Please use: ${supportedFormats.join(', ')}`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setMessage("⏳ Uploading file...");
      await api.put(`/study-material/pdf/${materialId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessage("✅ File uploaded successfully!");
      fetchStudyMaterials(selectedUnit, filters.accessTypes);
    } catch (err) {
      console.error("Error uploading file:", err);
      setMessage("❌ Failed to upload file.");
    }
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = async (file, materialId) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setMessage("⏳ Uploading thumbnail...");
      await api.put(`/study-material/thumbnail/${materialId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessage("✅ Thumbnail uploaded successfully!");
      fetchStudyMaterials(selectedUnit, filters.accessTypes);
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

  // Get file extension from filename
  const getFileExtension = (filename) => {
    if (!filename) return '';
    return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
  };

  // Download study material
  const downloadMaterial = async (materialId) => {
    try {
      setMessage("⏳ Preparing download...");
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }
      
      // Get the material details first
      const material = studyMaterials.find(m => m.id === materialId);
      if (!material || !material.fileUrl) {
        throw new Error("File not available for download.");
      }
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = material.fileUrl;
      link.setAttribute('download', material.fileName || 'study-material');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setMessage("✅ Download started!");
      
    } catch (err) {
      console.error("Error downloading material:", err);
      setMessage("❌ Failed to download material. Please check your permissions.");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white shadow rounded-lg p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Study Material Management</h2>

        {/* Supported Formats Info */}
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          <strong className="font-bold">Supported File Formats: </strong>
          <span>{supportedFormats.join(', ')}</span>
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
                setStudyMaterials([]);
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
                  fetchStudyMaterials(e.target.value, filters.accessTypes);
                } else {
                  setStudyMaterials([]);
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

        {/* Add/Edit Study Material Form */}
        {selectedUnit && (
          <form onSubmit={editingMaterial ? handleUpdateStudyMaterial : handleAddStudyMaterial} className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              {editingMaterial ? 'Edit Study Material' : 'Add New Study Material'}
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
                {editingMaterial ? 'Update Study Material' : 'Add Study Material'}
              </button>
              {editingMaterial && (
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
              message.includes("✅") || message.includes("▶️") || message.includes("⏳") ? "text-green-700 bg-green-100" : 
              message.includes("❌") ? "text-red-700 bg-red-100" :
              "text-blue-700 bg-blue-100"
            }`}
          >
            {message}
          </p>
        )}

        {/* Study Materials List */}
        {selectedUnit && (
          <>
            <h3 className="text-lg font-semibold mb-4">Study Materials</h3>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : studyMaterials.length > 0 ? (
              <div className="grid gap-4">
                {studyMaterials.map((material) => (
                  <div key={material.id} className="border p-4 rounded-lg bg-white shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{material.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{material.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            material.accessTypes === 'FREE' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {material.accessTypes === 'FREE' ? 'FREE' : `$${formatPrice(material.price)}`}
                          </span>
                          {material.fileName && (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              material.isSupported ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {material.isSupported ? 'File Ready' : `Unsupported format: .${getFileExtension(material.fileName)}`}
                            </span>
                          )}
                          {material.fileName && (
                            <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                              File: {material.fileName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEditStudyMaterial(material)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => downloadMaterial(material.id)}
                          disabled={!material.fileName || !material.isSupported}
                          className={`px-3 py-1 rounded text-sm ${
                            material.fileName && material.isSupported
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Download
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Study File ({supportedFormats.join(', ')})
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm cursor-pointer hover:bg-blue-200">
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                              onChange={(e) => {
                                if (e.target.files[0]) {
                                  handleFileUpload(e.target.files[0], material.id);
                                }
                              }}
                            />
                            Choose File
                          </label>
                          <span className="text-sm text-gray-500">
                            {material.fileName ? "Uploaded" : "No file"}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Thumbnail (JPG, PNG)
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm cursor-pointer hover:bg-blue-200">
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files[0]) {
                                  handleThumbnailUpload(e.target.files[0], material.id);
                                }
                              }}
                            />
                            Choose Thumbnail
                          </label>
                          {material.thumbnailPath && (
                            <div className="ml-2">
                              <img 
                                src={material.thumbnailUrl} 
                                alt="Thumbnail" 
                                className="h-10 w-10 object-cover rounded"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                No study materials found for this unit. Create your first one using the form above.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudyMaterialManagement;
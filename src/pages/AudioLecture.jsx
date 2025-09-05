import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSubjectsAndCourses,
  fetchUnits,
  fetchAudioLectures,
  addAudioLecture,
  updateAudioLecture,
  uploadAudioFile,
  uploadThumbnail,
  setActiveTab,
  setSelectedSubject,
  setSelectedCourse,
  setSelectedSubjectUnit,
  setSelectedCourseUnit,
  setTitle,
  setDescription,
  setDuration,
  setPrice,
  setValidityDays,
  setAccessTypes,
  setEditingAudio,
  setFilter,
  clearFilters,
  setMessage,
  setAudioError,
  setPlayingAudio,
  resetForm,
  setAudioElement,
} from "../store/AudioLectureslice";
import { API_BASE_URL } from "../config/api";

// Safe selector hook
const useAudioLectureState = () => {
  const state = useSelector((state) => state.audioLectures || {});
  
  return {
    activeTab: state.activeTab || "subjects",
    subjects: state.subjects || [],
    courses: state.courses || [],
    subjectUnits: state.subjectUnits || [],
    courseUnits: state.courseUnits || [],
    subjectAudioLectures: state.subjectAudioLectures || [],
    courseAudioLectures: state.courseAudioLectures || [],
    loading: state.loading || false,
    selectedSubject: state.selectedSubject || "",
    selectedCourse: state.selectedCourse || "",
    selectedSubjectUnit: state.selectedSubjectUnit || "",
    selectedCourseUnit: state.selectedCourseUnit || "",
    message: state.message || "",
    playingAudio: state.playingAudio || null,
    audioError: state.audioError || null,
    audioElement: state.audioElement || null,
    title: state.title || "",
    description: state.description || "",
    duration: state.duration || "",
    price: state.price || 0,
    validityDays: state.validityDays || 0,
    accessTypes: state.accessTypes || "FREE",
    editingAudio: state.editingAudio || null,
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

const AudioLectureManagement = () => {
  const dispatch = useDispatch();
  const state = useAudioLectureState();
  
  const {
    activeTab,
    subjects,
    courses,
    subjectUnits,
    courseUnits,
    subjectAudioLectures,
    courseAudioLectures,
    loading,
    selectedSubject,
    selectedCourse,
    selectedSubjectUnit,
    selectedCourseUnit,
    message,
    playingAudio,
    audioError,
    audioElement,
    title,
    description,
    duration,
    price,
    validityDays,
    accessTypes,
    editingAudio,
    filters,
    filterOptions,
    filteredSubjects,
    filteredCourses,
  } = state;

  const supportedFormats = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
  
  // Clean up audio element on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  // Fetch subjects and courses on mount
  useEffect(() => {
    dispatch(fetchSubjectsAndCourses());
  }, [dispatch]);

  // Function to fix audio URL - replace backslashes with forward slashes
  const fixAudioUrl = (url) => {
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

  // Function to get the correct audio URL with authentication token
  const getAudioUrl = (audioId) => {
    const token = localStorage.getItem("token");
    return `${API_BASE_URL}/audio-lecture/listen/${audioId}?token=${token}`;
  };

  // Check if file format is supported
  const isSupportedFormat = (filename) => {
    if (!filename) return false;
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return supportedFormats.includes(extension);
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

  // Fetch audio lectures when unit is selected
  const handleSelectUnit = (unitId) => {
    if (activeTab === "subjects") {
      dispatch(setSelectedSubjectUnit(unitId));
    } else {
      dispatch(setSelectedCourseUnit(unitId));
    }
    
    if (unitId) {
      dispatch(fetchAudioLectures({ unitId, accessTypeFilter: filters.accessTypes }));
    }
  };

  // Add new audio lecture
  const handleAddAudioLecture = async (e) => {
    e.preventDefault();
    
    const selectedId = activeTab === "subjects" ? selectedSubject : selectedCourse;
    const selectedUnit = activeTab === "subjects" ? selectedSubjectUnit : selectedCourseUnit;
    
    if (!selectedId || !selectedUnit || !title.trim()) {
      dispatch(setMessage("Please fill all required fields."));
      return;
    }

    try {
      const audioData = {
        title,
        description,
        duration: parseInt(duration) || 0,
        price: accessTypes === "PAID" ? parseFloat(price) : 0,
        validityDays: parseInt(validityDays) || 0,
        accessTypes,
        unitId: selectedUnit
      };
      
      // Add the appropriate ID based on active tab
      if (activeTab === "subjects") {
        audioData.subjectId = selectedSubject;
      } else {
        audioData.courseId = selectedCourse;
      }

      await dispatch(addAudioLecture(audioData)).unwrap();
      
      dispatch(resetForm());
      dispatch(fetchAudioLectures({ unitId: selectedUnit, accessTypeFilter: filters.accessTypes }));
    } catch (err) {
      console.error("Error adding audio lecture:", err);
    }
  };

  // Update audio lecture
  const handleUpdateAudioLecture = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      dispatch(setMessage("Please fill all required fields."));
      return;
    }

    try {
      const updateData = {
        title,
        description,
        duration: parseInt(duration) || 0,
        price: accessTypes === "PAID" ? parseFloat(price) : 0,
        validityDays: parseInt(validityDays) || 0,
        accessTypes
      };

      await dispatch(updateAudioLecture({
        id: editingAudio.id,
        data: updateData
      })).unwrap();
      
      dispatch(resetForm());
      const selectedUnit = activeTab === "subjects" ? selectedSubjectUnit : selectedCourseUnit;
      dispatch(fetchAudioLectures({ unitId: selectedUnit, accessTypeFilter: filters.accessTypes }));
    } catch (err) {
      console.error("Error updating audio lecture:", err);
    }
  };

  // Handle edit audio lecture
  const handleEditAudioLecture = (audio) => {
    dispatch(setEditingAudio(audio));
    dispatch(setTitle(audio.title || ""));
    dispatch(setDescription(audio.description || ""));
    dispatch(setDuration(audio.duration || ""));
    dispatch(setPrice(audio.price || 0));
    dispatch(setValidityDays(audio.validityDays || 0));
    dispatch(setAccessTypes(audio.accessTypes || "FREE"));
  };

  // Cancel edit
  const cancelEdit = () => {
    dispatch(resetForm());
  };

  // Handle audio file upload with format validation
  const handleAudioUpload = async (file, audioId) => {
    // Check if file format is supported
    if (!isSupportedFormat(file.name)) {
      dispatch(setMessage(`❌ Unsupported audio format. Please use: ${supportedFormats.join(', ')}`));
      return;
    }

    try {
      dispatch(setMessage("⏳ Uploading audio file..."));
      await dispatch(uploadAudioFile({ audioId, file })).unwrap();
      const selectedUnit = activeTab === "subjects" ? selectedSubjectUnit : selectedCourseUnit;
      dispatch(fetchAudioLectures({ unitId: selectedUnit, accessTypeFilter: filters.accessTypes }));
    } catch (err) {
      console.error("Error uploading audio:", err);
    }
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = async (file, audioId) => {
    try {
      dispatch(setMessage("⏳ Uploading thumbnail..."));
      await dispatch(uploadThumbnail({ audioId, file })).unwrap();
      const selectedUnit = activeTab === "subjects" ? selectedSubjectUnit : selectedCourseUnit;
      dispatch(fetchAudioLectures({ unitId: selectedUnit, accessTypeFilter: filters.accessTypes }));
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

  // Get current audio lectures based on active tab
  const getCurrentAudioLectures = () => {
    return activeTab === "subjects" ? subjectAudioLectures : courseAudioLectures;
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

  // Get file extension from filename
  const getFileExtension = (filename) => {
    if (!filename) return '';
    return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
  };

  // Alternative approach: Use fetch to get audio blob and create object URL
  const playAudio = async (audioId, audioUrl) => {
    try {
      dispatch(setAudioError(null));
      
      // Check if audio is already playing
      if (playingAudio === audioId) {
        // Stop currently playing audio
        if (audioElement) {
          audioElement.pause();
          audioElement.src = '';
        }
        dispatch(setPlayingAudio(null));
        return;
      }
      
      dispatch(setPlayingAudio(audioId));
      dispatch(setMessage("⏳ Loading audio..."));
      
      // If we have a direct URL to the audio file, use it
      if (audioUrl) {
        // Create audio element for playback
        const newAudioElement = new Audio(audioUrl);
        
        newAudioElement.onerror = (e) => {
          console.error("Audio element error:", e);
          dispatch(setAudioError("Failed to play audio: The file may be corrupted or in an unsupported format."));
          dispatch(setPlayingAudio(null));
        };
        
        newAudioElement.onended = () => {
          dispatch(setPlayingAudio(null));
        };
        
        newAudioElement.oncanplay = () => {
          dispatch(setMessage("✅ Audio ready to play"));
        };
        
        dispatch(setAudioElement(newAudioElement));
        
        // Play the audio
        await newAudioElement.play();
        dispatch(setMessage("▶️ Playing audio..."));
        return;
      }
      
      // Fallback to API endpoint if no direct URL
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }
      
      // Use fetch to get the audio with proper authentication
      const response = await fetch(getAudioUrl(audioId), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        } else if (response.status === 404) {
          throw new Error("Audio file not found on server.");
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }
      
      // Check if response is audio
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('audio/')) {
        throw new Error("Server returned non-audio content.");
      }
      
      // Convert response to blob
      const audioBlob = await response.blob();
      
      // Create object URL from blob
      const audioObjectUrl = URL.createObjectURL(audioBlob);
      
      // Create audio element for playback
      const newAudioElement = new Audio(audioObjectUrl);
      
      newAudioElement.onerror = (e) =>{
        console.error("Audio element error:", e);
        dispatch(setAudioError("Failed to play audio: The file may be corrupted or in an unsupported format."));
        dispatch(setPlayingAudio(null));
        URL.revokeObjectURL(audioObjectUrl); // Clean up
      };
      
      newAudioElement.onended = () => {
        dispatch(setPlayingAudio(null));
        URL.revokeObjectURL(audioObjectUrl); // Clean up
      };
      
      newAudioElement.oncanplay = () => {
        dispatch(setMessage("✅ Audio ready to play"));
      };
      
      dispatch(setAudioElement(newAudioElement));
      
      // Play the audio
      await newAudioElement.play();
      dispatch(setMessage("▶️ Playing audio..."));
      
    } catch (err) {
      console.error("Error playing audio:", err);
      dispatch(setAudioError(err.message || "Failed to play audio. Please check your permissions and try again."));
      dispatch(setPlayingAudio(null));
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white shadow rounded-lg p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Audio Lecture Management</h2>

        {/* Tabs for Subjects and Courses */}
        <div className="flex border-b mb-6">
          <button
            className={`py-2 px-4 font-medium ${activeTab === "subjects" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
            onClick={() => dispatch(setActiveTab("subjects"))}
          >
            Subject Audios
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === "courses" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
            onClick={() => dispatch(setActiveTab("courses"))}
          >
            Course Audios
          </button>
        </div>

        {/* Audio Error Alert */}
        {audioError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded relative">
            <strong className="font-bold">Audio Error: </strong>
            <span className="block sm:inline">{audioError}</span>
            <button 
              className="absolute top-0 right-0 p-2"
              onClick={() => dispatch(setAudioError(null))}
            >
              ×
            </button>
          </div>
        )}

        {/* Supported Formats Info */}
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          <strong className="font-bold">Supported Audio Formats: </strong>
          <span>{supportedFormats.join(', ')}</span>
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
                  <option key={index}value={grade}>{grade}</option>
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

        {/* Add/Edit Audio Lecture Form */}
        {getCurrentSelectedUnit() && (
          <form onSubmit={editingAudio ? handleUpdateAudioLecture : handleAddAudioLecture} className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              {editingAudio ? 'Edit Audio Lecture' : `Add New Audio Lecture to ${activeTab === "subjects" ? "Subject" : "Course"}`}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={duration}
                  onChange={(e) => dispatch(setDuration(e.target.value))}
                  min="0"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Validity Days</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={validityDays}
                  onChange={(e) => dispatch(setValidityDays(e.target.value))}
                  min="0"
                  placeholder="0 = No expiry"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Processing...' : (editingAudio ? 'Update Audio Lecture' : 'Add Audio Lecture')}
              </button>
              {editingAudio && (
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

        {/* Audio Lectures List */}
        {getCurrentSelectedUnit() && (
          <>
            <h3 className="text-lg font-semibold mb-4">Audio Lectures</h3>
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : getCurrentAudioLectures().length === 0 ? (
              <p>No audio lectures found for this unit.</p>
            ) : (
              <div className="space-y-4">
                {getCurrentAudioLectures().map((audio) => (
                  <div key={audio.id} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <h4 className="text-md font-semibold">{audio.title}</h4>
                        <p className="text-sm text-gray-600">{audio.description}</p>
                        <p className="text-sm text-gray-600">
                          Duration: {audio.duration || 'N/A'} mins | Access: {audio.accessTypes} | Price: ${formatPrice(audio.price)} | Validity: {audio.validityDays || 'No expiry'} days
                        </p>
                      </div>
                      
                      <div className="mt-3 md:mt-0 flex items-center gap-3">
                        {/* Play/Pause Button */}
                        <button
                          onClick={() => playAudio(audio.id, fixAudioUrl(audio.audioUrl))}
                          className={`px-3 py-1 rounded-lg text-white ${
                            playingAudio === audio.id ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {playingAudio === audio.id ? 'Stop' : 'Play'}
                        </button>

                        {/* Upload Audio File */}
                        <label className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg cursor-pointer">
                          Upload Audio
                          <input
                            type="file"
                            accept={supportedFormats.map(ext => `audio/${ext.substring(1)}`).join(',')}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files.length > 0) {
                                handleAudioUpload(e.target.files[0], audio.id);
                                e.target.value = null; // Reset file input
                              }
                            }}
                          />
                        </label>

                        {/* Upload Thumbnail */}
                        <label className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg cursor-pointer">
                          Upload Thumbnail
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files.length > 0) {
                                handleThumbnailUpload(e.target.files[0], audio.id);
                                e.target.value = null; // Reset file input
                              }
                            }}
                          />
                        </label>
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditAudioLecture(audio)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    {/* Thumbnail */}
                    {audio.thumbnailUrl && (
                      <div className="mt-3">
                        <img
                          src={fixAudioUrl(audio.thumbnailUrl)}
                          alt="Thumbnail"
                          className="w-32 h-32 object-cover rounded"
                        />
                      </div>
                    )}
                    {/* Audio Format Info */}
                    {audio.audioUrl && (
                      <p className="text-sm text-gray-500 mt-2">
                        Format: {getFileExtension(audio.audioUrl).toUpperCase()}
                      </p>
                    )}
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

export default AudioLectureManagement;
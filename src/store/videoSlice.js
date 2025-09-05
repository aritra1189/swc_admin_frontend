import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

import { API_BASE_URL } from '../config/api';

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

// Async thunks
export const fetchSubjectsAndCourses = createAsyncThunk(
  'videoLecture/fetchSubjectsAndCourses',
  async () => {
    const [subjectsRes, coursesRes] = await Promise.all([
      api.get('/subject/list', {
        params: { limit: 100, offset: 0, status: 'ACTIVE' }
      }),
      api.get('/course/admin', {
        params: { limit: 100, offset: 0, status: 'ACTIVE' }
      })
    ]);

    const subjectData = subjectsRes.data?.result || [];
    const courseData = coursesRes.data?.result || [];
    const allItems = [...subjectData, ...courseData];

    const filterOptions = {
      grades: [...new Set(allItems.map(item => item.grade?.name).filter(Boolean))],
      streams: [...new Set(allItems.map(item => item.stream?.name).filter(Boolean))],
      semesters: [...new Set(allItems.map(item => item.semester?.name).filter(Boolean))],
      degrees: [...new Set(allItems.map(item => item.degree?.name).filter(Boolean))],
      universities: [...new Set(allItems.map(item => item.university?.name).filter(Boolean))],
      names: [...new Set(allItems.map(item => item.subMaster?.name || item.name).filter(Boolean))]
    };

    return { subjects: subjectData, courses: courseData, filterOptions };
  }
);

export const fetchUnits = createAsyncThunk(
  'videoLecture/fetchUnits',
  async ({ id, type }) => {
    const endpoint = type === 'subjects' 
      ? `/unit/list?subjectId=${id}&limit=100&offset=0`
      : `/unit/list?courseId=${id}&limit=100&offset=0`;
    
    const res = await api.get(endpoint);
    return res.data?.result || [];
  }
);

export const fetchVideoLectures = createAsyncThunk(
  'videoLecture/fetchVideoLectures',
  async ({ unitId, accessTypeFilter = "" }) => {
    const params = {};
    if (unitId) params.unitId = unitId;
    if (accessTypeFilter) params.accessTypes = accessTypeFilter;
    
    const res = await api.get('/video-lecture/list', { params });
    return res.data?.result || [];
  }
);

export const addVideoLecture = createAsyncThunk(
  'videoLecture/addVideoLecture',
  async (payload) => {
    const res = await api.post("/video-lecture", payload);
    return res.data;
  }
);

export const updateVideoLecture = createAsyncThunk(
  'videoLecture/updateVideoLecture',
  async ({ id, data }) => {
    const res = await api.put(`/video-lecture/${id}`, data);
    return { id, data: res.data };
  }
);

export const uploadThumbnail = createAsyncThunk(
  'videoLecture/uploadThumbnail',
  async ({ videoId, file }) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await api.put(`/video-lecture/thumbnail/${videoId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return { videoId, thumbnailUrl: res.data.thumbnailUrl };
  }
);

const initialState = {
  // Data
  subjects: [],
  courses: [],
  subjectUnits: [],
  courseUnits: [],
  subjectVideoLectures: [],
  courseVideoLectures: [],
  
  // UI State
  activeTab: "subjects",
  selectedSubject: "",
  selectedCourse: "",
  selectedSubjectUnit: "",
  selectedCourseUnit: "",
  loading: false,
  message: "",
  
  // Form State
  title: "",
  description: "",
  videoUrl: "",
  duration: "",
  price: 0,
  accessTypes: "FREE",
  editingVideo: null,
  
  // Filters
  filters: {
    grade: "",
    stream: "",
    semester: "",
    degree: "",
    university: "",
    name: "",
    accessTypes: ""
  },
  filterOptions: {
    grades: [],
    streams: [],
    semesters: [],
    degrees: [],
    universities: [],
    names: []
  },
  
  // Filtered Data
  filteredSubjects: [],
  filteredCourses: []
};

const videoLectureSlice = createSlice({
  name: 'videoLecture',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
      // Reset selections when changing tabs
      state.selectedSubject = "";
      state.selectedCourse = "";
      state.selectedSubjectUnit = "";
      state.selectedCourseUnit = "";
      state.subjectVideoLectures = [];
      state.courseVideoLectures = [];
    },
    setSelectedSubject: (state, action) => {
      state.selectedSubject = action.payload;
      state.selectedSubjectUnit = "";
      state.subjectVideoLectures = [];
    },
    setSelectedCourse: (state, action) => {
      state.selectedCourse = action.payload;
      state.selectedCourseUnit = "";
      state.courseVideoLectures = [];
    },
    setSelectedSubjectUnit: (state, action) => {
      state.selectedSubjectUnit = action.payload;
    },
    setSelectedCourseUnit: (state, action) => {
      state.selectedCourseUnit = action.payload;
    },
    setFormField: (state, action) => {
      const { field, value } = action.payload;
      state[field] = value;
    },
    setEditingVideo: (state, action) => {
      state.editingVideo = action.payload;
      if (action.payload) {
        state.title = action.payload.title;
        state.description = action.payload.description || "";
        state.videoUrl = action.payload.videoUrl;
        state.duration = action.payload.duration || "";
        state.accessTypes = action.payload.accessTypes;
        state.price = action.payload.price || 0;
      }
    },
    resetForm: (state) => {
      state.title = "";
      state.description = "";
      state.videoUrl = "";
      state.duration = "";
      state.accessTypes = "FREE";
      state.price = 0;
      state.editingVideo = null;
    },
    setFilter: (state, action) => {
      const { filterType, value } = action.payload;
      state.filters[filterType] = value;
      // Apply filtering immediately
      filterData(state);
    },
    clearFilters: (state) => {
      state.filters = {
        grade: "",
        stream: "",
        semester: "",
        degree: "",
        university: "",
        name: "",
        accessTypes: ""
      };
      // Apply filtering immediately
      filterData(state);
    },
    setMessage: (state, action) => {
      state.message = action.payload;
    },
    clearMessage: (state) => {
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Subjects and Courses
      .addCase(fetchSubjectsAndCourses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSubjectsAndCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.subjects = action.payload.subjects;
        state.courses = action.payload.courses;
        state.filterOptions = action.payload.filterOptions;
        // Initialize filtered data
        state.filteredSubjects = action.payload.subjects;
        state.filteredCourses = action.payload.courses;
      })
      .addCase(fetchSubjectsAndCourses.rejected, (state) => {
        state.loading = false;
        state.message = "Failed to load data.";
      })
      // Fetch Units
      .addCase(fetchUnits.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUnits.fulfilled, (state, action) => {
        state.loading = false;
        if (state.activeTab === "subjects") {
          state.subjectUnits = action.payload;
        } else {
          state.courseUnits = action.payload;
        }
      })
      .addCase(fetchUnits.rejected, (state) => {
        state.loading = false;
        state.message = "Failed to load units.";
      })
      // Fetch Video Lectures
      .addCase(fetchVideoLectures.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVideoLectures.fulfilled, (state, action) => {
        state.loading = false;
        if (state.activeTab === "subjects") {
          state.subjectVideoLectures = action.payload;
        } else {
          state.courseVideoLectures = action.payload;
        }
      })
      .addCase(fetchVideoLectures.rejected, (state) => {
        state.loading = false;
        state.message = "Failed to load video lectures.";
      })
      // Add Video Lecture
      .addCase(addVideoLecture.pending, (state) => {
        state.loading = true;
      })
      .addCase(addVideoLecture.fulfilled, (state) => {
        state.loading = false;
        state.message = "✅ Video lecture added successfully!";
      })
      .addCase(addVideoLecture.rejected, (state) => {
        state.loading = false;
        state.message = "❌ Failed to add video lecture.";
      })
      // Update Video Lecture
      .addCase(updateVideoLecture.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateVideoLecture.fulfilled, (state) => {
        state.loading = false;
        state.message = "✅ Video lecture updated successfully!";
        state.editingVideo = null;
      })
      .addCase(updateVideoLecture.rejected, (state) => {
        state.loading = false;
        state.message = "❌ Failed to update video lecture.";
      })
      // Upload Thumbnail
      .addCase(uploadThumbnail.fulfilled, (state, action) => {
        const { videoId, thumbnailUrl } = action.payload;
        // Update the video lecture with the new thumbnail
        const videoLectures = state.activeTab === "subjects" 
          ? state.subjectVideoLectures 
          : state.courseVideoLectures;
        
        const updatedVideoLectures = videoLectures.map(video => 
          video.id === videoId ? { ...video, thumbnailUrl } : video
        );
        
        if (state.activeTab === "subjects") {
          state.subjectVideoLectures = updatedVideoLectures;
        } else {
          state.courseVideoLectures = updatedVideoLectures;
        }
        
        state.message = "✅ Thumbnail uploaded successfully!";
      })
      .addCase(uploadThumbnail.rejected, (state) => {
        state.message = "❌ Failed to upload thumbnail.";
      });
  }
});

// Helper function for filtering
function filterData(state) {
  if (state.activeTab === "subjects") {
    let filtered = [...state.subjects];
    
    if (state.filters.grade) {
      filtered = filtered.filter(item => item.grade?.name === state.filters.grade);
    }
    
    if (state.filters.stream) {
      filtered = filtered.filter(item => item.stream?.name === state.filters.stream);
    }
    
    if (state.filters.semester) {
      filtered = filtered.filter(item => item.semester?.name === state.filters.semester);
    }
    
    if (state.filters.degree) {
      filtered = filtered.filter(item => item.degree?.name === state.filters.degree);
    }
    
    if (state.filters.university) {
      filtered = filtered.filter(item => item.university?.name === state.filters.university);
    }
    
    if (state.filters.name) {
      filtered = filtered.filter(item => item.subMaster?.name === state.filters.name);
    }
    
    state.filteredSubjects = filtered;
  } else {
    let filtered = [...state.courses];
    
    if (state.filters.grade) {
      filtered = filtered.filter(item => item.grade?.name === state.filters.grade);
    }
    
    if (state.filters.stream) {
      filtered = filtered.filter(item => item.stream?.name === state.filters.stream);
    }
    
    if (state.filters.semester) {
      filtered = filtered.filter(item => item.semester?.name === state.filters.semester);
    }
    
    if (state.filters.degree) {
      filtered = filtered.filter(item => item.degree?.name === state.filters.degree);
    }
    
    if (state.filters.university) {
      filtered = filtered.filter(item => item.university?.name === state.filters.university);
    }
    
    if (state.filters.name) {
      filtered = filtered.filter(item => item.name === state.filters.name);
    }
    
    state.filteredCourses = filtered;
  }
}

export const {
  setActiveTab,
  setSelectedSubject,
  setSelectedCourse,
  setSelectedSubjectUnit,
  setSelectedCourseUnit,
  setFormField,
  setEditingVideo,
  resetForm,
  setFilter,
  clearFilters,
  setMessage,
  clearMessage,
} = videoLectureSlice.actions;

export default videoLectureSlice.reducer;
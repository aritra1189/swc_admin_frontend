import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';

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
export const fetchSubjects = createAsyncThunk(
  'audioLecture/fetchSubjects',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/subject/list', {
        params: {
          limit: 100,
          offset: 0,
          status: 'ACTIVE'
        }
      });
      return res.data?.result || [];
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch subjects');
    }
  }
);

export const fetchUnits = createAsyncThunk(
  'audioLecture/fetchUnits',
  async (subjectId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/unit/list?subjectId=${subjectId}&limit=100&offset=0`);
      return res.data?.result || [];
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch units');
    }
  }
);

export const fetchAudioLectures = createAsyncThunk(
  'audioLecture/fetchAudioLectures',
  async ({ unitId, accessTypeFilter = "" }, { rejectWithValue }) => {
    try {
      const params = {};
      if (unitId) params.unitId = unitId;
      if (accessTypeFilter) params.accessTypes = accessTypeFilter;
      
      const res = await api.get('/audio-lecture/list', { params });
      
      // Process the lectures data - fix the audio URLs
      const supportedFormats = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
      const isSupportedFormat = (filename) => {
        if (!filename) return false;
        const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return supportedFormats.includes(extension);
      };
      
      const fixAudioUrl = (url) => {
        if (!url) return null;
        let fixedUrl = url.replace(/\\/g, '/');
        if (fixedUrl.includes('localhost') && !API_BASE_URL.includes('localhost')) {
          const urlPath = fixedUrl.split('/').slice(3).join('/');
          fixedUrl = `${API_BASE_URL}/${urlPath}`;
        }
        return fixedUrl;
      };
      
      return (res.data?.result || []).map(lecture => ({
        ...lecture,
        audioUrl: fixAudioUrl(lecture.audioUrl),
        fileName: lecture.audioPath ? lecture.audioPath.split('/').pop() : null,
        isSupported: lecture.audioPath ? isSupportedFormat(lecture.audioPath) : false
      }));
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch audio lectures');
    }
  }
);

export const addAudioLecture = createAsyncThunk(
  'audioLecture/addAudioLecture',
  async (lectureData, { rejectWithValue }) => {
    try {
      const res = await api.post("/audio-lecture", lectureData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to add audio lecture');
    }
  }
);

export const updateAudioLecture = createAsyncThunk(
  'audioLecture/updateAudioLecture',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/audio-lecture/${id}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to update audio lecture');
    }
  }
);

export const uploadAudioFile = createAsyncThunk(
  'audioLecture/uploadAudioFile',
  async ({ audioId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.put(`/audio-lecture/audio/${audioId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to upload audio file');
    }
  }
);

export const uploadThumbnail = createAsyncThunk(
  'audioLecture/uploadThumbnail',
  async ({ audioId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.put(`/audio-lecture/thumbnail/${audioId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to upload thumbnail');
    }
  }
);

// Initial state
const initialState = {
  subjects: [],
  units: [],
  filteredSubjects: [],
  audioLectures: [],
  loading: false,
  selectedSubject: "",
  selectedUnit: "",
  message: "",
  playingAudio: null,
  audioError: null,
  audioElement: null,
  
  // Form states
  title: "",
  description: "",
  duration: "",
  price: 0,
  accessTypes: "FREE",
  editingAudio: null,
  
  // Filter states
  filters: {
    grade: "",
    stream: "",
    semester: "",
    degree: "",
    university: "",
    subjectName: "",
    accessTypes: ""
  },
  
  // Filter options
  filterOptions: {
    grades: [],
    streams: [],
    semesters: [],
    degrees: [],
    universities: [],
    subjectNames: []
  }
};

// Slice
const audioLectureSlice = createSlice({
  name: 'audioLecture',
  initialState,
  reducers: {
    setSelectedSubject: (state, action) => {
      state.selectedSubject = action.payload;
      state.selectedUnit = "";
      state.audioLectures = [];
    },
    setSelectedUnit: (state, action) => {
      state.selectedUnit = action.payload;
    },
    setTitle: (state, action) => {
      state.title = action.payload;
    },
    setDescription: (state, action) => {
      state.description = action.payload;
    },
    setDuration: (state, action) => {
      state.duration = action.payload;
    },
    setPrice: (state, action) => {
      state.price = action.payload;
    },
    setAccessTypes: (state, action) => {
      state.accessTypes = action.payload;
    },
    setEditingAudio: (state, action) => {
      state.editingAudio = action.payload;
      if (action.payload) {
        state.title = action.payload.title;
        state.description = action.payload.description || "";
        state.duration = action.payload.duration || "";
        state.accessTypes = action.payload.accessTypes;
        state.price = action.payload.price || 0;
      }
    },
    setFilter: (state, action) => {
      const { filterType, value } = action.payload;
      state.filters[filterType] = value;
      
      // Apply filters to subjects
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
      
      if (state.filters.subjectName) {
        filtered = filtered.filter(item => item.subMaster?.name === state.filters.subjectName);
      }
      
      state.filteredSubjects = filtered;
    },
    clearFilters: (state) => {
      state.filters = {
        grade: "",
        stream: "",
        semester: "",
        degree: "",
        university: "",
        subjectName: "",
        accessTypes: ""
      };
      state.filteredSubjects = state.subjects;
    },
    setMessage: (state, action) => {
      state.message = action.payload;
    },
    setAudioError: (state, action) => {
      state.audioError = action.payload;
    },
    setPlayingAudio: (state, action) => {
      state.playingAudio = action.payload;
    },
    setAudioElement: (state, action) => {
      state.audioElement = action.payload;
    },
    resetForm: (state) => {
      state.title = "";
      state.description = "";
      state.duration = "";
      state.accessTypes = "FREE";
      state.price = 0;
      state.editingAudio = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch subjects
      .addCase(fetchSubjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSubjects.fulfilled, (state, action) => {
        state.loading = false;
        state.subjects = action.payload;
        state.filteredSubjects = action.payload;
        
        // Extract unique values for filters
        const grades = [...new Set(action.payload.map(item => item.grade?.name).filter(Boolean))];
        const streams = [...new Set(action.payload.map(item => item.stream?.name).filter(Boolean))];
        const semesters = [...new Set(action.payload.map(item => item.semester?.name).filter(Boolean))];
        const degrees = [...new Set(action.payload.map(item => item.degree?.name).filter(Boolean))];
        const universities = [...new Set(action.payload.map(item => item.university?.name).filter(Boolean))];
        const subjectNames = [...new Set(action.payload.map(item => item.subMaster?.name).filter(Boolean))];
        
        state.filterOptions = {
          grades,
          streams,
          semesters,
          degrees,
          universities,
          subjectNames
        };
      })
      .addCase(fetchSubjects.rejected, (state, action) => {
        state.loading = false;
        state.message = "Failed to load subjects.";
      })
      // Fetch units
      .addCase(fetchUnits.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUnits.fulfilled, (state, action) => {
        state.loading = false;
        state.units = action.payload;
      })
      .addCase(fetchUnits.rejected, (state, action) => {
        state.loading = false;
        state.message = "Failed to load units.";
      })
      // Fetch audio lectures
      .addCase(fetchAudioLectures.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAudioLectures.fulfilled, (state, action) => {
        state.loading = false;
        state.audioLectures = action.payload;
      })
      .addCase(fetchAudioLectures.rejected, (state, action) => {
        state.loading = false;
        state.message = "Failed to load audio lectures.";
      })
      // Add audio lecture
      .addCase(addAudioLecture.fulfilled, (state) => {
        state.message = "✅ Audio lecture added successfully!";
        state.title = "";
        state.description = "";
        state.duration = "";
        state.accessTypes = "FREE";
        state.price = 0;
      })
      .addCase(addAudioLecture.rejected, (state) => {
        state.message = "❌ Failed to add audio lecture.";
      })
      // Update audio lecture
      .addCase(updateAudioLecture.fulfilled, (state) => {
        state.message = "✅ Audio lecture updated successfully!";
        state.editingAudio = null;
        state.title = "";
        state.description = "";
        state.duration = "";
        state.accessTypes = "FREE";
        state.price = 0;
      })
      .addCase(updateAudioLecture.rejected, (state) => {
        state.message = "❌ Failed to update audio lecture.";
      })
      // Upload audio file
      .addCase(uploadAudioFile.fulfilled, (state) => {
        state.message = "✅ Audio file uploaded successfully!";
      })
      .addCase(uploadAudioFile.rejected, (state) => {
        state.message = "❌ Failed to upload audio file.";
      })
      // Upload thumbnail
      .addCase(uploadThumbnail.fulfilled, (state) => {
        state.message = "✅ Thumbnail uploaded successfully!";
      })
      .addCase(uploadThumbnail.rejected, (state) => {
        state.message = "❌ Failed to upload thumbnail.";
      });
  },
});

export const {
  setSelectedSubject,
  setSelectedUnit,
  setTitle,
  setDescription,
  setDuration,
  setPrice,
  setAccessTypes,
  setEditingAudio,
  setFilter,
  clearFilters,
  setMessage,
  setAudioError,
  setPlayingAudio,
  setAudioElement,
  resetForm,
} = audioLectureSlice.actions;

export default audioLectureSlice.reducer;
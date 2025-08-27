// src/store/slices/mcqTestSlice.js
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
  'mcqTest/fetchSubjects',
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
  'mcqTest/fetchUnits',
  async (subjectId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/unit/list?subjectId=${subjectId}&limit=100&offset=0`);
      return res.data?.result || [];
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch units');
    }
  }
);

export const fetchMcqTests = createAsyncThunk(
  'mcqTest/fetchMcqTests',
  async ({ unitId, accessTypeFilter = "" }, { rejectWithValue }) => {
    try {
      const params = {};
      if (unitId) params.unitId = unitId;
      if (accessTypeFilter) params.accessTypes = accessTypeFilter;
      
      const res = await api.get('/mcq-test/list', { params });
      
      // Process the MCQ tests data
      const fixThumbnailUrl = (url) => {
        if (!url) return null;
        let fixedUrl = url.replace(/\\/g, '/');
        if (fixedUrl.includes('localhost') && !API_BASE_URL.includes('localhost')) {
          const urlPath = fixedUrl.split('/').slice(3).join('/');
          fixedUrl = `${API_BASE_URL}/${urlPath}`;
        }
        return fixedUrl;
      };
      
      return (res.data?.result || []).map(test => ({
        ...test,
        thumbnailUrl: fixThumbnailUrl(test.thumbnailUrl),
      }));
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch MCQ tests');
    }
  }
);

export const fetchMcqTestsByUser = createAsyncThunk(
  'mcqTest/fetchMcqTestsByUser',
  async ({ accessTypeFilter = "", unitId = "" }, { rejectWithValue }) => {
    try {
      const params = {};
      if (unitId) params.unitId = unitId;
      if (accessTypeFilter) params.accessTypes = accessTypeFilter;
      
      const res = await api.get('/mcq-test/user', { params });
      
      // Process the MCQ tests data
      const fixThumbnailUrl = (url) => {
        if (!url) return null;
        let fixedUrl = url.replace(/\\/g, '/');
        if (fixedUrl.includes('localhost') && !API_BASE_URL.includes('localhost')) {
          const urlPath = fixedUrl.split('/').slice(3).join('/');
          fixedUrl = `${API_BASE_URL}/${urlPath}`;
        }
        return fixedUrl;
      };
      
      return (res.data?.result || []).map(test => ({
        ...test,
        thumbnailUrl: fixThumbnailUrl(test.thumbnailUrl),
      }));
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch MCQ tests');
    }
  }
);

export const addMcqTest = createAsyncThunk(
  'mcqTest/addMcqTest',
  async (testData, { rejectWithValue }) => {
    try {
      const res = await api.post("/mcq-test", testData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to add MCQ test');
    }
  }
);

export const updateMcqTest = createAsyncThunk(
  'mcqTest/updateMcqTest',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/mcq-test/${id}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to update MCQ test');
    }
  }
);

export const uploadThumbnail = createAsyncThunk(
  'mcqTest/uploadThumbnail',
  async ({ testId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.put(`/mcq-test/thumbnail/${testId}`, formData, {
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
  mcqTests: [],
  loading: false,
  selectedSubject: "",
  selectedUnit: "",
  message: "",
  
  // Form states
  title: "",
  description: "",
  timeLimit: 30,
  price: 0,
  accessTypes: "FREE",
  editingTest: null,
  
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
  },
  
  // View mode (admin vs user)
  userView: false
};

// Slice
const mcqTestSlice = createSlice({
  name: 'mcqTest',
  initialState,
  reducers: {
    setSelectedSubject: (state, action) => {
      state.selectedSubject = action.payload;
      state.selectedUnit = "";
      state.mcqTests = [];
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
    setTimeLimit: (state, action) => {
      state.timeLimit = action.payload;
    },
    setPrice: (state, action) => {
      state.price = action.payload;
    },
    setAccessTypes: (state, action) => {
      state.accessTypes = action.payload;
    },
    setEditingTest: (state, action) => {
      state.editingTest = action.payload;
      if (action.payload) {
        state.title = action.payload.title;
        state.description = action.payload.description || "";
        state.timeLimit = action.payload.timeLimit || 30;
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
    resetForm: (state) => {
      state.title = "";
      state.description = "";
      state.timeLimit = 30;
      state.accessTypes = "FREE";
      state.price = 0;
      state.editingTest = null;
    },
    setUserView: (state, action) => {
      state.userView = action.payload;
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
      // Fetch MCQ tests
      .addCase(fetchMcqTests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMcqTests.fulfilled, (state, action) => {
        state.loading = false;
        state.mcqTests = action.payload;
        state.userView = false;
      })
      .addCase(fetchMcqTests.rejected, (state, action) => {
        state.loading = false;
        state.message = "Failed to load MCQ tests.";
      })
      // Fetch MCQ tests by user
      .addCase(fetchMcqTestsByUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMcqTestsByUser.fulfilled, (state, action) => {
        state.loading = false;
        state.mcqTests = action.payload;
        state.userView = true;
      })
      .addCase(fetchMcqTestsByUser.rejected, (state, action) => {
        state.loading = false;
        state.message = "Failed to load MCQ tests.";
      })
      // Add MCQ test
      .addCase(addMcqTest.fulfilled, (state) => {
        state.message = "✅ MCQ test added successfully!";
        state.title = "";
        state.description = "";
        state.timeLimit = 30;
        state.accessTypes = "FREE";
        state.price = 0;
      })
      .addCase(addMcqTest.rejected, (state) => {
        state.message = "❌ Failed to add MCQ test.";
      })
      // Update MCQ test
      .addCase(updateMcqTest.fulfilled, (state) => {
        state.message = "✅ MCQ test updated successfully!";
        state.editingTest = null;
        state.title = "";
        state.description = "";
        state.timeLimit = 30;
        state.accessTypes = "FREE";
        state.price = 0;
      })
      .addCase(updateMcqTest.rejected, (state) => {
        state.message = "❌ Failed to update MCQ test.";
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
  setTimeLimit,
  setPrice,
  setAccessTypes,
  setEditingTest,
  setFilter,
  clearFilters,
  setMessage,
  resetForm,
  setUserView,
} = mcqTestSlice.actions;

export default mcqTestSlice.reducer;
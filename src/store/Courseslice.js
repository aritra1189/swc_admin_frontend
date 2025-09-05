// store/courseSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Async thunks
export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.status) queryParams.append('status', params.status);
      if (params.accessType) queryParams.append('accessType', params.accessType);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.offset) queryParams.append('offset', params.offset);
      if (params.keyword) queryParams.append('keyword', params.keyword);
      
      const queryString = queryParams.toString();
      const url = `/course/admin${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createCourse = createAsyncThunk(
  'courses/createCourse',
  async (courseData, { rejectWithValue }) => {
    try {
      const response = await api.post('/course', courseData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateCourse = createAsyncThunk(
  'courses/updateCourse',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/course/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteCourse = createAsyncThunk(
  'courses/deleteCourse',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/course/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const searchCourses = createAsyncThunk(
  'courses/searchCourses',
  async (query, { rejectWithValue }) => {
    try {
      const response = await api.get(`/course/search?q=${query}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateCourseThumbnail = createAsyncThunk(
  'courses/updateCourseThumbnail',
  async ({ courseId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.put(`/course/thumbnail/${courseId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const courseSlice = createSlice({
  name: 'courses',
  initialState: {
    courses: [],
    loading: false,
    error: null,
    totalCount: 0,
    filters: {
      status: '',
      accessType: '',
      limit: 10,
      offset: 0,
      keyword: ''
    },
    thumbnailUpdating: false
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setThumbnailUpdating: (state, action) => {
      state.thumbnailUpdating = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch courses
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload.result || action.payload;
        state.totalCount = action.payload.totalCount || action.payload.length;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create course
      .addCase(createCourse.fulfilled, (state, action) => {
        state.courses.push(action.payload);
        state.totalCount += 1;
      })
      // Update course
      .addCase(updateCourse.fulfilled, (state, action) => {
        const index = state.courses.findIndex(course => course.id === action.payload.id);
        if (index !== -1) {
          state.courses[index] = action.payload;
        }
      })
      // Delete course
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.courses = state.courses.filter(course => course.id !== action.payload);
        state.totalCount -= 1;
      })
      // Search courses
      .addCase(searchCourses.fulfilled, (state, action) => {
        state.courses = action.payload.result || action.payload;
        state.totalCount = action.payload.totalCount || action.payload.length;
      })
      // Update course thumbnail
      .addCase(updateCourseThumbnail.pending, (state) => {
        state.thumbnailUpdating = true;
        state.error = null;
      })
      .addCase(updateCourseThumbnail.fulfilled, (state, action) => {
        state.thumbnailUpdating = false;
        const index = state.courses.findIndex(course => course.id === action.payload.id);
        if (index !== -1) {
          state.courses[index] = action.payload;
        }
      })
      .addCase(updateCourseThumbnail.rejected, (state, action) => {
        state.thumbnailUpdating = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setFilters, setThumbnailUpdating } = courseSlice.actions;
export default courseSlice.reducer;
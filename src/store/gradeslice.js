// src/redux/slices/gradeSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { toast } from "react-toastify";

// Async thunks
export const fetchGrades = createAsyncThunk(
  "grades/fetchGrades",
  async ({ limit, offset, status, token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/grade/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit, offset, status, keyword: "" }
      });
      return { data: response.data, status };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch grades");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const createGrade = createAsyncThunk(
  "grades/createGrade",
  async ({ name, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/grade`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Grade created successfully");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create grade");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateGrade = createAsyncThunk(
  "grades/updateGrade",
  async ({ id, name, token }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/grade/${id}`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Grade updated successfully");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update grade");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateGradeStatus = createAsyncThunk(
  "grades/updateGradeStatus",
  async ({ id, status, token }, { rejectWithValue }) => {
    try {
      await axios.put(
        `${API_BASE_URL}/grade/status/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Status updated to ${status}`);
      return { id, status };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchAllStreams = createAsyncThunk(
  "grades/fetchAllStreams",
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stream/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: "ACTIVE", limit: 100, offset: 0, keyword: "" }
      });
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch streams");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchConnectedStreams = createAsyncThunk(
  "grades/fetchConnectedStreams",
  async ({ gradeId, token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/grade-stream/${gradeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch stream connections");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const connectStreamsToGrade = createAsyncThunk(
  "grades/connectStreamsToGrade",
  async ({ gradeId, streamIds, token }, { rejectWithValue }) => {
    try {
      const promises = streamIds.map(streamId => 
        axios.post(`${API_BASE_URL}/grade-stream`, {
          gradeId,
          streamId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      await Promise.all(promises);
      toast.success("Streams connected successfully");
      return streamIds;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to connect streams");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const removeStreamConnection = createAsyncThunk(
  "grades/removeStreamConnection",
  async ({ connectionId, gradeId, token }, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/grade-stream/remove/${connectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Connection removed successfully");
      return connectionId;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove connection");
      return rejectWithValue(error.response?.data);
    }
  }
);

// Slice
const gradeSlice = createSlice({
  name: "grades",
  initialState: {
    grades: [],
    loading: false,
    pagination: {
      limit: 10,
      offset: 0,
      total: 0,
      status: "ACTIVE"
    },
    streams: [],
    connectedStreams: [],
    loadingStreams: false,
    loadingConnections: false
  },
  reducers: {
    clearGrades: (state) => {
      state.grades = [];
      state.pagination = {
        limit: 10,
        offset: 0,
        total: 0,
        status: "ACTIVE"
      };
    },
    setPaginationStatus: (state, action) => {
      state.pagination.status = action.payload;
    },
    setPaginationOffset: (state, action) => {
      state.pagination.offset = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch grades
      .addCase(fetchGrades.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGrades.fulfilled, (state, action) => {
        state.loading = false;
        state.grades = action.payload.data.result || [];
        state.pagination = {
          ...state.pagination,
          total: action.payload.data.total || 0,
          status: action.payload.status
        };
      })
      .addCase(fetchGrades.rejected, (state) => {
        state.loading = false;
      })
      // Fetch all streams
      .addCase(fetchAllStreams.pending, (state) => {
        state.loadingStreams = true;
      })
      .addCase(fetchAllStreams.fulfilled, (state, action) => {
        state.loadingStreams = false;
        state.streams = action.payload.result || [];
      })
      .addCase(fetchAllStreams.rejected, (state) => {
        state.loadingStreams = false;
      })
      // Fetch connected streams
      .addCase(fetchConnectedStreams.pending, (state) => {
        state.loadingConnections = true;
      })
      .addCase(fetchConnectedStreams.fulfilled, (state, action) => {
        state.loadingConnections = false;
        state.connectedStreams = action.payload.result || [];
      })
      .addCase(fetchConnectedStreams.rejected, (state) => {
        state.loadingConnections = false;
      });
  }
});

export const { clearGrades, setPaginationStatus, setPaginationOffset } = gradeSlice.actions;
export default gradeSlice.reducer;
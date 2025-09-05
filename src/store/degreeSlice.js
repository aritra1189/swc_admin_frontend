// src/redux/slices/degreeSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../config/api";

const initialState = {
  degrees: [],
  universities: [],
  connectedUniversities: [],
  pagination: {
    limit: 10,
    offset: 0,
    total: 0,
    status: "ACTIVE"
  },
  loading: false,
  loadingUniversities: false,
  loadingConnections: false,
  error: null
};

// Async thunks
export const fetchDegrees = createAsyncThunk(
  "degree/fetchDegrees",
  async (params, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/degree/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch degrees");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const createDegree = createAsyncThunk(
  "degree/createDegree",
  async (degreeData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/degree`,
        degreeData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Degree created successfully");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create degree");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateDegree = createAsyncThunk(
  "degree/updateDegree",
  async ({ id, name }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_BASE_URL}/degree/${id}`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Degree updated successfully");
      return { id, name };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update degree");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateDegreeStatus = createAsyncThunk(
  "degree/updateDegreeStatus",
  async ({ id, currentStatus }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const newStatus = currentStatus === "ACTIVE" ? "DEACTIVE" : "ACTIVE";
      await axios.put(
        `${API_BASE_URL}/degree/status/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Status updated to ${newStatus}`);
      return { id, status: newStatus };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchAllUniversities = createAsyncThunk(
  "degree/fetchAllUniversities",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/university/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: "ACTIVE",
          limit: 100,
          offset: 0,
          keyword: ""
        }
      });
      return response.data.result || [];
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch universities");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchConnectedUniversities = createAsyncThunk(
  "degree/fetchConnectedUniversities",
  async (degreeId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/degree-university/${degreeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.result || [];
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch university connections");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const connectUniversitiesToDegree = createAsyncThunk(
  "degree/connectUniversitiesToDegree",
  async ({ degreeId, universityIds }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const promises = universityIds.map(universityId => 
        axios.post(`${API_BASE_URL}/degree-university`, {
          degreeId,
          universityId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      await Promise.all(promises);
      toast.success("Universities connected successfully");
      return { degreeId, universityIds };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to connect universities");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const removeUniversityConnection = createAsyncThunk(
  "degree/removeUniversityConnection",
  async ({ connectionId, degreeId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/degree-university/remove/${connectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Connection removed successfully");
      return { connectionId, degreeId };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove connection");
      return rejectWithValue(error.response?.data);
    }
  }
);

const degreeSlice = createSlice({
  name: "degree",
  initialState,
  reducers: {
    resetDegreeState: () => initialState,
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch degrees
      .addCase(fetchDegrees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDegrees.fulfilled, (state, action) => {
        state.loading = false;
        state.degrees = action.payload.result || [];
        state.pagination.total = action.payload.total || 0;
        state.pagination.offset = action.meta.arg.offset;
        state.pagination.status = action.meta.arg.status;
      })
      .addCase(fetchDegrees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create degree
      .addCase(createDegree.fulfilled, (state) => {
        // We don't need to update state here as we'll refetch the list
      })
      // Update degree
      .addCase(updateDegree.fulfilled, (state, action) => {
        const { id, name } = action.payload;
        const degree = state.degrees.find(d => d.id === id);
        if (degree) {
          degree.name = name;
        }
      })
      // Update degree status
      .addCase(updateDegreeStatus.fulfilled, (state, action) => {
        const { id, status } = action.payload;
        const degree = state.degrees.find(d => d.id === id);
        if (degree) {
          degree.status = status;
        }
      })
      // Fetch all universities
      .addCase(fetchAllUniversities.pending, (state) => {
        state.loadingUniversities = true;
      })
      .addCase(fetchAllUniversities.fulfilled, (state, action) => {
        state.loadingUniversities = false;
        state.universities = action.payload;
      })
      .addCase(fetchAllUniversities.rejected, (state) => {
        state.loadingUniversities = false;
      })
      // Fetch connected universities
      .addCase(fetchConnectedUniversities.pending, (state) => {
        state.loadingConnections = true;
      })
      .addCase(fetchConnectedUniversities.fulfilled, (state, action) => {
        state.loadingConnections = false;
        state.connectedUniversities = action.payload;
      })
      .addCase(fetchConnectedUniversities.rejected, (state) => {
        state.loadingConnections = false;
      });
  }
});

export const { resetDegreeState, updatePagination } = degreeSlice.actions;

// Selectors
export const selectDegrees = (state) => state.degree.degrees;
export const selectPagination = (state) => state.degree.pagination;
export const selectUniversities = (state) => state.degree.universities;
export const selectConnectedUniversities = (state) => state.degree.connectedUniversities;
export const selectLoading = (state) => state.degree.loading;
export const selectLoadingUniversities = (state) => state.degree.loadingUniversities;
export const selectLoadingConnections = (state) => state.degree.loadingConnections;
export const selectError = (state) => state.degree.error;

export default degreeSlice.reducer;
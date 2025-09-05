// src/redux/slices/boardSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { toast } from "react-toastify";

const token = localStorage.getItem("token");

// Async thunks
export const fetchBoards = createAsyncThunk(
  "boards/fetchBoards",
  async ({ limit, offset, status, keyword = "" }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/board/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit, offset, status, keyword }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch boards");
    }
  }
);

export const createBoard = createAsyncThunk(
  "boards/createBoard",
  async (name, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/board`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Board created successfully");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create board");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateBoard = createAsyncThunk(
  "boards/updateBoard",
  async ({ id, name }, { rejectWithValue }) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/board/${id}`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Board updated successfully");
      return { id, name };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update board");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateBoardStatus = createAsyncThunk(
  "boards/updateBoardStatus",
  async ({ id, currentStatus }, { rejectWithValue }) => {
    const newStatus = currentStatus === "ACTIVE" ? "DEACTIVE" : "ACTIVE";
    try {
      await axios.put(
        `${API_BASE_URL}/board/status/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Status updated to ${newStatus}`);
      return { id, newStatus };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateBoardIcon = createAsyncThunk(
  "boards/updateBoardIcon",
  async ({ id, imageFile }, { rejectWithValue }) => {
    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      await axios.put(`${API_BASE_URL}/board/icon/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      toast.success("Icon updated successfully");
      return { id };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update icon");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchAllGrades = createAsyncThunk(
  "boards/fetchAllGrades",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/grade/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: "ACTIVE", limit: 100, offset: 0, keyword: "" }
      });
      return response.data.result || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch grades");
    }
  }
);

export const fetchConnectedGrades = createAsyncThunk(
  "boards/fetchConnectedGrades",
  async (boardId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/board-grade/${boardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { boardId, grades: response.data.result || [] };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch grade connections");
    }
  }
);

export const connectGradesToBoard = createAsyncThunk(
  "boards/connectGradesToBoard",
  async ({ boardId, gradeIds }, { rejectWithValue }) => {
    try {
      const promises = gradeIds.map(gradeId => 
        axios.post(`${API_BASE_URL}/board-grade`, {
          boardId,
          gradeId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      await Promise.all(promises);
      toast.success("Grades connected successfully");
      return { boardId, gradeIds };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to connect grades");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const removeGradeConnection = createAsyncThunk(
  "boards/removeGradeConnection",
  async ({ connectionId, boardId }, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/board-grade/remove/${connectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Connection removed successfully");
      return { connectionId, boardId };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove connection");
      return rejectWithValue(error.response?.data);
    }
  }
);

// Initial state
const initialState = {
  boards: [],
  name: "",
  editId: null,
  loading: false,
  imageFile: null,
  imagePreview: null,
  pagination: {
    limit: 10,
    offset: 0,
    total: 0,
    status: "ACTIVE"
  },
  selectedBoard: null,
  grades: [],
  connectedGrades: [],
  showGradeModal: false,
  selectedGrades: [],
  loadingGrades: false,
  loadingConnections: false
};

// Board slice
const boardSlice = createSlice({
  name: "boards",
  initialState,
  reducers: {
    setName: (state, action) => {
      state.name = action.payload;
    },
    setEditId: (state, action) => {
      state.editId = action.payload;
    },
    setImageFile: (state, action) => {
      state.imageFile = action.payload;
    },
    setImagePreview: (state, action) => {
      state.imagePreview = action.payload;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setSelectedBoard: (state, action) => {
      state.selectedBoard = action.payload;
    },
    setShowGradeModal: (state, action) => {
      state.showGradeModal = action.payload;
    },
    setSelectedGrades: (state, action) => {
      state.selectedGrades = action.payload;
    },
    resetForm: (state) => {
      state.name = "";
      state.editId = null;
      state.imageFile = null;
      state.imagePreview = null;
    },
    handleGradeSelection: (state, action) => {
      const gradeId = action.payload;
      if (state.selectedGrades.includes(gradeId)) {
        state.selectedGrades = state.selectedGrades.filter(id => id !== gradeId);
      } else {
        state.selectedGrades.push(gradeId);
      }
    },
    clearSelectedGrades: (state) => {
      state.selectedGrades = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch boards
      .addCase(fetchBoards.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.loading = false;
        state.boards = action.payload.result || [];
        state.pagination.total = action.payload.total || 0;
      })
      .addCase(fetchBoards.rejected, (state) => {
        state.loading = false;
      })
      // Create board
      .addCase(createBoard.fulfilled, (state, action) => {
        state.boards.unshift(action.payload);
        state.name = "";
        state.imageFile = null;
        state.imagePreview = null;
      })
      // Update board
      .addCase(updateBoard.fulfilled, (state, action) => {
        const { id, name } = action.payload;
        const index = state.boards.findIndex(board => board.id === id);
        if (index !== -1) {
          state.boards[index].name = name;
        }
        state.editId = null;
        state.name = "";
        state.imageFile = null;
        state.imagePreview = null;
      })
      // Update board status
      .addCase(updateBoardStatus.fulfilled, (state, action) => {
        const { id, newStatus } = action.payload;
        const index = state.boards.findIndex(board => board.id === id);
        if (index !== -1) {
          state.boards[index].status = newStatus;
        }
      })
      // Fetch all grades
      .addCase(fetchAllGrades.pending, (state) => {
        state.loadingGrades = true;
      })
      .addCase(fetchAllGrades.fulfilled, (state, action) => {
        state.loadingGrades = false;
        state.grades = action.payload;
      })
      .addCase(fetchAllGrades.rejected, (state) => {
        state.loadingGrades = false;
      })
      // Fetch connected grades
      .addCase(fetchConnectedGrades.pending, (state) => {
        state.loadingConnections = true;
      })
      .addCase(fetchConnectedGrades.fulfilled, (state, action) => {
        state.loadingConnections = false;
        state.connectedGrades = action.payload.grades;
      })
      .addCase(fetchConnectedGrades.rejected, (state) => {
        state.loadingConnections = false;
      })
      // Remove grade connection
      .addCase(removeGradeConnection.fulfilled, (state, action) => {
        const { connectionId } = action.payload;
        state.connectedGrades = state.connectedGrades.filter(
          connection => connection.id !== connectionId
        );
      })
      // Connect grades to board
      .addCase(connectGradesToBoard.fulfilled, (state, action) => {
        state.selectedGrades = [];
      });
  }
});

export const {
  setName,
  setEditId,
  setImageFile,
  setImagePreview,
  setPagination,
  setSelectedBoard,
  setShowGradeModal,
  setSelectedGrades,
  resetForm,
  handleGradeSelection,
  clearSelectedGrades
} = boardSlice.actions;

export default boardSlice.reducer;
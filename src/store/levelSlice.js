// store/levelSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { toast } from 'react-toastify';

const token = localStorage.getItem("token");

// Async thunks
export const fetchLevels = createAsyncThunk(
  'levels/fetchLevels',
  async (statusFilter = "PENDING") => {
    const params = {
      limit: 100,
      offset: 0,
      keyword: ""
    };

    if (statusFilter !== "ALL") {
      params.status = statusFilter;
    }

    const response = await axios.get(`${API_BASE_URL}/level/list`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    });

    return response.data.result || [];
  }
);

export const createLevel = createAsyncThunk(
  'levels/createLevel',
  async (name) => {
    const response = await axios.post(
      `${API_BASE_URL}/level`,
      { name },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    toast.success("Level created successfully");
    return response.data;
  }
);

export const updateLevel = createAsyncThunk(
  'levels/updateLevel',
  async ({ id, name }) => {
    await axios.patch(
      `${API_BASE_URL}/level/${id}`,
      { name },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    toast.success("Level name updated");
    return { id, name };
  }
);

export const updateLevelStatus = createAsyncThunk(
  'levels/updateLevelStatus',
  async ({ id, currentStatus }) => {
    const newStatus = currentStatus === "ACTIVE" ? "DEACTIVE" : "ACTIVE";
    await axios.put(
      `${API_BASE_URL}/level/status/${id}`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    toast.success(`Status updated to ${newStatus}`);
    return { id, status: newStatus };
  }
);

export const updateLevelImage = createAsyncThunk(
  'levels/updateLevelImage',
  async ({ id, imageFile }) => {
    const formData = new FormData();
    formData.append("file", imageFile);

    await axios.put(`${API_BASE_URL}/level/image/${id}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      }
    });
    toast.success("Image updated successfully");
    return { id };
  }
);

export const deleteLevel = createAsyncThunk(
  'levels/deleteLevel',
  async (id) => {
    await axios.delete(`${API_BASE_URL}/level/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success("Level deleted successfully");
    return id;
  }
);

export const fetchAllBoards = createAsyncThunk(
  'levels/fetchAllBoards',
  async () => {
    const response = await axios.get(`${API_BASE_URL}/board/list`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        status: "ACTIVE",
        limit: 100,
        offset: 0,
        keyword: ""
      }
    });
    return response.data.result || [];
  }
);

export const fetchAllDegrees = createAsyncThunk(
  'levels/fetchAllDegrees',
  async () => {
    const response = await axios.get(`${API_BASE_URL}/degree/list`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        status: "ACTIVE",
        limit: 100,
        offset: 0,
        keyword: ""
      }
    });
    return response.data.result || [];
  }
);

export const fetchConnectedBoards = createAsyncThunk(
  'levels/fetchConnectedBoards',
  async (levelId) => {
    const response = await axios.get(`${API_BASE_URL}/level-board/${levelId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return { levelId, boards: response.data.result || [] };
  }
);

export const fetchConnectedDegrees = createAsyncThunk(
  'levels/fetchConnectedDegrees',
  async (levelId) => {
    const response = await axios.get(`${API_BASE_URL}/level-degree/${levelId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return { levelId, degrees: response.data.result || [] };
  }
);

export const connectBoardsToLevel = createAsyncThunk(
  'levels/connectBoardsToLevel',
  async ({ levelId, boardIds }) => {
    const promises = boardIds.map(boardId => 
      axios.post(`${API_BASE_URL}/level-board`, {
        levelId,
        boardId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );
    
    await Promise.all(promises);
    toast.success("Boards connected successfully");
    return levelId;
  }
);

export const connectDegreesToLevel = createAsyncThunk(
  'levels/connectDegreesToLevel',
  async ({ levelId, degreeIds }) => {
    const promises = degreeIds.map(degreeId => 
      axios.post(`${API_BASE_URL}/level-degree`, {
        levelId,
        degreeId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );
    
    await Promise.all(promises);
    toast.success("Degrees connected successfully");
    return levelId;
  }
);

export const removeBoardConnection = createAsyncThunk(
  'levels/removeBoardConnection',
  async ({ connectionId, levelId }) => {
    await axios.delete(`${API_BASE_URL}/level-board/remove/${connectionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success("Board connection removed successfully");
    return { connectionId, levelId };
  }
);

export const removeDegreeConnection = createAsyncThunk(
  'levels/removeDegreeConnection',
  async ({ connectionId, levelId }) => {
    await axios.delete(`${API_BASE_URL}/level-degree/remove/${connectionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success("Degree connection removed successfully");
    return { connectionId, levelId };
  }
);

const levelSlice = createSlice({
  name: 'levels',
  initialState: {
    levels: [],
    loading: false,
    error: null,
    name: "",
    editId: null,
    imageFile: null,
    imagePreview: null,
    statusFilter: "PENDING",
    selectedLevel: null,
    boards: [],
    degrees: [],
    connectedBoards: [],
    connectedDegrees: [],
    showConnectionModal: false,
    connectionType: "board",
    selectedConnections: [],
    loadingConnections: false,
    loadingItems: false
  },
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
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    setSelectedLevel: (state, action) => {
      state.selectedLevel = action.payload;
    },
    setShowConnectionModal: (state, action) => {
      state.showConnectionModal = action.payload;
    },
    setConnectionType: (state, action) => {
      state.connectionType = action.payload;
    },
    setSelectedConnections: (state, action) => {
      state.selectedConnections = action.payload;
    },
    resetForm: (state) => {
      state.name = "";
      state.editId = null;
      state.imageFile = null;
      state.imagePreview = null;
    },
    addToSelectedConnections: (state, action) => {
      if (!state.selectedConnections.includes(action.payload)) {
        state.selectedConnections.push(action.payload);
      }
    },
    removeFromSelectedConnections: (state, action) => {
      state.selectedConnections = state.selectedConnections.filter(id => id !== action.payload);
    },
    clearSelectedConnections: (state) => {
      state.selectedConnections = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch levels
      .addCase(fetchLevels.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLevels.fulfilled, (state, action) => {
        state.loading = false;
        state.levels = action.payload;
      })
      .addCase(fetchLevels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create level
      .addCase(createLevel.fulfilled, (state) => {
        state.name = "";
        state.imageFile = null;
        state.imagePreview = null;
      })
      // Update level
      .addCase(updateLevel.fulfilled, (state, action) => {
        const { id, name } = action.payload;
        const index = state.levels.findIndex(level => level.id === id);
        if (index !== -1) {
          state.levels[index].name = name;
        }
        state.name = "";
        state.editId = null;
        state.imageFile = null;
        state.imagePreview = null;
      })
      // Update level status
      .addCase(updateLevelStatus.fulfilled, (state, action) => {
        const { id, status } = action.payload;
        const index = state.levels.findIndex(level => level.id === id);
        if (index !== -1) {
          state.levels[index].status = status;
        }
      })
      // Delete level
      .addCase(deleteLevel.fulfilled, (state, action) => {
        state.levels = state.levels.filter(level => level.id !== action.payload);
      })
      // Fetch all boards
      .addCase(fetchAllBoards.pending, (state) => {
        state.loadingItems = true;
      })
      .addCase(fetchAllBoards.fulfilled, (state, action) => {
        state.loadingItems = false;
        state.boards = action.payload;
      })
      .addCase(fetchAllBoards.rejected, (state) => {
        state.loadingItems = false;
      })
      // Fetch all degrees
      .addCase(fetchAllDegrees.pending, (state) => {
        state.loadingItems = true;
      })
      .addCase(fetchAllDegrees.fulfilled, (state, action) => {
        state.loadingItems = false;
        state.degrees = action.payload;
      })
      .addCase(fetchAllDegrees.rejected, (state) => {
        state.loadingItems = false;
      })
      // Fetch connected boards
      .addCase(fetchConnectedBoards.pending, (state) => {
        state.loadingConnections = true;
      })
      .addCase(fetchConnectedBoards.fulfilled, (state, action) => {
        state.loadingConnections = false;
        state.connectedBoards = action.payload.boards;
      })
      .addCase(fetchConnectedBoards.rejected, (state) => {
        state.loadingConnections = false;
      })
      // Fetch connected degrees
      .addCase(fetchConnectedDegrees.pending, (state) => {
        state.loadingConnections = true;
      })
      .addCase(fetchConnectedDegrees.fulfilled, (state, action) => {
        state.loadingConnections = false;
        state.connectedDegrees = action.payload.degrees;
      })
      .addCase(fetchConnectedDegrees.rejected, (state) => {
        state.loadingConnections = false;
      })
      // Connect boards to level
      .addCase(connectBoardsToLevel.fulfilled, (state, action) => {
        state.selectedConnections = [];
      })
      // Connect degrees to level
      .addCase(connectDegreesToLevel.fulfilled, (state, action) => {
        state.selectedConnections = [];
      })
      // Remove board connection
      .addCase(removeBoardConnection.fulfilled, (state, action) => {
        const { connectionId } = action.payload;
        state.connectedBoards = state.connectedBoards.filter(
          board => board.id !== connectionId
        );
      })
      // Remove degree connection
      .addCase(removeDegreeConnection.fulfilled, (state, action) => {
        const { connectionId } = action.payload;
        state.connectedDegrees = state.connectedDegrees.filter(
          degree => degree.id !== connectionId
        );
      });
  }
});

export const {
  setName,
  setEditId,
  setImageFile,
  setImagePreview,
  setStatusFilter,
  setSelectedLevel,
  setShowConnectionModal,
  setConnectionType,
  setSelectedConnections,
  resetForm,
  addToSelectedConnections,
  removeFromSelectedConnections,
  clearSelectedConnections
} = levelSlice.actions;

export default levelSlice.reducer;
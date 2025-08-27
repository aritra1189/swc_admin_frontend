// src/store/slices/questionSlice.js
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
export const fetchQuestions = createAsyncThunk(
  'questions/fetchQuestions',
  async (filters, { rejectWithValue }) => {
    try {
      // Convert empty string filters to undefined to avoid sending them
      const cleanedFilters = Object.fromEntries(
        Object.entries(filters).map(([key, value]) => [
          key, 
          value === '' ? undefined : value
        ])
      );
      
      const response = await api.get('/question/list', {
        params: cleanedFilters
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchQuestionFilters = createAsyncThunk(
  'questions/fetchQuestionFilters',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/question/filter/all', {
        params: {
          limit: 100,
          offset: 0,
          status: 'ACTIVE'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createQuestion = createAsyncThunk(
  'questions/createQuestion',
  async (questionData, { rejectWithValue }) => {
    try {
      // Ensure questionType is valid
      const validQuestionTypes = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'IMAGE_BASED'];
      if (!validQuestionTypes.includes(questionData.questionType)) {
        questionData.questionType = 'SINGLE_CHOICE';
      }
      
      const response = await api.post('/question', questionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateQuestion = createAsyncThunk(
  'questions/updateQuestion',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/question/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateQuestionStatus = createAsyncThunk(
  'questions/updateQuestionStatus',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/question/${id}/status`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const addPreviousQuestion = createAsyncThunk(
  'questions/addPreviousQuestion',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/question/add-previous', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchMcqTests = createAsyncThunk(
  'questions/fetchMcqTests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/mcq-test/list', {
        params: {
          limit: 100,
          offset: 0,
          status: 'ACTIVE'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Helper function to apply client filters
const applyClientFilters = (questions, clientFilters) => {
  let filtered = [...questions];
  
  if (clientFilters.grade) {
    filtered = filtered.filter(question => 
      question.mcqTest?.unit?.subject?.grade?.name === clientFilters.grade
    );
  }
  
  if (clientFilters.stream) {
    filtered = filtered.filter(question => 
      question.mcqTest?.unit?.subject?.stream?.name === clientFilters.stream
    );
  }
  
  if (clientFilters.semester) {
    filtered = filtered.filter(question => 
      question.mcqTest?.unit?.subject?.semester?.name === clientFilters.semester
    );
  }
  
  if (clientFilters.degree) {
    filtered = filtered.filter(question => 
      question.mcqTest?.unit?.subject?.degree?.name === clientFilters.degree
    );
  }
  
  if (clientFilters.university) {
    filtered = filtered.filter(question => 
      question.mcqTest?.unit?.subject?.university?.name === clientFilters.university
    );
  }
  
  if (clientFilters.subjectName) {
    filtered = filtered.filter(question => 
      question.mcqTest?.unit?.subject?.subMaster?.name === clientFilters.subjectName
    );
  }
  
  if (clientFilters.questionType) {
    filtered = filtered.filter(question => 
      question.questionType === clientFilters.questionType
    );
  }
  
  if (clientFilters.keyword) {
    const keyword = clientFilters.keyword.toLowerCase();
    filtered = filtered.filter(question => 
      question.questionText.toLowerCase().includes(keyword) ||
      (question.explanation && question.explanation.toLowerCase().includes(keyword))
    );
  }
  
  return filtered;
};

// Helper function to extract filter options from questions
const extractFilterOptions = (questions) => {
  const grades = [...new Set(questions.map(
    q => q.mcqTest?.unit?.subject?.grade?.name
  ).filter(Boolean))];
  
  const streams = [...new Set(questions.map(
    q => q.mcqTest?.unit?.subject?.stream?.name
  ).filter(Boolean))];
  
  const semesters = [...new Set(questions.map(
    q => q.mcqTest?.unit?.subject?.semester?.name
  ).filter(Boolean))];
  
  const degrees = [...new Set(questions.map(
    q => q.mcqTest?.unit?.subject?.degree?.name
  ).filter(Boolean))];
  
  const universities = [...new Set(questions.map(
    q => q.mcqTest?.unit?.subject?.university?.name
  ).filter(Boolean))];
  
  const subjectNames = [...new Set(questions.map(
    q => q.mcqTest?.unit?.subject?.subMaster?.name
  ).filter(Boolean))];
  
  return {
    grades,
    streams,
    semesters,
    degrees,
    universities,
    subjectNames,
    questionTypes: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'IMAGE_BASED']
  };
};

// Slice
const questionSlice = createSlice({
  name: 'questions',
  initialState: {
    questions: [],
    filteredQuestions: [],
    filters: {
      semesterId: '',
      gradeId: '',
      streamId: '',
      degreeId: '',
      universityId: '',
      masterSubId: '',
      examId: '',
      examTypeId: '',
      subjectId: '',
      unitId: '',
      questionType: '',
      keyword: '',
      mcqTestId: '',
      limit: 10,
      offset: 0
    },
    totalCount: 0,
    loading: false,
    error: null,
    mcqTests: [],
    filterOptions: {
      semesters: [],
      grades: [],
      streams: [],
      degrees: [],
      universities: [],
      masterSubjects: [],
      exams: [],
      examTypes: [],
      subjects: [],
      units: []
    },
    
    // Client-side filtering (similar to mcqTestSlice)
    clientFilters: {
      grade: "",
      stream: "",
      semester: "",
      degree: "",
      university: "",
      subjectName: "",
      questionType: "",
      keyword: ""
    },
    
    // Client-side filter options (extracted from questions)
    clientFilterOptions: {
      grades: [],
      streams: [],
      semesters: [],
      degrees: [],
      universities: [],
      subjectNames: [],
      questionTypes: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'IMAGE_BASED']
    },
    
    message: ''
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        semesterId: '',
        gradeId: '',
        streamId: '',
        degreeId: '',
        universityId: '',
        masterSubId: '',
        examId: '',
        examTypeId: '',
        subjectId: '',
        unitId: '',
        questionType: '',
        keyword: '',
        mcqTestId: '',
        limit: 10,
        offset: 0
      };
    },
    clearError: (state) => {
      state.error = null;
      state.message = '';
    },
    setMessage: (state, action) => {
      state.message = action.payload;
    },
    
    // Client-side filtering actions
    setClientFilter: (state, action) => {
      const { filterType, value } = action.payload;
      state.clientFilters[filterType] = value;
      
      // Apply all client-side filters
      state.filteredQuestions = applyClientFilters(state.questions, state.clientFilters);
    },
    
    clearClientFilters: (state) => {
      state.clientFilters = {
        grade: '',
        stream: '',
        semester: '',
        degree: '',
        university: '',
        subjectName: '',
        questionType: '',
        keyword: ''
      };
      // Reset to show all questions
      state.filteredQuestions = state.questions;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch questions
      .addCase(fetchQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = '';
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload.result || [];
        state.totalCount = action.payload.total || 0;
        
        // Apply current client filters to new data
        state.filteredQuestions = applyClientFilters(state.questions, state.clientFilters);
        
        // Extract client filter options from all questions
        state.clientFilterOptions = extractFilterOptions(state.questions);
        
        state.message = '';
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.message = 'Failed to fetch questions';
      })
      
      // Fetch filters
      .addCase(fetchQuestionFilters.pending, (state) => {
        // Don't set loading to true here as it might interfere with questions loading
      })
      .addCase(fetchQuestionFilters.fulfilled, (state, action) => {
        state.filterOptions = {
          semesters: action.payload.semesters || [],
          grades: action.payload.grades || [],
          streams: action.payload.streams || [],
          degrees: action.payload.degrees || [],
          universities: action.payload.universities || [],
          masterSubjects: action.payload.masterSubjects || [],
          exams: action.payload.exams || [],
          examTypes: action.payload.examTypes || [],
          subjects: action.payload.subjects || [],
          units: action.payload.units || []
        };
      })
      .addCase(fetchQuestionFilters.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Create question
      .addCase(createQuestion.pending, (state) => {
        state.loading = true;
        state.message = '';
      })
      .addCase(createQuestion.fulfilled, (state, action) => {
        state.loading = false;
        const newQuestion = action.payload.result || action.payload;
        
        // Add to beginning of both arrays
        state.questions.unshift(newQuestion);
        state.totalCount += 1;
        
        // Reapply client filters
        state.filteredQuestions = applyClientFilters(state.questions, state.clientFilters);
        
        // Update client filter options
        state.clientFilterOptions = extractFilterOptions(state.questions);
        
        state.message = "✅ Question created successfully!";
      })
      .addCase(createQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.message = "❌ Failed to create question.";
      })
      
      // Update question status
      .addCase(updateQuestionStatus.pending, (state) => {
        state.loading = true;
        state.message = '';
      })
      .addCase(updateQuestionStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedQuestion = action.payload.result || action.payload;
        
        // Update in both arrays
        const questionIndex = state.questions.findIndex(item => item.id === updatedQuestion.id);
        if (questionIndex !== -1) {
          state.questions[questionIndex] = updatedQuestion;
        }
        
        // Reapply client filters
        state.filteredQuestions = applyClientFilters(state.questions, state.clientFilters);
        
        state.message = "✅ Question status updated successfully!";
      })
      .addCase(updateQuestionStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.message = "❌ Failed to update question status.";
      })
      
      // Add previous question
      .addCase(addPreviousQuestion.pending, (state) => {
        state.loading = true;
        state.message = '';
      })
      .addCase(addPreviousQuestion.fulfilled, (state, action) => {
        state.loading = false;
        const newQuestion = action.payload.result || action.payload;
        
        // Add to beginning of both arrays
        state.questions.unshift(newQuestion);
        state.totalCount += 1;
        
        // Reapply client filters
        state.filteredQuestions = applyClientFilters(state.questions, state.clientFilters);
        
        // Update client filter options
        state.clientFilterOptions = extractFilterOptions(state.questions);
        
        state.message = "✅ Previous question added successfully!";
      })
      .addCase(addPreviousQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.message = "❌ Failed to add previous question.";
      })
      
      // Fetch MCQ tests
      .addCase(fetchMcqTests.pending, (state) => {
        // Don't set loading to avoid interfering with other operations
      })
      .addCase(fetchMcqTests.fulfilled, (state, action) => {
        state.mcqTests = action.payload.result || [];
      })
      .addCase(fetchMcqTests.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { 
  setFilters, 
  resetFilters, 
  clearError, 
  setMessage,
  setClientFilter,
  clearClientFilters
} = questionSlice.actions;

export default questionSlice.reducer;
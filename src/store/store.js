// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import subjectReducer from './subjects/subjectSlice';
import audioLectureReducer from './AudioLectureslice';
import mcqTestReducer from './McqTestSlice'
import questionsReducer from './QuestionSlice'
import courseReducer from './Courseslice'
import boardReducer from './Boardsslice';
import gradeReducer from './gradeslice';
import levelReducer from './levelSlice';
import degreeReducer from './degreeSlice';
import videoLectureReducer from './videoSlice';
export const store = configureStore({
  reducer: {
    auth: authReducer,
    subjects: subjectReducer,
    audioLectures: audioLectureReducer,
    mcqTest:mcqTestReducer,
    questions:questionsReducer,
    courses:courseReducer,
    boards:boardReducer,
    grades:gradeReducer,
    levels:levelReducer,
    degree:degreeReducer,
    videos:videoLectureReducer

  }
});

// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import subjectReducer from './subjects/subjectSlice';
import audioLectureReducer from './AudioLectureslice';
import mcqTestReducer from './McqTestSlice'
import questionsReducer from './questionSlice'
export const store = configureStore({
  reducer: {
    auth: authReducer,
    subjects: subjectReducer,
    audioLectures: audioLectureReducer,
    mcqTest:mcqTestReducer,
    questions:questionsReducer

  }
});
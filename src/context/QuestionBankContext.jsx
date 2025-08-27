import React, { createContext, useContext, useEffect, useState } from "react";

const QuestionBankContext = createContext();
export const useQuestionBank = () => useContext(QuestionBankContext);

export const QuestionBankProvider = ({ children }) => {
  const [questions, setQuestions] = useState([]);

  // Load saved questions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("questions");
    if (saved) {
      setQuestions(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage whenever questions change
  useEffect(() => {
    localStorage.setItem("questions", JSON.stringify(questions));
  }, [questions]);

  const addQuestion = (question) => {
    setQuestions((prev) => [...prev, question]);
  };

  const getQuestionsBySubject = (subject) =>
    questions.filter((q) => q.subject === subject);

  return (
    <QuestionBankContext.Provider
      value={{ questions, addQuestion, getQuestionsBySubject }}
    >
      {children}
    </QuestionBankContext.Provider>
  );
};

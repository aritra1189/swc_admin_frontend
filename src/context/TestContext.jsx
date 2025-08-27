import React, { createContext, useContext, useEffect, useState } from "react";

const TestContext = createContext();

export const TestProvider = ({ children }) => {
  const [tests, setTests] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedTests = localStorage.getItem("tests");
    if (savedTests) {
      setTests(JSON.parse(savedTests));
    }
  }, []);

  // Save to localStorage whenever tests change
  useEffect(() => {
    localStorage.setItem("tests", JSON.stringify(tests));
  }, [tests]);

  const addTest = (test) => {
    setTests((prev) => [...prev, test]);
  };

  const updateTest = (updatedTest) => {
    setTests((prev) =>
      prev.map((t) => (t.id === updatedTest.id ? updatedTest : t))
    );
  };

  const deleteTest = (testId) => {
    setTests((prev) => prev.filter((t) => t.id !== testId));
  };

  const value = {
    tests,
    addTest,
    updateTest,
    deleteTest,
  };

  return <TestContext.Provider value={value}>{children}</TestContext.Provider>;
};

export const useTestContext = () => useContext(TestContext);

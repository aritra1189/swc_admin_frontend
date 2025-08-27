import React, { createContext, useContext, useState } from "react";

const LibraryContext = createContext();

export const LibraryProvider = ({ children }) => {
  const [libraryData, setLibraryData] = useState({});

  const uploadResource = (className, subject, resource) => {
    setLibraryData((prev) => {
      const currentClass = prev[className] || {};
      const currentSubject = currentClass[subject] || [];

      return {
        ...prev,
        [className]: {
          ...currentClass,
          [subject]: [...currentSubject, resource],
        },
      };
    });
  };

  const removeResource = (className, subject, index) => {
    setLibraryData((prev) => {
      const currentClass = prev[className];
      const currentSubject = [...(currentClass?.[subject] || [])];
      currentSubject.splice(index, 1);

      return {
        ...prev,
        [className]: {
          ...currentClass,
          [subject]: currentSubject,
        },
      };
    });
  };

  return (
    <LibraryContext.Provider value={{ libraryData, uploadResource, removeResource }}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibraryContext = () => useContext(LibraryContext);

import React, { createContext, useContext, useEffect, useState } from "react";

// Create context
const SubjectContext = createContext();

// Custom hook for using the context
export const useSubjectContext = () => useContext(SubjectContext);

// Default data structure
const DEFAULT_SUBJECTS = {
  WBBSE: {
    "Class I": ["English", "Math"],
    "Class II": ["English", "Math", "Environmental Studies"],
  },
  "B.A": {
    "Burdwan University": ["History", "Political Science"],
    "University of Calcutta": ["English", "Bengali"],
  },
  "B.Sc": {},
  "B.Com": {},
};

export const SubjectProvider = ({ children }) => {
  const [subjectsByBoard, setSubjectsByBoard] = useState(() => {
    try {
      const saved = localStorage.getItem("subjectsByBoard");
      return saved ? JSON.parse(saved) : DEFAULT_SUBJECTS;
    } catch (e) {
      console.error("Failed to parse subjects from localStorage", e);
      return DEFAULT_SUBJECTS;
    }
  });

  // Currently selected subject path (for cross-component usage)
  const [currentSubjectPath, setCurrentSubjectPath] = useState(null);

  // Persist to localStorage whenever subjects change
  useEffect(() => {
    localStorage.setItem("subjectsByBoard", JSON.stringify(subjectsByBoard));
  }, [subjectsByBoard]);

  // ========== SUBJECT MANAGEMENT ==========
  const addSubject = async (board, streamOrClass, maybeClassLevel, subject) => {
    if (!subject) throw new Error("Subject is required");

    setSubjectsByBoard((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));

      // Initialize board if it doesn't exist
      if (!updated[board]) updated[board] = {};

      // Case 1: Adding to a graduation university (no class level)
      if (maybeClassLevel === undefined) {
        if (!updated[board][streamOrClass]) updated[board][streamOrClass] = [];
        if (!updated[board][streamOrClass].includes(subject)) {
          updated[board][streamOrClass] = [...updated[board][streamOrClass], subject];
        }
      } 
      // Case 2: Adding to a class level
      else {
        if (!updated[board][streamOrClass]) updated[board][streamOrClass] = {};
        if (!updated[board][streamOrClass][maybeClassLevel]) {
          updated[board][streamOrClass][maybeClassLevel] = [];
        }
        if (!updated[board][streamOrClass][maybeClassLevel].includes(subject)) {
          updated[board][streamOrClass][maybeClassLevel] = [
            ...updated[board][streamOrClass][maybeClassLevel],
            subject,
          ];
        }
      }

      return updated;
    });
  };

  const removeSubject = async (board, streamOrClass, maybeClassLevel, subjectName) => {
    setSubjectsByBoard((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));

      // Check if board exists
      if (!updated[board]) return updated;

      // Case 1: Removing from a graduation university (no class level)
      if (maybeClassLevel === undefined) {
        if (Array.isArray(updated[board][streamOrClass])) {
          updated[board][streamOrClass] = updated[board][streamOrClass].filter(
            subj => subj !== subjectName
          );
          // Clean up empty arrays
          if (updated[board][streamOrClass].length === 0) {
            delete updated[board][streamOrClass];
          }
        }
      } 
      // Case 2: Removing from a class level
      else {
        if (updated[board][streamOrClass] && 
            Array.isArray(updated[board][streamOrClass][maybeClassLevel])) {
          updated[board][streamOrClass][maybeClassLevel] = 
            updated[board][streamOrClass][maybeClassLevel].filter(
              subj => subj !== subjectName
            );

          // Clean up empty arrays
          if (updated[board][streamOrClass][maybeClassLevel].length === 0) {
            delete updated[board][streamOrClass][maybeClassLevel];
          }

          // Clean up empty class objects
          if (Object.keys(updated[board][streamOrClass]).length === 0) {
            delete updated[board][streamOrClass];
          }
        }
      }

      // Clean up empty boards
      if (Object.keys(updated[board]).length === 0) {
        delete updated[board];
      }

      return updated;
    });
  };

  // ========== SUBJECT SELECTION ==========
  const selectSubject = (board, streamOrClass, maybeClassLevel, subject) => {
    setCurrentSubjectPath({
      board,
      streamOrClass,
      classLevel: maybeClassLevel,
      subject
    });
  };

  // ========== SUBJECT QUERY METHODS ==========
  const getSubjects = (board, streamOrClass, maybeClassLevel) => {
    try {
      if (maybeClassLevel === undefined) {
        return Array.isArray(subjectsByBoard[board]?.[streamOrClass])
          ? [...subjectsByBoard[board][streamOrClass]]
          : [];
      }
      return Array.isArray(subjectsByBoard[board]?.[streamOrClass]?.[maybeClassLevel])
        ? [...subjectsByBoard[board][streamOrClass][maybeClassLevel]]
        : [];
    } catch (error) {
      console.error("Error getting subjects:", error);
      return [];
    }
  };

  const getAllBoards = () => Object.keys(subjectsByBoard);

  const getStreamsOrClasses = (board) => {
    if (!subjectsByBoard[board]) return [];
    return Object.keys(subjectsByBoard[board]);
  };

  const getClassLevels = (board, streamOrClass) => {
    if (!subjectsByBoard[board]?.[streamOrClass]) return [];
    if (Array.isArray(subjectsByBoard[board][streamOrClass])) return [];
    return Object.keys(subjectsByBoard[board][streamOrClass]);
  };

  // ========== VALIDATION METHODS ==========
  const boardExists = (board) => board in subjectsByBoard;

  const streamOrClassExists = (board, streamOrClass) => 
    board in subjectsByBoard && streamOrClass in subjectsByBoard[board];

  const classLevelExists = (board, streamOrClass, classLevel) => 
    board in subjectsByBoard &&
    streamOrClass in subjectsByBoard[board] &&
    classLevel in subjectsByBoard[board][streamOrClass];

  const resetBoard = (board) => {
    setSubjectsByBoard((prev) => ({
      ...prev,
      [board]: DEFAULT_SUBJECTS[board] || {},
    }));
  };

  return (
    <SubjectContext.Provider
      value={{
        // Subject data
        subjectsByBoard,
        currentSubjectPath,
        
        // Subject management
        addSubject,
        removeSubject,
        selectSubject,
        resetBoard,
        
        // Query methods
        getSubjects,
        getAllBoards,
        getStreamsOrClasses,
        getClassLevels,
        
        // Validation methods
        boardExists,
        streamOrClassExists,
        classLevelExists,
        
        // For integration with other managers
        getCurrentSubject: () => currentSubjectPath,
        getSubjectPath: (board, streamOrClass, classLevel, subject) => ({
          board,
          streamOrClass,
          classLevel,
          subject
        })
      }}
    >
      {children}
    </SubjectContext.Provider>
  );
};
import React, { createContext, useContext, useState, useEffect } from 'react';

const SyllabusContext = createContext();

export const SyllabusProvider = ({ children }) => {
  const [syllabus, setSyllabus] = useState(() => {
    return {
      "WBBSE": {
        "Class X": {
          "Mathematics": [
            {
              id: 1,
              chapter: "Algebra",
              topics: ["Polynomials", "Quadratic Equations"],
              version: "1.0",
              pdfUrl: "",
              lastUpdated: "2023-06-15"
            }
          ]
        }
      }
    };
  });

  useEffect(() => {
    const saved = localStorage.getItem('syllabusData');
    if (saved) {
      try {
        setSyllabus(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse syllabus data", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('syllabusData', JSON.stringify(syllabus));
  }, [syllabus]);

  const addChapter = (board, className, subject, chapterData) => {
    setSyllabus(prev => {
      const newSyllabus = { ...prev };
      if (!newSyllabus[board]) newSyllabus[board] = {};
      if (!newSyllabus[board][className]) newSyllabus[board][className] = {};
      if (!newSyllabus[board][className][subject]) newSyllabus[board][className][subject] = [];

      const newChapter = {
        ...chapterData,
        id: Date.now(),
        version: "1.0",
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      newSyllabus[board][className][subject].push(newChapter);
      return newSyllabus;
    });
  };

  const updateChapter = (board, className, subject, chapterId, updatedData) => {
    setSyllabus(prev => {
      const newSyllabus = { ...prev };
      const chapters = newSyllabus[board]?.[className]?.[subject] || [];

      const updatedChapters = chapters.map(chapter => {
        if (chapter.id === chapterId) {
          return {
            ...chapter,
            ...updatedData,
            version: incrementVersion(chapter.version),
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
        return chapter;
      });

      if (newSyllabus[board]?.[className]) {
        newSyllabus[board][className][subject] = updatedChapters;
      }

      return newSyllabus;
    });
  };

  const deleteChapter = (board, className, subject, chapterId) => {
    setSyllabus(prev => {
      const newSyllabus = { ...prev };
      const chapters = newSyllabus[board]?.[className]?.[subject] || [];

      const filteredChapters = chapters.filter(ch => ch.id !== chapterId);

      if (newSyllabus[board]?.[className]) {
        newSyllabus[board][className][subject] = filteredChapters;
      }

      return newSyllabus;
    });
  };

  const incrementVersion = (version) => {
    const parts = version.split('.');
    return `${parts[0]}.${parseInt(parts[1]) + 1}`;
  };

  const attachPdf = (board, className, subject, chapterId, pdfUrl) => {
    updateChapter(board, className, subject, chapterId, { pdfUrl });
  };

  return (
    <SyllabusContext.Provider value={{ syllabus, addChapter, updateChapter, deleteChapter, attachPdf }}>
      {children}
    </SyllabusContext.Provider>
  );
};

export const useSyllabusContext = () => {
  const context = useContext(SyllabusContext);
  if (!context) {
    throw new Error('useSyllabusContext must be used within a SyllabusProvider');
  }
  return context;
};

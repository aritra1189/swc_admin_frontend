import React, { useState, useEffect } from "react";
import { ChevronDown, Plus, Trash2, Search, ArrowLeft } from "lucide-react";
import { useSubjectContext } from "../context/SubjectContext";

const classList = [
  "Class I", "Class II", "Class III", "Class IV", "Class V",
  "Class VI", "Class VII", "Class VIII", "Class IX", "Class X",
];

export default function WBBSEPage({ boardName = "WBBSE" }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedClass, setExpandedClass] = useState(null);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [localSubjects, setLocalSubjects] = useState({});
  const { subjectsByBoard, addSubject, removeSubject } = useSubjectContext();

  // Sync local state with context
  useEffect(() => {
    setLocalSubjects(subjectsByBoard);
  }, [subjectsByBoard]);

  const filteredClasses = classList.filter((cls) =>
    cls.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleClass = (className) => {
    setExpandedClass((prev) => (prev === className ? null : className));
    setNewSubjectInput("");
  };

  const getSubjectsForClass = (board, cls) => {
    const boardData = localSubjects[board] || {};
    const subjects = boardData[cls];
    return Array.isArray(subjects) ? subjects : [];
  };

  const handleAddSubject = async (board, cls, subject) => {
    if (subject.trim()) {
      try {
        await addSubject(board, cls, undefined, subject.trim());
        setNewSubjectInput("");
        // Refresh the UI
        setExpandedClass(null);
        setTimeout(() => setExpandedClass(cls), 50);
      } catch (error) {
        console.error("Failed to add subject:", error);
      }
    }
  };

  const handleRemoveSubject = async (board, cls, index) => {
    try {
      await removeSubject(board, cls, undefined, index);
      // Refresh the UI
      setExpandedClass(null);
      setTimeout(() => setExpandedClass(cls), 50);
    } catch (error) {
      console.error("Failed to remove subject:", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <button className="p-2 rounded-full hover:bg-gray-100 transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{boardName} Board</h1>
          <p className="text-sm text-gray-500">Manage class subjects and curriculum</p>
        </div>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search classes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition"
        />
      </div>

      <div className="space-y-4">
        {filteredClasses.map((cls) => (
          <div 
            key={cls}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs hover:shadow-sm transition"
          >
            <div
              className="flex items-center justify-between p-5 cursor-pointer"
              onClick={() => toggleClass(cls)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                  <span className="font-medium text-gray-700">{cls.split(" ")[1]}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{cls}</h3>
              </div>
              <ChevronDown 
                size={20} 
                className={`text-gray-500 transition-transform ${expandedClass === cls ? 'rotate-180' : ''}`}
              />
            </div>

            {expandedClass === cls && (
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Subjects</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add new subject..."
                      value={newSubjectInput}
                      onChange={(e) => setNewSubjectInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSubject(boardName, cls, newSubjectInput)}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition"
                    />
                    <button
                      onClick={() => handleAddSubject(boardName, cls, newSubjectInput)}
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-1"
                    >
                      <Plus size={18} />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                <ul className="space-y-2">
                  {getSubjectsForClass(boardName, cls).map((subj, idx) => (
                    <li
                      key={`${cls}-${idx}`}
                      className="flex items-center justify-between bg-white border border-gray-200 px-4 py-3 rounded-lg hover:bg-gray-50 transition"
                    >
                      <span className="text-gray-800">{subj}</span>
                      <button
                        onClick={() => handleRemoveSubject(boardName, cls, idx)}
                        className="text-gray-400 hover:text-gray-600 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700">No classes found</h3>
          <p className="text-gray-500 mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  );
}
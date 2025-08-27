import React, { useState, useEffect } from "react";
import { ChevronDown, Plus, Trash2, Search, ArrowLeft } from "lucide-react";
import { useSubjectContext } from "../context/SubjectContext";

const universityData = [
  { 
    name: "Burdwan University", 
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/7/7a/University_of_Burdwan_logo.png",
    location: "West Bengal",
    established: 1960
  },
  { 
    name: "MAKAUT", 
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm9Kec2j-C9pt7BcrNr-PTB_gqzgvAzdBJmg&s",
    location: "West Bengal",
    established: 2001
  },
  { 
    name: "IIT Kharagpur", 
    imageUrl: "https://brandeps.com/logo-download/I/IIT-Kharagpur-logo-01.png",
    location: "West Bengal",
    established: 1951
  },
  { 
    name: "Jadavpur University", 
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/5/58/Jadavpur_University_Logo.svg/250px-Jadavpur_University_Logo.svg.png",
    location: "Kolkata",
    established: 1955
  },
  { 
    name: "University of Calcutta", 
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/f/f0/University_of_Calcutta_logo.svg",
    location: "Kolkata",
    established: 1857
  },
];

export default function Graduation({ UNIVERSITY = "B.A" }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedUniversity, setExpandedUniversity] = useState(null);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [localSubjects, setLocalSubjects] = useState({});
  const { subjectsByBoard, addSubject, removeSubject } = useSubjectContext();

  // Sync local state with context
  useEffect(() => {
    setLocalSubjects(subjectsByBoard);
  }, [subjectsByBoard]);

  const filteredUniversities = universityData.filter((uni) =>
    uni.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUniversity = (uniName) => {
    setExpandedUniversity((prev) => (prev === uniName ? null : uniName));
    setNewSubjectInput("");
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    const fallback = e.target.nextElementSibling;
    if (fallback) fallback.style.display = 'flex';
  };

  const getSubjectsForUniversity = (board, uniName) => {
    try {
      const subjects = localSubjects[board]?.[uniName];
      return Array.isArray(subjects) ? subjects : [];
    } catch (error) {
      console.error("Error getting subjects:", error);
      return [];
    }
  };

  const handleAddSubject = async (uniName) => {
    if (newSubjectInput.trim()) {
      try {
        await addSubject(UNIVERSITY, uniName, undefined, newSubjectInput.trim());
        setNewSubjectInput("");
        // Refresh UI
        const current = expandedUniversity;
        setExpandedUniversity(null);
        setTimeout(() => setExpandedUniversity(current), 50);
      } catch (error) {
        console.error("Failed to add subject:", error);
      }
    }
  };

  const handleRemoveSubject = async (uniName, index) => {
    try {
      await removeSubject(UNIVERSITY, uniName, undefined, index);
      // Refresh UI
      const current = expandedUniversity;
      setExpandedUniversity(null);
      setTimeout(() => setExpandedUniversity(current), 50);
    } catch (error) {
      console.error("Failed to remove subject:", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <button 
          className="p-2 rounded-full hover:bg-gray-100 transition"
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{UNIVERSITY} — Graduation Programs</h1>
          <p className="text-sm text-gray-500">Manage university subjects and curriculum</p>
        </div>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search universities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition"
        />
      </div>

      <div className="space-y-4">
        {filteredUniversities.map((uni) => {
          const subjects = getSubjectsForUniversity(UNIVERSITY, uni.name);
          
          return (
            <div 
              key={uni.name}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs hover:shadow-sm transition"
            >
              <div
                className="flex items-center justify-between p-5 cursor-pointer"
                onClick={() => toggleUniversity(uni.name)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden">
                    <img
                      src={uni.imageUrl}
                      alt={`${uni.name} logo`}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                    <div className="hidden absolute inset-0 bg-gray-100 items-center justify-center text-gray-600">
                      <span className="font-medium">{uni.name.charAt(0)}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{uni.name}</h3>
                    <div className="flex gap-3 mt-1">
                      <span className="text-sm text-gray-500">{uni.location}</span>
                      <span className="text-sm text-gray-500">Est. {uni.established}</span>
                    </div>
                  </div>
                </div>
                <ChevronDown 
                  size={20} 
                  className={`text-gray-500 transition-transform ${expandedUniversity === uni.name ? 'rotate-180' : ''}`}
                />
              </div>

              {expandedUniversity === uni.name && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Subjects</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add new subject..."
                        value={newSubjectInput}
                        onChange={(e) => setNewSubjectInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSubject(uni.name)}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition"
                      />
                      <button
                        onClick={() => handleAddSubject(uni.name)}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-1"
                      >
                        <Plus size={18} />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {subjects.map((subj, idx) => (
                      <li
                        key={`${uni.name}-${idx}`}
                        className="flex items-center justify-between bg-white border border-gray-200 px-4 py-3 rounded-lg hover:bg-gray-50 transition"
                      >
                        <span className="text-gray-800">{subj}</span>
                        <button
                          onClick={() => handleRemoveSubject(uni.name, idx)}
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
          );
        })}
      </div>

      {filteredUniversities.length === 0 && (
        <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700">No universities found</h3>
          <p className="text-gray-500 mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  );
}
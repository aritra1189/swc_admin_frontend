import React, { useState } from "react";
import { ChevronDown, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useSubjectContext } from "../context/SubjectContext";

const streamList = ["ARTS", "SCIENCE", "COMMERCE", "VOCATIONAL"];
const classLevels = ["Class XI", "Class XII"];

export default function SubjectManager({ boardName }) {
  const [expandedStreams, setExpandedStreams] = useState({});
  const [expandedClasses, setExpandedClasses] = useState({});
  const [newSubjects, setNewSubjects] = useState({});
  const { subjectsByBoard, addSubject, removeSubject } = useSubjectContext();

  const toggleStream = (stream) => {
    setExpandedStreams(prev => ({ ...prev, [stream]: !prev[stream] }));
  };

  const toggleClass = (stream, cls) => {
    const key = `${stream}-${cls}`;
    setExpandedClasses(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddSubject = (stream, cls) => {
    const subject = newSubjects[`${stream}-${cls}`];
    if (subject?.trim()) {
      addSubject(boardName, stream, cls, subject.trim());
      setNewSubjects(prev => ({ ...prev, [`${stream}-${cls}`]: "" }));
    }
  };

  const getSubjects = (stream, cls) => {
    try {
      const subjects = subjectsByBoard?.[boardName]?.[stream]?.[cls];
      return Array.isArray(subjects) ? subjects : [];
    } catch (e) {
      console.error("Error getting subjects:", e);
      return [];
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <button className="p-2 rounded-full hover:bg-gray-100 transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{boardName} Board</h1>
          <p className="text-sm text-gray-500">Manage subjects by stream and class</p>
        </div>
      </div>

      <div className="space-y-4">
        {streamList.map(stream => (
          <div key={stream} className="border rounded-xl overflow-hidden">
            {/* Stream Header */}
            <div
              className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
              onClick={() => toggleStream(stream)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center">
                  <span className="font-medium">{stream.charAt(0)}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{stream}</h3>
              </div>
              <ChevronDown 
                size={20} 
                className={`text-gray-500 transition-transform ${expandedStreams[stream] ? 'rotate-180' : ''}`}
              />
            </div>

            {/* Stream Content */}
            {expandedStreams[stream] && (
              <div className="bg-white p-4 space-y-4 border-t">
                {classLevels.map(cls => {
                  const classKey = `${stream}-${cls}`;
                  return (
                    <div key={classKey} className="border rounded-lg overflow-hidden">
                      {/* Class Header */}
                      <div
                        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                        onClick={() => toggleClass(stream, cls)}
                      >
                        <h4 className="font-medium text-gray-800">{cls}</h4>
                        <ChevronDown 
                          size={18} 
                          className={`text-gray-500 transition-transform ${expandedClasses[classKey] ? 'rotate-180' : ''}`}
                        />
                      </div>

                      {/* Class Content */}
                      {expandedClasses[classKey] && (
                        <div className="p-3 space-y-3 bg-white border-t">
                          {/* Add Subject */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newSubjects[classKey] || ""}
                              onChange={(e) => setNewSubjects(prev => ({
                                ...prev,
                                [classKey]: e.target.value
                              }))}
                              placeholder="Add new subject"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
                            />
                            <button
                              onClick={() => handleAddSubject(stream, cls)}
                              className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-1"
                            >
                              <Plus size={16} />
                              <span>Add</span>
                            </button>
                          </div>

                          {/* Subject List */}
                          <ul className="space-y-2">
                            {getSubjects(stream, cls).map((subject, idx) => (
                              <li
                                key={`${classKey}-${idx}`}
                                className="flex items-center justify-between bg-white border px-3 py-2 rounded-lg hover:bg-gray-50 transition"
                              >
                                <span className="text-gray-800">{subject}</span>
                                <button
                                  onClick={() => removeSubject(boardName, stream, cls, idx)}
                                  className="text-gray-400 hover:text-gray-600 transition"
                                >
                                  <Trash2 size={16} />
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
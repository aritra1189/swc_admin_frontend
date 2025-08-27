import React, { useState } from "react";
import { useSubjectContext } from "../context/SubjectContext";
import { useTestContext } from "../context/TestContext";
import { useQuestionBank } from "../context/QuestionBankContext";
import { useAuditLog } from "../context/AuditLogContext";

export const CreateTestForm = () => {
  const { subjectsByBoard } = useSubjectContext();
  const { addTest } = useTestContext();
  const { questions } = useQuestionBank();
  const { addLog } = useAuditLog();

  const boards = Object.keys(subjectsByBoard || {});
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  const [form, setForm] = useState({
    subject: "",
    title: "",
    type: "MCQ",
    totalMarks: 0,
    timer: 30,
    passMarks: 0,
    allowMultipleAttempts: false,
    isPublished: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.subject || !form.title || !selectedLevel) {
      addLog("TEST_CREATION_FAILED", "TEST", {
        reason: "Missing required fields",
        missing_fields: {
          subject: !form.subject,
          title: !form.title,
          level: !selectedLevel,
        },
      });
      return alert("Please fill all required fields");
    }

    const testData = {
      ...form,
      board: selectedBoard,
      level: selectedLevel,
      stream: shouldShowStreams() ? selectedStream : null,
      classLevel: selectedClass,
      questions: selectedQuestions,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };

    addTest(testData);
    addLog("TEST_CREATED", "TEST", {
      test_id: testData.id,
      test_title: form.title,
      subject: form.subject,
      type: form.type,
      total_marks: form.totalMarks,
      question_count: selectedQuestions.length,
      timer_minutes: form.timer,
      is_published: form.isPublished,
      allow_multiple_attempts: form.allowMultipleAttempts,
    });

    alert("✅ Test created successfully!");
    setForm({
      subject: "",
      title: "",
      type: "MCQ",
      totalMarks: 0,
      timer: 30,
      passMarks: 0,
      allowMultipleAttempts: false,
      isPublished: false,
    });
    setSelectedQuestions([]);
    setSelectedBoard("");
    setSelectedLevel("");
    setSelectedStream("");
    setSelectedClass("");
  };

  // Boards that should show streams only for Higher Secondary level
  const STREAM_BOARDS = ["CBSE", "ISC", "WBCHSE"];

  // Check if we should show streams for the current selection
  const shouldShowStreams = () => {
    return (
      selectedLevel === "HIGHER_SECONDARY" && 
      STREAM_BOARDS.includes(selectedBoard)
    );
  };

  // Get available streams for the selected board
  const getStreams = () => {
    if (!selectedBoard || !shouldShowStreams()) return [];
    const boardData = subjectsByBoard[selectedBoard];
    if (!boardData) return [];
    
    return Object.keys(boardData);
  };

  // Get available classes for the current selection
  const getClasses = () => {
    if (!selectedBoard || !selectedLevel) return [];
    
    const boardData = subjectsByBoard[selectedBoard];
    if (!boardData) return [];
    
    if (shouldShowStreams()) {
      // For boards with streams at higher secondary level
      if (!selectedStream) return [];
      const streamData = boardData[selectedStream];
      return streamData ? Object.keys(streamData) : [];
    } else {
      // For all other cases
      return Object.keys(boardData);
    }
  };

  // Get available subjects based on the current selection
  const getSubjects = () => {
    if (!selectedBoard || !selectedClass) return [];
    
    const boardData = subjectsByBoard[selectedBoard];
    if (!boardData) return [];
    
    if (shouldShowStreams()) {
      // For boards with streams at higher secondary level
      if (!selectedStream) return [];
      const streamData = boardData[selectedStream];
      if (!streamData) return [];
      
      const classData = streamData[selectedClass];
      return Array.isArray(classData) ? classData : [];
    } else {
      // For all other cases
      const classData = boardData[selectedClass];
      return Array.isArray(classData) ? classData : [];
    }
  };

  const availableQuestions = questions.filter((q) => q.subject === form.subject);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 shadow-lg rounded-xl space-y-6 max-w-4xl mx-auto"
    >
      <h2 className="text-2xl font-semibold text-gray-700">Create New Test</h2>

      {/* Level selection */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-600">
          Education Level
        </label>
        <select
          value={selectedLevel}
          onChange={(e) => {
            setSelectedLevel(e.target.value);
            setSelectedBoard("");
            setSelectedStream("");
            setSelectedClass("");
            setForm({...form, subject: ""});
          }}
          className="w-full border border-gray-300 p-2 rounded-md"
          required
        >
          <option value="">Select</option>
          <option value="SECONDARY">Secondary (Class 9-10)</option>
          <option value="HIGHER_SECONDARY">Higher Secondary (Class 11-12)</option>
          <option value="UNDERGRADUATE">Undergraduate</option>
          <option value="POSTGRADUATE">Postgraduate</option>
        </select>
      </div>

      {/* Board selection */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-600">
          University / Board
        </label>
        <select
          value={selectedBoard}
          onChange={(e) => {
            setSelectedBoard(e.target.value);
            setSelectedStream("");
            setSelectedClass("");
            setForm({...form, subject: ""});
          }}
          className="w-full border border-gray-300 p-2 rounded-md"
          required
          disabled={!selectedLevel}
        >
          <option value="">Select</option>
          {boards.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Stream selection (only for higher secondary in specific boards) */}
      {shouldShowStreams() && getStreams().length > 0 && (
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-600">
            Stream
          </label>
          <select
            value={selectedStream}
            onChange={(e) => {
              setSelectedStream(e.target.value);
              setSelectedClass("");
              setForm({...form, subject: ""});
            }}
            className="w-full border border-gray-300 p-2 rounded-md"
            required={shouldShowStreams()}
          >
            <option value="">Select</option>
            {getStreams().map((stream) => (
              <option key={stream} value={stream}>
                {stream}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Class selection */}
      {getClasses().length > 0 && (
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-600">
            Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setForm({...form, subject: ""});
            }}
            className="w-full border border-gray-300 p-2 rounded-md"
            required
          >
            <option value="">Select</option>
            {getClasses().map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Subject selection */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-600">
          Subject
        </label>
        <select
          value={form.subject}
          name="subject"
          onChange={handleChange}
          className="w-full border border-gray-300 p-2 rounded-md"
          required
          disabled={!selectedClass}
        >
          <option value="">Select</option>
          {getSubjects().map((subj) => (
            <option key={subj} value={subj}>
              {subj}
            </option>
          ))}
        </select>
      </div>

      {/* Test Title */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-600">
          Test Title
        </label>
        <input
          type="text"
          name="title"
          placeholder="e.g., Unit Test 1"
          value={form.title}
          onChange={handleChange}
          className="w-full border border-gray-300 p-2 rounded-md"
          required
        />
      </div>

      {/* Test Type */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-600">
          Test Type
        </label>
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full border border-gray-300 p-2 rounded-md"
        >
          <option value="MCQ">Multiple Choice (MCQ)</option>
          <option value="Descriptive">Descriptive</option>
          <option value="Mixed">Mixed</option>
        </select>
      </div>

      {/* Test Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-600">
            Total Marks
          </label>
          <input
            type="number"
            name="totalMarks"
            min="0"
            value={form.totalMarks}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded-md"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-600">
            Passing Marks
          </label>
          <input
            type="number"
            name="passMarks"
            min="0"
            max={form.totalMarks}
            value={form.passMarks}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded-md"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-600">
            Duration (minutes)
          </label>
          <input
            type="number"
            name="timer"
            min="1"
            value={form.timer}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded-md"
          />
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-col space-y-3">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="allowMultipleAttempts"
            checked={form.allowMultipleAttempts}
            onChange={handleChange}
            className="rounded text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">
            Allow multiple attempts
          </span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isPublished"
            checked={form.isPublished}
            onChange={handleChange}
            className="rounded text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">
            Publish immediately
          </span>
        </label>
      </div>

      {/* Question selection */}
      {form.subject && (
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Select Questions ({selectedQuestions.length} selected)
          </h3>
          <div className="max-h-60 overflow-y-auto border rounded p-2">
            {availableQuestions.length === 0 ? (
              <p className="text-sm text-gray-500">No questions available for this subject.</p>
            ) : (
              availableQuestions.map((q, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-2 text-sm text-gray-800 mb-2 p-1 hover:bg-gray-50 rounded"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selectedQuestions.some(
                      (sq) => sq.question === q.question
                    )}
                    onChange={(e) => {
                      setSelectedQuestions((prev) =>
                        e.target.checked
                          ? [...prev, q]
                          : prev.filter((ques) => ques.question !== q.question)
                      );
                    }}
                  />
                  <div>
                    <p className="font-medium">{q.question}</p>
                    <p className="text-xs text-gray-500">
                      {q.topic} | {q.difficulty} | {q.type} | Marks: {q.marks}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-semibold py-2 rounded-md disabled:bg-gray-400"
        disabled={!form.subject || !form.title || !selectedLevel}
      >
        Create Test
      </button>
    </form>
  );
};
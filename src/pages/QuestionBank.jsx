import React, { useState } from "react";
import { useSubjectContext } from "../context/SubjectContext";
import { useQuestionBank } from "../context/QuestionBankContext";
import { useAuditLog } from "../context/AuditLogContext";

const difficulties = ["Easy", "Medium", "Hard"];
const questionTypes = ["MCQ", "Short Answer", "Descriptive"];

export const QuestionBank = () => {
  const { subjectsByBoard } = useSubjectContext();
  const { addQuestion, questions } = useQuestionBank();
  const { addLog } = useAuditLog();

  // Boards that should show streams only for Higher Secondary level
  const STREAM_BOARDS = ["CBSE", "ISC", "WBCHSE"];
  
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  const [form, setForm] = useState({
    subject: "",
    topic: "",
    difficulty: "Medium",
    type: "MCQ",
    question: "",
    options: ["", "", "", ""],
    answer: "",
  });

  // Check if we should show streams for the current selection
  const shouldShowStreams = () => {
    return (
      selectedLevel === "HIGHER_SECONDARY" && 
      STREAM_BOARDS.includes(selectedBoard)
    );
  };

  // Get available boards for the selected level
  const getBoards = () => {
    return Object.keys(subjectsByBoard || {});
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
    if (!selectedBoard) return [];
    
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

  const handleAdd = () => {
    if (!form.subject || !form.question) {
      addLog("QUESTION_CREATION_FAILED", "QUESTION_BANK", {
        reason: "Missing required fields",
        missing_fields: {
          subject: !form.subject,
          question: !form.question
        }
      });
      return alert("Fill required fields");
    }
    
    const questionData = {
      ...form,
      board: selectedBoard,
      level: selectedLevel,
      stream: shouldShowStreams() ? selectedStream : null,
      classLevel: selectedClass
    };
    
    addQuestion(questionData);
    addLog("QUESTION_CREATED", "QUESTION_BANK", {
      subject: form.subject,
      topic: form.topic,
      difficulty: form.difficulty,
      type: form.type,
      question_length: form.question.length,
      has_options: form.type === "MCQ",
      options_count: form.type === "MCQ" ? form.options.filter(opt => opt.trim() !== "").length : 0,
      has_answer: !!form.answer,
      board: selectedBoard,
      level: selectedLevel,
      stream: shouldShowStreams() ? selectedStream : null,
      classLevel: selectedClass
    });
    
    setForm({ 
      ...form, 
      question: "", 
      options: ["", "", "", ""], 
      answer: "" 
    });
  };

  const updateOption = (index, value) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm({ ...form, options: newOptions });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Question Bank</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Question</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Level Selection */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-600">
              Education Level
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value);
                setSelectedBoard("");
                setSelectedStream("");
                setSelectedClass("");
                setForm({...form, subject: ""});
              }}
              required
            >
              <option value="">Select Level</option>
              <option value="SECONDARY">Secondary (Class 9-10)</option>
              <option value="HIGHER_SECONDARY">Higher Secondary (Class 11-12)</option>
              <option value="UNDERGRADUATE">Undergraduate</option>
              <option value="POSTGRADUATE">Postgraduate</option>
            </select>
          </div>

          {/* Board Selection */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-600">
              Board/University
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedBoard}
              onChange={(e) => {
                setSelectedBoard(e.target.value);
                setSelectedStream("");
                setSelectedClass("");
                setForm({...form, subject: ""});
              }}
              disabled={!selectedLevel}
              required
            >
              <option value="">Select Board</option>
              {getBoards().map(board => (
                <option key={board} value={board}>{board}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stream Selection (only for higher secondary in specific boards) */}
        {shouldShowStreams() && (
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-600">
              Stream
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedStream}
              onChange={(e) => {
                setSelectedStream(e.target.value);
                setSelectedClass("");
                setForm({...form, subject: ""});
              }}
              disabled={!selectedBoard}
              required={shouldShowStreams()}
            >
              <option value="">Select Stream</option>
              {getStreams().map(stream => (
                <option key={stream} value={stream}>{stream}</option>
              ))}
            </select>
          </div>
        )}

        {/* Class Selection */}
        {selectedBoard && (
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-600">
              {shouldShowStreams() ? "Class" : "Class/Year"}
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setForm({...form, subject: ""});
              }}
              disabled={shouldShowStreams() ? !selectedStream : false}
              required
            >
              <option value="">Select Class</option>
              {getClasses().map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        )}

        {/* Subject Selection */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-600">
            Subject
          </label>
          <select
            className="w-full p-2 border rounded-md"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            disabled={!selectedClass}
            required
          >
            <option value="">Select Subject</option>
            {getSubjects().map((subj, idx) => (
              <option key={idx} value={subj}>{subj}</option>
            ))}
          </select>
        </div>

        {/* Question Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-600">
              Topic
            </label>
            <input
              className="w-full p-2 border rounded-md"
              placeholder="Enter topic"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-600">
              Difficulty
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            >
              {difficulties.map((d, idx) => (
                <option key={idx} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-600">
              Question Type
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {questionTypes.map((type, idx) => (
                <option key={idx} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Question Text */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-600">
            Question Text
          </label>
          <textarea
            className="w-full p-2 border rounded-md"
            placeholder="Enter your question here"
            rows={3}
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            required
          />
        </div>

        {/* MCQ Options */}
        {form.type === "MCQ" && (
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-600">
              Options (Mark the correct answer)
            </label>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={form.answer === opt}
                    onChange={() => setForm({ ...form, answer: opt })}
                    disabled={!opt.trim()}
                  />
                  <input
                    type="text"
                    className="flex-1 p-2 border rounded-md"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Answer Field for non-MCQ questions */}
        {form.type !== "MCQ" && (
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-600">
              Answer
            </label>
            <textarea
              className="w-full p-2 border rounded-md"
              placeholder="Enter the answer"
              rows={2}
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
            />
          </div>
        )}

        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={handleAdd}
          disabled={!form.subject || !form.question}
        >
          Add Question
        </button>
      </div>

      {/* Question List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">All Questions</h2>
        <div className="overflow-y-auto max-h-96">
          {questions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No questions added yet</p>
          ) : (
            <div className="space-y-4">
              {questions.map((q, i) => (
                <div key={i} className="border-b pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{q.question}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {q.subject} | {q.topic} | {q.difficulty} | {q.type}
                        {q.board && ` | ${q.board}`}
                        {q.level && ` | ${q.level}`}
                        {q.stream && ` | ${q.stream}`}
                        {q.classLevel && ` | ${q.classLevel}`}
                      </p>
                    </div>
                  </div>
                  {q.type === "MCQ" && q.options && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Options:</p>
                      <ul className="list-disc pl-5 text-sm text-gray-600">
                        {q.options.map((opt, idx) => (
                          <li key={idx} className={q.answer === opt ? "text-green-600 font-medium" : ""}>
                            {opt} {q.answer === opt && "(Correct)"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {q.type !== "MCQ" && q.answer && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Answer:</p>
                      <p className="text-sm text-gray-600">{q.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
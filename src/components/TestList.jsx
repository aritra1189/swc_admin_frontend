import React, { useState } from "react";
import { useTestContext } from "../context/TestContext";

export const TestList = () => {
  const { tests, updateTest, deleteTest } = useTestContext();
  const [expandedTestId, setExpandedTestId] = useState(null);

  const togglePublish = (testId) => {
    const test = tests.find((t) => t.id === testId);
    if (test) {
      updateTest({ ...test, isPublished: !test.isPublished });
    }
  };

  const toggleExpand = (testId) => {
    setExpandedTestId((prevId) => (prevId === testId ? null : testId));
  };

  const handleDelete = (testId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this test?");
    if (confirmDelete) {
      deleteTest(testId);
    }
  };

  return (
    <div className="overflow-auto max-h-[600px] bg-gray-50 p-4 rounded shadow">
      <h3 className="text-lg font-bold mb-4">All Tests</h3>

      {tests.length === 0 ? (
        <p className="text-gray-500 text-sm">No tests available.</p>
      ) : (
        tests.map((test) => (
          <div
            key={test.id}
            className="border p-3 mb-3 rounded bg-white shadow-sm"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold text-lg">{test.title}</div>
                <div className="text-sm text-gray-600">
                  {test.board} | {test.class} | {test.subject} | {test.type}
                </div>
                <div className="text-xs text-gray-400">
                  Marks: {test.totalMarks}, Time: {test.timer} min, Pass:{" "}
                  {test.passMarks}
                </div>
                <div className="text-xs mt-1">
                  {test.isPublished ? (
                    <span className="text-green-600">✅ Published</span>
                  ) : (
                    <span className="text-red-600">🚫 Unpublished</span>
                  )}
                </div>
              </div>

              <div className="space-x-2 flex flex-wrap">
                <button
                  onClick={() => togglePublish(test.id)}
                  className={`text-sm px-3 py-1 rounded ${
                    test.isPublished
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {test.isPublished ? "Unpublish" : "Publish"}
                </button>

                <button
                  onClick={() => toggleExpand(test.id)}
                  className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  {expandedTestId === test.id ? "Hide Details" : "View Details"}
                </button>

                <button
                  onClick={() => handleDelete(test.id)}
                  className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>

            {expandedTestId === test.id && (
              <div className="mt-4 text-sm">
                <h4 className="font-semibold mb-2">Questions:</h4>
                {test.questions?.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {test.questions.map((q, index) => (
                      <li key={index}>
                        <span className="font-medium">{q.question}</span>{" "}
                        <span className="text-gray-500">
                          ({q.difficulty}, {q.type})
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No questions selected.</p>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

import React, { useState } from "react";

export const AddCourse = ({ courseList, setCourseList }) => {
  const [course, setCourse] = useState({ name: "", instructor: "", class: "" });
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (course.name && course.instructor && course.class) {
      const updatedCourses = [...courseList, course];
      setCourseList(updatedCourses);
      setSuccessMessage("✅ Course added successfully!");
      setCourse({ name: "", instructor: "", class: "" });

      // Auto-hide message
      setTimeout(() => setSuccessMessage(""), 2500);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Add New Course</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block font-medium mb-1">Course Name</label>
          <input
            type="text"
            value={course.name}
            onChange={(e) => setCourse({ ...course, name: e.target.value })}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Course Class</label>
          <input
            type="text"
            value={course.class}
            onChange={(e) => setCourse({ ...course, class: e.target.value })}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Instructor</label>
          <input
            type="text"
            value={course.instructor}
            onChange={(e) =>
              setCourse({ ...course, instructor: e.target.value })
            }
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Course
        </button>
      </form>

      {successMessage && (
        <p className="mt-4 text-green-600 font-medium">{successMessage}</p>
      )}
    </div>
  );
};

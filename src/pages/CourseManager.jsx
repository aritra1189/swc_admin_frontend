import React, { useState } from "react";
import { PlusCircle, X } from "lucide-react";
import { AllCourses } from "../components/AllCourses";
import { useAuditLog } from "../context/AuditLogContext";

export const CourseManager = ({ courseList, setCourseList }) => {
  const { addLog } = useAuditLog();
  const [course, setCourse] = useState({
    name: "",
    instructor: "",
    class: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!course.name || !course.instructor || !course.class) {
      addLog("COURSE_CREATION_FAILED", "COURSE", {
        reason: "Missing required fields",
        missing_fields: {
          name: !course.name,
          instructor: !course.instructor,
          class: !course.class
        }
      });
      return;
    }

    const newCourse = {
      ...course,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    
    const updated = [...courseList, newCourse];
    setCourseList(updated);
    
    // Log successful course creation
    addLog("COURSE_CREATED", "COURSE", {
      course_id: newCourse.id,
      course_name: newCourse.name,
      instructor: newCourse.instructor,
      class: newCourse.class,
      total_courses: updated.length
    });

    setCourse({ name: "", instructor: "", class: "" });
    setSuccessMessage("Course added successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
    setShowForm(false);
  };

  const toggleForm = () => {
    const action = showForm ? "FORM_CLOSED" : "FORM_OPENED";
    addLog(action, "COURSE_FORM", {
      current_course_count: courseList.length
    });
    setShowForm(!showForm);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Course Management
            </h1>
            <p className="mt-1 text-md text-gray-500">
              Manage all available courses with ease.
            </p>
          </div>
          <button
            className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg ${
              showForm
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
            onClick={toggleForm}
          >
            {showForm ? (
              <>
                <X size={20} />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <PlusCircle size={20} />
                <span>Add New Course</span>
              </>
            )}
          </button>
        </div>

        {/* Add Course Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-white p-8 border border-gray-200 rounded-2xl shadow-xl mb-10 animate-fade-in"
          >
            <h3 className="text-2xl font-bold text-gray-900 border-b pb-4">
              Add New Course
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Course Name Input */}
              <div>
                <label
                  htmlFor="courseName"
                  className="block mb-2 font-semibold text-gray-700"
                >
                  Course Name
                </label>
                <input
                  id="courseName"
                  type="text"
                  value={course.name}
                  onChange={(e) =>
                    setCourse({ ...course, name: e.target.value })
                  }
                  className="w-full border-2 border-gray-300 bg-gray-50 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="e.g., Introduction to React"
                  required
                />
              </div>

              {/* Class Select */}
              <div>
                <label
                  htmlFor="courseClass"
                  className="block mb-2 font-semibold text-gray-700"
                >
                  Class
                </label>
                <select
                  id="courseClass"
                  value={course.class}
                  onChange={(e) =>
                    setCourse({ ...course, class: e.target.value })
                  }
                  className="w-full border-2 border-gray-300 bg-gray-50 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  required
                >
                  <option value="">Select Class</option>
                  <option value="BCA">BCA</option>
                  <option value="BTech">BTech</option>
                  <option value="MCA">MCA</option>
                  <option value="BSc">BSc</option>
                </select>
              </div>
            </div>

            {/* Instructor Input */}
            <div>
              <label
                htmlFor="instructor"
                className="block mb-2 font-semibold text-gray-700"
              >
                Instructor
              </label>
              <input
                id="instructor"
                type="text"
                value={course.instructor}
                onChange={(e) =>
                  setCourse({ ...course, instructor: e.target.value })
                }
                className="w-full border-2 border-gray-300 bg-gray-50 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="Instructor's name"
                required
              />
            </div>

            {/* Form Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={toggleForm}
                className="px-6 py-3 border-2 border-gray-300 rounded-full text-gray-700 font-semibold hover:bg-gray-100 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Add Course
              </button>
            </div>
          </form>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-8 p-5 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-lg shadow-md animate-fade-in">
            <div className="flex items-center">
              <svg
                className="w-6 h-6 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Course List Section */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <AllCourses courseList={courseList} />
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
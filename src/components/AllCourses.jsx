import React from "react";
import PropTypes from "prop-types";

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          Error rendering courses. Please try again later.
        </div>
      );
    }
    return this.props.children;
  }
}

export const AllCourses = ({ courseList = [] }) => {
  // Data validation and normalization
  const validatedCourses = courseList
    .filter(course => course && typeof course === "object")
    .map(course => ({
      id: course.id || Math.random().toString(36).substr(2, 9),
      name: course.name || "Unnamed Course",
      instructor: course.instructor || "Unknown Instructor",
      class: course.class || "No Class",
      createdAt: course.createdAt || new Date().toISOString()
    }));

  // Check for duplicate IDs
  const uniqueIds = new Set();
  const hasDuplicateIds = validatedCourses.some(course => {
    if (uniqueIds.has(course.id)) {
      return true;
    }
    uniqueIds.add(course.id);
    return false;
  });

  if (hasDuplicateIds) {
    console.warn("Warning: Duplicate course IDs detected in courseList");
  }

  return (
    <ErrorBoundary>
      <div className="p-9">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">All Courses</h3>
        
        {validatedCourses.length > 0 ? (
          <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Course Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Instructor
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Class
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Added On
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {validatedCourses.map((course) => (
                  <tr
                    key={course.id}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {course.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {course.instructor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {course.class}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-500 text-lg font-medium">
              No courses available. Add a new course to get started!
            </p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

AllCourses.propTypes = {
  courseList: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      instructor: PropTypes.string,
      class: PropTypes.string,
      createdAt: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(Date)
      ])
    })
  )
};

AllCourses.defaultProps = {
  courseList: []
};
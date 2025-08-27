import React from "react";

export const AllFaculty = ({ facultyList }) => {
  return (
    <div className="mt-10 p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">All Faculty</h2>
      {facultyList.length === 0 ? (
        <p className="text-gray-500">No faculty added yet.</p>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full bg-white border text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                {[
                  "Name", "Email", "Phone", "Gender", "City", "State", "Country", "Pincode",
                  "DOB", "Faculty Type", "Department", "Class", "Designation"
                ].map((col) => (
                  <th key={col} className="px-4 py-2 border">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {facultyList.map((faculty, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {Object.values(faculty).map((val, i) => (
                    <td key={i} className="px-4 py-2 border">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

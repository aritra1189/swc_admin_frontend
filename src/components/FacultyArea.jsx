import React, { useState } from "react";

export const FacultyArea = ({ facultyList, setFacultyList }) => {
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", gender: "", city: "", state: "", country: "",
    pincode: "", dateofbirth: "", facultyType: "", department: "", class: "", designation: ""
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    for (let key in formData) {
      if (!formData[key]) {
        alert(`Please fill out the ${key} field.`);
        return;
      }
    }
    setFacultyList([...facultyList, formData]);
    setFormData({
      name: "", email: "", phone: "", gender: "", city: "", state: "", country: "",
      pincode: "", dateofbirth: "", facultyType: "", department: "", class: "", designation: ""
    });
    alert("Faculty data submitted successfully!");
  };

  return (
    <div className="p-8 bg-white shadow-lg rounded-xl max-w-7xl mx-auto mt-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Add New Faculty</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {["name", "email", "phone", "city", "state", "country", "pincode"].map((id) => (
          <div key={id}>
            <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-2">{id.toUpperCase()}</label>
            <input
              type="text"
              id={id}
              value={formData[id]}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        ))}
        <div>
          <label htmlFor="dateofbirth" className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
          <input type="date" id="dateofbirth" value={formData.dateofbirth} onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        {[
          ['gender', ['Male', 'Female', 'Other']],
          ['facultyType', ['Permanent', 'Visiting']],
          ['department', ['Secondary', 'Higher Secondary', 'Graduation']],
          ['class', ['Class X', 'Class XII']],
          ['designation', ['Professor', 'Lecturer', 'Assistant Professor', 'Associate Professor']]
        ].map(([id, options]) => (
          <div key={id}>
            <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-2">{id.toUpperCase()}</label>
            <select id={id} value={formData[id]} onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="">Select {id}</option>
              {options.map((opt) => <option key={opt}>{opt}</option>)}
            </select>
          </div>
        ))}
      </form>
      <div className="mt-8 text-right">
        <button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

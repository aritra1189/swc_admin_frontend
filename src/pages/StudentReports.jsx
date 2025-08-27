import React, { useState } from "react";
import {
  Search,
  Eye,
  FileText,
  Download,
  BookOpen,
  ClipboardCheck,
  Clock,
  Wallet,
  X,
  User,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {usersData} from "./mockUsers"
const StudentPerformanceReports = () => {
  const [students, setStudents] = useState(usersData);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showReport, setShowReport] = useState(false);

  // Filter students based on search term
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to view a student's detailed report in a modal
  const handleViewReport = (student) => {
    setSelectedStudent(student);
    setShowReport(true);
  };

  // Function to export the selected student's report to Excel
  const handleExportExcel = () => {
    if (!selectedStudent) return;

    // Flatten the nested data for a single, easy-to-read Excel sheet
    const formattedData = [
      { "Report For": selectedStudent.name, "Key": "Email", "Value": selectedStudent.email },
      { "Report For": selectedStudent.name, "Key": "---", "Value": "---" },
      { "Report For": "Lecture Progress" },
      ...selectedStudent.lectureProgress.map(item => ({ "Report For": "Chapter", "Key": item.chapter, "Value": `${item.watchedPercentage}% Watched` })),
      { "Report For": "---", "Key": "---", "Value": "---" },
      { "Report For": "Test Scores" },
      ...selectedStudent.testScores.map(item => ({ "Report For": "Test Name", "Key": item.testName, "Value": `${item.score} (${item.attempts} attempts)` })),
      { "Report For": "---", "Key": "---", "Value": "---" },
      { "Report For": "Login Activity" },
      ...selectedStudent.loginActivity.map(item => ({ "Report For": "Date", "Key": item.date, "Value": `${item.timeSpent} spent` })),
      { "Report For": "---", "Key": "---", "Value": "---" },
      { "Report For": "Payment History" },
      ...selectedStudent.paymentHistory.map(item => ({ "Report For": "Invoice ID", "Key": item.invoiceId, "Value": `Amount: $${item.amount}, Status: ${item.status}` })),
    ];
    
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Student Report");
    XLSX.writeFile(wb, `${selectedStudent.name}_report.xlsx`);
  };

  // Function to export the selected student's report to PDF
  const handleExportPDF = () => {
    if (!selectedStudent) return;

    const input = document.getElementById("student-report-content");
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let position = 0;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save(`${selectedStudent.name}_report.pdf`);
    });
  };

  // The main component render
  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-4xl font-bold text-gray-800 mb-2">Student Performance Reports</h2>
        <p className="text-gray-600 mb-6">
          Access detailed academic, activity, and financial reports for all students.
        </p>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="text-gray-400" size={20} />
          </div>
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Student List Table */}
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleViewReport(student)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium"
                      >
                        <Eye size={18} />
                        View Report
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Modal */}
      {showReport && selectedStudent && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8">
            <button
              onClick={() => setShowReport(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X size={24} />
            </button>
            <div id="student-report-content">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold text-gray-800">
                  {selectedStudent.name}'s Performance Report
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportExcel}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600 transition-colors duration-200 flex items-center gap-2"
                  >
                    <FileText size={18} />
                    Excel
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200 flex items-center gap-2"
                  >
                    <Download size={18} />
                    PDF
                  </button>
                </div>
              </div>

              {/* Student Details */}
              <div className="mb-8 p-4 bg-gray-100 rounded-lg">
                <h4 className="text-xl font-semibold mb-2 flex items-center gap-2 text-gray-700">
                  <User size={20} /> Student Details
                </h4>
                <p className="text-gray-600"><strong>Name:</strong> {selectedStudent.name}</p>
                <p className="text-gray-600"><strong>Email:</strong> {selectedStudent.email}</p>
              </div>

              {/* Performance Sections */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Lecture Progress */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-700">
                    <BookOpen size={20} /> Lecture Progress
                  </h4>
                  <ul className="space-y-3">
                    {selectedStudent.lectureProgress.map((item, index) => (
                      <li key={index} className="flex justify-between items-center text-gray-600">
                        <span>{item.chapter}</span>
                        <span className="font-semibold text-gray-800">{item.watchedPercentage}%</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Test Scores */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-700">
                    <ClipboardCheck size={20} /> Test Scores
                  </h4>
                  <ul className="space-y-3">
                    {selectedStudent.testScores.map((item, index) => (
                      <li key={index} className="flex justify-between items-center text-gray-600">
                        <span>{item.testName}</span>
                        <span className="font-semibold text-gray-800">{item.score} ({item.attempts} attempts)</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Login Activity */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-700">
                    <Clock size={20} /> Login Activity
                  </h4>
                  <ul className="space-y-3">
                    {selectedStudent.loginActivity.map((item, index) => (
                      <li key={index} className="flex justify-between items-center text-gray-600">
                        <span>{item.date}</span>
                        <span className="font-semibold text-gray-800">{item.timeSpent}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Payment History */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-700">
                    <Wallet size={20} /> Payment History
                  </h4>
                  <ul className="space-y-3">
                    {selectedStudent.paymentHistory.map((item, index) => (
                      <li key={index} className="flex justify-between items-center text-gray-600">
                        <span>Invoice: {item.invoiceId}</span>
                        <span className={`font-semibold ${item.status === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>
                          ${item.amount} ({item.status})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPerformanceReports;

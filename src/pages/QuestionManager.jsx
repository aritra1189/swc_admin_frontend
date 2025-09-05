import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchQuestions,
  fetchQuestionFilters,
  createQuestion,
  addPreviousQuestion,
  updateQuestionStatus,
  setFilters,
  resetFilters,
  fetchMcqTests,
  uploadOptionImage
} from '../store/QuestionSlice';

const useQuestionState = () => {
  const state = useSelector((state) => state.questions || {});
  
  return {
    questions: state.questions || [],
    totalCount: state.totalCount || 0,
    loading: state.loading || false,
    error: state.error || null,
    filters: state.filters || {
      semesterId: '',
      gradeId: '',
      streamId: '',
      degreeId: '',
      universityId: '',
      masterSubId: '',
      examId: '',
      examTypeId: '',
      subjectId: '',
      unitId: '',
      questionType: '',
      keyword: '',
      mcqTestId: '',
      limit: 10,
      offset: 0
    },
    mcqTests: state.mcqTests || [],
    filterOptions: {
      universities: state.filterOptions?.universities || [],
      degrees: state.filterOptions?.degrees || [],
      streams: state.filterOptions?.streams || [],
      grades: state.filterOptions?.grades || [],
      semesters: state.filterOptions?.semesters || [],
      masterSubjects: state.filterOptions?.masterSubjects || [],
      subjects: state.filterOptions?.subjects || [],
      units: state.filterOptions?.units || [],
      examTypes: state.filterOptions?.examTypes || [],
      exams: state.filterOptions?.exams || []
    }
  };
};

const QuestionManagement = () => {
  const dispatch = useDispatch();
  const state = useQuestionState();
  
  const {
    questions,
    totalCount,
    loading,
    error,
    filters,
    mcqTests,
    filterOptions
  } = state;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreviousModal, setShowPreviousModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [formData, setFormData] = useState({
    questionText: '',
    questionType: 'SINGLE_CHOICE',
    explanation: '',
    marks: 1,
    mcqTestId: '',
    options: [
      { optionText: '', isCorrect: false, optionOrder: 'A' },
      { optionText: '', isCorrect: false, optionOrder: 'B' },
      { optionText: '', isCorrect: false, optionOrder: 'C' },
      { optionText: '', isCorrect: false, optionOrder: 'D' }
    ]
  });
  const [previousQuestionData, setPreviousQuestionData] = useState({
    questionId: '',
    mcqTestId: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRefs = useRef({});
   const [filteredMcqTests, setFilteredMcqTests] = useState([]);
  // Load initial data and MCQ tests
  useEffect(() => {
    dispatch(fetchQuestions(filters));
    dispatch(fetchMcqTests());
    dispatch(fetchQuestionFilters());
  }, [dispatch]);
  useEffect(() => {
    if (mcqTests.length > 0) {
      let filtered = [...mcqTests];
      
      // Apply filters based on selected values
      if (filters.universityId) {
        filtered = filtered.filter(test => 
          test.unit?.subject?.universityId === filters.universityId
        );
      }
      
      if (filters.degreeId) {
        filtered = filtered.filter(test => 
          test.unit?.subject?.degreeId === filters.degreeId
        );
      }
      
      if (filters.streamId) {
        filtered = filtered.filter(test => 
          test.unit?.subject?.streamId === filters.streamId
        );
      }
      
      if (filters.gradeId) {
        filtered = filtered.filter(test => 
          test.unit?.subject?.gradeId === filters.gradeId
        );
      }
      
      if (filters.semesterId) {
        filtered = filtered.filter(test => 
          test.unit?.subject?.semesterId === filters.semesterId
        );
      }
      
      if (filters.masterSubId) {
        filtered = filtered.filter(test => 
          test.unit?.subject?.subMasterId === filters.masterSubId
        );
      }
      
      if (filters.subjectId) {
        filtered = filtered.filter(test => 
          test.unit?.subjectId === filters.subjectId
        );
      }
      
      setFilteredMcqTests(filtered);
    }
  }, [filters, mcqTests]);
  // Handle server-side filter changes
  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value, offset: 0 };
    dispatch(setFilters(newFilters));
  
if (field === 'universityId') {
      newFilters.degreeId = '';
      newFilters.streamId = '';
      newFilters.gradeId = '';
      newFilters.semesterId = '';
      newFilters.masterSubId = '';
      newFilters.subjectId = '';
      newFilters.unitId = '';
      newFilters.mcqTestId = '';
    } else if (field === 'degreeId') {
      newFilters.streamId = '';
      newFilters.gradeId = '';
      newFilters.semesterId = '';
      newFilters.masterSubId = '';
      newFilters.subjectId = '';
      newFilters.unitId = '';
      newFilters.mcqTestId = '';
    } else if (field === 'streamId') {
      newFilters.gradeId = '';
      newFilters.semesterId = '';
      newFilters.masterSubId = '';
      newFilters.subjectId = '';
      newFilters.unitId = '';
      newFilters.mcqTestId = '';
    } else if (field === 'gradeId' || field === 'semesterId') {
      newFilters.masterSubId = '';
      newFilters.subjectId = '';
      newFilters.unitId = '';
      newFilters.mcqTestId = '';
    } else if (field === 'masterSubId') {
      newFilters.subjectId = '';
      newFilters.unitId = '';
      newFilters.mcqTestId = '';
    } else if (field === 'subjectId') {
      newFilters.unitId = '';
      newFilters.mcqTestId = '';
    } else if (field === 'unitId') {
      newFilters.mcqTestId = '';
    }
    
    dispatch(setFilters(newFilters));
  };
  // Handle search with filters
  const handleSearch = () => {
    dispatch(fetchQuestions(filters));
  };

  // Handle reset filters
  const handleReset = () => {
    dispatch(resetFilters());
    dispatch(fetchQuestions({
      semesterId: '',
      gradeId: '',
      streamId: '',
      degreeId: '',
      universityId: '',
      masterSubId: '',
      examId: '',
      examTypeId: '',
      subjectId: '',
      unitId: '',
      questionType: '',
      keyword: '',
      mcqTestId: '',
      limit: 10,
      offset: 0
    }));
  };

  // Handle pagination
  const handlePageChange = (newOffset) => {
    const newFilters = { ...filters, offset: newOffset };
    dispatch(setFilters(newFilters));
    dispatch(fetchQuestions(newFilters));
  };

  // Handle question status change
  const handleStatusChange = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await dispatch(updateQuestionStatus({ id, data: { status: newStatus } })).unwrap();
      dispatch(fetchQuestions(filters));
    } catch (error) {
      console.error('Failed to update question status:', error);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle option changes
  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    
    if (field === 'optionImage' && value instanceof File) {
      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(value);
      newOptions[index].optionImagePreview = previewUrl;
      newOptions[index].optionImageFile = value;
    } else {
      newOptions[index][field] = value;
    }
    
    if (field === 'isCorrect' && value && formData.questionType === 'SINGLE_CHOICE') {
      newOptions.forEach((option, i) => {
        if (i !== index) option.isCorrect = false;
      });
    }
    
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  // Handle image upload for an option
  const handleImageUpload = async (optionIndex, optionId) => {
    const fileInput = fileInputRefs.current[optionIndex];
    if (!fileInput || !fileInput.files[0]) return;
    
    const file = fileInput.files[0];
    setUploadingImage(true);
    
    try {
      await dispatch(uploadOptionImage({ optionId, file })).unwrap();
      // Refresh questions to get the updated data
      dispatch(fetchQuestions(filters));
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setUploadingImage(false);
      fileInput.value = ''; // Reset file input
    }
  };

  // Add new option
  const addOption = () => {
    const newOrder = String.fromCharCode(65 + formData.options.length);
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { optionText: '', isCorrect: false, optionOrder: newOrder }]
    }));
  };

  // Remove option
  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, options: newOptions }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // First create the question without images
      const questionData = {
        ...formData,
        options: formData.options.map(option => ({
          optionText: option.optionText,
          isCorrect: option.isCorrect,
          optionOrder: option.optionOrder
        }))
      };
      
      const result = await dispatch(createQuestion(questionData)).unwrap();
      const newQuestion = result.result || result;
      
      // Upload images for options that have them
      const uploadPromises = formData.options
        .filter(option => option.optionImageFile)
        .map(async (option, index) => {
          const optionId = newQuestion.options[index].id;
          return dispatch(uploadOptionImage({
            optionId,
            file: option.optionImageFile
          })).unwrap();
        });
      
      await Promise.all(uploadPromises);
      
      setShowAddModal(false);
      setFormData({
        questionText: '',
        questionType: 'SINGLE_CHOICE',
        explanation: '',
        marks: 1,
        mcqTestId: '',
        options: [
          { optionText: '', isCorrect: false, optionOrder: 'A' },
          { optionText: '', isCorrect: false, optionOrder: 'B' },
          { optionText: '', isCorrect: false, optionOrder: 'C' },
          { optionText: '', isCorrect: false, optionOrder: 'D' }
        ]
      });
      
      dispatch(fetchQuestions(filters));
    } catch (error) {
      console.error('Failed to create question:', error);
    }
  };

  // Handle previous question submission
  const handlePreviousSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(addPreviousQuestion(previousQuestionData)).unwrap();
      setShowPreviousModal(false);
      setPreviousQuestionData({
        questionId: '',
        mcqTestId: ''
      });
      dispatch(fetchQuestions(filters));
    } catch (error) {
      console.error('Failed to add previous question:', error);
    }
  };

  // View question details
  const viewQuestionDetails = (question) => {
    setSelectedQuestion(question);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Question Management</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowPreviousModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Add Previous Question
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add New Question
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>Error: {error.message || 'Something went wrong'}</p>
        </div>
      )}

      {/* Server-side Filter Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
          {/* Keyword Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Keyword</label>
            <input
              type="text"
              value={filters.keyword || ''}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search questions..."
            />
          </div>
        
          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
            <select
              value={filters.questionType || ''}
              onChange={(e) => handleFilterChange('questionType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="SINGLE_CHOICE">Single Choice</option>
              <option value="MULTIPLE_CHOICE">Multiple Choice</option>
              <option value="TRUE_FALSE">True/False</option>
              <option value="IMAGE_BASED">Image-Based</option>
            </select>
          </div>

          {/* MCQ Test */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MCQ Test</label>
            <select
              value={filters.mcqTestId || ''}
              onChange={(e) => handleFilterChange('mcqTestId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Tests</option>
              {mcqTests.map(test => (
                <option key={test.id} value={test.id}>{test.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Reset All Filters
          </button>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Questions ({totalCount})</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {questions.length > 0 ? (
                    questions.map((question) => (
                      <tr key={question.id}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">
                            {question.questionText}
                          </div>
                          {question.options && question.options.some(opt => opt.optionImage) && (
                            <div className="text-xs text-blue-600 mt-1">
                              Contains images
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {question.questionType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {question.mcqTest?.title || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {question.marks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              question.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {question.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => viewQuestionDetails(question)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleStatusChange(question.id, question.status)}
                            className={`mr-3 ${
                              question.status === 'ACTIVE'
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {question.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                        No questions found. Try adjusting your filters or add new questions.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalCount > filters.limit && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{filters.offset + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(filters.offset + filters.limit, totalCount)}
                    </span>{' '}
                    of <span className="font-medium">{totalCount}</span> results
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(Math.max(0, filters.offset - filters.limit))}
                      disabled={filters.offset === 0}
                      className="px-3 py-1 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(filters.offset + filters.limit)}
                      disabled={filters.offset + filters.limit >= totalCount}
                      className="px-3 py-1 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Add New Question</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-6 text-gray-400 hover:text-gray-500"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                <textarea
                  name="questionText"
                  value={formData.questionText}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your question here..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                  <select
                    name="questionType"
                    value={formData.questionType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SINGLE_CHOICE">Single Choice</option>
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True/False</option>
                    <option value="IMAGE_BASED">Image-Based</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                  <input
                    type="number"
                    name="marks"
                    value={formData.marks}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MCQ Test</label>
                <select
                  name="mcqTestId"
                  value={formData.mcqTestId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Test</option>
                  {mcqTests.map(test => (
                    <option key={test.id} value={test.id}>{test.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                <textarea
                  name="explanation"
                  value={formData.explanation}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add explanation for the answer..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">Options</label>
                  <button
                    type="button"
                    onClick={addOption}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
                  >
                    + Add Option
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type={formData.questionType === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                        checked={option.isCorrect}
                        onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={option.optionText}
                        onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
                        placeholder={`Option ${option.optionOrder}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      
                      {/* Image upload section */}
                      <div className="flex flex-col items-center">
                        {option.optionImagePreview ? (
                          <div className="relative">
                            <img 
                              src={option.optionImagePreview} 
                              alt="Option preview" 
                              className="h-12 w-12 object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => handleOptionChange(index, 'optionImage', null)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <>
                            <input
                              type="file"
                              ref={el => fileInputRefs.current[index] = el}
                              onChange={(e) => handleOptionChange(index, 'optionImage', e.target.files[0])}
                              accept="image/*"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[index]?.click()}
                              className="px-2 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                            >
                              Add Image
                            </button>
                          </>
                        )}
                      </div>
                      
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="px-2 py-1 text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Previous Question Modal */}
      {showPreviousModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Add Previous Question</h3>
              <button
                onClick={() => setShowPreviousModal(false)}
                className="absolute top-4 right-6 text-gray-400 hover:text-gray-500"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handlePreviousSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question ID</label>
                <input
                  type="text"
                  value={previousQuestionData.questionId}
                  onChange={(e) => setPreviousQuestionData(prev => ({ ...prev, questionId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter question ID"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MCQ Test</label>
                <select
                  value={previousQuestionData.mcqTestId}
                  onChange={(e) => setPreviousQuestionData(prev => ({ ...prev, mcqTestId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Test</option>
                  {mcqTests.map(test => (
                    <option key={test.id} value={test.id}>{test.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPreviousModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Details Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Question Details</h3>
              <button
                onClick={() => setSelectedQuestion(null)}
                className="absolute top-4 right-6 text-gray-400 hover:text-gray-500"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-900">Question:</h4>
                <p className="mt-1 text-gray-700">{selectedQuestion.questionText}</p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-900">Options:</h4>
                <div className="mt-2 space-y-3">
                  {selectedQuestion.options && selectedQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-start">
                      <span className={`mr-2 ${option.isCorrect ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <div>
                        <p className={option.isCorrect ? 'text-green-700 font-medium' : 'text-gray-700'}>
                          {option.optionText}
                        </p>
                        {option.optionImage && (
                          <div className="mt-2">
                            <img 
                              src={option.optionImage} 
                              alt={`Option ${String.fromCharCode(65 + index)}`}
                              className="max-h-40 rounded-md border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedQuestion.explanation && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Explanation:</h4>
                  <p className="mt-1 text-gray-700">{selectedQuestion.explanation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionManagement;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Set up axios instance with base URL and interceptors
const api = axios.create({
  baseURL: API_BASE_URL
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('user'))?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; // Redirect to login
    }
    return Promise.reject(error);
  }
);

const SubjectManagement = () => {
  // State for subjects
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error'
  });
  
  // State for related entities
  const [grades, setGrades] = useState([]);
  const [streams, setStreams] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [subjectMasters, setSubjectMasters] = useState([]);
  
  // Loading states for related entities
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingDegrees, setLoadingDegrees] = useState(false);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [loadingSubjectMasters, setLoadingSubjectMasters] = useState(false);
  
  // Pagination state for subjects
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Pagination state for related entities
  const [entityLimit] = useState(100); // Fetch more items to reduce pagination needs
  
  // Filter state
  const [filters, setFilters] = useState({
    gradeId: '',
    streamId: '',
    semesterId: '',
    degreeId: '',
    universityId: '',
    subMasterId: '',
    status: 'ACTIVE'
  });
  
  // Search state
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    subMasterId: '',
    gradeId: '',
    streamId: '',
    semesterId: '',
    degreeId: '',
    universityId: '',
    status: 'ACTIVE'
  });
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSubjectId, setCurrentSubjectId] = useState(null);

  // Show snackbar notification
  const showSnackbar = (message, severity = 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Convert empty strings to null for API compatibility
  const sanitizeFormData = (data) => {
    const sanitized = { ...data };
    
    // Convert empty strings to null for optional fields
    const optionalFields = ['streamId', 'semesterId', 'degreeId', 'universityId'];
    optionalFields.forEach(field => {
      if (sanitized[field] === '') {
        sanitized[field] = null;
      }
    });
    
    return sanitized;
  };

  // Fetch all related entities
  const fetchRelatedEntities = async () => {
    try {
      setLoadingGrades(true);
      setLoadingStreams(true);
      setLoadingSemesters(true);
      setLoadingDegrees(true);
      setLoadingUniversities(true);
      setLoadingSubjectMasters(true);

      // Fetch all entities in parallel with pagination
      const [
        gradesRes,
        streamsRes,
        semestersRes,
        degreesRes,
        universitiesRes
      ] = await Promise.all([
        api.get('/grade/list', {
          params: {
            limit: entityLimit,
            offset: 0,
            status: 'ACTIVE'
          }
        }),
        api.get('/stream/list', {
          params: {
            limit: entityLimit,
            offset: 0,
            status: 'ACTIVE'
          }
        }),
        api.get('/semester/list', {
          params: {
            limit: entityLimit,
            offset: 0,
            status: 'ACTIVE'
          }
        }),
        api.get('/degree/list', {
          params: {
            limit: entityLimit,
            offset: 0,
            status: 'ACTIVE'
          }
        }),
        api.get('/university/list', {
          params: {
            limit: entityLimit,
            offset: 0,
            status: 'ACTIVE'
          }
        })
      ]);

      setGrades(gradesRes.data.result || []);
      setStreams(streamsRes.data.result || []);
      setSemesters(semestersRes.data.result || []);
      setDegrees(degreesRes.data.result || []);
      setUniversities(universitiesRes.data.result || []);
      
      // Fetch subject masters
      const subjectMastersRes = await api.get('/subject-master/list', {
        params: {
          limit: entityLimit,
          offset: 0,
          status: 'ACTIVE'
        }
      });
      setSubjectMasters(subjectMastersRes.data.result || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch related entities';
      showSnackbar(errorMessage);
      console.error(err);
    } finally {
      setLoadingGrades(false);
      setLoadingStreams(false);
      setLoadingSemesters(false);
      setLoadingDegrees(false);
      setLoadingUniversities(false);
      setLoadingSubjectMasters(false);
    }
  };

  // Fetch subjects
  const fetchSubjects = async (isUserView = false) => {
    setLoading(true);
    try {
      const endpoint = isUserView ? '/subject/user' : '/subject/list';
      
      // Sanitize filter data - convert empty strings to null
      const sanitizedFilters = { ...filters };
      const optionalFilterFields = ['gradeId', 'streamId', 'semesterId', 'degreeId', 'universityId', 'subMasterId'];
      optionalFilterFields.forEach(field => {
        if (sanitizedFilters[field] === '') {
          sanitizedFilters[field] = null;
        }
      });
      
      const params = {
        ...sanitizedFilters,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        keyword: searchKeyword
      };
      
      const response = await api.get(endpoint, { params });
      setSubjects(response.data.result || []);
      setTotalCount(response.data.total || 0);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch subjects';
      showSnackbar(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSubjects();
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open create dialog
  const handleOpenCreateDialog = () => {
    setIsEditMode(false);
    setFormData({
      subMasterId: '',
      gradeId: '',
      streamId: '',
      semesterId: '',
      degreeId: '',
      universityId: '',
      status: 'ACTIVE'
    });
    setOpenDialog(true);
  };

  // Open edit dialog
  const handleOpenEditDialog = (subject) => {
    setIsEditMode(true);
    setCurrentSubjectId(subject.id);
    setFormData({
      subMasterId: subject.subMasterId || '',
      gradeId: subject.gradeId || '',
      streamId: subject.streamId || '',
      semesterId: subject.semesterId || '',
      degreeId: subject.degreeId || '',
      universityId: subject.universityId || '',
      status: subject.status || 'ACTIVE'
    });
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Submit form
  const handleSubmit = async () => {
    try {
      // Sanitize form data - convert empty strings to null for optional fields
      const sanitizedData = sanitizeFormData(formData);
      
      if (isEditMode) {
        await api.patch(`/subject/update/${currentSubjectId}`, sanitizedData);
        showSnackbar('Subject updated successfully', 'success');
      } else {
        await api.post('/subject', sanitizedData);
        showSnackbar('Subject created successfully', 'success');
      }
      fetchSubjects();
      handleCloseDialog();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
        `Failed to ${isEditMode ? 'update' : 'create'} subject`;
      showSnackbar(errorMessage);
      console.error(err);
    }
  };

  // Delete subject
  const handleDelete = async (id) => {
    try {
      await api.delete(`/subject/${id}`);
      showSnackbar('Subject deleted successfully', 'success');
      fetchSubjects();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete subject';
      showSnackbar(errorMessage);
      console.error(err);
    }
  };

  // Toggle subject status
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.patch(`/subject/update/${id}`, { status: newStatus });
      showSnackbar(`Subject ${newStatus.toLowerCase()}d successfully`, 'success');
      fetchSubjects();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update subject status';
      showSnackbar(errorMessage);
      console.error(err);
    }
  };

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('user'))?.token;
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchRelatedEntities();
    fetchSubjects();
  }, []);

  // Fetch subjects when filters/pagination changes
  useEffect(() => {
    fetchSubjects();
  }, [filters, page, rowsPerPage]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Subject Management</h1>
        
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by subject name, code, etc."
                value={searchKeyword}
                onChange={handleSearchChange}
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
            >
              Search
            </button>
          </form>
        </div>
        
        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select
                name="gradeId"
                value={filters.gradeId}
                onChange={handleFilterChange}
                disabled={loadingGrades}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Grades</option>
                {grades.map(grade => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
              <select
                name="streamId"
                value={filters.streamId}
                onChange={handleFilterChange}
                disabled={loadingStreams}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Streams</option>
                {streams.map(stream => (
                  <option key={stream.id} value={stream.id}>
                    {stream.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select
                name="semesterId"
                value={filters.semesterId}
                onChange={handleFilterChange}
                disabled={loadingSemesters}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Semesters</option>
                {semesters.map(semester => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
              <select
                name="degreeId"
                value={filters.degreeId}
                onChange={handleFilterChange}
                disabled={loadingDegrees}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Degrees</option>
                {degrees.map(degree => (
                  <option key={degree.id} value={degree.id}>
                    {degree.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
              <select
                name="universityId"
                value={filters.universityId}
                onChange={handleFilterChange}
                disabled={loadingUniversities}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Universities</option>
                {universities.map(university => (
                  <option key={university.id} value={university.id}>
                    {university.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="">All Statuses</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleOpenCreateDialog}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
          >
            Add New Subject-connection
          </button>
          <div className="text-gray-700 font-medium">
            Total Subjects: {totalCount}
          </div>
        </div>
        
        {/* Subjects Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Master</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stream</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Degree</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">University</th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : subjects.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      No subjects found
                    </td>
                  </tr>
                ) : (
                  subjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{subject.subMaster?.name|| 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{subject.grade?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{subject.stream?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{subject.semester?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{subject.degree?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{subject.university?.name || 'N/A'}</div>
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(subject.id, subject.subMaster?.status)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            subject.subMaster?.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {subject.subMaster?.status}
                        </button>
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleOpenEditDialog(subject)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{page * rowsPerPage + 1}</span> to{' '}
                  <span className="font-medium">{Math.min((page + 1) * rowsPerPage, totalCount)}</span> of{' '}
                  <span className="font-medium">{totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <select
                    value={rowsPerPage}
                    onChange={handleChangeRowsPerPage}
                    className="mr-4 px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {[5, 10, 25].map((size) => (
                      <option key={size} value={size}>
                        Show {size}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => setPage(p => Math.max(p - 1, 0))}
                    disabled={page === 0}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    &larr;
                  </button>
                  
                  {Array.from({ length: Math.ceil(totalCount / rowsPerPage) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === i
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setPage(p => Math.min(p + 1, Math.ceil(totalCount / rowsPerPage) - 1))}
                    disabled={page >= Math.ceil(totalCount / rowsPerPage) - 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    &rarr;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
        
        {/* Create/Edit Dialog */}
        {openDialog && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {isEditMode ? 'Edit Subject' : 'Create New Subject'}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject Master</label>
                    <select
                      name="subMasterId"
                      value={formData.subMasterId}
                      onChange={handleInputChange}
                      disabled={loadingSubjectMasters}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Subject Master</option>
                      {subjectMasters.map(subjectMaster => (
                        <option key={subjectMaster.id} value={subjectMaster.id}>
                          {subjectMaster.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                    <select
                      name="gradeId"
                      value={formData.gradeId}
                      onChange={handleInputChange}
                      disabled={loadingGrades}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Grade</option>
                      {grades.map(grade => (
                        <option key={grade.id} value={grade.id}>
                          {grade.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
                    <select
                      name="streamId"
                      value={formData.streamId}
                      onChange={handleInputChange}
                      disabled={loadingStreams}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Stream (Optional)</option>
                      {streams.map(stream => (
                        <option key={stream.id} value={stream.id}>
                          {stream.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                    <select
                      name="semesterId"
                      value={formData.semesterId}
                      onChange={handleInputChange}
                      disabled={loadingSemesters}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Semester (Optional)</option>
                      {semesters.map(semester => (
                        <option key={semester.id} value={semester.id}>
                          {semester.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                    <select
                      name="degreeId"
                      value={formData.degreeId}
                      onChange={handleInputChange}
                      disabled={loadingDegrees}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Degree (Optional)</option>
                      {degrees.map(degree => (
                        <option key={degree.id} value={degree.id}>
                          {degree.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                    <select
                      name="universityId"
                      value={formData.universityId}
                      onChange={handleInputChange}
                      disabled={loadingUniversities}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select University (Optional)</option>
                      {universities.map(university => (
                        <option key={university.id} value={university.id}>
                          {university.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={handleCloseDialog}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.subMasterId || !formData.gradeId || !formData.status}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEditMode ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Snackbar for notifications */}
        {snackbar.open && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
            snackbar.severity === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {snackbar.severity === 'success' ? (
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{snackbar.message}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={handleCloseSnackbar}
                  className="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectManagement;
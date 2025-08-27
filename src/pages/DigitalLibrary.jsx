import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useAuditLog } from "../context/AuditLogContext";
import { useSubjectContext } from "../context/SubjectContext";
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  Check,
  X
} from "lucide-react";

const DigitalLibraryManager = () => {
  const { user } = useAuth();
  const { addLog } = useAuditLog();
  const { subjectsByBoard } = useSubjectContext();
  
  // Boards that should show streams only for Higher Secondary level
  const STREAM_BOARDS = ["CBSE", "ISE", "WBCHSE"];
  
  // Refs for logging optimization
  const initialLoadLogged = useRef(false);
  const filterChangeTimeout = useRef(null);
  const prevFilters = useRef({});

  // State for level-based hierarchy
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  
  const [formData, setFormData] = useState({
    subject: "",
    resourceType: "",
    accessType: "Free",
    title: "",
    description: ""
  });
  
  const [file, setFile] = useState(null);
  const [uploadedResources, setUploadedResources] = useState([]);
  const [viewMode, setViewMode] = useState("pending");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    level: "",
    board: "",
    stream: "",
    class: "",
    subject: "",
    resourceType: ""
  });
  const [adminComment, setAdminComment] = useState("");

  // Determine user permissions
  const isSuperAdmin ="Super Admin";
  const isContentAdmin = user?.role === "Content Admin";
  const canUpload = isSuperAdmin || isContentAdmin;
  const canModerate = isSuperAdmin;

  // Check if we should show streams for the current selection
  const shouldShowStreams = () => {
    return (
      selectedFilters.level === "HIGHER_SECONDARY" && 
      STREAM_BOARDS.includes(selectedFilters.board)
    );
  };

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("uploadedResources");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUploadedResources(parsed);
      } catch (error) {
        console.error("Error parsing saved resources:", error);
      }
    }
  }, []);

  // Save to localStorage when resources change
  useEffect(() => {
    localStorage.setItem("uploadedResources", JSON.stringify(uploadedResources));
  }, [uploadedResources]);

  // Log initial load
  useEffect(() => {
    if (!initialLoadLogged.current && uploadedResources.length > 0) {
      addLog('LIBRARY_PAGE_LOADED', 'LIBRARY', {
        resourceCount: uploadedResources.length,
        pendingCount: uploadedResources.filter(r => r.status === "pending").length
      });
      initialLoadLogged.current = true;
    }
  }, [uploadedResources, addLog]);

  // Clean up timeouts
  useEffect(() => {
    return () => {
      clearTimeout(filterChangeTimeout.current);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...selectedFilters, [name]: value };
    
    // Reset dependent filters when higher-level filters change
    if (name === "level") {
      newFilters.board = "";
      newFilters.stream = "";
      newFilters.class = "";
      newFilters.subject = "";
    } else if (name === "board") {
      newFilters.stream = "";
      newFilters.class = "";
      newFilters.subject = "";
    } else if (name === "stream") {
      newFilters.class = "";
      newFilters.subject = "";
    } else if (name === "class") {
      newFilters.subject = "";
    }

    setSelectedFilters(newFilters);
    
    // Debounce the logging
    clearTimeout(filterChangeTimeout.current);
    filterChangeTimeout.current = setTimeout(() => {
      if (prevFilters.current[name] !== value) {
        addLog('LIBRARY_FILTER_CHANGED', 'LIBRARY', { 
          filter: name, 
          value,
          currentView: viewMode 
        });
        prevFilters.current = { ...prevFilters.current, [name]: value };
      }
    }, 300);
  };

  const handleUpload = (e) => {
    e.preventDefault();
    
    if (!file || !formData.title || !formData.description || !selectedClass || !formData.subject) {
      return alert("Please fill all required fields.");
    }

    const newResource = {
      id: Date.now(),
      ...formData,
      level: selectedLevel,
      board: selectedBoard,
      stream: shouldShowStreams() ? selectedStream : null,
      class: selectedClass,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      status: isSuperAdmin ? "approved" : "pending",
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.email || "unknown",
      approvedBy: isSuperAdmin ? user?.email : "",
      adminComment: ""
    };

    setUploadedResources(prev => [...prev, newResource]);
    addLog('RESOURCE_UPLOADED', 'LIBRARY', {
      resourceId: newResource.id,
      title: newResource.title,
      level: newResource.level,
      board: newResource.board,
      stream: newResource.stream,
      class: newResource.class,
      subject: newResource.subject,
      status: newResource.status
    });

    // Reset form
    setFormData({
      subject: "",
      resourceType: "",
      accessType: "Free",
      title: "",
      description: ""
    });
    setSelectedLevel("");
    setSelectedBoard("");
    setSelectedStream("");
    setSelectedClass("");
    setFile(null);
    setShowUploadForm(false);
  };

  const approveResource = (id) => {
    const resource = uploadedResources.find(r => r.id === id);
    const updated = uploadedResources.map(res => 
      res.id === id ? { 
        ...res, 
        status: "approved",
        approvedBy: user?.email,
        approvedAt: new Date().toISOString(),
        adminComment: adminComment 
      } : res
    );
    
    setUploadedResources(updated);
    addLog('RESOURCE_APPROVED', 'LIBRARY', {
      resourceId: id,
      title: resource.title,
      level: resource.level,
      board: resource.board,
      class: resource.class,
      subject: resource.subject
    });
    setAdminComment("");
  };

  const rejectResource = (id) => {
    const resource = uploadedResources.find(r => r.id === id);
    const updated = uploadedResources.map(res => 
      res.id === id ? { 
        ...res, 
        status: "rejected",
        rejectedBy: user?.email,
        rejectedAt: new Date().toISOString(),
        adminComment: adminComment 
      } : res
    );
    
    setUploadedResources(updated);
    addLog('RESOURCE_REJECTED', 'LIBRARY', {
      resourceId: id,
      title: resource.title,
      reason: adminComment || "No reason provided"
    });
    setAdminComment("");
  };

  // Get available values for filters
  const getUniqueValues = (key) => {
    if (key === "level") {
      return ["SECONDARY", "HIGHER_SECONDARY", "UNDERGRADUATE", "POSTGRADUATE"];
    }
    
    if (key === "board") {
      return Object.keys(subjectsByBoard || {});
    }
    if(key==="resourceType"){
      return ["eBook", "Reference Guide", "Assignment", "Video", "Slide"];
    }
    
    if (key === "stream") {
      if (!selectedFilters.board || !shouldShowStreams()) return [];
      const boardData = subjectsByBoard[selectedFilters.board];
      return boardData ? Object.keys(boardData) : [];
    }
    
    if (key === "class") {
      if (!selectedFilters.board) return [];
      const boardData = subjectsByBoard[selectedFilters.board];
      if (!boardData) return [];
      
      if (shouldShowStreams()) {
        if (!selectedFilters.stream) return [];
        const streamData = boardData[selectedFilters.stream];
        return streamData ? Object.keys(streamData) : [];
      } else {
        return Object.keys(boardData);
      }
    }
    
    if (key === "subject") {
      if (!selectedFilters.board) return [];
      const boardData = subjectsByBoard[selectedFilters.board];
      if (!boardData) return [];
      
      if (shouldShowStreams()) {
        if (!selectedFilters.stream || !selectedFilters.class) return [];
        const streamData = boardData[selectedFilters.stream];
        if (!streamData) return [];
        
        const classData = streamData[selectedFilters.class];
        return Array.isArray(classData) ? classData : [];
      } else {
        if (!selectedFilters.class) return [];
        const classData = boardData[selectedFilters.class];
        return Array.isArray(classData) ? classData : [];
      }
    }
    
    // For resourceType, get all unique values from uploaded resources
    return [...new Set(uploadedResources.map(res => res[key]))]
      .filter(Boolean)
      .sort();
  };

  const filteredResources = uploadedResources.filter((res) => {
    // Filter by view mode
    if (canModerate && viewMode !== "all" && res.status !== viewMode) return false;
    
    // For non-admins, only show approved resources
    if (!canModerate && res.status !== "approved") return false;
    
    // Apply filters only if they have a value
    if (selectedFilters.level && res.level !== selectedFilters.level) return false;
    if (selectedFilters.board && res.board !== selectedFilters.board) return false;
    if (selectedFilters.stream && res.stream !== selectedFilters.stream) return false;
    if (selectedFilters.class && res.class !== selectedFilters.class) return false;
    if (selectedFilters.subject && res.subject !== selectedFilters.subject) return false;
    if (selectedFilters.resourceType && res.resourceType !== selectedFilters.resourceType) return false;
    
    return true;
  });

  const StatusBadge = ({ status }) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case "approved":
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <CheckCircle2 className="mr-1 h-3 w-3" /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <XCircle className="mr-1 h-3 w-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            <Clock className="mr-1 h-3 w-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Digital Library</h2>

      {/* View Mode Tabs */}
      {canModerate && (
        <div className="flex border-b mb-6">
          {["all", "pending", "approved", "rejected"].map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setViewMode(mode);
                addLog('LIBRARY_VIEW_CHANGED', 'LIBRARY', { viewMode: mode });
              }}
              className={`py-2 px-4 font-medium capitalize ${
                viewMode === mode 
                  ? "border-b-2 border-blue-500 text-blue-600" 
                  : "text-gray-500"
              }`}
            >
              {mode === "all" ? "All Resources" : `${mode} Resources`}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
          <select
            name="level"
            value={selectedFilters.level}
            onChange={handleFilterChange}
            className="w-full p-2 border rounded text-sm"
          >
            <option value="">All Levels</option>
            <option value="SECONDARY">Secondary (9-10)</option>
            <option value="HIGHER_SECONDARY">Higher Secondary (11-12)</option>
            <option value="UNDERGRADUATE">Undergraduate</option>
            <option value="POSTGRADUATE">Postgraduate</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
          <select
            name="board"
            value={selectedFilters.board}
            onChange={handleFilterChange}
            className="w-full p-2 border rounded text-sm"
            disabled={!selectedFilters.level}
          >
            <option value="">All Boards</option>
            {getUniqueValues("board").map(board => (
              <option key={board} value={board}>{board}</option>
            ))}
          </select>
        </div>

        {/* Stream filter (only for higher secondary in specific boards) */}
        {shouldShowStreams() && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
            <select
              name="stream"
              value={selectedFilters.stream}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded text-sm"
              disabled={!selectedFilters.board}
            >
              <option value="">All Streams</option>
              {getUniqueValues("stream").map(stream => (
                <option key={stream} value={stream}>{stream}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {shouldShowStreams() ? "Class" : "Class/Year"}
          </label>
          <select
            name="class"
            value={selectedFilters.class}
            onChange={handleFilterChange}
            className="w-full p-2 border rounded text-sm"
            disabled={shouldShowStreams() ? !selectedFilters.stream : !selectedFilters.board}
          >
            <option value="">All Classes</option>
            {getUniqueValues("class").map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select
            name="subject"
            value={selectedFilters.subject}
            onChange={handleFilterChange}
            className="w-full p-2 border rounded text-sm"
            disabled={!selectedFilters.class}
          >
            <option value="">All Subjects</option>
            {getUniqueValues("subject").map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
          <select
            name="resourceType"
            value={selectedFilters.resourceType}
            onChange={handleFilterChange}
            className="w-full p-2 border rounded text-sm"
          >
            <option value="">All Types</option>
            {getUniqueValues("resourceType").map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload Section */}
      {canUpload && (
        <div className="mb-6">
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showUploadForm ? (
              <>
                <ChevronUp size={18} /> Hide Upload Form
              </>
            ) : (
              <>
                <Upload size={18} /> Upload Resource
              </>
            )}
          </button>

          {showUploadForm && (
            <form onSubmit={handleUpload} className="mt-4 p-4 border rounded-lg bg-white">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">
                  {isSuperAdmin ? "Publish Resource" : "Submit for Review"}
                </h3>
                {isContentAdmin && (
                  <p className="text-sm text-gray-600 mt-1">
                    Note: Your uploads will be reviewed by a Super Admin
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                {/* Level Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level*</label>
                  <select
                    name="level"
                    value={selectedLevel}
                    onChange={(e) => {
                      setSelectedLevel(e.target.value);
                      setSelectedBoard("");
                      setSelectedStream("");
                      setSelectedClass("");
                    }}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select Level</option>
                    <option value="SECONDARY">Secondary (9-10)</option>
                    <option value="HIGHER_SECONDARY">Higher Secondary (11-12)</option>
                    <option value="UNDERGRADUATE">Undergraduate</option>
                    <option value="POSTGRADUATE">Postgraduate</option>
                  </select>
                </div>

                {/* Board Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Board/University*</label>
                  <select
                    name="board"
                    value={selectedBoard}
                    onChange={(e) => {
                      setSelectedBoard(e.target.value);
                      setSelectedStream("");
                      setSelectedClass("");
                    }}
                    className="w-full p-2 border rounded"
                    disabled={!selectedLevel}
                    required
                  >
                    <option value="">Select Board</option>
                    {getUniqueValues("board").map(board => (
                      <option key={board} value={board}>{board}</option>
                    ))}
                  </select>
                </div>

                {/* Stream Selection (only for higher secondary in specific boards) */}
                {selectedLevel === "HIGHER_SECONDARY" && STREAM_BOARDS.includes(selectedBoard) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stream*</label>
                    <select
                      name="stream"
                      value={selectedStream}
                      onChange={(e) => {
                        setSelectedStream(e.target.value);
                        setSelectedClass("");
                      }}
                      className="w-full p-2 border rounded"
                      disabled={!selectedBoard}
                      required
                    >
                      <option value="">Select Stream</option>
                      {getUniqueValues("stream").map(stream => (
                        <option key={stream} value={stream}>{stream}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Class Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedLevel === "HIGHER_SECONDARY" && STREAM_BOARDS.includes(selectedBoard) 
                      ? "Class*" 
                      : "Class/Year*"}
                  </label>
                  <select
                    name="class"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full p-2 border rounded"
                    disabled={
                      selectedLevel === "HIGHER_SECONDARY" && STREAM_BOARDS.includes(selectedBoard) 
                        ? !selectedStream 
                        : !selectedBoard
                    }
                    required
                  >
                    <option value="">Select Class</option>
                    {selectedBoard && getUniqueValues("class").map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject*</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    disabled={!selectedClass}
                    required
                  >
                    <option value="">Select Subject</option>
                    {selectedClass && getUniqueValues("subject").map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type*</label>
                  <select
                    name="resourceType"
                    value={formData.resourceType}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="eBook">eBook</option>
                    <option value="Reference Guide">Reference Guide</option>
                    <option value="Assignment">Assignment</option>
                    <option value="Video">Video</option>
                    <option value="Slide">Slide</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access Type*</label>
                  <select
                    name="accessType"
                    value={formData.accessType}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="Free">Free</option>
                    <option value="Paid">Paid</option>
                    <option value="Download">Download</option>
                    <option value="View-only">View-only</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">File*</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col w-full border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 p-4">
                      <div className="flex flex-col items-center justify-center">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <p className="text-sm text-gray-500 mt-2">
                          {file ? file.name : "Click to upload or drag and drop"}
                        </p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => setFile(e.target.files[0])}
                        required
                      />
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                {isSuperAdmin ? "Publish Resource" : "Submit for Review"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Resources List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold capitalize">
            {viewMode === "all" ? "All Resources" : `${viewMode} Resources`}
          </h3>
          <p className="text-sm text-gray-500">
            Showing {filteredResources.length} resources
          </p>
        </div>
        
        {filteredResources.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-500">
              No resources found matching your filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredResources.map((res) => (
              <div key={res.id} className="border rounded-lg bg-white p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-lg">{res.title}</h4>
                    <p className="text-sm text-gray-600">{res.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Uploaded by: {res.uploadedBy}
                    </p>
                  </div>
                  <StatusBadge status={res.status} />
                </div>
                
                <div className="flex flex-wrap gap-1 my-2">
                  {res.level && (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      Level: {res.level}
                    </span>
                  )}
                  {res.board && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Board: {res.board}
                    </span>
                  )}
                  {res.stream && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      Stream: {res.stream}
                    </span>
                  )}
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Class: {res.class}
                  </span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Subject: {res.subject}
                  </span>
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                    Type: {res.resourceType}
                  </span>
                  <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded">
                    Access: {res.accessType}
                  </span>
                </div>

                {/* Moderation Section for Super Admin */}
                {isSuperAdmin && res.status === "pending" && (
                  <div className="mt-3 pt-3 border-t">
                    <textarea
                      placeholder="Add approval/rejection comment..."
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      className="w-full p-2 border rounded text-sm mb-2"
                      rows="2"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => rejectResource(res.id)}
                        className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
                      >
                        <X size={14} /> Reject
                      </button>
                      <button
                        onClick={() => approveResource(res.id)}
                        className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200"
                      >
                        <Check size={14} /> Approve
                      </button>
                    </div>
                  </div>
                )}

                {/* Admin comment if available */}
                {res.adminComment && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                    <p className="font-medium">Admin Note:</p>
                    <p>{res.adminComment}</p>
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {new Date(res.uploadedAt).toLocaleDateString()}
                  </span>
                  <a 
                    href={res.fileUrl} 
                    download
                    className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                  >
                    <Download size={14} /> Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalLibraryManager;
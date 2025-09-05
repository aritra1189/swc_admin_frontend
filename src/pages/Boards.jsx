// src/pages/AdminBoardManagement.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBoards,
  createBoard,
  updateBoard,
  updateBoardStatus,
  updateBoardIcon,
  fetchAllGrades,
  fetchConnectedGrades,
  connectGradesToBoard,
  removeGradeConnection,
  setName,
  setEditId,
  setImageFile,
  setImagePreview,
  setPagination,
  setSelectedBoard,
  setShowGradeModal,
  setSelectedGrades,
  resetForm,
  handleGradeSelection,
  clearSelectedGrades
} from "../store/Boardsslice";

export default function AdminBoardManagement() {
  const dispatch = useDispatch();
  const {
    boards,
    name,
    editId,
    loading,
    imageFile,
    imagePreview,
    pagination,
    selectedBoard,
    grades,
    connectedGrades,
    showGradeModal,
    selectedGrades,
    loadingGrades,
    loadingConnections
  } = useSelector((state) => state.boards);

  useEffect(() => {
    dispatch(fetchBoards(pagination));
  }, [dispatch, pagination.offset, pagination.status]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      dispatch(setImageFile(file));
      dispatch(setImagePreview(URL.createObjectURL(file)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning("Please enter a board name");
      return;
    }

    try {
      if (editId) {
        await dispatch(updateBoard({ id: editId, name })).unwrap();
        if (imageFile) {
          await dispatch(updateBoardIcon({ id: editId, imageFile })).unwrap();
        }
      } else {
        const newBoard = await dispatch(createBoard(name)).unwrap();
        if (imageFile) {
          await dispatch(updateBoardIcon({ id: newBoard.id, imageFile })).unwrap();
        }
      }
      
      dispatch(resetForm());
      dispatch(fetchBoards(pagination));
    } catch (error) {
      console.error("Operation failed:", error);
    }
  };

  const handleEdit = (board) => {
    dispatch(setName(board.name));
    dispatch(setEditId(board.id));
    dispatch(setImagePreview(board.icon || null));
  };

  const handleStatusToggle = async (id, currentStatus) => {
    await dispatch(updateBoardStatus({ id, currentStatus })).unwrap();
    dispatch(fetchBoards(pagination));
  };

  const handlePageChange = (newOffset) => {
    dispatch(setPagination({ ...pagination, offset: newOffset }));
  };

  const handleStatusFilter = (status) => {
    dispatch(setPagination({ ...pagination, status, offset: 0 }));
  };

  const handleOpenGradeModal = async (board) => {
    dispatch(setSelectedBoard(board));
    await dispatch(fetchAllGrades()).unwrap();
    await dispatch(fetchConnectedGrades(board.id)).unwrap();
    dispatch(setShowGradeModal(true));
  };

  const handleConnectGrades = async () => {
    if (selectedGrades.length === 0) {
      toast.warning("Please select at least one grade");
      return;
    }
    await dispatch(connectGradesToBoard({ 
      boardId: selectedBoard.id, 
      gradeIds: selectedGrades 
    })).unwrap();
    dispatch(clearSelectedGrades());
    dispatch(fetchConnectedGrades(selectedBoard.id));
  };

  const handleRemoveConnection = async (connectionId) => {
    await dispatch(removeGradeConnection({ 
      connectionId, 
      boardId: selectedBoard.id 
    })).unwrap();
    dispatch(fetchConnectedGrades(selectedBoard.id));
  };

  const handleCloseModal = () => {
    dispatch(setShowGradeModal(false));
    dispatch(setSelectedBoard(null));
    dispatch(clearSelectedGrades());
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Board Management</h1>

      {/* Board Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editId ? "Edit Board" : "Create New Board"}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Board Name*</label>
              <input
                type="text"
                value={name}
                onChange={(e) => dispatch(setName(e.target.value))}
                className="w-full border border-gray-300 rounded p-2"
                required
              />
            </div>
          </div>
          
          <div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Board Icon</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full border border-gray-300 rounded p-2"
              />
            </div>
            
            {imagePreview && (
              <div className="mt-4">
                <h3 className="text-gray-700 mb-2">Icon Preview</h3>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-full h-auto max-h-32 rounded border border-gray-300"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-4">
          {editId && (
            <button
              type="button"
              onClick={() => dispatch(resetForm())}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            {editId ? "Update Board" : "Create Board"}
          </button>
        </div>
      </form>

      {/* Status Filter */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => handleStatusFilter("ACTIVE")}
          className={`px-4 py-2 rounded ${
            pagination.status === "ACTIVE" 
              ? "bg-green-500 text-white" 
              : "bg-gray-200"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => handleStatusFilter("PENDING")}
          className={`px-4 py-2 rounded ${
            pagination.status === "PENDING" 
              ? "bg-yellow-500 text-white" 
              : "bg-gray-200"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => handleStatusFilter("DEACTIVE")}
          className={`px-4 py-2 rounded ${
            pagination.status === "DEACTIVE" 
              ? "bg-red-500 text-white" 
              : "bg-gray-200"
          }`}
        >
          Deactive
        </button>
      </div>

      {/* Boards Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Boards List</h2>
        
        {loading ? (
          <div className="text-center py-8">Loading boards...</div>
        ) : boards.length === 0 ? (
          <div className="text-center py-8">No boards found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {boards.map((board, index) => (
                    <tr key={board.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{pagination.offset + index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{board.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {board.icon ? (
                          <img
                            src={board.icon}
                            alt={board.name}
                            className="h-12 w-12 rounded object-cover"
                            onError={(e) => {
                              e.target.onerror = null; 
                              e.target.src = "https://via.placeholder.com/48?text=No+Icon";
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-500">No Icon</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                            board.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : board.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                          onClick={() => handleStatusToggle(board.id, board.status)}
                        >
                          {board.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap space-x-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleEdit(board)}
                            className="flex items-center px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 hover:bg-yellow-100 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>

                          <button
                            onClick={() => handleOpenGradeModal(board)}
                            className="flex items-center px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                            </svg>
                            Connect Grades
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <div>
                Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} boards
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                  disabled={pagination.offset === 0}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                  disabled={pagination.offset + pagination.limit >= pagination.total}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Grade Connection Modal */}
      {showGradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Manage Grades for Board: {selectedBoard?.name}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {/* Connected Grades */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Connected Grades</h3>
                {loadingConnections ? (
                  <div className="text-center py-4">Loading connections...</div>
                ) : connectedGrades.length === 0 ? (
                  <p className="text-gray-500">No grades connected to this board</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {connectedGrades.map((connection) => (
                      <div key={connection.id} className="border rounded p-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <span>{connection.grade?.name}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveConnection(connection.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Grades */}
              <div>
                <h3 className="text-lg font-medium mb-2">Available Grades</h3>
                {loadingGrades ? (
                  <div className="text-center py-4">Loading grades...</div>
                ) : grades.length === 0 ? (
                  <p className="text-gray-500">No available grades</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 max-h-60 overflow-y-auto">
                      {grades
                        .filter(grade => !connectedGrades.some(cg => cg.grade.id === grade.id))
                        .map(grade => (
                          <div key={grade.id} className="border rounded p-3 flex items-center">
                            <input
                              type="checkbox"
                              id={`grade-${grade.id}`}
                              checked={selectedGrades.includes(grade.id)}
                              onChange={() => dispatch(handleGradeSelection(grade.id))}
                              className="mr-2"
                            />
                            <label htmlFor={`grade-${grade.id}`} className="flex items-center cursor-pointer">
                              <span>{grade.name}</span>
                            </label>
                          </div>
                        ))}
                    </div>
                    <button
                      onClick={handleConnectGrades}
                      disabled={selectedGrades.length === 0}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Connect Selected Grades
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
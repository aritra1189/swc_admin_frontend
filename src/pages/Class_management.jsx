// src/pages/AdminLevelManagement.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchLevels,
  createLevel,
  updateLevel,
  updateLevelStatus,
  updateLevelImage,
  deleteLevel,
  fetchAllBoards,
  fetchAllDegrees,
  fetchConnectedBoards,
  fetchConnectedDegrees,
  connectBoardsToLevel,
  connectDegreesToLevel,
  removeBoardConnection,
  removeDegreeConnection,
  setName,
  setEditId,
  setImageFile,
  setImagePreview,
  setStatusFilter,
  setSelectedLevel,
  setShowConnectionModal,
  setConnectionType,
  setSelectedConnections,
  resetForm,
  addToSelectedConnections,
  removeFromSelectedConnections,
  clearSelectedConnections
} from "../store/levelSlice";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminLevelManagement() {
  const dispatch = useDispatch();
  const {
    levels,
    loading,
    name,
    editId,
    imageFile,
    imagePreview,
    statusFilter,
    selectedLevel,
    boards,
    degrees,
    connectedBoards,
    connectedDegrees,
    showConnectionModal,
    connectionType,
    selectedConnections,
    loadingConnections,
    loadingItems
  } = useSelector(state => state.levels);

  useEffect(() => {
    dispatch(fetchLevels(statusFilter));
  }, [dispatch, statusFilter]);

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
      toast.warning("Please enter a level name");
      return;
    }

    try {
      if (editId) {
        await dispatch(updateLevel({ id: editId, name })).unwrap();
        if (imageFile) {
          await dispatch(updateLevelImage({ id: editId, imageFile })).unwrap();
        }
        dispatch(resetForm());
      } else {
        const newLevel = await dispatch(createLevel(name)).unwrap();
        if (imageFile) {
          await dispatch(updateLevelImage({ id: newLevel.id, imageFile })).unwrap();
        }
        dispatch(resetForm());
      }

      dispatch(fetchLevels(statusFilter));
    } catch (error) {
      console.error("Operation failed:", error);
    }
  };

  const handleEdit = (level) => {
    dispatch(setName(level.name));
    dispatch(setEditId(level.id));
    dispatch(setImagePreview(level.image || null));
  };

  const handleStatusToggle = async (id, currentStatus) => {
    await dispatch(updateLevelStatus({ id, currentStatus })).unwrap();
    dispatch(fetchLevels(statusFilter));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this level?")) return;

    try {
      await dispatch(deleteLevel(id)).unwrap();
      dispatch(fetchLevels(statusFilter));
    } catch (error) {
      console.error("Failed to delete level:", error);
    }
  };

  const handleOpenConnectionModal = async (level, type) => {
    dispatch(setSelectedLevel(level));
    dispatch(setConnectionType(type));
    dispatch(clearSelectedConnections());
    
    if (type === "board") {
      await dispatch(fetchAllBoards()).unwrap();
      await dispatch(fetchConnectedBoards(level.id)).unwrap();
    } else {
      await dispatch(fetchAllDegrees()).unwrap();
      await dispatch(fetchConnectedDegrees(level.id)).unwrap();
    }
    
    dispatch(setShowConnectionModal(true));
  };

  const handleConnectionSelection = (id) => {
    if (selectedConnections.includes(id)) {
      dispatch(removeFromSelectedConnections(id));
    } else {
      dispatch(addToSelectedConnections(id));
    }
  };

  const handleConnectItems = async () => {
    if (selectedConnections.length === 0) {
      toast.warning(`Please select at least one ${connectionType}`);
      return;
    }

    if (connectionType === "board") {
      await dispatch(connectBoardsToLevel({
        levelId: selectedLevel.id,
        boardIds: selectedConnections
      })).unwrap();
      dispatch(fetchConnectedBoards(selectedLevel.id));
    } else {
      await dispatch(connectDegreesToLevel({
        levelId: selectedLevel.id,
        degreeIds: selectedConnections
      })).unwrap();
      dispatch(fetchConnectedDegrees(selectedLevel.id));
    }
    
    dispatch(clearSelectedConnections());
  };

  const handleCloseModal = () => {
    dispatch(setShowConnectionModal(false));
    dispatch(setSelectedLevel(null));
    dispatch(clearSelectedConnections());
  };

  const handleRemoveConnection = async (connectionId, type) => {
    if (type === "board") {
      await dispatch(removeBoardConnection({
        connectionId,
        levelId: selectedLevel.id
      })).unwrap();
    } else {
      await dispatch(removeDegreeConnection({
        connectionId,
        levelId: selectedLevel.id
      })).unwrap();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Level Management</h1>

      {/* Filter */}
      <div className="mb-4 flex items-center space-x-4">
        <label className="font-medium">Status Filter:</label>
        <select
          value={statusFilter}
          onChange={(e) => dispatch(setStatusFilter(e.target.value))}
          className="border border-gray-300 rounded px-3 py-1"
        >
          <option value="ACTIVE">Active</option>
          <option value="DEACTIVE">Deactive</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      {/* Level Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editId ? "Edit Level" : "Create New Level"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Level Name*</label>
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
              <label className="block text-gray-700 mb-2">Level Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full border border-gray-300 rounded p-2"
              />
            </div>

            {imagePreview && (
              <div className="mt-4">
                <h3 className="text-gray-700 mb-2">Image Preview</h3>
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
            {editId ? "Update Level" : "Create Level"}
          </button>
        </div>
      </form>

      {/* Levels Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Levels List</h2>

        {loading ? (
          <div className="text-center py-8">Loading levels...</div>
        ) : levels.length === 0 ? (
          <div className="text-center py-8">No levels found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {levels.map((level, index) => (
                  <tr key={level.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{level.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {level.image && (
                        <img
                          src={level.image}
                          alt={level.name}
                          className="h-12 w-12 rounded object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/48?text=No+Image";
                          }}
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                          level.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                        onClick={() => handleStatusToggle(level.id, level.status)}
                      >
                        {level.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleEdit(level)}
                          className="flex items-center px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 hover:bg-yellow-100 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>

                        <button
                          onClick={() => handleOpenConnectionModal(level, "board")}
                          className="flex items-center px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                          </svg>
                          Connect Boards
                        </button>
                        <button
                          onClick={() => handleOpenConnectionModal(level, "degree")}
                          className="flex items-center px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-md text-purple-700 hover:bg-purple-100 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Connect Degrees
                        </button>
                        
                        {/* <button
                          onClick={() => handleDelete(level.id)}
                          className="flex items-center px-3 py-1.5 bg-red-50 border border-red-200 rounded-md text-red-700 hover:bg-red-100 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Connection Modal */}
      {showConnectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Manage {connectionType === "board" ? "Boards" : "Degrees"} for Level: {selectedLevel?.name}
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

              {/* Connected Items */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">
                  Connected {connectionType === "board" ? "Boards" : "Degrees"}
                </h3>
                {loadingConnections ? (
                  <div className="text-center py-4">Loading connections...</div>
                ) : (connectionType === "board" ? connectedBoards : connectedDegrees).length === 0 ? (
                  <p className="text-gray-500">
                    No {connectionType === "board" ? "boards" : "degrees"} connected to this level
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(connectionType === "board" ? connectedBoards : connectedDegrees).map((connection) => (
                      <div key={connection.id} className="border rounded p-3 flex justify-between items-center">
                        <div className="flex items-center">
                          {connectionType === "board" && connection.board?.icon && (
                            <img
                              src={connection.board.icon}
                              alt={connection.board.name}
                              className="w-8 h-8 rounded mr-2"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/32?text=No+Icon";
                              }}
                            />
                          )}
                          <span>{connectionType === "board" ? connection.board?.name : connection.degree?.name}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveConnection(connection.id, connectionType)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Items */}
              <div>
                <h3 className="text-lg font-medium mb-2">
                  Available {connectionType === "board" ? "Boards" : "Degrees"}
                </h3>
                {loadingItems ? (
                  <div className="text-center py-4">Loading {connectionType === "board" ? "boards" : "degrees"}...</div>
                ) : (connectionType === "board" ? boards : degrees).length === 0 ? (
                  <p className="text-gray-500">
                    No available {connectionType === "board" ? "boards" : "degrees"}
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 max-h-60 overflow-y-auto">
                      {(connectionType === "board" ? boards : degrees)
                        .filter(item => 
                          !(connectionType === "board" ? connectedBoards : connectedDegrees)
                            .some(conn => conn[connectionType]?.id === item.id)
                        )
                        .map(item => (
                          <div key={item.id} className="border rounded p-3 flex items-center">
                            <input
                              type="checkbox"
                              id={`${connectionType}-${item.id}`}
                              checked={selectedConnections.includes(item.id)}
                              onChange={() => handleConnectionSelection(item.id)}
                              className="mr-2"
                            />
                            <label 
                              htmlFor={`${connectionType}-${item.id}`} 
                              className="flex items-center cursor-pointer"
                            >
                              {connectionType === "board" && item.icon && (
                                <img
                                  src={item.icon}
                                  alt={item.name}
                                  className="w-8 h-8 rounded mr-2"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://via.placeholder.com/32?text=No+Icon";
                                  }}
                                />
                              )}
                              <span>{item.name}</span>
                            </label>
                          </div>
                        ))}
                    </div>
                    <button
                      onClick={handleConnectItems}
                      disabled={selectedConnections.length === 0}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Connect Selected {connectionType === "board" ? "Boards" : "Degrees"}
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
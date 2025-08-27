import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useAuditLog } from "../context/AuditLogcontext";
import { API_BASE_URL } from "../config/api";
import {
  PlusCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

// Assuming you have this icon for active notices
const CheckCircleIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5 text-green-500"
  >
    <path
      fillRule="evenodd"
      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
      clipRule="evenodd"
    />
  </svg>
);

// Assuming you have this icon for deactive notices
const PauseCircleIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5 text-yellow-500"
  >
    <path
      fillRule="evenodd"
      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm6-2.25a.75.75 0 0 0-.75.75v6.75c0 .414.336.75.75.75H9.75a.75.75 0 0 0 .75-.75V10.5a.75.75 0 0 0-.75-.75H8.25Zm5.25 0a.75.75 0 0 0-.75.75v6.75c0 .414.336.75.75.75H15.75a.75.75 0 0 0 .75-.75V10.5a.75.75 0 0 0-.75-.75H13.5Z"
      clipRule="evenodd"
    />
  </svg>
);

const NoticeCard = ({
  notice,
  editingNoticeId,
  setEditingNoticeId,
  handleFileChange,
  handleUpdateNotice,
  handleToggleStatus,
  handleDelete,
  isActive,
}) => {
  return (
    <div
      className={`relative p-6 bg-white rounded-xl shadow-md transition-shadow duration-200 ease-in-out hover:shadow-lg flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-6
        ${!isActive && "opacity-70 bg-gray-100"}`}
    >
      <div className="flex items-center space-x-4 flex-grow">
        {notice.image && (
          <img
            src={notice.image}
            alt="Notice"
            className={`w-20 h-20 object-cover rounded-lg border-2 border-gray-200 shadow-sm
              ${!isActive && "grayscale"}`}
          />
        )}
        <div className="flex-grow">
          <h4 className="font-semibold text-lg text-gray-800 truncate max-w-xs sm:max-w-md">
            {notice.imagePath.split("/").pop()}
          </h4>
          <p className="mt-1 text-sm text-gray-600 flex items-center gap-1">
            Status:
            <span
              className={`font-medium ${isActive ? "text-green-600" : "text-yellow-600"}`}
            >
              {isActive ? "Active" : "Deactive"}
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Created At: {new Date(notice.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center md:justify-end gap-2">
        <a
          href={notice.image}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-blue-600 hover:text-white bg-blue-100 hover:bg-blue-600 rounded-full transition-colors duration-200"
          title="View Notice"
        >
          <EyeIcon className="w-5 h-5" />
        </a>
        <button
          onClick={() => handleToggleStatus(notice.id, notice.status)}
          className="p-2 text-yellow-600 hover:text-white bg-yellow-100 hover:bg-yellow-600 rounded-full transition-colors duration-200"
          title="Toggle Status"
        >
          <ArrowPathIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => setEditingNoticeId(notice.id)}
          className="p-2 text-indigo-600 hover:text-white bg-indigo-100 hover:bg-indigo-600 rounded-full transition-colors duration-200"
          title="Update Notice"
        >
          <PencilIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleDelete(notice.id)}
          className="p-2 text-red-600 hover:text-white bg-red-100 hover:bg-red-600 rounded-full transition-colors duration-200"
          title="Delete Notice"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>

      {editingNoticeId === notice.id && (
        <div className="mt-4 pt-4 border-t border-gray-200 w-full">
          <form
            onSubmit={(e) => handleUpdateNotice(e, notice.id)}
            className="flex flex-col sm:flex-row gap-4 items-end"
          >
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Notice File
              </label>
              <input
                type="file"
                name="file"
                accept=".png,.jpeg,.jpg"
                onChange={handleFileChange}
                required
                className="block w-full text-sm text-gray-600
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:font-semibold
                         file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="submit"
                className="flex-grow sm:flex-grow-0 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingNoticeId(null)}
                className="flex-grow sm:flex-grow-0 px-4 py-2 text-sm font-medium bg-gray-400 text-white rounded-full hover:bg-gray-500 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const NoticeBoardManager = () => {
  const { user } = useAuth();
  const { addLog } = useAuditLog();

  const [activeNotices, setActiveNotices] = useState([]);
  const [deactiveNotices, setDeactiveNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [editingNoticeId, setEditingNoticeId] = useState(null);

  useEffect(() => {
    fetchNotices();
  }, [user]);

  const fetchNotices = async () => {
    if (!user || !user.token) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const headers = {
        Authorization: `Bearer ${user.token}`,
      };

      const [activeResponse, deactiveResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/notice/list`, {
          params: { status: "ACTIVE", limit: 10, offset: 0 },
          headers,
        }),
        axios.get(`${API_BASE_URL}/notice/list`, {
          params: { status: "PENDING", limit: 10, offset: 0 },
          headers,
        }),
      ]);

      setActiveNotices(activeResponse.data.result);
      setDeactiveNotices(deactiveResponse.data.result);
      setLoading(false);

      addLog("NOTICES_FETCHED", "NOTICE_BOARD", {
        activeCount: activeResponse.data.result.length,
        deactiveCount: deactiveResponse.data.result.length,
      });
    } catch (err) {
      console.error("Failed to fetch notices:", err);
      setError("Failed to load notices. Please check your network and try again.");
      setLoading(false);
      addLog("NOTICE_FETCH_ERROR", "NOTICE_BOARD", { error: err.message });
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API_BASE_URL}/notice`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.token}`,
        },
      });

      addLog("NOTICE_CREATED", "NOTICE_BOARD", { fileName: file.name });
      setFile(null);
      e.target.reset();
      fetchNotices();
    } catch (err) {
      console.error("Failed to create notice:", err);
      addLog("NOTICE_CREATION_ERROR", "NOTICE_BOARD", {
        error: err.message,
        fileName: file.name,
      });
      alert("Failed to create notice. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this notice?")) {
      try {
        await axios.put(
          `${API_BASE_URL}/notice/status/${id}`,
          { status: "DELETED" },
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        addLog("NOTICE_DELETED", "NOTICE_BOARD", { noticeId: id });
        fetchNotices();
      } catch (err) {
        console.error("Failed to delete notice:", err);
        addLog("NOTICE_DELETION_ERROR", "NOTICE_BOARD", {
          noticeId: id,
          error: err.message,
        });
        alert("Failed to delete notice. Please try again.");
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "DEACTIVE" : "ACTIVE";
    try {
      await axios.put(
        `${API_BASE_URL}/notice/status/${id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      addLog("NOTICE_STATUS_UPDATED", "NOTICE_BOARD", {
        noticeId: id,
        newStatus: newStatus,
      });
      fetchNotices();
    } catch (err) {
      console.error("Failed to update status:", err);
      addLog("NOTICE_STATUS_UPDATE_ERROR", "NOTICE_BOARD", {
        noticeId: id,
        error: err.message,
      });
      alert("Failed to update notice status.");
    }
  };

  const handleUpdateNotice = async (e, id) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file to update the notice.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.put(`${API_BASE_URL}/notice/update/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.token}`,
        },
      });

      addLog("NOTICE_UPDATED", "NOTICE_BOARD", {
        noticeId: id,
        fileName: file.name,
      });
      setFile(null);
      setEditingNoticeId(null);
      fetchNotices();
    } catch (err) {
      console.error("Failed to update notice:", err);
      addLog("NOTICE_UPDATE_ERROR", "NOTICE_BOARD", {
        noticeId: id,
        error: err.message,
      });
      alert("Failed to update notice. Please try again.");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-600 font-medium animate-pulse">
          Loading notices...
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      </div>
    );

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen font-sans antialiased">
      <div className="max-w-4xl mx-auto w-full space-y-10">
        

        {/* Create New Notice Section */}
        <section className="bg-white shadow-xl rounded-2xl p-6 sm:p-8">
          <div className="flex items-center max-h-40 justify-between mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <PlusCircleIcon className="w-7 h-7 text-green-600" />
              Upload New Notice
            </h2>
          </div>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
          >
            <div>
              <label
                htmlFor="file-upload"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Upload Notice Image (PNG, JPEG, JPG)
              </label>
              <input
                id="file-upload"
                type="file"
                name="file"
                accept=".png,.jpeg,.jpg"
                onChange={handleFileChange}
                required
                className="block w-full text-sm text-gray-600
                         file:mr-4 file:py-2.5 file:px-6
                         file:rounded-full file:border-0
                         file:font-semibold
                         file:bg-indigo-50 file:text-indigo-700
                         hover:file:bg-indigo-100 transition-colors duration-200 cursor-pointer"
              />
            </div>
            <div className="md:col-span-1 flex justify-end">
              <button
                type="submit"
                className="w-full md:w-auto px-8 py-3 text-lg text-white bg-green-600 rounded-full font-bold
                           hover:bg-green-700 focus:outline-none focus:ring-4
                           focus:ring-green-500/50 transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                Add Notice
              </button>
            </div>
          </form>
        </section>

        {/* Active Notices Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <CheckCircleIcon className="w-6 h-6 text-green-500" />
              Active Notices
            </h3>
          </div>
          <div className="grid gap-6 max-h-40 overflow-y-auto pr-2">
            {activeNotices.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No active notices available.
              </p>
            ) : (
              activeNotices.map((notice) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  editingNoticeId={editingNoticeId}
                  setEditingNoticeId={setEditingNoticeId}
                  handleFileChange={handleFileChange}
                  handleUpdateNotice={handleUpdateNotice}
                  handleToggleStatus={handleToggleStatus}
                  handleDelete={handleDelete}
                  isActive={true}
                />
              ))
            )}
          </div>
        </section>

        {/* Deactive Notices Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <PauseCircleIcon className="w-6 h-6 text-yellow-500" />
              Deactive Notices
            </h3>
          </div>
          <div className="grid gap-6 max-h-40 overflow-y-auto pr-2">
            {deactiveNotices.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No deactive notices available.
              </p>
            ) : (
              deactiveNotices.map((notice) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  editingNoticeId={editingNoticeId}
                  setEditingNoticeId={setEditingNoticeId}
                  handleFileChange={handleFileChange}
                  handleUpdateNotice={handleUpdateNotice}
                  handleToggleStatus={handleToggleStatus}
                  handleDelete={handleDelete}
                  isActive={false}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default NoticeBoardManager;
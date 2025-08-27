import React, { useEffect, useState } from "react";
import { api } from "../config/axios";

export default function ContactUsAdmin() {
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const fetchContacts = async () => {
    try {
      const res = await api.get("/contact-us/all", {
        params: { keyword, limit, offset },
      });
      setContacts(res.data.result || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error("Failed to fetch contacts", error);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [keyword, limit, offset]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Contact Us Messages</h2>

      {/* Search */}
      <input
        type="text"
        placeholder="Search..."
        className="border p-2 rounded mb-4 w-full"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      {/* Table */}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Mobile</th>
            <th className="border p-2">Query</th>
            <th className="border p-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="border p-2">{item.account?.userDetail?.name}</td>
              <td className="border p-2">{item.account?.email}</td>
              <td className="border p-2">{item.account?.userDetail?.mobileNumber}</td>
              <td className="border p-2">{item.query}</td>
              <td className="border p-2">
                {new Date(item.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
          {contacts.length === 0 && (
            <tr>
              <td colSpan="5" className="p-4 text-center">
                No contact messages found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(offset - limit, 0))}
          className="bg-gray-300 px-3 py-1 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Showing {offset + 1} - {Math.min(offset + limit, total)} of {total}
        </span>
        <button
          disabled={offset + limit >= total}
          onClick={() => setOffset(offset + limit)}
          className="bg-gray-300 px-3 py-1 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

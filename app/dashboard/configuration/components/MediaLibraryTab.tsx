"use client";

import { useState, useEffect } from "react";

export default function MediaLibraryTab() {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [wabaNumberInput, setWabaNumberInput] = useState("All");

  const fetchMedia = async () => {
    try {
      const userId = localStorage.getItem("userId") || "";
      const res = await fetch(`/api/media?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setMediaList(data.media || []);
      }
    } catch (err) {
      console.error("Failed to fetch media:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("userId", localStorage.getItem("userId") || "emergency_admin_id");
    formData.append("wabaNumber", wabaNumberInput);

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Media uploaded successfully!");
        setShowUploadModal(false);
        setSelectedFile(null);
        fetchMedia();
      } else {
        alert(`❌ Upload failed: ${data.error}`);
      }
    } catch (err) {
      alert("❌ Network error during upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media?")) return;
    try {
      const res = await fetch(`/api/media?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMediaList((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert("Failed to delete media.");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="w-full space-y-4 text-xs font-sans">
      {/* Top Header & Add Media Button */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border shadow-xs">
        <div>
          <div className="text-gray-400 font-medium">Home › Configuration › Media Library</div>
          <h1 className="text-lg font-bold text-gray-800">Media Library</h1>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-md cursor-pointer flex items-center space-x-1"
        >
          <span>+ Add Media</span>
        </button>
      </div>

      {/* Meta Retention Policy Banner */}
      <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-xl flex items-center space-x-2 text-[11px]">
        <span>ℹ️</span>
        <span>
          As per Meta WhatsApp media retention policies, only media files from the last 30 days are available in the Media Library. Older media is automatically deleted. If required, please re-upload the media.
        </span>
      </div>

      {/* Media Table */}
      <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 font-bold text-[11px]">
              <th className="p-3.5">MEDIA</th>
              <th className="p-3.5">URL</th>
              <th className="p-3.5">WABA NUMBER</th>
              <th className="p-3.5">EXPIRES IN</th>
              <th className="p-3.5 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">Loading media library...</td>
              </tr>
            ) : mediaList.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400 font-medium">
                  No media files found. Click "+ Add Media" to upload your first file.
                </td>
              </tr>
            ) : (
              mediaList.map((item) => {
                const expiryDate = new Date(item.expiresAt);
                const diffTime = expiryDate.getTime() - new Date().getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isExpired = diffDays <= 0;

                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-3.5 flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 border overflow-hidden flex items-center justify-center shrink-0">
                        {item.fileType === "image" ? (
                          <img src={item.url} alt={item.mediaName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-gray-500 uppercase">{item.fileType || "doc"}</span>
                        )}
                      </div>
                      <span className="font-semibold text-gray-800 truncate max-w-xs">{item.mediaName}</span>
                    </td>
                    <td className="p-3.5 font-mono text-blue-600 truncate max-w-xs">
                      <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline">
                        🔗 {item.url}
                      </a>
                    </td>
                    <td className="p-3.5 font-mono text-gray-600">{item.wabaNumber}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          isExpired
                            ? "bg-red-100 text-red-700 border border-red-300"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        }`}
                      >
                        {isExpired ? "Expired" : `${diffDays} days left`}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(item.url);
                          alert("URL copied to clipboard!");
                        }}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 cursor-pointer"
                        title="Copy URL"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 cursor-pointer"
                        title="Delete Media"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Media Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-sm">Upload Media File</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 font-bold px-2 py-1 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block font-bold text-gray-700 text-xs mb-1">ASSOCIATED WABA NUMBER *</label>
                <input
                  type="text"
                  value={wabaNumberInput}
                  onChange={(e) => setWabaNumberInput(e.target.value)}
                  placeholder="Enter WABA number or All..."
                  className="w-full border rounded-xl p-2.5 bg-gray-50 text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 text-xs mb-1">SELECT FILE (IMAGE / VIDEO / PDF) *</label>
                <input
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {uploading ? "⏳ Uploading..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect, useMemo } from "react";

export default function MediaLibraryTab() {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredMedia = useMemo(() => {
    if (!searchQuery.trim()) return mediaList;
    return mediaList.filter(
      (m) =>
        m.mediaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.wabaNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [mediaList, searchQuery]);

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
        setWabaNumberInput("All");
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl border shadow-xs gap-3">
        <div>
          <div className="text-gray-400 font-medium">Home › Configuration › Media Library</div>
          <h1 className="text-xl font-bold text-gray-800">Media Library</h1>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5 transition"
        >
          <span>+ Add Media</span>
        </button>
      </div>

      {/* Meta Retention Policy Notice Banner */}
      <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3.5 rounded-xl flex items-center space-x-3 text-[11px] leading-relaxed shadow-xs">
        <span className="text-base">ℹ️</span>
        <span>
          As per Meta WhatsApp media retention policies, only media files from the last 30 days are available in the Media Library[cite: 8]. Older media is automatically deleted[cite: 8]. If required, please re-upload the media[cite: 8].
        </span>
      </div>

      {/* Filter Records Bar */}
      <div className="bg-white p-4 rounded-2xl border shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-2 w-full max-w-sm">
          <span className="text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Filter Records by name or WABA number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border rounded-xl p-2 bg-gray-50 text-xs focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
          />
        </div>
        <div className="text-gray-500 font-bold text-[11px]">
          Total: {filteredMedia.length} record(s)
        </div>
      </div>

      {/* Media Table */}
      <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 font-bold text-[11px]">
              <th className="p-4">MEDIA</th>
              <th className="p-4">URL</th>
              <th className="p-4">WADANUMBER</th>
              <th className="p-4">EXPIRES IN</th>
              <th className="p-4 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400 font-medium">
                  Loading media library...
                </td>
              </tr>
            ) : filteredMedia.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-400 font-medium">
                  No media files found. Click "+ Add Media" to upload your first file.
                </td>
              </tr>
            ) : (
              filteredMedia.map((item) => {
                const expiryDate = new Date(item.expiresAt);
                const diffTime = expiryDate.getTime() - new Date().getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isExpired = diffDays <= 0;

                return (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition">
                    <td className="p-4 flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 border overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                        {item.fileType === "image" ? (
                          <img src={item.url} alt={item.mediaName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-gray-500 uppercase">{item.fileType || "doc"}</span>
                        )}
                      </div>
                      <span className="font-bold text-gray-800 truncate max-w-xs">{item.mediaName}</span>
                    </td>
                    <td className="p-4 font-mono text-blue-600 truncate max-w-xs">
                      <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline flex items-center space-x-1">
                        <span>🔗 File URL</span>
                      </a>
                    </td>
                    <td className="p-4 font-mono font-semibold text-gray-600">{item.wabaNumber}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full font-bold text-[10px] inline-block ${
                          isExpired
                            ? "bg-red-100 text-red-700 border border-red-300"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        }`}
                      >
                        {isExpired ? "Expired" : `${diffDays} days left`}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(item.url);
                          alert("🔗 URL copied to clipboard!");
                        }}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 cursor-pointer transition shadow-xs"
                        title="Copy URL"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 cursor-pointer transition shadow-xs"
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
        
        {/* Footer pagination info */}
        <div className="p-4 border-t bg-gray-50/50 flex justify-between items-center text-gray-500 font-semibold text-[11px]">
          <span>Showing 1 to {filteredMedia.length} of {mediaList.length} records</span>
        </div>
      </div>

      {/* Add Media Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-md w-full space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-sm">Upload Media File</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 font-bold px-2.5 py-1 hover:bg-gray-100 rounded-lg cursor-pointer"
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
                  className="w-full border rounded-xl p-2.5 bg-gray-50 text-xs font-mono focus:outline-none focus:bg-white focus:border-emerald-500"
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
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md cursor-pointer disabled:opacity-50"
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
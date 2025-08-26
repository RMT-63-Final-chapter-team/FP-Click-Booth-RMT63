"use client";

import { AiType } from "@/type";
import { ObjectId } from "mongodb";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";

export default function AdminPage() {
  const [aiList, setAiList] = useState<AiType[]>([]);
  const [aiName, setAiName] = useState<string>("");
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [iconUrl, setIconUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<AiType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState<string>("");
  const [editPrompt, setEditPrompt] = useState<string>("");
  const [editIcon, setEditIcon] = useState<string>("");
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [editUploadFile, setEditUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddModalClosing, setIsAddModalClosing] = useState(false);
  const [isAddModalOpening, setIsAddModalOpening] = useState(false);

  const route = useRouter();

  function handleFileChange(e: any) {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  }

  function handleEditFileChange(e: any) {
    const file = e.target.files?.[0];
    if (file) {
      setEditUploadFile(file);
    }
  }

  const fetchData = async () => {
    try {
      const response = await fetch("/api/admin/ai");

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const data = await response.json();
      console.log(data.data);

      if (Array.isArray(data.data)) {
        setAiList(data.data);
      } else {
        setAiList([]);
      }

      console.log("Fetched AI data:", data);
    } catch (error) {
      console.error("Error fetching AI data:", error);

      setAiList([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all fields are filled
    if (!aiName || !aiPrompt || !uploadFile) {
      Swal.fire({
        title: "Validation Error",
        text: "Please fill all fields and upload an icon",
        icon: "warning",
        confirmButtonColor: "#D85C3A",
      });
      return;
    }

    setLoading(true);
    try {
      let uploadedIconUrl = "";

      // Upload file first to get the URL
      if (uploadFile) {
        const formData = new FormData();
        formData.append("file", uploadFile);
        formData.append("folderName", "ai-icons");

        const uploadResponse = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }

        const uploadData = await uploadResponse.json();
        uploadedIconUrl = uploadData.res?.secure_url || uploadData.res?.url;
        console.log("Image uploaded successfully:", uploadData);
      }

      // Then create the AI record with the uploaded icon URL
      const response = await fetch("/api/admin/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: aiName,
          prompt: aiPrompt,
          icon: uploadedIconUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add AI");
      }

      const data = await response.json();

      // Reset form
      setAiName("");
      setAiPrompt("");
      setIconUrl("");
      setUploadFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await fetchData();

      // Show success message
      Swal.fire({
        title: "Success!",
        text: "AI style has been added successfully!",
        icon: "success",
        confirmButtonColor: "#D85C3A",
      });

      // Close modal
      closeAddModal();

      console.log("AI added successfully:", data);
    } catch (error) {
      console.error("Error submitting form:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to add AI style. Please try again.",
        icon: "error",
        confirmButtonColor: "#D85C3A",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#D85C3A",
        cancelButtonColor: "#6B7280",
        confirmButtonText: "Yes, delete it!",
      }).then(async (result) => {
        if (result.isConfirmed) {
          console.log("Deleting AI with ID:", id);

          const response = await fetch(`/api/admin/ai?id=${id}`, {
            method: "DELETE",
          });
          if (!response.ok) {
            throw new Error("Failed to delete AI");
          }
          const data = await response.json();
          await fetchData();
          console.log("AI deleted successfully:", data);
          Swal.fire({
            title: "Deleted!",
            text: "Your file has been deleted.",
            icon: "success",
            confirmButtonColor: "#D85C3A",
          });
        }
      });
    } catch (error) {
      console.error("Error deleting AI:", error);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      setLoading(true);

      let finalIconUrl = editIcon;

      // Upload new file if selected
      if (editUploadFile) {
        const formData = new FormData();
        formData.append("file", editUploadFile);
        formData.append("folderName", "ai-icons");

        const uploadResponse = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }

        const uploadData = await uploadResponse.json();
        finalIconUrl = uploadData.res?.secure_url || uploadData.res?.url;
        console.log("Image uploaded successfully:", uploadData);
      }

      const response = await fetch("/api/admin/ai", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          name: editName,
          prompt: editPrompt,
          icon: finalIconUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update AI");
      }

      const data = await response.json();
      await fetchData();
      closeModal();

      // Show success message
      Swal.fire({
        title: "Success!",
        text: "AI style has been updated successfully!",
        icon: "success",
        confirmButtonColor: "#D85C3A",
      });

      console.log("AI updated successfully:", data);
    } catch (error) {
      console.error("Error updating AI:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to update AI style. Please try again.",
        icon: "error",
        confirmButtonColor: "#D85C3A",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (style: AiType) => {
    setSelectedStyle(style);
    setEditName(style.name);
    setEditPrompt(style.prompt);
    setEditIcon(style.icon);
    setIsEditMode(false);
    setIsOpening(true);
    setShowModal(true);

    // Trigger opening animation
    setTimeout(() => {
      setIsOpening(false);
    }, 50);
  };

  const enableEditMode = () => {
    setIsEditMode(true);
  };

  const cancelEdit = () => {
    if (selectedStyle) {
      setEditName(selectedStyle.name);
      setEditPrompt(selectedStyle.prompt);
      setEditIcon(selectedStyle.icon);
    }
    setEditUploadFile(null);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
    setIsEditMode(false);
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setSelectedStyle(null);
      setIsEditMode(false);
      setEditName("");
      setEditPrompt("");
      setEditIcon("");
      setEditUploadFile(null);
      if (editFileInputRef.current) {
        editFileInputRef.current.value = "";
      }
      setIsClosing(false);
      setIsOpening(false);
    }, 300);
  };

  const openAddModal = () => {
    setIsAddModalOpening(true);
    setShowAddModal(true);
    // Trigger opening animation
    setTimeout(() => {
      setIsAddModalOpening(false);
    }, 50);
  };

  const closeAddModal = () => {
    setIsAddModalClosing(true);
    setTimeout(() => {
      setShowAddModal(false);
      setAiName("");
      setAiPrompt("");
      setIconUrl("");
      setUploadFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsAddModalClosing(false);
      setIsAddModalOpening(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img
                src="/clickBooth.png"
                alt="Click Booth"
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-charcoal-900">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-charcoal-600">
                  Manage AI Photo Styles
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-warm-gradient rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">A</span>
              </div>
              <span className="text-charcoal-700 font-medium">Admin</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-cream-200 p-6 w-full">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-warmRed-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-warmRed-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7H3a1 1 0 01-1-1V5a1 1 0 011-1h4z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-charcoal-600 text-sm font-medium">
                  Total Styles
                </p>
                <p className="text-2xl font-bold text-charcoal-900">
                  {aiList.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Styles Table */}
        <div className="bg-white rounded-xl shadow-sm border border-cream-200 mb-8">
          <div className="px-6 py-4 border-b border-cream-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-charcoal-900">
                AI Photo Styles
              </h2>
              <p className="text-sm text-charcoal-600">
                Manage your AI transformation styles
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="bg-white hover:bg-gray-100 text-black px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 hover:shadow-lg active:scale-95 flex items-center border border-black"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add New Style
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                    Icon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                    Prompt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {aiList.map((ai, index) => (
                  <tr
                    key={String(ai._id)}
                    className="hover:bg-cream-50 cursor-pointer transition-colors"
                    onClick={() => handleViewDetails(ai)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-10 h-10 rounded-lg bg-peach-100 flex items-center justify-center overflow-hidden border border-peach-200">
                        <img
                          src={ai.icon}
                          alt={ai.name}
                          className="w-8 h-8 object-cover rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling!.textContent = "🎨";
                          }}
                        />
                        <span className="text-lg hidden text-peach-600">
                          🎨
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-charcoal-900">
                        {ai.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-charcoal-700 max-w-xs truncate">
                        {ai.prompt}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-500">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(ai);
                        }}
                        className="text-warmRed-600 hover:text-warmRed-900 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add New Style Modal */}
        {showAddModal && (
          <div
            className={`fixed inset-0 bg-charcoal-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300 ease-out ${
              isAddModalClosing ? "opacity-0" : "opacity-100"
            }`}
          >
            <div
              className={`bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-cream-200 transition-all duration-300 ease-out transform ${
                isAddModalClosing
                  ? "scale-95 translate-y-4 opacity-0"
                  : isAddModalOpening
                  ? "scale-95 translate-y-4 opacity-0"
                  : "scale-100 translate-y-0 opacity-100"
              }`}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-cream-200 bg-cream-50 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-xl bg-warmRed-100 border border-warmRed-200 flex items-center justify-center mr-4">
                      <svg
                        className="w-6 h-6 text-warmRed-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-charcoal-900">
                        Add New AI Style
                      </h2>
                      <p className="text-sm text-charcoal-600">
                        Create a new AI photo transformation style
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeAddModal}
                    className="text-charcoal-400 hover:text-charcoal-600 p-2 rounded-lg hover:bg-cream-100 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <form
                onSubmit={handleSubmit}
                className={`p-6 space-y-6 relative ${
                  loading ? "pointer-events-none opacity-75" : ""
                }`}
              >
                {loading && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-b-2xl z-10">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-warmRed-200 border-t-warmRed-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-charcoal-700 font-medium">
                        Uploading and saving...
                      </p>
                      <p className="text-charcoal-500 text-sm">
                        Please wait while we process your request
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                        Style Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter AI style name (e.g., Vintage Film)"
                        className="w-full px-4 py-3 border border-cream-300 rounded-lg focus:ring-2 focus:ring-warmRed-500 focus:border-warmRed-500 transition-all bg-white text-charcoal-900 placeholder-charcoal-400"
                        value={aiName}
                        onChange={(e) => setAiName(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                        Upload Style Icon
                      </label>
                      <div className="relative">
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileChange}
                          accept="image/*"
                          className="w-full px-4 py-3 border border-cream-300 rounded-lg focus:ring-2 focus:ring-warmRed-500 focus:border-warmRed-500 transition-all bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-peach-100 file:text-peach-700 hover:file:bg-peach-200"
                          disabled={loading}
                        />
                        {uploadFile && (
                          <div className="mt-2 flex items-center space-x-2">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <p className="text-sm text-green-700 font-medium">
                              {uploadFile.name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                      AI Transformation Prompt
                    </label>
                    <textarea
                      placeholder="Describe the AI transformation style in detail... (e.g., Transform this photo into a vintage film style with warm tones, soft grain, and retro color grading)"
                      className="w-full px-4 py-3 border border-cream-300 rounded-lg focus:ring-2 focus:ring-warmRed-500 focus:border-warmRed-500 transition-all bg-white text-charcoal-900 placeholder-charcoal-400 resize-none"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      rows={6}
                      disabled={loading}
                    ></textarea>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end pt-4 border-t border-cream-200 space-x-3">
                  <button
                    type="button"
                    onClick={closeAddModal}
                    className="px-6 py-3 text-charcoal-700 bg-white hover:bg-cream-100 border border-cream-300 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-8 py-3 rounded-lg font-semibold transition-all transform border border-black ${
                      loading
                        ? "bg-charcoal-300 text-charcoal-500 cursor-not-allowed"
                        : "bg-warmRed-600 hover:bg-warmRed-700 text-white hover:shadow-lg hover:scale-105 active:scale-95"
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-black border-2 rounded-full animate-spin mr-2"></div>
                        Uploading...
                      </div>
                    ) : (
                      <div className="flex items-center text-black">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Add AI Style
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail/Edit Modal */}
        {showModal && selectedStyle && (
          <div
            className={`fixed inset-0 bg-charcoal-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300 ease-out ${
              isClosing ? "opacity-0" : "opacity-100"
            }`}
          >
            <div
              className={`bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-cream-200 transition-all duration-300 ease-out transform ${
                isClosing
                  ? "scale-95 translate-y-4 opacity-0"
                  : isOpening
                  ? "scale-95 translate-y-4 opacity-0"
                  : "scale-100 translate-y-0 opacity-100"
              }`}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-cream-200 bg-cream-50 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-xl bg-peach-100 border border-peach-200 flex items-center justify-center mr-4 overflow-hidden">
                      <img
                        src={isEditMode ? editIcon : selectedStyle.icon}
                        alt={isEditMode ? editName : selectedStyle.name}
                        className="w-10 h-10 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          target.nextElementSibling!.textContent = "🎨";
                        }}
                      />
                      <span className="text-xl hidden text-peach-600">🎨</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-charcoal-900">
                        {isEditMode ? "Edit Style" : selectedStyle.name}
                      </h2>
                      <p className="text-sm text-charcoal-600">
                        {isEditMode
                          ? "Update AI style details"
                          : "AI Style Details"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-charcoal-400 hover:text-charcoal-600 p-2 rounded-lg hover:bg-cream-100 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-6 space-y-6">
                {/* Style Name */}
                <div>
                  <label className="block text-sm font-semibold text-charcoal-700 mb-3">
                    Style Name
                  </label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-3 border border-cream-300 rounded-lg focus:ring-2 focus:ring-warmRed-500 focus:border-warmRed-500 transition-all bg-white text-charcoal-900"
                      placeholder="Enter style name"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-cream-50 rounded-lg border border-cream-200">
                      <p className="text-charcoal-900 font-medium">
                        {selectedStyle.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Style Icon */}
                <div>
                  <label className="block text-sm font-semibold text-charcoal-700 mb-3">
                    Style Icon
                  </label>
                  {isEditMode ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editIcon}
                        onChange={(e) => setEditIcon(e.target.value)}
                        className="w-full px-4 py-3 border border-cream-300 rounded-lg focus:ring-2 focus:ring-warmRed-500 focus:border-warmRed-500 transition-all bg-white text-charcoal-900"
                        placeholder="https://example.com/icon.png"
                      />
                      <div className="text-center text-charcoal-500 text-sm">
                        OR
                      </div>
                      <div>
                        <input
                          ref={editFileInputRef}
                          type="file"
                          onChange={handleEditFileChange}
                          accept="image/*"
                          className="w-full px-4 py-3 border border-cream-300 rounded-lg focus:ring-2 focus:ring-warmRed-500 focus:border-warmRed-500 transition-all bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-peach-100 file:text-peach-700 hover:file:bg-peach-200"
                        />
                        {editUploadFile && (
                          <div className="mt-2 flex items-center space-x-2">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <p className="text-sm text-green-700 font-medium">
                              {editUploadFile.name} (New file selected)
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-charcoal-500 mt-2">
                          Upload a new file to replace the current icon
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-3 bg-cream-50 rounded-lg border border-cream-200 flex items-center">
                      <div className="w-14 h-14 rounded-xl bg-peach-100 border border-peach-200 flex items-center justify-center mr-4 overflow-hidden">
                        <img
                          src={selectedStyle.icon}
                          alt={selectedStyle.name}
                          className="w-12 h-12 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling!.textContent = "🎨";
                          }}
                        />
                        <span className="text-xl hidden text-peach-600">
                          🎨
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-charcoal-900 text-sm font-medium truncate">
                          Icon URL
                        </p>
                        <p className="text-charcoal-600 text-xs truncate">
                          {selectedStyle.icon}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Prompt */}
                <div>
                  <label className="block text-sm font-semibold text-charcoal-700 mb-3">
                    AI Transformation Prompt
                  </label>
                  {isEditMode ? (
                    <textarea
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 border border-cream-300 rounded-lg focus:ring-2 focus:ring-warmRed-500 focus:border-warmRed-500 transition-all resize-none bg-white text-charcoal-900"
                      placeholder="Describe the transformation style in detail..."
                    />
                  ) : (
                    <div className="px-4 py-3 bg-cream-50 rounded-lg border border-cream-200">
                      <p className="text-charcoal-900 leading-relaxed whitespace-pre-wrap text-sm">
                        {selectedStyle.prompt}
                      </p>
                    </div>
                  )}
                </div>

                {/* Metadata - Only show in view mode */}
                {!isEditMode &&
                  (selectedStyle.createdAt || selectedStyle.updatedAt) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-cream-200">
                      {selectedStyle.createdAt && (
                        <div>
                          <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                            Created At
                          </label>
                          <div className="px-4 py-3 bg-cream-50 rounded-lg border border-cream-200">
                            <p className="text-charcoal-900 text-sm">
                              {new Date(
                                selectedStyle.createdAt
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedStyle.updatedAt && (
                        <div>
                          <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                            Updated At
                          </label>
                          <div className="px-4 py-3 bg-cream-50 rounded-lg border border-cream-200">
                            <p className="text-charcoal-900 text-sm">
                              {new Date(
                                selectedStyle.updatedAt
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-cream-200 bg-cream-50 rounded-b-2xl">
                <div className="flex justify-between">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-charcoal-700 bg-white hover:bg-cream-100 border border-cream-300 rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>

                  <div className="flex space-x-3">
                    {isEditMode ? (
                      <>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 text-charcoal-700 bg-white hover:bg-cream-100 border border-cream-300 rounded-lg font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() =>
                            handleUpdate(String(selectedStyle._id))
                          }
                          disabled={
                            loading || !editName || !editPrompt || !editIcon
                          }
                          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                            loading || !editName || !editPrompt || !editIcon
                              ? "bg-charcoal-300 text-charcoal-500 cursor-not-allowed"
                              : "bg-green-600 hover:bg-green-700 text-white hover:shadow-lg transform hover:scale-105"
                          }`}
                        >
                          {loading ? (
                            <div className="flex items-center">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Updating...
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Save Changes
                            </div>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={enableEditMode}
                          className="px-6 py-2 bg-green-500 hover:bg-peach-600 text-white rounded-lg font-semibold transition-all transform hover:scale-105 hover:shadow-lg"
                        >
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit Style
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            closeModal();
                            handleDelete(String(selectedStyle._id));
                          }}
                          disabled={!selectedStyle._id}
                          className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete Style
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

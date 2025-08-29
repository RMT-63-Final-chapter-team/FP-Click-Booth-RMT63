"use client";

import { AiType } from "@/type";
// import { ObjectId } from "mongodb";
import Image from "next/image";
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
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [message, setMessage] = useState("");

  // Field validation states
  const [fieldErrors, setFieldErrors] = useState({
    fullName: "",
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
  });

  // Add Admin Modal states
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [isAddAdminModalClosing, setIsAddAdminModalClosing] = useState(false);
  const [isAddAdminModalOpening, setIsAddAdminModalOpening] = useState(false);

  // Removed unused route variable

  // Set current date on client side only
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString());
  }, []);

  // Real-time field validation functions
  const validateField = (fieldName: string, value: string) => {
    let error = "";

    switch (fieldName) {
      case "fullName":
        if (!value.trim()) {
          error = "Full name is required";
        } else if (value.trim().length < 3) {
          error = "Must be at least 3 characters";
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          error = "Only letters and spaces allowed";
        }
        break;

      case "username":
        if (!value.trim()) {
          error = "Username is required";
        } else if (value.trim().length < 3) {
          error = "Must be at least 3 characters";
        } else if (!/^[a-zA-Z0-9_]+$/.test(value.trim())) {
          error = "Only letters, numbers, and underscores allowed";
        }
        break;

      case "email":
        if (!value.trim()) {
          error = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          error = "Please enter a valid email address";
        }
        break;

      case "phoneNumber":
        if (!value.trim()) {
          error = "Phone number is required";
        } else if (value.trim().length < 7) {
          error = "Must be at least 7 characters";
        } else if (!/^[\d\+\-\(\)\s]+$/.test(value.trim())) {
          error = "Please enter a valid phone number";
        }
        break;

      case "password":
        if (!value) {
          error = "Password is required";
        } else if (value.length < 8) {
          error = "Must be at least 8 characters";
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          error = "Must contain uppercase, lowercase, and number";
        }
        break;
    }

    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));

    return error === "";
  };

  // Enhanced input handlers with real-time validation
  const handleFullNameChange = (value: string) => {
    setFullName(value);
    validateField("fullName", value);
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    validateField("username", value);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    validateField("email", value);
  };

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value);
    validateField("phoneNumber", value);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    validateField("password", value);
  };

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  }

  function handleEditFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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

  const openAddAdminModal = () => {
    setIsAddAdminModalOpening(true);
    setShowAddAdminModal(true);
    // Trigger opening animation
    setTimeout(() => {
      setIsAddAdminModalOpening(false);
    }, 50);
  };

  const closeAddAdminModal = () => {
    setIsAddAdminModalClosing(true);
    setTimeout(() => {
      setShowAddAdminModal(false);
      setFullName("");
      setEmail("");
      setUsername("");
      setPhoneNumber("");
      setPassword("");
      setMessage("");
      setFieldErrors({
        fullName: "",
        username: "",
        email: "",
        phoneNumber: "",
        password: "",
      });
      setIsAddAdminModalClosing(false);
      setIsAddAdminModalOpening(false);
    }, 300);
  };

  // Enhanced form validation with better error messages
  const validateAdminForm = () => {
    // Clear previous messages
    setMessage("");

    // Full Name validation
    if (!fullName.trim()) {
      setMessage("Full name is required");
      return false;
    }
    if (fullName.trim().length < 3) {
      setMessage("Full name must be at least 3 characters long");
      return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(fullName.trim())) {
      setMessage("Full name should only contain letters and spaces");
      return false;
    }

    // Username validation
    if (!username.trim()) {
      setMessage("Username is required");
      return false;
    }
    if (username.trim().length < 3) {
      setMessage("Username must be at least 3 characters long");
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setMessage("Username can only contain letters, numbers, and underscores");
      return false;
    }

    // Email validation
    if (!email.trim()) {
      setMessage("Email address is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMessage("Please enter a valid email address");
      return false;
    }

    // Phone number validation
    if (!phoneNumber.trim()) {
      setMessage("Phone number is required");
      return false;
    }
    if (phoneNumber.trim().length < 7) {
      setMessage("Phone number must be at least 7 characters long");
      return false;
    }
    if (!/^[\d\+\-\(\)\s]+$/.test(phoneNumber.trim())) {
      setMessage("Please enter a valid phone number");
      return false;
    }

    // Password validation
    if (!password) {
      setMessage("Password is required");
      return false;
    }
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long");
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      );
      return false;
    }

    return true;
  };

  const handleAddAdmin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Use enhanced validation
    if (!validateAdminForm()) {
      Swal.fire({
        title: "Validation Error",
        text: message,
        icon: "warning",
        confirmButtonColor: "#D85C3A",
      });
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      console.log("Adding admin with data:", {
        username: username.trim(),
        phoneNumber: phoneNumber.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
      });

      const response = await fetch("/api/admin/addadmin", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          phoneNumber: phoneNumber.trim(),
          fullName: fullName.trim(),
          email: email.trim(),
          password,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error messages from backend
        let errorMessage = "Failed to add admin";

        if (data.message) {
          if (data.message.includes("Email already exists")) {
            errorMessage =
              "This email is already registered. Please use a different email.";
          } else if (data.message.includes("Username already exists")) {
            errorMessage =
              "This username is already taken. Please choose a different username.";
          } else if (data.message.includes("Phone number already exists")) {
            errorMessage =
              "This phone number is already registered. Please use a different phone number.";
          } else {
            errorMessage = data.message;
          }
        }

        setMessage(errorMessage);
        throw new Error(errorMessage);
      }

      setMessage("Admin account created successfully!");

      // Show success message
      Swal.fire({
        title: "Success!",
        text: "Admin account has been created successfully!",
        icon: "success",
        confirmButtonColor: "#10B981",
      });

      // Close modal and reset form
      closeAddAdminModal();
    } catch (error) {
      console.error("Error adding admin:", error);

      // Don't show SweetAlert if we already set a specific message
      if (!message) {
        Swal.fire({
          title: "Error!",
          text:
            error instanceof Error
              ? error.message
              : "Failed to add admin. Please try again.",
          icon: "error",
          confirmButtonColor: "#EF4444",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-8">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 mb-8">
          <div className="px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
                    Admin Dashboard
                  </h1>
                  <p className="text-slate-600 font-medium">
                    Manage AI Photo Styles & System
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-slate-100 rounded-2xl px-4 py-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
                <div>
                  <span className="text-slate-800 font-semibold text-sm">
                    Administrator
                  </span>
                  <p className="text-slate-500 text-xs">System Admin</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="mb-10 ">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {aiList.length}
                  </h3>
                  <p className="text-slate-600 font-medium">Total AI Styles</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
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
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {aiList.length}
                  </h3>
                  <p className="text-slate-600 font-medium">Active Styles</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
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
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {currentDate || "Loading..."}
                  </h3>
                  <p className="text-slate-600 font-medium">Last Updated</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4M8 7h8M8 7l-2 9h12l-2-9"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Styles Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 mb-8">
          <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
                AI Photo Styles
              </h2>
              <p className="text-slate-600 font-medium mt-1">
                Manage your AI transformation styles and effects
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={openAddAdminModal}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl active:scale-95 flex items-center"
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Add Admin
              </button>
              <button
                onClick={openAddModal}
                className="bg-white hover:bg-slate-50 text-slate-800 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl active:scale-95 flex items-center border border-slate-300 shadow-lg"
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
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-100 to-blue-50">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-bold text-slate-700 tracking-wide">
                    No
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-bold text-slate-700 tracking-wide">
                    Icon
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-bold text-slate-700 tracking-wide">
                    Name
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-bold text-slate-700 tracking-wide">
                    Prompt
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-bold text-slate-700 tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {aiList.map((ai, index) => (
                  <tr
                    key={String(ai._id)}
                    className="hover:bg-slate-50 cursor-pointer transition-all duration-200 hover:shadow-sm"
                    onClick={() => handleViewDetails(ai)}
                  >
                    <td className="px-8 py-6 whitespace-nowrap text-sm font-medium text-slate-800">
                      {index + 1}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden border border-white shadow-lg">
                        <Image
                          src={ai.icon}
                          alt={ai.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-cover rounded-xl"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling!.textContent = "🎨";
                          }}
                        />
                        <span className="text-xl hidden text-blue-600">🎨</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-base font-semibold text-slate-800">
                        {ai.name}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm text-slate-600 max-w-xs truncate leading-relaxed">
                        {ai.prompt}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(ai);
                        }}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
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
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
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

        {/* Add Admin Modal */}
        {showAddAdminModal && (
          <div
            className={`fixed inset-0 bg-charcoal-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300 ease-out ${
              isAddAdminModalClosing ? "opacity-0" : "opacity-100"
            }`}
          >
            <div
              className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-cream-200 transition-all duration-300 ease-out transform ${
                isAddAdminModalClosing
                  ? "scale-95 translate-y-4 opacity-0"
                  : isAddAdminModalOpening
                  ? "scale-95 translate-y-4 opacity-0"
                  : "scale-100 translate-y-0 opacity-100"
              }`}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-cream-200 bg-blue-50 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center mr-4">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-charcoal-900">
                        Add New Admin
                      </h2>
                      <p className="text-sm text-charcoal-600">
                        Create a new admin account
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeAddAdminModal}
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
                onSubmit={handleAddAdmin}
                className={`p-6 space-y-6 relative ${
                  loading ? "pointer-events-none opacity-75" : ""
                }`}
              >
                {loading && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-b-2xl z-10">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-charcoal-700 font-medium">
                        Creating admin account...
                      </p>
                      <p className="text-charcoal-500 text-sm">
                        Please wait while we process your request
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter admin's full name"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-white text-charcoal-900 placeholder-charcoal-400 ${
                        fieldErrors.fullName
                          ? "border-red-500 focus:border-red-500"
                          : fullName && !fieldErrors.fullName
                          ? "border-green-500 focus:border-green-500"
                          : "border-cream-300 focus:border-blue-500"
                      }`}
                      value={fullName}
                      onChange={(e) => handleFullNameChange(e.target.value)}
                      disabled={loading}
                      required
                    />
                    {fieldErrors.fullName && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {fieldErrors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      placeholder="Enter username"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-white text-charcoal-900 placeholder-charcoal-400 ${
                        fieldErrors.username
                          ? "border-red-500 focus:border-red-500"
                          : username && !fieldErrors.username
                          ? "border-green-500 focus:border-green-500"
                          : "border-cream-300 focus:border-blue-500"
                      }`}
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      disabled={loading}
                      required
                    />
                    {fieldErrors.username && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {fieldErrors.username}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="Enter email address"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-white text-charcoal-900 placeholder-charcoal-400 ${
                        fieldErrors.email
                          ? "border-red-500 focus:border-red-500"
                          : email && !fieldErrors.email
                          ? "border-green-500 focus:border-green-500"
                          : "border-cream-300 focus:border-blue-500"
                      }`}
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      disabled={loading}
                      required
                    />
                    {fieldErrors.email && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-white text-charcoal-900 placeholder-charcoal-400 ${
                        fieldErrors.phoneNumber
                          ? "border-red-500 focus:border-red-500"
                          : phoneNumber && !fieldErrors.phoneNumber
                          ? "border-green-500 focus:border-green-500"
                          : "border-cream-300 focus:border-blue-500"
                      }`}
                      value={phoneNumber}
                      onChange={(e) => handlePhoneNumberChange(e.target.value)}
                      disabled={loading}
                      required
                    />
                    {fieldErrors.phoneNumber && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {fieldErrors.phoneNumber}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter secure password (min. 8 characters)"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-white text-charcoal-900 placeholder-charcoal-400 ${
                        fieldErrors.password
                          ? "border-red-500 focus:border-red-500"
                          : password && !fieldErrors.password
                          ? "border-green-500 focus:border-green-500"
                          : "border-cream-300 focus:border-blue-500"
                      }`}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      disabled={loading}
                      required
                      minLength={8}
                    />
                    {fieldErrors.password && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {fieldErrors.password}
                      </p>
                    )}
                    {password && !fieldErrors.password && (
                      <div className="mt-2 flex items-center">
                        <div className="flex space-x-1">
                          <div
                            className={`h-1 w-6 rounded ${
                              password.length >= 8
                                ? "bg-green-500"
                                : "bg-gray-200"
                            }`}
                          ></div>
                          <div
                            className={`h-1 w-6 rounded ${
                              /(?=.*[a-z])/.test(password)
                                ? "bg-green-500"
                                : "bg-gray-200"
                            }`}
                          ></div>
                          <div
                            className={`h-1 w-6 rounded ${
                              /(?=.*[A-Z])/.test(password)
                                ? "bg-green-500"
                                : "bg-gray-200"
                            }`}
                          ></div>
                          <div
                            className={`h-1 w-6 rounded ${
                              /(?=.*\d)/.test(password)
                                ? "bg-green-500"
                                : "bg-gray-200"
                            }`}
                          ></div>
                        </div>
                        <span className="text-xs text-green-600 ml-2">
                          Strong password
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Message Display */}
                  {message && (
                    <div
                      className={`mt-6 p-4 rounded-lg border ${
                        message.includes("successful") ||
                        message.includes("berhasil")
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      {message}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end pt-4 border-t border-cream-200 space-x-3">
                  <button
                    type="button"
                    onClick={closeAddAdminModal}
                    className="px-6 py-3 text-charcoal-700 bg-white hover:bg-cream-100 border border-cream-300 rounded-lg font-medium transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !fullName ||
                      !email ||
                      !username ||
                      !phoneNumber ||
                      !password ||
                      Object.values(fieldErrors).some((error) => error !== "")
                    }
                    className={`px-8 py-3 rounded-lg font-semibold transition-all transform ${
                      loading ||
                      !fullName ||
                      !email ||
                      !username ||
                      !phoneNumber ||
                      !password ||
                      Object.values(fieldErrors).some((error) => error !== "")
                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:scale-105 active:scale-95"
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating...
                      </div>
                    ) : (
                      <div className="flex items-center">
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Create Admin
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
                      <Image
                        src={isEditMode ? editIcon : selectedStyle.icon}
                        alt={isEditMode ? editName : selectedStyle.name}
                        width={40}
                        height={40}
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
                        <Image
                          src={selectedStyle.icon}
                          alt={selectedStyle.name}
                          width={48}
                          height={48}
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

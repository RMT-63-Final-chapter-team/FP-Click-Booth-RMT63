"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Calendar,
  Camera,
  Download,
  Share,
  Eye,
  Grid,
  List,
  //   Settings,
  LogOut,
  Edit,
  Save,
  X,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  // Icon tambahan untuk photo booth
  //   Heart,
  Star,
  //   Trophy,
  //   Gift,
  Zap,
  Sparkles,
  //   ImageIcon,
  //   Filter,
  //   Palette,
  //   Wand2,
  BadgeCheck,
  //   Crown,
  Flame,
  Clock,
  CheckCircle,
  //   TrendingUp,
} from "lucide-react";
import {
  getUserFromCookiesClient,
  getAuthTokenFromCookies,
} from "@/helpers/getUserFromCookiesClient";
// import Footer from "@/components/Footer";

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  createdAt: string;
}

interface Photo {
  _id: string;
  url: string;
  thumbUrl?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Photo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [photosLoading, setPhotosLoading] = useState(false);

  const loadPhotos = useCallback(
    async (next = false) => {
      try {
        const userData = getUserFromCookiesClient();
        console.log("loadPhotos - userData:", userData);

        if (!userData) {
          console.log("loadPhotos - no user data, skipping");
          return;
        }

        setPhotosLoading(true);
        const skip = next ? photos.length : 0;
        const limit = 24;

        const token = getAuthTokenFromCookies();
        console.log("loadPhotos - token:", token ? "exists" : "not found");

        const response = await fetch(
          `/api/photos?mine=true&limit=${limit}&skip=${skip}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("loadPhotos - API response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("loadPhotos - received data:", data);
          const newPhotos = Array.isArray(data.photos) ? data.photos : [];
          setPhotos((prev) => (next ? [...prev, ...newPhotos] : newPhotos));
          setHasMore(newPhotos.length === limit);
        } else {
          const errorText = await response.text();
          console.log("loadPhotos - API error:", errorText);
          throw new Error("Failed to load photos");
        }
      } catch (error) {
        console.error("loadPhotos error:", error);
        setError("Failed to load photos");
      } finally {
        setPhotosLoading(false);
      }
    },
    [photos.length]
  );

  const refreshPhotos = useCallback(async () => {
    setPhotos([]);
    setHasMore(true);
    await loadPhotos(false);
  }, [loadPhotos]);

  const loadMorePhotos = useCallback(async () => {
    if (hasMore && !photosLoading) {
      await loadPhotos(true);
    }
  }, [hasMore, photosLoading, loadPhotos]);

  useEffect(() => {
    const initializeData = async () => {
      await loadProfile();
      await loadPhotos(false);
    };
    initializeData();
  }, [loadPhotos]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(""); // Clear previous errors

      const userData = getUserFromCookiesClient();
      console.log("userData from cookies:", userData);

      if (!userData) {
        throw new Error(
          "Please login first. If you recently logged in, please login again to refresh your session."
        );
      }

      const token = getAuthTokenFromCookies();
      console.log("token:", token ? "exists" : "not found");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("API error:", errorText);
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const profileData = await response.json();
      console.log("Profile data received:", profileData);

      // Map the API response to UserProfile interface
      const userProfile: UserProfile = {
        id: profileData.userId,
        name: profileData.name,
        username: profileData.username,
        email: profileData.email,
        createdAt: profileData.createdAt,
      };

      setUser(userProfile);
      setEditName(userProfile.name);
    } catch (err) {
      console.error("loadProfile error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const downloadPhoto = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareToWhatsApp = (url: string) => {
    const message = `Check out this photo from ClickBooth! ${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleLogout = () => {
    // Clear the cookie properly
    document.cookie =
      "authorization=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; sameSite=lax;";

    // Redirect to login
    window.location.href = "/login";
  };

  const handleSaveProfile = async () => {
    try {
      const userData = getUserFromCookiesClient();
      if (!userData) return;

      const token = getAuthTokenFromCookies();
      const response = await fetch("/api/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName }),
      });

      if (response.ok) {
        setUser((prev) => (prev ? { ...prev, name: editName } : null));
        setIsEditing(false);
      }
    } catch {
      setError("Failed to update profile");
    }
  };

  if (loading && !user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-amber-50 flex items-center justify-center"
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-amber-200/50 max-w-lg mx-auto">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 mx-auto mb-6 flex items-center justify-center text-red-500"
          >
            <Zap className="w-16 h-16" />
          </motion.div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3 text-center">
            Loading Profile...
          </h3>
          <div className="flex items-center justify-center space-x-2 text-slate-600">
            <Sparkles className="w-4 h-4" />
            <p className="text-sm">Preparing your awesome content...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-amber-50"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white border-b border-amber-200 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="flex items-center gap-2 text-4xl font-bold text-slate-800 mb-2">
              <User className="w-8 h-8 text-slate-700" />
              My Profile
            </h1>
            <p className="text-slate-600 text-lg">
              Manage your account and view your photo memories
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {error && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 shadow-lg"
          >
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <span className="text-red-700 font-semibold text-lg">
                {error}
              </span>
            </div>
            {error.includes("login") && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => (window.location.href = "/login")}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Go to Login
              </motion.button>
            )}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-amber-200/50 p-8 sticky top-8">
              {/* Profile Avatar */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: 0.3,
                  type: "spring",
                  damping: 15,
                }}
                className="text-center mb-8"
              >
                <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-red-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl">
                  <User className="w-16 h-16 text-white" />
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full text-2xl font-bold text-center bg-amber-50 border border-amber-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <div className="flex justify-center space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSaveProfile}
                        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-xl transition-colors duration-200"
                      >
                        <Save className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setIsEditing(false);
                          setEditName(user?.name || "");
                        }}
                        className="bg-slate-500 hover:bg-slate-600 text-white p-2 rounded-xl transition-colors duration-200"
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center space-x-3 mb-2">
                      <h2 className="text-2xl font-bold text-slate-800">
                        {user?.name || "Guest User"}
                      </h2>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsEditing(true)}
                        className="bg-amber-100 hover:bg-amber-200 text-slate-700 p-2 rounded-xl transition-colors duration-200"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                    </div>
                    {user?.username && (
                      <p className="text-slate-500 text-center">
                        @{user.username}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Profile Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-4 p-4 bg-amber-50 rounded-2xl">
                  <Mail className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Email</p>
                    <p className="text-slate-800 font-semibold">
                      {user?.email || "Not available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-amber-50 rounded-2xl">
                  <Calendar className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="text-sm text-slate-500 font-medium">
                      Member Since
                    </p>
                    <p className="text-slate-800 font-semibold">
                      {user?.createdAt
                        ? formatDate(user.createdAt)
                        : "Not available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-amber-50 rounded-2xl">
                  <Camera className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="text-sm text-slate-500 font-medium">
                      Total Photos
                    </p>
                    <p className="text-slate-800 font-semibold">
                      {photos.length} Photos
                    </p>
                  </div>
                </div>

                {/* New Achievement Card */}
                {/* <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-200">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  <div>
                    <p className="text-sm text-slate-500 font-medium">
                      Achievement Level
                    </p>
                    <p className="text-slate-800 font-semibold flex items-center space-x-1">
                      <span>
                        {photos.length >= 50
                          ? "Pro Photographer"
                          : photos.length >= 20
                          ? "Advanced User"
                          : photos.length >= 5
                          ? "Photo Enthusiast"
                          : "Beginner"}
                      </span>
                      {photos.length >= 20 && (
                        <Crown className="w-4 h-4 text-yellow-600" />
                      )}
                    </p>
                  </div>
                </div> */}

                {/* User Status Card */}
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
                  <BadgeCheck className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-500 font-medium">
                      Account Status
                    </p>
                    <p className="text-slate-800 font-semibold flex items-center space-x-1">
                      <span>Verified User</span>
                      <Sparkles className="w-4 h-4 text-blue-600" />
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-8 space-y-3"
              >
                {/* <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <Settings className="w-5 h-5" />
                  <span>Account Settings</span>
                </motion.button> */}

                {/* New Action Buttons */}
                {/* <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-4 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <Wand2 className="w-5 h-5" />
                  <span>AI Photo Enhance</span>
                </motion.button> */}

                {/* <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white p-4 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <Gift className="w-5 h-5" />
                  <span>Redeem Rewards</span>
                </motion.button> */}

                {/* <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white p-4 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>View Analytics</span>
                </motion.button> */}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full bg-red-500 hover:bg-red-600 text-white p-4 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>

          {/* Photo History */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-amber-200/50 p-8">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <h3 className="flex items-center gap-2 text-2xl font-bold text-slate-800 mb-2">
                    <Camera className="w-5 h-5 text-slate-700" />
                    Photo History
                  </h3>
                  <p className="text-slate-600">
                    Your captured memories from ClickBooth sessions
                  </p>
                </motion.div>

                {/* View Mode Toggle */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="flex items-center space-x-2 bg-amber-100 rounded-2xl p-1 shadow-lg"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode("grid")}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                      viewMode === "grid"
                        ? "bg-white text-slate-800 shadow-lg"
                        : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                    <span>Grid</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode("list")}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                      viewMode === "list"
                        ? "bg-white text-slate-800 shadow-lg"
                        : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span>List</span>
                  </motion.button>
                </motion.div>
              </div>

              {/* Photos Display */}
              {photos.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-center py-20"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, type: "spring", damping: 15 }}
                    className="text-8xl mb-6"
                  >
                    📸
                  </motion.div>
                  <h4 className="text-xl font-bold text-slate-800 mb-3">
                    No Photos Yet
                  </h4>
                  <p className="text-slate-600 mb-6">
                    Visit our photo booth to capture your first moments!
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => (window.location.href = "/booth")}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Take Photos Now
                  </motion.button>
                </motion.div>
              ) : viewMode === "grid" ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {photos.map((photo, index) => (
                    <motion.div
                      key={photo._id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      className="bg-white rounded-2xl shadow-lg border border-amber-200/50 overflow-hidden hover:shadow-xl transition-all duration-300 group"
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelected(photo)}
                        className="aspect-square relative cursor-pointer overflow-hidden"
                      >
                        {/* Special Badge for Recent Photos */}
                        {index < 3 && (
                          <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full flex items-center space-x-1 text-xs font-semibold shadow-lg">
                            <Flame className="w-3 h-3" />
                            <span>Hot</span>
                          </div>
                        )}

                        {/* Quality Badge for High Resolution */}
                        {index % 5 === 0 && index > 0 && (
                          <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full flex items-center space-x-1 text-xs font-semibold shadow-lg">
                            <Star className="w-3 h-3" />
                            <span>HD</span>
                          </div>
                        )}

                        <Image
                          src={photo.thumbUrl ?? photo.url}
                          alt="Photo"
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            whileHover={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <Eye className="w-8 h-8 text-white" />
                          </motion.div>
                        </div>
                      </motion.div>

                      <div className="p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <p className="text-sm text-slate-600 font-medium">
                            {formatDate(photo.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              downloadPhoto(photo.url, `photo-${photo._id}.jpg`)
                            }
                            className="bg-amber-100 hover:bg-amber-200 text-slate-700 p-2 rounded-xl transition-all duration-200"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </motion.button>

                          {/* <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="bg-pink-100 hover:bg-pink-200 text-pink-700 p-2 rounded-xl transition-all duration-200"
                            title="Add to Favorites"
                          >
                            <Heart className="w-4 h-4" />
                          </motion.button> */}

                          {/* <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="bg-purple-100 hover:bg-purple-200 text-purple-700 p-2 rounded-xl transition-all duration-200"
                            title="Apply Filter"
                          >
                            <Filter className="w-4 h-4" />
                          </motion.button> */}

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => shareToWhatsApp(photo.url)}
                            className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-xl transition-all duration-200"
                            title="Share to WhatsApp"
                          >
                            <Share className="w-4 h-4" />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSelected(photo)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-xl transition-all duration-200"
                            title="View Full Size"
                          >
                            <Eye className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="space-y-4"
                >
                  {photos.map((photo, index) => (
                    <motion.div
                      key={photo._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      whileHover={{
                        scale: 1.01,
                        transition: { duration: 0.2 },
                      }}
                      className="bg-white rounded-2xl shadow-lg border border-amber-200/50 p-6 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-center space-x-6">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelected(photo)}
                          className="flex-shrink-0 cursor-pointer group"
                        >
                          <div className="w-20 h-20 rounded-2xl overflow-hidden relative shadow-lg">
                            <Image
                              src={photo.thumbUrl ?? photo.url}
                              alt="Photo thumbnail"
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                              sizes="80px"
                              loading="lazy"
                            />
                          </div>
                        </motion.div>

                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-semibold text-slate-700 mb-2">
                            <Camera className="w-5 h-5 text-slate-700" />
                            Photo Session
                          </p>
                          <p className="text-slate-600 mb-1">
                            {formatDate(photo.createdAt)}
                          </p>
                          <p className="text-sm text-slate-500 truncate font-mono">
                            ID: {photo._id}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              downloadPhoto(photo.url, `photo-${photo._id}.jpg`)
                            }
                            className="bg-amber-100 hover:bg-amber-200 text-slate-700 p-2 rounded-xl transition-all duration-200"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => shareToWhatsApp(photo.url)}
                            className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-xl transition-all duration-200"
                            title="Share to WhatsApp"
                          >
                            <Share className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSelected(photo)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-xl transition-all duration-200"
                            title="View Full Size"
                          >
                            <Eye className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {photos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="mt-8 flex items-center justify-center gap-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={loadMorePhotos}
                    disabled={photosLoading || !hasMore}
                    className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    {photosLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Loading...</span>
                      </>
                    ) : hasMore ? (
                      <>
                        <Download className="w-5 h-5" />
                        <span>Load More</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span>All Loaded</span>
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={refreshPhotos}
                    className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Refresh</span>
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Photo Modal */}
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{
              duration: 0.3,
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
            className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-amber-200/50 max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Modal Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex items-center justify-between mb-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Photo Details
                  </h3>
                  <p className="text-slate-600">
                    {formatDate(selected.createdAt)}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelected(null)}
                  className="bg-amber-100 hover:bg-amber-200 text-slate-700 p-2 rounded-xl transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </motion.div>

              {/* Photo Display */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="relative bg-gray-100 rounded-2xl overflow-hidden mb-6"
              >
                <Image
                  src={selected.url}
                  alt="Full size photo"
                  width={800}
                  height={600}
                  className="w-full h-auto object-contain max-h-[60vh]"
                  priority
                />
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex flex-wrap gap-3 justify-center"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    downloadPhoto(selected.url, `photo-${selected._id}.jpg`)
                  }
                  className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => shareToWhatsApp(selected.url)}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <Share className="w-5 h-5" />
                  <span>Share WhatsApp</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.open(selected.url, "_blank")}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>Open Original</span>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* <Footer /> */}
    </motion.div>
  );
}

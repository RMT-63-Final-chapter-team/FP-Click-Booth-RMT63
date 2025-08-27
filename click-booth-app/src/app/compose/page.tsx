"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { AiType, UserType } from "@/type";
import Swal from "sweetalert2";
import NextImage from "next/image";

interface Frame {
  id: string;
  name: string;
  src: string;
  category: "frame" | "sticker";
  type?: "overlay" | "strip"; // overlay = frame biasa, strip = photobooth strip
  stripConfig?: {
    photoCount: number;
    orientation: "vertical" | "horizontal";
    spacing: number;
    background: string;
    branding?: string;
  };
}

type TabCategory = "frame" | "sticker" | "ai";

// Generate frames based on selected layout data
function generateFramesForLayout(shotsCount: number): Frame[] {
  const baseFrames: Frame[] = [
    {
      id: "none",
      name: "No Frame",
      src: "",
      category: "frame",
      type: "overlay",
    },
  ];

  // Color variations for strips
  const colorVariations = [
    { id: "coral", name: "Coral", background: "#ffeaa7", accent: "#fd79a8" },
    { id: "mint", name: "Mint", background: "#00b894", accent: "#00cec9" },
    { id: "blue", name: "Blue", background: "#74b9ff", accent: "#0984e3" },
    { id: "purple", name: "Purple", background: "#a29bfe", accent: "#6c5ce7" },
    { id: "pink", name: "Pink", background: "#fd79a8", accent: "#e84393" },
    { id: "orange", name: "Orange", background: "#fdcb6e", accent: "#e17055" },
    { id: "green", name: "Green", background: "#55a3ff", accent: "#00b894" },
    { id: "sunset", name: "Sunset", background: "#fab1a0", accent: "#e17055" },
  ];

  // Generate strip frames based on shots count
  colorVariations.forEach((color) => {
    baseFrames.push({
      id: `strip-vertical-${shotsCount}-${color.id}`,
      name: `${shotsCount} Photos Strip (${color.name})`,
      src: "",
      category: "frame",
      type: "strip",
      stripConfig: {
        photoCount: shotsCount,
        orientation: "vertical",
        spacing: 8,
        background: color.background,
        branding: "ClickBooth",
      },
    });

    // Also add horizontal version for 2+ photos
    if (shotsCount >= 2) {
      baseFrames.push({
        id: `strip-horizontal-${shotsCount}-${color.id}`,
        name: `${shotsCount} Photos Horizontal (${color.name})`,
        src: "",
        category: "frame",
        type: "strip",
        stripConfig: {
          photoCount: shotsCount,
          orientation: "horizontal",
          spacing: 8,
          background: color.background,
          branding: "ClickBooth",
        },
      });
    }
  });

  return baseFrames;
}

const defaultFrames: Frame[] = [
  { id: "none", name: "No Frame", src: "", category: "frame", type: "overlay" },

  // Default frames for fallback
  {
    id: "strip-vertical-2",
    name: "2 Photos Strip",
    src: "",
    category: "frame",
    type: "strip",
    stripConfig: {
      photoCount: 2,
      orientation: "vertical",
      spacing: 10,
      background: "#e0f2f1",
      branding: "clickbooth",
    },
  },
  {
    id: "strip-vertical-3",
    name: "3 Photos Strip",
    src: "",
    category: "frame",
    type: "strip",
    stripConfig: {
      photoCount: 3,
      orientation: "vertical",
      spacing: 10,
      background: "#e1f5fe",
      branding: "clickbooth",
    },
  },
  {
    id: "strip-vertical-4",
    name: "4 Photos Strip",
    src: "",
    category: "frame",
    type: "strip",
    stripConfig: {
      photoCount: 4,
      orientation: "vertical",
      spacing: 10,
      background: "#fce4ec",
      branding: "clickbooth",
    },
  },

  // Tambahkan frame baru di sini:
  // { id: "birthday", name: "Birthday Frame", src: "/frames/birthday.png", category: "frame", type: "overlay" },
  // { id: "wedding", name: "Wedding Frame", src: "/frames/wedding.png", category: "frame", type: "overlay" },

  // Tambahkan sticker di sini:
  // { id: "heart", name: "Heart Sticker", src: "/stickers/heart.png", category: "sticker", type: "overlay" },
  // { id: "star", name: "Star Sticker", src: "/stickers/star.png", category: "sticker", type: "overlay" },
  // { id: "emoji", name: "Emoji Sticker", src: "/stickers/emoji.png", category: "sticker", type: "overlay" },
];

export default function ComposePage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Layout data from session
  // Removed unused layoutData state
  const [availableFrames, setAvailableFrames] =
    useState<Frame[]>(defaultFrames);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<Frame>(defaultFrames[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TabCategory>("frame");

  // === AI States ===
  const [aiList, setAiList] = useState<AiType[]>([]);
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [size, setSize] = useState<string>("1024x1024");
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType>();

  // === Sharing States ===
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  // Load photos and layout data from sessionStorage when component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPhotos = sessionStorage.getItem("capturedPhotos");
      const savedLayout = sessionStorage.getItem("selectedLayout");

      if (savedPhotos) {
        const photos = JSON.parse(savedPhotos);
        setCapturedPhotos(photos);
      }

      if (savedLayout) {
        const layout = JSON.parse(savedLayout);
        // Generate frames based on layout shots count
        const framesForLayout = generateFramesForLayout(layout.shots);
        setAvailableFrames(framesForLayout);
        setSelectedFrame(framesForLayout[0]);
      }
    }
  }, []);

  // Fetch AI styles list (once)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/admin/ai");
        const data = await response.json();
        setAiList(data?.data || []);
      } catch (error) {
        console.error("Error fetching AI data:", error);
      }
    };
    fetchData();
  }, []);

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/me");
      const userData = await response.json();
      setCurrentUser(userData);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Check login session for sharing features
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const j = await res.json();
          setLoggedIn(Boolean(j?.authenticated));
        } else {
          setLoggedIn(false);
        }
      } catch {
        setLoggedIn(false);
      }
    }
    checkSession();
  }, []);

  // Load selected photo from URL params or sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const photo = params.get("photo");
    if (photo) {
      const decodedPhoto = decodeURIComponent(photo);
      setSelectedPhoto(decodedPhoto);
      return;
    }

    try {
      const composePayload = sessionStorage.getItem("composePayload");
      if (composePayload) {
        const payload = JSON.parse(composePayload);
        if (payload.finalImage) {
          setSelectedPhoto(payload.finalImage);
        } else if (payload.images && payload.images.length > 0) {
          setSelectedPhoto(payload.images[0]);
        }
      }
    } catch (e) {
      console.warn("Failed to load compose payload from sessionStorage", e);
    }
  }, []);

  // Redraw on updates
  useEffect(() => {
    if (selectedPhoto && canvasRef.current) {
      drawComposition();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhoto, selectedFrame]);

  const drawComposition = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (selectedFrame.type === "strip" && selectedFrame.stripConfig) {
      drawPhotoboothStrip(ctx, canvas);
    } else {
      drawRegularFrame(ctx, canvas);
    }
  };

  const drawPhotoboothStrip = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) => {
    const config = selectedFrame.stripConfig!;

    // Get multiple photos from sessionStorage
    let photos: string[] = [];
    try {
      const composePayload = sessionStorage.getItem("composePayload");
      if (composePayload) {
        const payload = JSON.parse(composePayload);
        photos = payload.images || (selectedPhoto ? [selectedPhoto] : []);
      } else {
        photos = selectedPhoto ? [selectedPhoto] : [];
      }
    } catch (e) {
      photos = selectedPhoto ? [selectedPhoto] : [];
    }

    // Ensure we have enough photos
    while (photos.length < config.photoCount && photos.length > 0) {
      photos.push(photos[0]);
    }
    if (photos.length === 0) return;

    // Calculate canvas size for strip
    const photoWidth = 300;
    const photoHeight = 200;
    const totalSpacing = (config.photoCount - 1) * config.spacing;
    const brandingHeight = 40;

    if (config.orientation === "vertical") {
      canvas.width = photoWidth + 40;
      canvas.height =
        photoHeight * config.photoCount + totalSpacing + brandingHeight + 40;
    } else {
      canvas.width = photoWidth * config.photoCount + totalSpacing + 40;
      canvas.height = photoHeight + brandingHeight + 40;
    }

    // Background
    ctx.fillStyle = config.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const loadedImages: Promise<HTMLImageElement>[] = photos
      .slice(0, config.photoCount)
      .map((photoSrc) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(img);
          img.src = photoSrc;
        });
      });

    Promise.all(loadedImages).then((images) => {
      images.forEach((img, index) => {
        if (config.orientation === "vertical") {
          const y = 20 + index * (photoHeight + config.spacing);
          ctx.drawImage(img, 20, y, photoWidth, photoHeight);
        } else {
          const x = 20 + index * (photoWidth + config.spacing);
          ctx.drawImage(img, x, 20, photoWidth, photoHeight);
        }
      });

      // Branding
      if (config.branding) {
        ctx.fillStyle = "#333";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center" as const;

        const brandingY =
          canvas.height - (config.orientation === "vertical" ? 15 : 10);
        ctx.fillText(config.branding, canvas.width / 2, brandingY);
      }
    });
  };

  const drawRegularFrame = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) => {
    canvas.width = 400;
    canvas.height = 300;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (selectedPhoto) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        if (selectedFrame.src) {
          const frameImg = new Image();
          frameImg.onload = () => {
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
          };
          frameImg.src = selectedFrame.src;
        }
      };
      img.src = selectedPhoto;
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `composed-photo-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // === Helper: canvas to File ===
  const canvasToFile = async (canvas: HTMLCanvasElement, filename: string) => {
    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b as Blob), "image/png")
    );
    return new File([blob], filename, { type: "image/png" });
  };

  // === Generate with AI using current preview (canvas) ===
  const handleGenerateAI = async () => {
    setAiErr(null);
    if (!canvasRef.current) return;
    if (!aiPrompt) {
      setAiErr("Pilih gaya AI terlebih dahulu.");
      return;
    }

    try {
      if (!currentUser) {
        Swal.fire({
          icon: "warning",
          title: "Please Login",
          text: "You need to be logged in to access the AI features.",
        });
        return;
      }

      if (currentUser.tokens <= 0) {
        Swal.fire({
          icon: "warning",
          title: "Insufficient Tokens",
          text: "You don't have enough tokens to use the AI feature. Please top up your tokens.",
        });
        return;
      }

      setIsGenerating(true);
      // Ambil image dari canvas saat ini agar frame/strip ikut terkirim
      const imageFile = await canvasToFile(
        canvasRef.current,
        `compose-${Date.now()}.png`
      );

      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("prompt", aiPrompt);
      formData.append("size", size);

      const response = await fetch("/api/style", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        setAiErr(text || "Failed to generate style");
        setIsGenerating(false);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Ganti foto terpilih dengan hasil AI
      setSelectedPhoto(url);
      setActiveCategory("frame"); // kembali ke tab frame untuk lanjut styling jika mau
      fetchCurrentUser(); // refresh user data (token)
    } catch (error: unknown) {
      console.error(error);
      if (typeof error === "object" && error !== null && "message" in error) {
        setAiErr((error as { message?: string }).message || "Unexpected error");
      } else {
        setAiErr("Unexpected error");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // === Sharing Functions ===
  async function ensureSession(): Promise<boolean> {
    if (loggedIn) return true;
    try {
      const r = await fetch("/api/me", {
        method: "GET",
        credentials: "include",
      });
      if (!r.ok) return false;
      const j = await r.json();
      const ok = Boolean(j?.authenticated);
      setLoggedIn(ok);
      return ok;
    } catch {
      return false;
    }
  }

  async function saveToCloudinary() {
    const canvas = canvasRef.current;
    if (!canvas) {
      setMessage("No photo to save");
      return null;
    }
    const ok = await ensureSession();
    if (!ok) {
      setMessage("Harus login untuk save foto.");
      setLoggedIn(false);
      return null;
    }
    setUploading(true);
    setMessage(null);
    try {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      const body = {
        imageData: dataUrl as string,
        sendToWhatsapp: false, // Only save, don't send WA
        filter: "none",
        shots: 1,
        layout: "composed",
      };
      const res = await fetch("/api/photos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        setMessage("Harus login untuk save foto.");
        setLoggedIn(false);
        setUploading(false);
        return null;
      }
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.message ?? "Save gagal");
        setUploading(false);
        return null;
      }
      setUploadedPhotoUrl(data.photo?.url ?? null);
      setMessage("Foto berhasil disimpan ke cloud storage!");
      return data;
    } catch (e) {
      console.error(e);
      setMessage("Save error.");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function shareToWhatsApp() {
    const canvas = canvasRef.current;
    if (!canvas) {
      setMessage("No photo to share");
      return null;
    }
    const ok = await ensureSession();
    if (!ok) {
      setMessage("Harus login untuk share ke WhatsApp.");
      setLoggedIn(false);
      return null;
    }
    setUploading(true);
    setMessage(null);
    try {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      const body: {
        imageData: string;
        sendToWhatsapp: boolean;
        filter: string;
        shots: number;
        layout: string;
      } = {
        imageData: dataUrl,
        sendToWhatsapp: true, // Request untuk share ke WhatsApp
        filter: "none",
        shots: 1,
        layout: "composed",
      };
      const res = await fetch("/api/photos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        setMessage("Harus login untuk share ke WhatsApp.");
        setLoggedIn(false);
        setUploading(false);
        return null;
      }
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.message ?? "Share gagal");
        setUploading(false);
        return null;
      }
      // Set URL untuk QR code jika ada foto baru
      if (data.isNewUpload && data.photo?.url) {
        setUploadedPhotoUrl(data.photo.url);
      }
      setMessage(data.message || "Foto berhasil dikirim ke WhatsApp!");
      return data;
    } catch (e) {
      console.error(e);
      setMessage("WhatsApp share error.");
      return null;
    } finally {
      setUploading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-coral-50 via-cream-50 to-sage-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-charcoal-600 font-semibold">Loading Composer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral-50 via-cream-50 to-sage-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-coral-600 via-coral-500 to-sage-500 shadow-xl">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-black text-white tracking-wide">
              🎨 COMPOSE EDITOR
            </h1>
            <button
              onClick={() => router.push("/booth")}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-white/30 backdrop-blur-sm"
            >
              ← Back to Booth
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {!selectedPhoto ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">📷</div>
            <h2 className="text-2xl font-bold text-charcoal-800 mb-4">
              No Photo Selected
            </h2>
            <p className="text-charcoal-600 mb-8">
              Please take a photo first at the booth
            </p>
            <button
              onClick={() => router.push("/booth")}
              className="bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-coral-400"
            >
              📸 Go to Photo Booth
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Panel - Canvas */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-sage-200/50">
              <h2 className="text-xl font-bold text-charcoal-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🖼️</span>
                Preview
              </h2>

              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-br from-charcoal-100 to-charcoal-200 p-4 rounded-xl shadow-inner">
                  <canvas
                    ref={canvasRef}
                    className="border-2 border-charcoal-300 rounded-lg shadow-lg"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </div>
              </div>

              {selectedPhoto && (
                <div className="space-y-6">
                  {/* Main Action Buttons */}
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={handleDownload}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-blue-400 flex items-center gap-2"
                    >
                      <span className="text-xl">💾</span>
                      Download
                    </button>

                    <button
                      onClick={saveToCloudinary}
                      disabled={uploading}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 border-2 border-purple-400 flex items-center gap-2"
                    >
                      <span className="text-xl">☁️</span>
                      {uploading ? "Saving..." : "Save to Cloud"}
                    </button>

                    <button
                      onClick={shareToWhatsApp}
                      disabled={uploading}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 border-2 border-green-400 flex items-center gap-2"
                    >
                      <span className="text-xl">�</span>
                      {uploading ? "Sending..." : "Share WhatsApp"}
                    </button>
                  </div>

                  {/* Message Alert */}
                  {message && (
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-2xl p-4 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse shadow-lg"></div>
                        <p className="text-sm font-bold text-blue-800">
                          {message}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* QR Code Section */}
                  {uploadedPhotoUrl && (
                    <div className="bg-gradient-to-br from-white to-cream-50 rounded-2xl shadow-xl border-4 border-coral-200 text-center p-6">
                      <h3 className="text-lg font-bold mb-4 text-charcoal-800 tracking-wide">
                        📱 QUICK ACCESS
                      </h3>
                      <div className="inline-block bg-white p-4 rounded-xl shadow-lg border-2 border-coral-200 mb-4">
                        <QRCodeCanvas
                          value={uploadedPhotoUrl}
                          size={150}
                          level="M"
                        />
                      </div>
                      <div>
                        <a
                          href={uploadedPhotoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 inline-block border-2 border-coral-400"
                        >
                          🔗 Open Photo
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Panel - Controls */}
            <div className="space-y-6">
              {/* Frame / Sticker / AI Selection */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-sage-200/50">
                <h3 className="text-lg font-bold text-charcoal-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">🎨</span>
                  Frames, Stickers & AI
                </h3>

                {/* Category Tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveCategory("frame")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      activeCategory === "frame"
                        ? "bg-gradient-to-r from-sage-500 to-sage-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    🖼️ Frames
                  </button>
                  <button
                    onClick={() => setActiveCategory("sticker")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      activeCategory === "sticker"
                        ? "bg-gradient-to-r from-sage-500 to-sage-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    ✨ Stickers
                  </button>
                  <button
                    onClick={() => setActiveCategory("ai")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      activeCategory === "ai"
                        ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    🤖 AI Styles
                  </button>
                </div>

                {/* Content per-tab */}
                {activeCategory === "ai" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">
                        Select AI Style
                      </label>
                      <p>Token : {currentUser?.tokens}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {aiList.map((ai) => (
                          <button
                            key={String(ai._id)}
                            onClick={() => setAiPrompt(ai.prompt)}
                            className={`p-3 rounded-full border-2 transition-all transform hover:scale-105 font-medium flex items-center gap-2 ${
                              aiPrompt === ai.prompt
                                ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-indigo-400 shadow-lg"
                                : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 hover:from-gray-200 hover:to-gray-300 shadow-md hover:shadow-lg"
                            }`}
                          >
                            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                              <img
                                src={ai.icon}
                                alt={ai.name}
                                className="w-full h-full object-cover"
                                width={24}
                                height={24}
                              />
                            </div>
                            <span className="flex-1 text-left text-sm">
                              {ai.name}
                            </span>
                            {aiPrompt === ai.prompt && (
                              <span className="text-sm">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {aiErr && (
                      <div className="text-red-600 text-sm">{aiErr}</div>
                    )}

                    <button
                      disabled={!selectedPhoto || !aiPrompt || isGenerating}
                      onClick={handleGenerateAI}
                      className={`w-full px-4 py-3 rounded-lg font-semibold border-2 transition-all shadow ${
                        isGenerating
                          ? "bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed"
                          : "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-indigo-400 hover:from-indigo-600 hover:to-indigo-700"
                      }`}
                    >
                      {isGenerating
                        ? "Processing…"
                        : "Generate Style from Preview"}
                    </button>

                    <p className="text-xs text-gray-500">
                      * Hasil AI akan menggantikan foto saat ini dan tetap bisa
                      diberi frame/sticker lagi.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {availableFrames
                      .filter(
                        (frame) =>
                          frame.category === activeCategory ||
                          frame.id === "none"
                      )
                      .map((frame) => (
                        <button
                          key={frame.id}
                          onClick={() => setSelectedFrame(frame)}
                          className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 font-medium ${
                            selectedFrame.id === frame.id
                              ? "bg-gradient-to-r from-sage-500 to-sage-600 text-white border-sage-400 shadow-lg"
                              : "bg-gradient-to-r from-charcoal-100 to-charcoal-200 text-charcoal-700 border-charcoal-300 hover:from-charcoal-200 hover:to-charcoal-300 shadow-md hover:shadow-lg"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                              {frame.type === "strip" ? (
                                <div className="flex flex-col gap-1">
                                  {Array(frame.stripConfig?.photoCount || 2)
                                    .fill(0)
                                    .map((_, i) => (
                                      <div
                                        key={i}
                                        className="w-2 h-1 bg-current rounded"
                                      ></div>
                                    ))}
                                </div>
                              ) : frame.src ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={frame.src}
                                  alt={frame.name}
                                  className="w-8 h-8 object-cover rounded"
                                />
                              ) : (
                                <span className="text-lg">🚫</span>
                              )}
                            </div>
                            <span className="flex-1 text-left">
                              {frame.name}
                              {frame.type === "strip" && (
                                <span className="block text-xs opacity-70">
                                  {frame.stripConfig?.photoCount} photos strip
                                </span>
                              )}
                            </span>
                            {selectedFrame.id === frame.id && (
                              <span className="text-lg">✓</span>
                            )}
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

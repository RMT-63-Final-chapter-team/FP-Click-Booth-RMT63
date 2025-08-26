"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

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

const frames: Frame[] = [
  { id: "none", name: "No Frame", src: "", category: "frame", type: "overlay" },

  // 🎯 Photobooth Strip Layouts (dijadikan frames)
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
      branding: "clickbooth"
    }
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
      branding: "clickbooth"
    }
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
      branding: "clickbooth"
    }
  }

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
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<Frame>(frames[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"frame" | "sticker">("frame");

  useEffect(() => {
    // Try to get photo from URL parameters first
    const params = new URLSearchParams(window.location.search);
    const photo = params.get("photo");
    if (photo) {
      const decodedPhoto = decodeURIComponent(photo);
      setSelectedPhoto(decodedPhoto);
      return;
    }

    // If no URL parameter, try to get from sessionStorage (from booth page)
    try {
      const composePayload = sessionStorage.getItem("composePayload");
      if (composePayload) {
        const payload = JSON.parse(composePayload);
        console.log("Compose payload:", payload);

        // First try to use finalImage (if photo was already composed)
        if (payload.finalImage) {
          setSelectedPhoto(payload.finalImage);
        }
        // Fallback to first image from captured images
        else if (payload.images && payload.images.length > 0) {
          setSelectedPhoto(payload.images[0]);
        }
      }
    } catch (e) {
      console.warn("Failed to load compose payload from sessionStorage", e);
    }
  }, []);

  useEffect(() => {
    if (selectedPhoto && canvasRef.current) {
      drawComposition();
    }
  }, [selectedPhoto, selectedFrame]);

  const drawComposition = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle photobooth strip layout
    if (selectedFrame.type === "strip" && selectedFrame.stripConfig) {
      drawPhotoboothStrip(ctx, canvas);
    } else {
      // Handle regular frame overlay
      drawRegularFrame(ctx, canvas);
    }
  };

  const drawPhotoboothStrip = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
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
      photos.push(photos[0]); // Duplicate first photo if not enough
    }

    if (photos.length === 0) return;

    // Calculate canvas size for strip
    const photoWidth = 300;
    const photoHeight = 200;
    const totalSpacing = (config.photoCount - 1) * config.spacing;
    const brandingHeight = 40;

    if (config.orientation === "vertical") {
      canvas.width = photoWidth + 40; // padding
      canvas.height = photoHeight * config.photoCount + totalSpacing + brandingHeight + 40;
    } else {
      canvas.width = photoWidth * config.photoCount + totalSpacing + 40;
      canvas.height = photoHeight + brandingHeight + 40;
    }

    // Clear and fill background
    ctx.fillStyle = config.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw photos
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

      // Draw branding
      if (config.branding) {
        ctx.fillStyle = "#333";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";

        if (config.orientation === "vertical") {
          const brandingY = canvas.height - 15;
          ctx.fillText(config.branding, canvas.width / 2, brandingY);
        } else {
          const brandingY = canvas.height - 10;
          ctx.fillText(config.branding, canvas.width / 2, brandingY);
        }
      }
    });
  };

  const drawRegularFrame = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Set canvas size
    canvas.width = 400;
    canvas.height = 300;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw photo
    if (selectedPhoto) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Draw frame if selected
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
            <h1 className="text-2xl font-black text-white tracking-wide">🎨 COMPOSE EDITOR</h1>
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
            <h2 className="text-2xl font-bold text-charcoal-800 mb-4">No Photo Selected</h2>
            <p className="text-charcoal-600 mb-8">Please take a photo first at the booth</p>
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
                <div className="flex justify-center">
                  <button
                    onClick={handleDownload}
                    className="bg-gradient-to-r from-sage-500 to-sage-600 hover:from-sage-600 hover:to-sage-700 text-white px-8 py-3 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-sage-400 flex items-center gap-2"
                  >
                    <span className="text-xl">📥</span>
                    Download Composition
                  </button>
                </div>
              )}
            </div>

            {/* Right Panel - Controls */}
            <div className="space-y-6">
              {/* Frame & Sticker Selection */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-sage-200/50">
                <h3 className="text-lg font-bold text-charcoal-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">🎨</span>
                  Frames & Stickers
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
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {frames
                    .filter((frame) => frame.category === activeCategory || frame.id === "none")
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
                                    <div key={i} className="w-2 h-1 bg-current rounded"></div>
                                  ))}
                              </div>
                            ) : frame.src ? (
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
                          {selectedFrame.id === frame.id && <span className="text-lg">✓</span>}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import React, { JSX, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const AVAILABLE_FILTERS: { id: string; label: string; css: string }[] = [
  { id: "none", label: "None", css: "none" },
  { id: "grayscale", label: "Grayscale", css: "grayscale(100%)" },
  { id: "sepia", label: "Sepia", css: "sepia(80%)" },
  { id: "bright", label: "Bright", css: "brightness(1.12)" },
];

const LAYOUTS = [
  { id: "single", label: "Single Photo", cols: 1, poses: 1 },
  { id: "double-vertical", label: "Double Vertical", cols: 1, poses: 2 },
  { id: "double-horizontal", label: "Double Horizontal", cols: 2, poses: 2 },
  { id: "triple-vertical", label: "Creative Collage", cols: 1, poses: 3 },
  { id: "quad-vertical", label: "Quad Vertical", cols: 1, poses: 4 },
  { id: "quad-horizontal", label: "Quad Horizontal", cols: 2, poses: 4 },
];

function LayoutPreview({ layoutId }: { layoutId: string }) {
  const layout = LAYOUTS.find((l) => l.id === layoutId) ?? LAYOUTS[0];
  const cols = layout.cols || 1;
  const poses = layout.poses;
  const boxes: JSX.Element[] = [];

  for (let i = 0; i < poses; i++) {
    boxes.push(
      <div
        key={i}
        className="bg-coral-100 border-2 border-coral-300 rounded flex items-center justify-center text-coral-700 text-xs font-bold shadow-sm"
        style={{
          width: cols === 1 ? "100%" : "48%",
          height: 16,
          margin: "2px",
        }}
      >
        {i + 1}
      </div>
    );
  }
  return (
    <div className="bg-gradient-to-br from-white to-cream-50 rounded-lg border-2 border-coral-200 shadow-lg p-3 w-24">
      <div
        className="flex flex-wrap justify-center items-center mb-2"
        style={{ minHeight: "50px" }}
      >
        {boxes}
      </div>
      <div className="text-xs text-coral-600 text-center font-bold bg-coral-50 rounded px-2 py-1">
        {layout.poses} poses
      </div>
    </div>
  );
}

export default function BoothPage() {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const [runningCountdown, setRunningCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isCapturing, setIsCapturing] = useState(false);

  const [shotsCount, setShotsCount] = useState<number>(LAYOUTS[0].poses);
  const [selectedLayout, setSelectedLayout] = useState<string>(LAYOUTS[0].id);
  const [selectedFilter, setSelectedFilter] = useState<string>("none");

  const [capturedDataUrls, setCapturedDataUrls] = useState<string[]>([]);
  const [previewCaptured, setPreviewCaptured] = useState<string | null>(null);
  const [finalComposed, setFinalComposed] = useState(false);
  const [savedPhotoId, setSavedPhotoId] = useState<string | null>(null);

  // This useEffect is no longer needed since we get shots directly from sessionStorage
  // useEffect(() => {
  //   const l = LAYOUTS.find((x) => x.id === selectedLayout);
  //   setShotsCount(l?.poses ?? 1);
  // }, [selectedLayout]);

  useEffect(() => {
    if (!previewCaptured) return;
    const c = canvasRef.current;
    if (!c) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = previewCaptured;
    img.onload = () => {
      c.width = img.naturalWidth || (videoRef.current?.videoWidth ?? 480);
      c.height = img.naturalHeight || (videoRef.current?.videoHeight ?? 360);
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
    };
    img.onerror = () => setPreviewCaptured(null);
  }, [previewCaptured]);

  useEffect(() => {
    let mounted = true;

    // Check if layout is selected from layout-selection page
    const savedLayout = sessionStorage.getItem("selectedLayout");
    if (!savedLayout) {
      // No layout selected, redirect to layout selection
      router.push("/layout-selection");
      return;
    }

    try {
      const layoutData = JSON.parse(savedLayout);
      setSelectedLayout(layoutData.id || "single");

      // Use shots directly from saved layout data
      const correctShotsCount = layoutData.shots || 1;
      setShotsCount(correctShotsCount);

      console.log("Layout loaded:", {
        layoutId: layoutData.id,
        savedShots: layoutData.shots,
        finalShotsCount: correctShotsCount,
      });
    } catch (e) {
      console.warn("Failed to load saved layout:", e);
      router.push("/layout-selection");
      return;
    }

    async function checkSession() {
      // Optional: still check session for other purposes if needed
      try {
        await fetch("/api/me", {
          method: "GET",
          credentials: "include",
        });
        if (!mounted) return;
        // Just continue without setting state
      } catch {
        /* ignore */
      }
    }
    checkSession(); // Start camera after layout is confirmed
    startCamera();

    return () => {
      mounted = false;
      stopCamera();
      clearTimer();
    };
  }, [router]);

  async function startCamera() {
    try {
      if (streamRef.current) {
        if (
          videoRef.current &&
          videoRef.current.srcObject !== streamRef.current
        ) {
          videoRef.current.srcObject = streamRef.current;
        }
        try {
          await videoRef.current?.play();
        } catch {}
        return;
      }
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.onloadedmetadata = () => {
          try {
            const vid = videoRef.current!;
            const canvas = canvasRef.current!;
            if (canvas && vid) {
              canvas.width = vid.videoWidth || 480;
              canvas.height = vid.videoHeight || 360;
            }
          } catch {}
        };
        try {
          await videoRef.current.play();
        } catch {}
      }
    } catch (e) {
      console.error("camera error", e);
      console.log("Gagal akses kamera.");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRunningCountdown(false);
    setCountdown(3);
  }

  function startCountdown() {
    if (runningCountdown) return;
    setCountdown(3);
    setRunningCountdown(true);
    timerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearTimer();
          takePhotoOnce();
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function ensureFreshFrame(): Promise<void> {
    await new Promise<void>((res) => {
      let done = false;
      const safeTimeout = window.setTimeout(() => {
        if (!done) {
          done = true;
          res();
        }
      }, 800); // Increased timeout for better frame refresh
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Additional frame wait
            if (!done) {
              done = true;
              clearTimeout(safeTimeout);
              res();
            }
          });
        });
      });
    });
  }

  async function captureOnceFromVideo(): Promise<string | null> {
    const vid = videoRef.current;
    if (!vid) return null;
    const w = vid.videoWidth || 480;
    const h = vid.videoHeight || 360;
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const ctx = off.getContext("2d");
    if (!ctx) return null;
    const filterCss =
      AVAILABLE_FILTERS.find((f) => f.id === selectedFilter)?.css ?? "none";
    (ctx as CanvasRenderingContext2D).filter = filterCss;
    ctx.drawImage(vid, 0, 0, w, h);
    return off.toDataURL("image/jpeg", 0.92);
  }

  async function takePhotoOnce() {
    if (!videoRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      await ensureFreshFrame();

      let dataUrl = await captureOnceFromVideo();
      if (!dataUrl) return;

      // retry a few times if identical to last saved (avoid duplicated identical captures)
      let tries = 0;
      while (tries < 4) {
        const last = capturedDataUrls[capturedDataUrls.length - 1] ?? null;
        if (!last || dataUrl !== last) {
          console.log("Photo accepted after", tries, "tries");
          break;
        }
        console.warn("Duplicate photo detected, retrying...", tries + 1);
        await new Promise((r) => setTimeout(r, 300)); // Increased delay
        await ensureFreshFrame();
        dataUrl = await captureOnceFromVideo();
        if (!dataUrl) return;
        tries++;
      }

      if (tries >= 4) {
        console.warn(
          "Could not get unique photo after 4 tries, using current capture"
        );
      }

      // append safely and trigger compose using the NEXT array (avoid reading stale state)
      setCapturedDataUrls((prev) => {
        const last = prev[prev.length - 1] ?? null;
        if (last === dataUrl) {
          console.warn("Skipping duplicate photo capture");
          return prev;
        }
        const next = [...prev, dataUrl];

        console.log("Photo captured:", {
          photoNumber: next.length,
          totalExpected: shotsCount,
          photoPreview: dataUrl.substring(0, 50) + "...",
          isUnique: !prev.includes(dataUrl),
          willTriggerCompose: next.length >= shotsCount,
        });

        // schedule side-effect with the concrete `next` array so composeFinal sees correct images
        setTimeout(() => {
          if (next.length >= shotsCount) {
            composeFinal(next).catch((e) => console.warn(e));
          } else {
            startCamera();
          }
        }, 250);

        return next;
      });

      setPreviewCaptured(dataUrl);
      setFinalComposed(false);
    } finally {
      setIsCapturing(false);
    }
  }

  async function composeFinal(imgsOverride?: string[]) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imgs = (imgsOverride ?? capturedDataUrls).slice(0, shotsCount);
    console.log("composeFinal called with:", {
      imageCount: imgs.length,
      expectedShots: shotsCount,
      selectedLayout: selectedLayout,
      imageSources: imgs.map((img, i) => `${i}: ${img.substring(0, 50)}...`),
    });

    if (imgs.length === 0) return;

    const loadImgs = imgs.map((d) => {
      const img = new Image();
      img.src = d;
      return new Promise<HTMLImageElement>((res) => {
        img.onload = () => res(img);
        img.onerror = () => res(img);
      });
    });
    const loaded = await Promise.all(loadImgs);
    const layout = LAYOUTS.find((l) => l.id === selectedLayout) ?? LAYOUTS[0];
    const cols = layout.cols || 1;
    const rows = Math.ceil(loaded.length / cols);
    const w = loaded[0].naturalWidth;
    const h = loaded[0].naturalHeight;
    canvas.width = w * cols;
    canvas.height = h * rows;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < loaded.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      ctx.drawImage(loaded[i], col * w, row * h, w, h);
    }
    setFinalComposed(true);
    setPreviewCaptured(null);
    stopCamera();

    // Auto-save photo to database for compose functionality
    await autoSavePhoto(canvas, imgs);

    // Save data to sessionStorage but don't auto-redirect
    try {
      const finalImage = canvas.toDataURL();
      const imagesToSave = (imgsOverride ?? capturedDataUrls).slice(
        0,
        shotsCount
      );
      const payload = {
        images: imagesToSave, // Use original data URLs
        layout: selectedLayout,
        filter: selectedFilter,
        shots: shotsCount,
        finalImage: finalImage,
      };

      console.log("Saving to sessionStorage:", {
        imageCount: imagesToSave.length,
        expectedShots: shotsCount,
        layout: selectedLayout,
        imagePreviews: imagesToSave.map(
          (img, i) => `${i}: ${img.substring(0, 50)}...`
        ),
      });

      sessionStorage.setItem("composePayload", JSON.stringify(payload));
    } catch (e) {
      console.warn("failed to save compose payload", e);
    }
  }

  // Auto-save photo to database for compose functionality
  async function autoSavePhoto(
    canvas: HTMLCanvasElement,
    imagesArray?: string[]
  ) {
    // Prevent double uploads
    if (savedPhotoId) {
      console.log("Photo already saved, skipping duplicate upload");
      return;
    }

    try {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      // Use provided images array or fallback to capturedDataUrls
      const imagesToSave = imagesArray || capturedDataUrls.slice(0, shotsCount);

      console.log("Auto-saving photo with data:", {
        totalCaptured: capturedDataUrls.length,
        expectedShots: shotsCount,
        imagesToSave: imagesToSave.length,
        layout: selectedLayout,
        usingProvidedArray: !!imagesArray,
      });

      const body = {
        imageData: dataUrl,
        sendToWhatsapp: false,
        filter: selectedFilter,
        shots: shotsCount,
        layout: selectedLayout,
        // Include individual images for better compose support
        images: imagesToSave,
        // Flag to skip Cloudinary upload for booth photos
        skipCloudinaryUpload: true,
      };

      const res = await fetch("/api/photos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.photo?._id) {
          setSavedPhotoId(data.photo._id);
          console.log("Photo auto-saved with ID:", data.photo._id);
        }
      }
    } catch (e) {
      console.warn("Auto-save failed:", e);
    }
  }

  function retakeCurrentShot() {
    setCapturedDataUrls((prev) => {
      const copy = [...prev];
      copy.pop();
      return copy;
    });
    setPreviewCaptured(null);
    startCamera();
  }

  function retakeAllPhotos() {
    setCapturedDataUrls([]);
    setPreviewCaptured(null);
    setFinalComposed(false);
    startCamera();
  }

  function goToEditPhotos() {
    if (savedPhotoId) {
      // Navigate with photo ID for DB-based compose
      router.push(`/compose?photoId=${savedPhotoId}`);
    } else {
      // Fallback to sessionStorage-based compose
      router.push("/compose");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100">
      {/* Main Camera Section */}
      <div className="container mx-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Camera Container */}
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-coral-200 overflow-hidden mb-6">
            {/* Camera Status Bar */}
            <div className="bg-gradient-to-r from-coral-500 to-coral-600 px-6 py-3">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                    <span className="font-bold text-sm tracking-wide">
                      CAMERA READY
                    </span>
                  </div>
                  {capturedDataUrls.length > 0 && (
                    <div className="bg-white/20 px-3 py-1 rounded-full">
                      <span className="text-xs font-bold">
                        {capturedDataUrls.length}/{shotsCount} CAPTURED
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-sm font-bold">
                  {!finalComposed ? "📸 PHOTO BOOTH" : "✨ COMPOSED"}
                </div>
              </div>
            </div>

            {/* Camera Display */}
            <div className="relative bg-gradient-to-br from-charcoal-800 to-charcoal-900 p-4">
              <div
                className="relative bg-black rounded-xl overflow-hidden shadow-inner border-4 border-charcoal-700"
                style={{ minHeight: "280px", aspectRatio: "16/10" }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    display:
                      finalComposed || previewCaptured ? "none" : "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter:
                      AVAILABLE_FILTERS.find((f) => f.id === selectedFilter)
                        ?.css ?? "none",
                  }}
                />
                <canvas
                  ref={canvasRef}
                  aria-hidden={!finalComposed && !previewCaptured}
                  style={{
                    display:
                      finalComposed || previewCaptured ? "block" : "none",
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    backgroundColor: "#000",
                  }}
                />

                {/* Countdown Overlay */}
                {!previewCaptured && !finalComposed && runningCountdown && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="bg-gradient-to-br from-coral-500 to-coral-600 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl border-4 border-white animate-pulse">
                      <span className="text-white text-2xl font-black">
                        {countdown}
                      </span>
                    </div>
                  </div>
                )}

                {/* Camera Controls */}
                {!previewCaptured && !finalComposed && !runningCountdown && (
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={startCamera}
                        className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-gray-500"
                      >
                        🎥 Start Camera
                      </button>
                      <button
                        onClick={startCountdown}
                        disabled={runningCountdown}
                        className="bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 text-white px-8 py-3 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 border-2 border-coral-400"
                      >
                        📸 CAPTURE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Camera Filter Section */}
          <div className="bg-gradient-to-r from-white to-cream-50 rounded-2xl shadow-xl border-4 border-coral-200 p-6 mb-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-charcoal-800 mb-4 tracking-wide">
                🎨 CAMERA FILTER
              </h3>
              <div className="flex justify-center">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-6 py-3 border-2 border-coral-300 rounded-full text-base font-medium bg-white focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-200 transition-all shadow-md hover:shadow-lg min-w-48"
                >
                  {AVAILABLE_FILTERS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Simplified Action Section */}
          {(previewCaptured || finalComposed) && (
            <div className="bg-gradient-to-r from-white to-cream-50 rounded-2xl shadow-xl border-4 border-coral-200 p-8 mb-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-charcoal-800 mb-2">
                  {previewCaptured && !finalComposed
                    ? "📷 Photo Captured!"
                    : finalComposed
                    ? "� All Photos Complete!"
                    : "✨ Session Complete!"}
                </h2>
                <p className="text-lg text-charcoal-600">
                  {previewCaptured && !finalComposed
                    ? "Review your photo and continue or retake"
                    : finalComposed
                    ? "What would you like to do next?"
                    : "Great work! Your photos are ready for editing and sharing"}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                {previewCaptured && !finalComposed && (
                  <>
                    <button
                      onClick={retakeCurrentShot}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:scale-110 border-2 border-orange-400"
                    >
                      🔄 Retake This Photo
                    </button>
                    {capturedDataUrls.length < shotsCount ? (
                      <button
                        onClick={() => {
                          setPreviewCaptured(null);
                          startCamera();
                        }}
                        className="bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:scale-110 border-2 border-coral-400"
                      >
                        ➡️ Continue to Next Photo ({capturedDataUrls.length}/
                        {shotsCount})
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          composeFinal().catch((e) => console.warn(e))
                        }
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:scale-110 border-2 border-green-400"
                      >
                        ✨ Complete Session
                      </button>
                    )}
                  </>
                )}
                {finalComposed && (
                  <>
                    <button
                      onClick={retakeAllPhotos}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:scale-110 border-2 border-red-400"
                    >
                      🔄 Retake All Photos
                    </button>
                    <button
                      onClick={goToEditPhotos}
                      className="bg-gradient-to-r from-sage-500 to-sage-600 hover:from-sage-600 hover:to-sage-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:scale-110 border-2 border-sage-400"
                    >
                      ✨ Edit Photos
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          {!previewCaptured && !finalComposed && (
            <div className="bg-gradient-to-br from-white to-cream-50 rounded-2xl shadow-xl border-4 border-coral-200 p-6">
              <h3 className="text-lg font-bold mb-6 text-center text-charcoal-800 tracking-wide">
                🎯 QUICK GUIDE
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-coral-500 to-coral-600 text-white w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center font-black text-xl shadow-lg border-4 border-white">
                    1
                  </div>
                  <h4 className="text-lg font-bold mb-2 text-charcoal-800">
                    Setup
                  </h4>
                  <p className="text-sm text-charcoal-600">
                    Choose layout & filter, then start camera
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-to-br from-sage-500 to-sage-600 text-white w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center font-black text-xl shadow-lg border-4 border-white">
                    2
                  </div>
                  <h4 className="text-lg font-bold mb-2 text-charcoal-800">
                    Capture
                  </h4>
                  <p className="text-sm text-charcoal-600">
                    Take photos with 3-second countdown
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-to-br from-charcoal-500 to-charcoal-600 text-white w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center font-black text-xl shadow-lg border-4 border-white">
                    3
                  </div>
                  <h4 className="text-lg font-bold mb-2 text-charcoal-800">
                    Continue
                  </h4>
                  <p className="text-sm text-charcoal-600">
                    Go to editor for advanced editing and sharing options
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

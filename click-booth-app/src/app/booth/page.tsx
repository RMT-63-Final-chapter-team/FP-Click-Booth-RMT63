"use client";
import React, { JSX, useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useRouter } from "next/navigation";

const AVAILABLE_FILTERS: { id: string; label: string; css: string }[] = [
  { id: "none", label: "None", css: "none" },
  { id: "grayscale", label: "Grayscale", css: "grayscale(100%)" },
  { id: "sepia", label: "Sepia", css: "sepia(80%)" },
  { id: "invert", label: "Invert", css: "invert(100%)" },
  { id: "bright", label: "Bright", css: "brightness(1.12)" }
];

const LAYOUTS = [
  { id: "layoutA", label: "layout A (3 poses)", cols: 1, poses: 3 },
  { id: "layoutB", label: "layout B (4 poses)", cols: 1, poses: 4 },
  { id: "layoutC", label: "layout C (2 poses)", cols: 1, poses: 2 },
  { id: "layoutD", label: "layout D (6 poses)", cols: 2, poses: 6 },
  { id: "studio", label: "Studio (4 poses)", cols: 1, poses: 4 }
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
          margin: "2px"
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

  const [loggedIn, setLoggedIn] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [shotsCount, setShotsCount] = useState<number>(LAYOUTS[0].poses);
  const [selectedLayout, setSelectedLayout] = useState<string>(LAYOUTS[0].id);
  const [selectedFilter, setSelectedFilter] = useState<string>("none");

  const [capturedDataUrls, setCapturedDataUrls] = useState<string[]>([]);
  const [previewCaptured, setPreviewCaptured] = useState<string | null>(null);
  const [finalComposed, setFinalComposed] = useState(false);

  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const l = LAYOUTS.find((x) => x.id === selectedLayout);
    setShotsCount(l?.poses ?? 1);
  }, [selectedLayout]);

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
    async function checkSession() {
      try {
        const res = await fetch("/api/me", { method: "GET", credentials: "include" });
        if (!mounted) return;
        if (res.ok) {
          const j = await res.json();
          setLoggedIn(Boolean(j?.authenticated));
          return;
        }
      } catch {
        /* ignore */
      }
      if (mounted) setLoggedIn(false);
    }
    checkSession();
    return () => {
      mounted = false;
      stopCamera();
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    try {
      if (streamRef.current) {
        if (videoRef.current && videoRef.current.srcObject !== streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
        try {
          await videoRef.current?.play();
        } catch {}
        return;
      }
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
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
      setMessage("Gagal akses kamera.");
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
      }, 500);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!done) {
            done = true;
            clearTimeout(safeTimeout);
            res();
          }
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
    const filterCss = AVAILABLE_FILTERS.find((f) => f.id === selectedFilter)?.css ?? "none";
    (ctx as CanvasRenderingContext2D).filter = filterCss;
    ctx.drawImage(vid, 0, 0, w, h);
    return off.toDataURL("image/jpeg", 0.92);
  }

  async function takePhotoOnce() {
    if (!videoRef.current) return;
    await ensureFreshFrame();

    let dataUrl = await captureOnceFromVideo();
    if (!dataUrl) return;

    // retry a few times if identical to last saved (avoid duplicated identical captures)
    let tries = 0;
    while (tries < 4) {
      const last = capturedDataUrls[capturedDataUrls.length - 1] ?? null;
      if (!last || dataUrl !== last) break;
      await new Promise((r) => setTimeout(r, 200));
      await ensureFreshFrame();
      dataUrl = await captureOnceFromVideo();
      if (!dataUrl) return;
      tries++;
    }

    // append safely and trigger compose using the NEXT array (avoid reading stale state)
    setCapturedDataUrls((prev) => {
      const last = prev[prev.length - 1] ?? null;
      if (last === dataUrl) return prev;
      const next = [...prev, dataUrl];

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
  }

  async function composeFinal(imgsOverride?: string[]) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imgs = (imgsOverride ?? capturedDataUrls).slice(0, shotsCount);
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

    // Don't automatically navigate to compose page
    // Let user see the result and choose actions (download, WhatsApp, QR)
    setMessage("Photo composed successfully! You can now download, share, or view QR code.");
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

  async function ensureSession(): Promise<boolean> {
    if (loggedIn) return true;
    try {
      const r = await fetch("/api/me", { method: "GET", credentials: "include" });
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
      const body: any = {
        imageData: dataUrl,
        sendToWhatsapp: false, // Only save, don't send WA
        filter: selectedFilter,
        shots: shotsCount,
        layout: selectedLayout
      };
      const res = await fetch("/api/photos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
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
      const body: any = {
        imageData: dataUrl,
        sendToWhatsapp: true, // Request untuk share ke WhatsApp
        filter: selectedFilter,
        shots: shotsCount,
        layout: selectedLayout
      };
      const res = await fetch("/api/photos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100">
      {/* Modern Header Controls */}
      <div className="bg-white shadow-lg border-b-4 border-coral-500">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Left Section - Layout & Filter */}
            <div className="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto">
              {/* Layout Selection */}
              <div className="flex flex-col items-center gap-2">
                <label className="text-sm font-bold text-charcoal-800 tracking-wide">LAYOUT</label>
                <select
                  value={selectedLayout}
                  onChange={(e) => setSelectedLayout(e.target.value)}
                  className="px-4 py-2 border-2 border-coral-300 rounded-full text-sm font-medium bg-white focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-200 transition-all shadow-md hover:shadow-lg min-w-48"
                >
                  {LAYOUTS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Selection */}
              <div className="flex flex-col items-center gap-2">
                <label className="text-sm font-bold text-charcoal-800 tracking-wide">FILTER</label>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-4 py-2 border-2 border-coral-300 rounded-full text-sm font-medium bg-white focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-200 transition-all shadow-md hover:shadow-lg min-w-36"
                >
                  {AVAILABLE_FILTERS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Center Section - Preview */}
            <div className="flex flex-col items-center gap-2">
              <label className="text-sm font-bold text-charcoal-800 tracking-wide">PREVIEW</label>
              <LayoutPreview layoutId={selectedLayout} />
            </div>

            {/* Right Section - Status */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3 bg-gradient-to-r from-coral-50 to-coral-100 px-4 py-2 rounded-full border-2 border-coral-200">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      loggedIn ? "bg-green-500" : "bg-orange-500"
                    } animate-pulse shadow-lg`}
                  ></div>
                  <span className="text-sm font-bold text-charcoal-800">
                    {loggedIn ? "Connected" : "Guest"}
                  </span>
                </div>
                <div className="h-4 w-px bg-coral-300"></div>
                <div className="text-sm font-bold text-coral-600 bg-white px-3 py-1 rounded-full border border-coral-300">
                  {shotsCount} shots
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                    <span className="font-bold text-sm tracking-wide">CAMERA READY</span>
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
                    display: finalComposed || previewCaptured ? "none" : "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: AVAILABLE_FILTERS.find((f) => f.id === selectedFilter)?.css ?? "none"
                  }}
                />
                <canvas
                  ref={canvasRef}
                  aria-hidden={!finalComposed && !previewCaptured}
                  style={{
                    display: finalComposed || previewCaptured ? "block" : "none",
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    backgroundColor: "#000"
                  }}
                />

                {/* Countdown Overlay */}
                {!previewCaptured && !finalComposed && runningCountdown && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="bg-gradient-to-br from-coral-500 to-coral-600 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl border-4 border-white animate-pulse">
                      <span className="text-white text-2xl font-black">{countdown}</span>
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

          {/* Action Buttons Section */}
          {(previewCaptured || finalComposed) && (
            <div className="bg-gradient-to-r from-white to-cream-50 rounded-2xl shadow-xl border-4 border-coral-200 p-6 mb-6">
              <div className="flex flex-wrap items-center justify-center gap-4">
                {previewCaptured && (
                  <>
                    <button
                      onClick={() => {
                        if (!previewCaptured) return;
                        const c = canvasRef.current!;
                        const img = new Image();
                        img.crossOrigin = "anonymous";
                        img.src = previewCaptured;
                        img.onload = () => {
                          c.width = img.naturalWidth;
                          c.height = img.naturalHeight;
                          const ctx = c.getContext("2d");
                          if (!ctx) return;
                          ctx.drawImage(img, 0, 0);
                          setFinalComposed(false);
                        };
                      }}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-blue-400"
                    >
                      Preview
                    </button>
                    <button
                      onClick={retakeCurrentShot}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-orange-400"
                    >
                      Retake
                    </button>
                    {capturedDataUrls.length < shotsCount ? (
                      <button
                        onClick={() => {
                          setPreviewCaptured(null);
                          startCamera();
                        }}
                        className="bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-coral-400"
                      >
                        Next ({capturedDataUrls.length}/{shotsCount})
                      </button>
                    ) : (
                      <button
                        onClick={() => composeFinal().catch((e) => console.warn(e))}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-green-400"
                      >
                        Compose
                      </button>
                    )}
                  </>
                )}
                {finalComposed && (
                  <>
                    <button
                      onClick={() => {
                        const c = canvasRef.current;
                        if (!c) return;
                        const url = c.toDataURL("image/jpeg", 0.92);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "photo-composed.jpg";
                        a.click();
                      }}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-blue-400"
                    >
                      💾 Download
                    </button>
                    <button
                      onClick={saveToCloudinary}
                      disabled={uploading}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 border-2 border-purple-400"
                    >
                      {uploading ? "Saving..." : "☁️ Save to Cloud"}
                    </button>
                    <button
                      onClick={shareToWhatsApp}
                      disabled={uploading}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 border-2 border-green-400"
                    >
                      {uploading ? "Sending..." : "📱 Share WhatsApp"}
                    </button>
                    <button
                      onClick={() => {
                        try {
                          const canvas = canvasRef.current;
                          let finalImage = null;

                          // If photo is already composed, get it from canvas
                          if (finalComposed && canvas) {
                            finalImage = canvas.toDataURL();
                          }
                          // If not composed yet, use the preview captured image
                          else if (previewCaptured) {
                            finalImage = previewCaptured;
                          }
                          // Fallback to first captured image
                          else if (capturedDataUrls.length > 0) {
                            finalImage = capturedDataUrls[0];
                          }

                          const payload = {
                            images: capturedDataUrls.slice(0, shotsCount),
                            layout: selectedLayout,
                            filter: selectedFilter,
                            shots: shotsCount,
                            finalImage: finalImage
                          };
                          sessionStorage.setItem("composePayload", JSON.stringify(payload));
                          router.push("/compose");
                        } catch (e) {
                          console.warn("failed to save compose payload", e);
                          setMessage("Gagal menyimpan data untuk compose.");
                        }
                      }}
                      className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-indigo-400"
                    >
                      🎨 Edit Compose
                    </button>
                    <button
                      onClick={() => {
                        setCapturedDataUrls([]);
                        setPreviewCaptured(null);
                        setFinalComposed(false);
                        setUploadedPhotoUrl(null);
                        setMessage(null);
                        startCamera();
                      }}
                      className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-gray-400"
                    >
                      🆕 New Session
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Message Alert */}
          {message && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-2xl p-4 mb-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse shadow-lg"></div>
                <p className="text-sm font-bold text-blue-800">{message}</p>
              </div>
            </div>
          )}

          {/* QR Code Section */}
          {uploadedPhotoUrl && (
            <div className="bg-gradient-to-br from-white to-cream-50 rounded-2xl shadow-xl border-4 border-coral-200 text-center p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 text-charcoal-800 tracking-wide">
                📱 QUICK ACCESS
              </h3>
              <div className="inline-block bg-white p-4 rounded-xl shadow-lg border-2 border-coral-200 mb-4">
                <QRCodeCanvas value={uploadedPhotoUrl} size={150} level="M" />
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
                  <h4 className="text-lg font-bold mb-2 text-charcoal-800">Setup</h4>
                  <p className="text-sm text-charcoal-600">
                    Choose layout & filter, then start camera
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-to-br from-sage-500 to-sage-600 text-white w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center font-black text-xl shadow-lg border-4 border-white">
                    2
                  </div>
                  <h4 className="text-lg font-bold mb-2 text-charcoal-800">Capture</h4>
                  <p className="text-sm text-charcoal-600">Take photos with 3-second countdown</p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-to-br from-charcoal-500 to-charcoal-600 text-white w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center font-black text-xl shadow-lg border-4 border-white">
                    3
                  </div>
                  <h4 className="text-lg font-bold mb-2 text-charcoal-800">Share</h4>
                  <p className="text-sm text-charcoal-600">
                    Compose, download & share via WhatsApp
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

"use client";
import React, { JSX, useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useRouter } from "next/navigation";

const AVAILABLE_FILTERS: { id: string; label: string; css: string }[] = [
  { id: "none", label: "None", css: "none" },
  { id: "grayscale", label: "Grayscale", css: "grayscale(100%)" },
  { id: "sepia", label: "Sepia", css: "sepia(80%)" },
  { id: "invert", label: "Invert", css: "invert(100%)" },
  { id: "bright", label: "Bright", css: "brightness(1.12)" },
];

const LAYOUTS = [
  { id: "layoutA", label: "layout A (3 poses)", cols: 1, poses: 3 },
  { id: "layoutB", label: "layout B (4 poses)", cols: 1, poses: 4 },
  { id: "layoutC", label: "layout C (2 poses)", cols: 1, poses: 2 },
  { id: "layoutD", label: "layout D (6 poses)", cols: 2, poses: 6 },
  { id: "studio", label: "Studio (4 poses)", cols: 1, poses: 4 },
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
        const res = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
        });
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
    const filterCss =
      AVAILABLE_FILTERS.find((f) => f.id === selectedFilter)?.css ?? "none";
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
    setMessage(
      "Photo composed successfully! You can now download, share, or view QR code."
    );
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
      const body: any = {
        imageData: dataUrl,
        sendToWhatsapp: false, // Only save, don't send WA
        filter: selectedFilter,
        shots: shotsCount,
        layout: selectedLayout,
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
      const body: any = {
        imageData: dataUrl,
        sendToWhatsapp: true, // Request untuk share ke WhatsApp
        filter: selectedFilter,
        shots: shotsCount,
        layout: selectedLayout,
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

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-amber-200 shadow-sm">
        <div className="container py-4">
          <h1 className="text-heading-2 text-center text-slate-800">
            📸 ClickBooth Studio
          </h1>
          <p className="text-center text-body mt-1 text-slate-600">
            Professional Photo Booth Experience
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {/* Camera/Photo Container */}
        <div className="card mb-8 overflow-hidden">
          {/* Status Bar */}
          <div className="bg-red-500 px-6 py-3">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    loggedIn ? "bg-green-400" : "bg-red-400"
                  } animate-pulse`}
                ></div>
                <span className="text-caption font-medium">
                  {loggedIn ? "Connected" : "Guest Mode"}
                </span>
              </div>

              {/* Filter Selection */}
              <div className="flex flex-col items-center gap-2">
                <label className="text-sm font-bold text-charcoal-800 tracking-wide">
                  FILTER
                </label>
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

          {/* Video/Canvas Area */}
          <div className="relative bg-slate-900 aspect-video">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${
                photoTaken ? "hidden" : "block"
              }`}
            />
            <canvas
              ref={canvasRef}
              aria-hidden={!photoTaken}
              className={`w-full h-full object-cover ${
                photoTaken ? "block" : "hidden"
              }`}
            />

            {/* Countdown Overlay */}
            {!photoTaken && runningCountdown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-red-500 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                  <span className="text-white text-6xl font-bold drop-shadow-lg">
                    {countdown}
                  </span>
                </div>
              </div>
            )}

            {/* Camera Controls Overlay */}
            {!photoTaken && !runningCountdown && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={startCamera}
                    className="bg-amber-100 text-slate-800 px-6 py-3 rounded-lg font-medium hover:bg-amber-200 transition-colors shadow-lg border border-amber-200"
                  >
                    🎥 Start Camera
                  </button>
                  <button
                    onClick={startCountdown}
                    disabled={runningCountdown}
                    className="bg-red-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                  >
                    📸 Capture Photo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {photoTaken && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <button
              onClick={downloadPhoto}
              className="bg-amber-100 text-slate-800 px-6 py-3 rounded-lg font-medium hover:bg-amber-200 transition-colors shadow-lg border border-amber-200 flex items-center justify-center space-x-2 group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">
                💾
              </span>
              <span>Download</span>
            </button>

            <button
              onClick={() => uploadPhoto(false)}
              disabled={uploading}
              className={`${
                uploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600"
              } text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg flex items-center justify-center space-x-2 group`}
              title={
                !loggedIn
                  ? "Login required for upload"
                  : "Save photo to gallery"
              }
            >
              <span className="text-xl group-hover:scale-110 transition-transform">
                ☁️
              </span>
              <span>{uploading ? "Uploading..." : "Save to Cloud"}</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              disabled={uploading}
              className={`${
                uploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600"
              } text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg flex items-center justify-center space-x-2 group`}
              title="Send to WhatsApp number in profile"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">
                📱
              </span>
              <span>{uploading ? "Sending..." : "Send WhatsApp"}</span>
            </button>

            <button
              onClick={retakePhoto}
              className="bg-amber-100 text-slate-800 px-6 py-3 rounded-lg font-medium hover:bg-amber-200 transition-colors shadow-lg border border-amber-200 flex items-center justify-center space-x-2 group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">
                🔄
              </span>
              <span>Retake</span>
            </button>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="text-body font-medium text-blue-800">{message}</p>
            </div>
          </div>
        )}

        {/* QR Code Section */}
        {uploadedPhotoUrl && (
          <div className="bg-white rounded-xl shadow-lg border border-amber-200 p-8 text-center mb-8">
            <h3 className="text-heading-3 mb-4 text-slate-800">
              📱 Quick Access
            </h3>
            <p className="text-body mb-6 text-slate-600">
              Scan QR code to view your photo on any device
            </p>

            <div className="inline-block bg-white p-6 rounded-2xl shadow-lg border border-amber-200 mb-6">
              <QRCodeCanvas value={uploadedPhotoUrl} size={200} level="M" />
            </div>

            <div>
              <a
                href={uploadedPhotoUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-red-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors shadow-lg inline-flex items-center space-x-2"
              >
                <span>🔗</span>
                <span>Open Photo</span>
              </a>
            </div>
          </div>
        )}

        {/* Getting Started Guide */}
        {!photoTaken && !runningCountdown && (
          <div className="bg-white rounded-xl shadow-lg border border-amber-200 p-8">
            <h3 className="text-heading-3 mb-6 text-center text-slate-800">
              🎯 How to Use
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  1
                </div>
                <h4 className="text-heading-5 mb-2 text-slate-800">
                  Start Camera
                </h4>
                <p className="text-body-small text-slate-600">
                  Click &ldquo;Start Camera&rdquo; to begin your photo session
                </p>
              </div>
              <div className="text-center">
                <div className="bg-amber-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  2
                </div>
                <h4 className="text-heading-5 mb-2 text-slate-800">
                  Capture Photo
                </h4>
                <p className="text-body-small text-slate-600">
                  Click &ldquo;Capture Photo&rdquo; and get ready for the
                  countdown
                </p>
              </div>
              <div className="text-center">
                <div className="bg-slate-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  3
                </div>
                <h4 className="text-heading-5 mb-2 text-slate-800">
                  Save & Share
                </h4>
                <p className="text-body-small text-slate-600">
                  Download, upload to cloud, or send via WhatsApp
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

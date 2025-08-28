"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { AiType, UserType } from "@/type";
import { dispatchTokenUpdate } from "@/helpers/tokenUpdateHelper";
import Swal from "sweetalert2";
import Image from "next/image";
import {
  Palette,
  ArrowLeft,
  Camera,
  Download,
  CloudUpload,
  MessageCircle,
  Trash2,
  Image as ImageIcon,
  Bot,
  Filter,
  AlertTriangle,
  ExternalLink,
  X,
  Check,
} from "lucide-react";

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

// Generate frames based on selected layout data with orientation awareness
function generateFramesForLayout(
  shotsCount: number,
  layoutId?: string
): Frame[] {
  const baseFrames: Frame[] = [
    {
      id: "none",
      name: "No Frame",
      src: "",
      category: "frame",
      type: "overlay",
    },
  ];

  // Determine layout orientation
  const isVerticalLayout =
    !layoutId ||
    layoutId.includes("vertical") ||
    layoutId === "single" ||
    layoutId === "triple-vertical";
  const isHorizontalLayout = layoutId?.includes("horizontal");

  console.log("Generating frames for layout:", {
    layoutId,
    shotsCount,
    isVerticalLayout,
    isHorizontalLayout,
  });

  // Color variations for strips
  const colorVariations = [
    { id: "coral", name: "Coral", background: "#ffeaa7", accent: "#fd79a8" },
    { id: "mint", name: "Mint", background: "#00b894", accent: "#00cec9" },
    { id: "blue", name: "Blue", background: "#74b9ff", accent: "#0984e3" },
    { id: "purple", name: "Purple", background: "#a29bfe", accent: "#6c5ce7" },
    { id: "pink", name: "Pink", background: "#fd79a8", accent: "#e84393" },
    { id: "orange", name: "Orange", background: "#fdcb6e", accent: "#e17055" },
    { id: "green", name: "Green", background: "#00b894", accent: "#00cec9" },
    { id: "sunset", name: "Sunset", background: "#fab1a0", accent: "#e17055" },
  ];

  // Generate frames based on layout orientation
  colorVariations.forEach((color) => {
    // For vertical layouts, ONLY vertical frames
    if (isVerticalLayout) {
      baseFrames.push({
        id: `strip-vertical-${shotsCount}-${color.id}`,
        name: `${shotsCount} Photos Vertical (${color.name})`,
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
    }

    // For horizontal layouts, ONLY horizontal frames
    if (isHorizontalLayout) {
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
  // const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Layout data from session
  // Removed unused layoutData state
  const [availableFrames, setAvailableFrames] =
    useState<Frame[]>(defaultFrames);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<Frame>(defaultFrames[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<TabCategory>("frame");

  // === AI States ===
  const [aiList, setAiList] = useState<AiType[]>([]);
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [size] = useState<string>("1024x1024");
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType>();

  // === Sharing States ===
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  // === DB Photo Data ===
  interface DbPhotoDataType {
    url?: string;
    images?: string[];
    shots?: number;
    layout?: string;
    [key: string]: unknown;
  }
  const [dbPhotoData, setDbPhotoData] = useState<DbPhotoDataType | null>(null);
  const [layoutInfo, setLayoutInfo] = useState<{
    shots: number;
    layout: string;
  } | null>(null);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  // const [originalPhotos, setOriginalPhotos] = useState<string[]>([]); // Store original photos without frames

  // === Rendering Control ===
  const [isRendering, setIsRendering] = useState(false);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load photos and layout data from DB (if photoId provided) or sessionStorage
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

    async function loadPhotoData() {
      if (typeof window === "undefined") return;

      // Get photoId once to prevent re-execution issues
      const urlParams = new URLSearchParams(window.location.search);
      const photoId = urlParams.get("photoId");

      if (photoId) {
        // Load from database
        try {
          console.log("Loading photo from DB with ID:", photoId);
          const response = await fetch(`/api/photos/${photoId}`);
          if (response.ok) {
            const data = await response.json();
            const photo = data.photo;

            if (!isMounted) return; // Exit if component unmounted

            setDbPhotoData(photo);

            // Set layout info from DB
            const shotsCount = photo.shots || 4;
            const layoutId = photo.layout || "layoutB";
            setLayoutInfo({ shots: shotsCount, layout: layoutId });

            // Generate frames based on DB layout data
            const framesForLayout = generateFramesForLayout(
              shotsCount,
              layoutId
            );
            setAvailableFrames(framesForLayout);
            setSelectedFrame(framesForLayout[0]);

            // For DB photos, use individual images if available, otherwise main photo
            if (photo.images && photo.images.length > 0) {
              setCapturedPhotos(photo.images);
              // setOriginalPhotos(photo.images); // Store original photos
              setSelectedPhoto(photo.images[0]);
            } else if (photo.url) {
              setCapturedPhotos([photo.url]);
              // setOriginalPhotos([photo.url]); // Store original photo
              setSelectedPhoto(photo.url);
            }

            console.log("Loaded photo from DB:", {
              photoId,
              shots: shotsCount,
              layout: layoutId,
              url: photo.url,
              imageCount: photo.images?.length || 0,
            });

            setIsLoading(false);
            return; // Exit early if DB load successful
          }
        } catch (error) {
          console.warn("Failed to load photo from DB:", error);
        }
      }

      if (!isMounted) return; // Exit if component unmounted

      // Fallback to sessionStorage (original behavior)
      console.log("Loading from sessionStorage");
      const savedPhotos = sessionStorage.getItem("capturedPhotos");
      const savedLayout = sessionStorage.getItem("selectedLayout");
      console.log("Saved Photos:", savedPhotos);
      const composePayload = sessionStorage.getItem("composePayload");

      if (composePayload) {
        try {
          const payload = JSON.parse(composePayload);
          const photos = payload.images || [];

          console.log("Loaded composePayload from sessionStorage:", {
            totalImages: photos.length,
            expectedShots: payload.shots,
            layout: payload.layout,
            imagePreviews: photos.map(
              (img: string, i: number) => `${i}: ${img.substring(0, 50)}...`
            ),
            allImagesUnique: photos.length === new Set(photos).size,
          });

          setCapturedPhotos(photos);
          // setOriginalPhotos(photos); // Store original photos from sessionStorage
          setLayoutInfo({
            shots: payload.shots || 4,
            layout: payload.layout || "layoutB",
          });

          // Generate frames based on sessionStorage data
          const framesForLayout = generateFramesForLayout(
            payload.shots || 4,
            payload.layout
          );
          setAvailableFrames(framesForLayout);
          setSelectedFrame(framesForLayout[0]);

          console.log("Photos loaded successfully from sessionStorage");
        } catch (e) {
          console.warn("Failed to load compose payload:", e);
        }
      } else {
        // Legacy fallback
        if (savedPhotos) {
          const photos = JSON.parse(savedPhotos);
          setCapturedPhotos(photos);
          // setOriginalPhotos(photos); // Store original photos
        }

        if (savedLayout) {
          const layout = JSON.parse(savedLayout);
          setLayoutInfo({ shots: layout.shots, layout: layout.id });
          // Generate frames based on layout shots count
          const framesForLayout = generateFramesForLayout(
            layout.shots,
            layout.id
          );
          setAvailableFrames(framesForLayout);
          setSelectedFrame(framesForLayout[0]);
        }
      }

      setIsLoading(false);
    }

    loadPhotoData();

    return () => {
      isMounted = false; // Cleanup to prevent state updates after unmount
      // Cleanup render timeout
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, []); // Remove searchParams dependency to prevent re-rendering

  // Fetch AI styles list (once)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/style/list");
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

      // Dispatch token update event with current tokens
      if (userData && typeof userData.tokens === "number") {
        dispatchTokenUpdate(userData.tokens);
      }
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

  // Redraw on updates with debounce to prevent multiple rapid calls
  useEffect(() => {
    if (selectedPhoto && canvasRef.current && !isLoading && !isRendering) {
      console.log("useEffect triggered for canvas render", {
        selectedPhoto: !!selectedPhoto,
        selectedFrameId: selectedFrame.id,
        aiGeneratedImage: !!aiGeneratedImage,
        isLoading,
        isRendering,
      });

      const timeoutId = setTimeout(() => {
        drawComposition();
      }, 200); // Increased debounce time

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedPhoto,
    selectedFrame.id,
    aiGeneratedImage,
    isLoading,
    isRendering,
  ]); // Use selectedFrame.id instead of whole object

  const drawComposition = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Prevent drawing if already rendering
    if (isRendering) {
      console.log("Skipping draw - already rendering");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    console.log("Drawing composition:", {
      frameType: selectedFrame.type,
      frameId: selectedFrame.id,
      hasAI: !!aiGeneratedImage,
    });

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

    console.log("Drawing strip frame:", {
      frameId: selectedFrame.id,
      frameName: selectedFrame.name,
      frameColor: selectedFrame.stripConfig?.background,
      hasAI: !!aiGeneratedImage,
      isRendering: isRendering,
      timestamp: Date.now(),
    });

    // Get photos from various sources (DB, sessionStorage, or current captured photos)
    let photos: string[] = [];

    // Check for AI generated image first, but preserve layout
    if (dbPhotoData && dbPhotoData.images && dbPhotoData.images.length > 0) {
      // Use individual photos from DB if available
      photos = dbPhotoData.images;
    } else if (dbPhotoData) {
      // For DB photos without individual images, use only the main photo (don't repeat)
      const mainPhoto = dbPhotoData.url || selectedPhoto;
      if (mainPhoto) {
        photos = [mainPhoto]; // Only use single photo, don't fill array
      }
    } else {
      // Use sessionStorage or captured photos (original behavior)
      try {
        const composePayload = sessionStorage.getItem("composePayload");
        if (composePayload) {
          const payload = JSON.parse(composePayload);
          photos =
            payload.images ||
            capturedPhotos ||
            (selectedPhoto ? [selectedPhoto] : []);
        } else {
          photos =
            capturedPhotos.length > 0
              ? capturedPhotos
              : selectedPhoto
              ? [selectedPhoto]
              : [];
        }
      } catch (e) {
        console.log("🚀 ~ drawPhotoboothStrip ~ e:", e);
        photos =
          capturedPhotos.length > 0
            ? capturedPhotos
            : selectedPhoto
            ? [selectedPhoto]
            : [];
      }
    }

    // Debug logging to track photo sources
    console.log("Drawing strip with photos:", {
      source: aiGeneratedImage
        ? "AI-overlay"
        : dbPhotoData?.images?.length
        ? "DB-images"
        : dbPhotoData
        ? "DB-main"
        : "sessionStorage",
      photoCount: photos.length,
      expectedCount: config.photoCount,
      hasAI: !!aiGeneratedImage,
      photos: photos.map((p, i) => `${i}: ${p.substring(0, 50)}...`),
    });

    // Don't duplicate photos - use only available photos
    if (photos.length === 0) return;

    // Use actual number of photos available instead of forcing config.photoCount
    const actualPhotoCount = Math.min(photos.length, config.photoCount);
    const photosToUse = photos.slice(0, actualPhotoCount);

    console.log("Photo count control:", {
      totalPhotosAvailable: photos.length,
      configPhotoCount: config.photoCount,
      actualPhotoCount: actualPhotoCount,
      photosToUseLength: photosToUse.length,
    });

    // Calculate canvas size for strip using actual photo count
    const photoWidth = 300;
    const photoHeight = 200;
    const totalSpacing = (actualPhotoCount - 1) * config.spacing;
    const brandingHeight = 40;

    if (config.orientation === "vertical") {
      canvas.width = photoWidth + 40;
      canvas.height =
        photoHeight * actualPhotoCount + totalSpacing + brandingHeight + 40;
    } else {
      canvas.width = photoWidth * actualPhotoCount + totalSpacing + 40;
      canvas.height = photoHeight + brandingHeight + 40;
    }

    // Background
    ctx.fillStyle = config.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Helper function to draw image proportionally (cover mode)
    const drawImageProportional = (
      img: HTMLImageElement,
      x: number,
      y: number,
      width: number,
      height: number,
      ctx: CanvasRenderingContext2D
    ) => {
      const imgAspect = img.width / img.height;
      const slotAspect = width / height;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.width;
      let sourceHeight = img.height;

      if (imgAspect > slotAspect) {
        // Image is wider than slot - crop horizontally
        sourceWidth = img.height * slotAspect;
        sourceX = (img.width - sourceWidth) / 2;
      } else {
        // Image is taller than slot - crop vertically
        sourceHeight = img.width / slotAspect;
        sourceY = (img.height - sourceHeight) / 2;
      }

      // Draw the cropped image to fit the slot perfectly
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight, // Source (cropped area)
        x,
        y,
        width,
        height // Destination (slot)
      );
    };

    const loadedImages: Promise<HTMLImageElement>[] = photosToUse.map(
      (photoSrc) => {
        return new Promise((resolve) => {
          const img = document.createElement("img");
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(img);
          img.src = photoSrc;
        });
      }
    );

    Promise.all(loadedImages).then((images) => {
      console.log("Images loaded for strip, applying layers:", {
        imageCount: images.length,
        actualPhotoCount: actualPhotoCount,
        expectedCount: config.photoCount,
        hasAI: !!aiGeneratedImage,
        frameId: selectedFrame.id,
        frameHasSrc: !!selectedFrame.src,
      });

      // IMPORTANT: If AI is available, DON'T draw original photos first
      // Only draw AI photos or original photos, not both

      // Conditional drawing: AI photos OR original photos (not both)
      const applyAIAndFrame = () => {
        if (aiGeneratedImage) {
          console.log("Drawing AI strip with cropped sections (no duplicates)");
          const aiImg = document.createElement("img");
          aiImg.crossOrigin = "anonymous";
          aiImg.onload = () => {
            // For strip with AI: crop different sections of AI image for each slot
            const aiWidth = aiImg.width;
            const aiHeight = aiImg.height;

            for (let index = 0; index < actualPhotoCount; index++) {
              let photoX, photoY;
              if (config.orientation === "vertical") {
                photoX = 20;
                photoY = 20 + index * (photoHeight + config.spacing);
              } else {
                photoX = 20 + index * (photoWidth + config.spacing);
                photoY = 20;
              }

              // Crop different sections of AI image for variety
              let sourceX, sourceY, sourceWidth, sourceHeight;

              if (config.orientation === "vertical") {
                // For vertical strips, crop horizontal sections
                sourceX = 0;
                sourceY = (index / actualPhotoCount) * aiHeight;
                sourceWidth = aiWidth;
                sourceHeight = aiHeight / actualPhotoCount;
              } else {
                // For horizontal strips, crop vertical sections
                sourceX = (index / actualPhotoCount) * aiWidth;
                sourceY = 0;
                sourceWidth = aiWidth / actualPhotoCount;
                sourceHeight = aiHeight;
              }

              // Draw cropped section of AI image proportionally
              const tempImg = document.createElement("img");
              tempImg.width = sourceWidth;
              tempImg.height = sourceHeight;

              // Create a temporary canvas to crop the AI image section
              const tempCanvas = document.createElement("canvas");
              tempCanvas.width = sourceWidth;
              tempCanvas.height = sourceHeight;
              const tempCtx = tempCanvas.getContext("2d");

              if (tempCtx) {
                tempCtx.drawImage(
                  aiImg,
                  sourceX,
                  sourceY,
                  sourceWidth,
                  sourceHeight,
                  0,
                  0,
                  sourceWidth,
                  sourceHeight
                );

                // Convert temp canvas to image and draw proportionally
                const croppedDataUrl = tempCanvas.toDataURL();
                const croppedImg = document.createElement("img");
                croppedImg.onload = () => {
                  drawImageProportional(
                    croppedImg,
                    photoX,
                    photoY,
                    photoWidth,
                    photoHeight,
                    ctx
                  );
                };
                croppedImg.src = croppedDataUrl;
              }
            }

            // Apply frame image if it exists (for hybrid frames)
            if (selectedFrame.src) {
              console.log("Applying frame image after AI:", selectedFrame.name);
              const frameImg = document.createElement("img");
              frameImg.onload = () => {
                ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
                console.log("Frame image applied successfully after AI");

                // Add logo + branding after frame
                drawLogoAndBranding(ctx, canvas, config);
              };
              frameImg.src = selectedFrame.src;
            } else {
              console.log("  Adding logo + branding after strip color overlay");
              // Add logo + branding after color overlay
              drawLogoAndBranding(ctx, canvas, config);
            }
          };
          aiImg.src = aiGeneratedImage;
        } else {
          // No AI - draw original photos ONLY with proportional scaling
          console.log(
            "Drawing original photos only (no AI) with proportional scaling"
          );
          images.slice(0, actualPhotoCount).forEach((img, index) => {
            let photoX, photoY;
            if (config.orientation === "vertical") {
              photoX = 20;
              photoY = 20 + index * (photoHeight + config.spacing);
            } else {
              photoX = 20 + index * (photoWidth + config.spacing);
              photoY = 20;
            }

            // Draw each image proportionally
            drawImageProportional(
              img,
              photoX,
              photoY,
              photoWidth,
              photoHeight,
              ctx
            );
          });

          // Apply frame if exists
          if (selectedFrame.src) {
            // Apply frame directly if no AI
            console.log("Applying frame without AI:", selectedFrame.name);
            const frameImg = document.createElement("img");
            frameImg.onload = () => {
              ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
              console.log("Frame applied successfully without AI");

              // Add logo + branding after frame
              drawLogoAndBranding(ctx, canvas, config);
            };
            frameImg.src = selectedFrame.src;
          } else {
            // Just logo + branding if no AI and no frame
            console.log("📝 Applying logo + branding only (no AI, no frame)");
            drawLogoAndBranding(ctx, canvas, config);
          }
        }
      };

      // Execute AI and frame application
      applyAIAndFrame();
    });
  };

  // Function to draw logo + branding text
  const drawLogoAndBranding = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    config: Frame["stripConfig"]
  ) => {
    if (!config || !config.branding) return;

    const brandingY =
      canvas.height - (config.orientation === "vertical" ? 15 : 10);
    const centerX = canvas.width / 2;

    // Try to load and draw logo first
    const logoImg = document.createElement("img");
    logoImg.crossOrigin = "anonymous";
    logoImg.onload = () => {
      // Draw logo with background handling
      const logoSize = 24;
      const logoX = centerX - 60; // Position logo to the left of text
      const logoY = brandingY - 18;

      // Option 1: Draw circular background to make logo stand out
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        logoX + logoSize / 2,
        logoY + logoSize / 2,
        logoSize / 2 + 2,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)"; // Semi-transparent white background
      ctx.fill();
      ctx.strokeStyle = "#ccc";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Draw logo (crop to reduce white background effect)
      const cropMargin = 6; // Crop pixels from each side
      ctx.drawImage(
        logoImg,
        cropMargin,
        cropMargin,
        logoImg.width - cropMargin * 2,
        logoImg.height - cropMargin * 2, // Source crop
        logoX + 3,
        logoY + 3,
        logoSize - 6,
        logoSize - 6 // Destination (smaller to fit in circle)
      );

      // Draw text next to logo
      ctx.fillStyle = "#333";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "left" as const;
      ctx.fillText(config.branding ?? "", logoX + logoSize + 8, brandingY);
    };
    logoImg.onerror = () => {
      // Fallback: just draw text if logo fails to load
      ctx.fillStyle = "#333";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center" as const;
      ctx.fillText(config.branding ?? "", centerX, brandingY);
    };
    logoImg.src = "/clickBooth.png"; // Use existing logo from public folder
  };

  const drawRegularFrame = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) => {
    // Get photos from various sources, similar to strip logic
    let photos: string[] = [];

    // Get original photos first, AI will be overlay
    if (dbPhotoData && dbPhotoData.images && dbPhotoData.images.length > 0) {
      photos = dbPhotoData.images;
    } else if (dbPhotoData) {
      const mainPhoto = dbPhotoData.url || selectedPhoto;
      if (mainPhoto) {
        photos = [mainPhoto];
      }
    } else {
      // Use sessionStorage or captured photos
      try {
        const composePayload = sessionStorage.getItem("composePayload");
        if (composePayload) {
          const payload = JSON.parse(composePayload);
          photos =
            payload.images ||
            capturedPhotos ||
            (selectedPhoto ? [selectedPhoto] : []);
        } else {
          photos =
            capturedPhotos.length > 0
              ? capturedPhotos
              : selectedPhoto
              ? [selectedPhoto]
              : [];
        }
      } catch (e) {
        console.log("🚀 ~ drawRegularFrame ~ e:", e);
        photos =
          capturedPhotos.length > 0
            ? capturedPhotos
            : selectedPhoto
            ? [selectedPhoto]
            : [];
      }
    }

    console.log("Drawing regular frame with photos:", {
      photoCount: photos.length,
      layoutInfo: layoutInfo,
      hasAI: !!aiGeneratedImage,
      photos: photos.map(
        (p: string, i: number) => `${i}: ${p.substring(0, 50)}...`
      ),
    });

    if (photos.length === 0) return;

    // For multiple photos, create a layout based on layoutInfo
    if (photos.length > 1 && layoutInfo) {
      drawMultiPhotoLayout(ctx, canvas, photos);
    } else {
      // Single photo layout
      // Set canvas size to match the image's natural size for proportional rendering
      const img = document.createElement("img");
      img.crossOrigin = "anonymous";
      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Apply AI generated image as overlay if available
        if (aiGeneratedImage) {
          const aiImg = document.createElement("img");
          aiImg.crossOrigin = "anonymous";
          aiImg.onload = () => {
            // Set canvas size to match AI image size for proportional rendering
            canvas.width = aiImg.naturalWidth;
            canvas.height = aiImg.naturalHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(aiImg, 0, 0, canvas.width, canvas.height);

            // Apply frame after AI overlay
            if (selectedFrame.src) {
              const frameImg = document.createElement("img");
              frameImg.onload = () => {
                ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
              };
              frameImg.src = selectedFrame.src;
            }
          };
          aiImg.src = aiGeneratedImage;
        } else if (selectedFrame.src) {
          // Apply frame directly if no AI
          const frameImg = document.createElement("img");
          frameImg.onload = () => {
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
          };
          frameImg.src = selectedFrame.src;
        }
      };
      img.src = photos[0];
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const photoToUse = photos[0];
      if (photoToUse) {
        const img = document.createElement("img");
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Apply AI generated image as overlay if available
          if (aiGeneratedImage) {
            const aiImg = document.createElement("img");
            aiImg.crossOrigin = "anonymous";
            aiImg.onload = () => {
              // Draw AI image over the original photo
              ctx.drawImage(aiImg, 0, 0, canvas.width, canvas.height);

              // Apply frame after AI overlay
              if (selectedFrame.src) {
                const frameImg = document.createElement("img");
                frameImg.onload = () => {
                  ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
                };
                frameImg.src = selectedFrame.src;
              }
            };
            aiImg.src = aiGeneratedImage;
          } else if (selectedFrame.src) {
            // Apply frame directly if no AI
            const frameImg = document.createElement("img");
            frameImg.onload = () => {
              ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
            };
            frameImg.src = selectedFrame.src;
          }
        };
        img.src = photoToUse;
      }
    }
  };

  const drawMultiPhotoLayout = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    photos: string[]
  ) => {
    if (!layoutInfo) return;

    const { shots, layout } = layoutInfo;
    const actualPhotoCount = Math.min(photos.length, shots);

    // Define layout configurations with reduced spacing
    type PhotoSlot = { x: number; y: number; width: number; height: number };
    type LayoutConfig = {
      canvasWidth: number;
      canvasHeight: number;
      photoSlots: PhotoSlot[];
    };
    const layoutConfigs: Record<string, LayoutConfig> = {
      "double-vertical": {
        canvasWidth: 400,
        canvasHeight: 520,
        photoSlots: [
          { x: 50, y: 50, width: 300, height: 200 },
          { x: 50, y: 270, width: 300, height: 200 },
        ],
      },
      "double-horizontal": {
        canvasWidth: 520,
        canvasHeight: 400,
        photoSlots: [
          { x: 50, y: 100, width: 200, height: 200 },
          { x: 270, y: 100, width: 200, height: 200 },
        ],
      },
      "triple-vertical": {
        canvasWidth: 400,
        canvasHeight: 690,
        photoSlots: [
          { x: 50, y: 50, width: 300, height: 200 },
          { x: 50, y: 270, width: 300, height: 200 },
          { x: 50, y: 490, width: 300, height: 200 },
        ],
      },
      "quad-vertical": {
        canvasWidth: 400,
        canvasHeight: 860,
        photoSlots: [
          { x: 50, y: 50, width: 300, height: 175 },
          { x: 50, y: 245, width: 300, height: 175 },
          { x: 50, y: 440, width: 300, height: 175 },
          { x: 50, y: 635, width: 300, height: 175 },
        ],
      },
      "quad-horizontal": {
        canvasWidth: 680,
        canvasHeight: 400,
        photoSlots: [
          { x: 50, y: 100, width: 150, height: 200 },
          { x: 220, y: 100, width: 150, height: 200 },
          { x: 390, y: 100, width: 150, height: 200 },
          { x: 560, y: 100, width: 150, height: 200 },
        ],
      },
    };

    const config = layoutConfigs[layout] || layoutConfigs["quad-vertical"];

    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Helper function to draw image proportionally (cover mode)
    const drawImageProportional = (
      img: HTMLImageElement,
      slot: PhotoSlot,
      ctx: CanvasRenderingContext2D
    ) => {
      const imgAspect = img.width / img.height;
      const slotAspect = slot.width / slot.height;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.width;
      let sourceHeight = img.height;

      if (imgAspect > slotAspect) {
        // Image is wider than slot - crop horizontally
        sourceWidth = img.height * slotAspect;
        sourceX = (img.width - sourceWidth) / 2;
      } else {
        // Image is taller than slot - crop vertically
        sourceHeight = img.width / slotAspect;
        sourceY = (img.height - sourceHeight) / 2;
      }

      // Draw the cropped image to fit the slot perfectly
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight, // Source (cropped area)
        slot.x,
        slot.y,
        slot.width,
        slot.height // Destination (slot)
      );
    };

    // Draw photos
    let loadedCount = 0;
    const totalToLoad = actualPhotoCount;

    for (let i = 0; i < actualPhotoCount; i++) {
      const photo = photos[i];
      const slot = config.photoSlots[i];

      if (photo && slot) {
        const img = document.createElement("img");
        img.crossOrigin = "anonymous";
        img.onload = () => {
          // Draw image proportionally to maintain aspect ratio
          drawImageProportional(img, slot, ctx);
          loadedCount++;

          // Apply AI and frame after all photos are loaded
          if (loadedCount === totalToLoad) {
            // Apply AI generated image as overlay if available
            if (aiGeneratedImage) {
              const aiImg = document.createElement("img");
              aiImg.crossOrigin = "anonymous";
              aiImg.onload = () => {
                // Draw AI image over the entire canvas as styled version
                ctx.drawImage(aiImg, 0, 0, canvas.width, canvas.height);

                // Apply frame after AI overlay
                if (selectedFrame.src) {
                  const frameImg = document.createElement("img");
                  frameImg.onload = () => {
                    ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
                  };
                  frameImg.src = selectedFrame.src;
                }
              };
              aiImg.src = aiGeneratedImage;
            } else if (selectedFrame.src) {
              // Apply frame directly if no AI
              const frameImg = document.createElement("img");
              frameImg.onload = () => {
                ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
              };
              frameImg.src = selectedFrame.src;
            }
          }
        };
        img.src = photo;
      }
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

  // === Handle frame change to prevent stacking ===
  const handleFrameChange = (frame: Frame) => {
    console.log("Frame change requested:", {
      from: selectedFrame.name,
      to: frame.name,
      hasAI: !!aiGeneratedImage,
      isRendering: isRendering,
    });

    // Prevent multiple simultaneous renders
    if (isRendering) {
      console.log("⏳ Render in progress, ignoring frame change");
      return;
    }

    setIsRendering(true);

    // Clear any pending timeouts
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    setSelectedFrame(frame);

    // Allow render to complete before accepting new changes - increased timeout
    renderTimeoutRef.current = setTimeout(() => {
      setIsRendering(false);
      console.log("Frame change complete, ready for next change");
    }, 300); // Increased from 100ms to 300ms

    // DON'T reset photos - this causes duplication
    // The canvas render function will handle frame overlay properly
    // Keep AI generated image when changing frames
  };

  // === Remove Frame Function ===
  const handleRemoveFrame = () => {
    const noFrame = availableFrames.find((f) => f.id === "none");
    if (noFrame) {
      setSelectedFrame(noFrame);
      // Clear AI generated image to go back to original
      setAiGeneratedImage(null);
    }
  };

  // === Generate with AI using current preview (canvas) ===
  const handleGenerateAI = async (bypassFrameCheck = false) => {
    setAiErr(null);
    if (!canvasRef.current) return;
    if (!aiPrompt) {
      setAiErr("Pilih gaya AI terlebih dahulu.");
      return;
    }

    // RULE: User must use "No Frame" before AI generation to prevent duplication
    if (!bypassFrameCheck && selectedFrame.id !== "none") {
      Swal.fire({
        icon: "warning",
        title: "Remove Frame First",
        text: "Harap pilih 'No Frame' terlebih dahulu sebelum generate AI untuk mencegah duplikasi frame.",
        confirmButtonText: "Auto Remove Frame",
        showCancelButton: true,
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          // Auto set to "No Frame" and retry
          const noFrame = availableFrames.find((f) => f.id === "none");
          if (noFrame) {
            setSelectedFrame(noFrame);
            // Retry AI generation after frame is removed with bypass flag
            setTimeout(() => handleGenerateAI(true), 500);
          }
        }
      });
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
          confirmButtonText: "Go to Payment",
          showCancelButton: true,
          cancelButtonText: "Cancel",
        }).then((result) => {
          if (result.isConfirmed) {
            router.push("/payment");
          }
        });
        return;
      }

      setIsGenerating(true);
      // Use current canvas for AI generation (should be frame-free at this point)
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

      // Save AI generated image - DON'T change selectedPhoto to preserve original layout
      setAiGeneratedImage(url);
      // Keep selectedPhoto unchanged to maintain layout integrity

      console.log("AI Generation completed:", {
        aiImageUrl: url.substring(0, 50) + "...",
        currentFrame: selectedFrame.id,
        layoutInfo: layoutInfo,
      });

      // DON'T reset capturedPhotos - keep original layout structure
      // AI result will be handled in canvas drawing logic

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

    // Wait for canvas to be fully rendered
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

      // Get current layout info for proper data structure
      const currentShots = layoutInfo?.shots || capturedPhotos.length || 1;
      const currentLayout = layoutInfo?.layout || "composed";

      const body = {
        imageData: dataUrl as string,
        sendToWhatsapp: false, // Only save, don't send WA
        filter: "none",
        shots: currentShots,
        layout: currentLayout,
        skipCloudinaryUpload: false, // Ensure cloud upload for compose
      };

      console.log("Saving to cloud with data:", {
        shots: body.shots,
        layout: body.layout,
        imageSize: dataUrl.length,
        hasAI: !!aiGeneratedImage,
        frameId: selectedFrame.id,
      });

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

    // Wait for canvas to be fully rendered
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

      // Get current layout info for proper data structure
      const currentShots = layoutInfo?.shots || capturedPhotos.length || 1;
      const currentLayout = layoutInfo?.layout || "composed";

      const body: {
        imageData: string;
        sendToWhatsapp: boolean;
        filter: string;
        shots: number;
        layout: string;
        skipCloudinaryUpload: boolean;
      } = {
        imageData: dataUrl,
        sendToWhatsapp: true, // Request untuk share ke WhatsApp
        filter: "none",
        shots: currentShots,
        layout: currentLayout,
        skipCloudinaryUpload: false, // Ensure cloud upload for sharing
      };

      console.log("Sharing to WhatsApp with data:", {
        shots: body.shots,
        layout: body.layout,
        imageSize: dataUrl.length,
        hasAI: !!aiGeneratedImage,
        frameId: selectedFrame.id,
      });

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-16">
      {/* Main Content */}
      <div className="container mx-auto px-6 py-1 max-w-7xl">
        {/* Header as Content */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 mb-8">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-red-600 bg-clip-text text-transparent">
                    Photo Editor
                  </h1>
                  <p className="text-slate-600 font-medium">
                    Customize your photos with frames and AI effects
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/booth")}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 hover:text-slate-900 rounded-2xl font-semibold text-sm transition-all duration-200 border border-slate-200 hover:border-slate-300 shadow-lg hover:shadow-xl"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Booth
              </button>
            </div>
          </div>
        </div>

        {!selectedPhoto ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Camera className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              No Photo Selected
            </h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
              Take a photo first at the booth to start editing and customizing
              your images
            </p>
            <button
              onClick={() => router.push("/booth")}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Camera className="w-5 h-5" />
              Go to Photo Booth
            </button>
          </div>
        ) : (
          <div className="grid xl:grid-cols-5 lg:grid-cols-3 gap-8">
            {/* Left Panel - Canvas (Sticky) */}
            <div className="xl:col-span-3 lg:col-span-2">
              <div className="sticky top-20 bg-white rounded-3xl shadow-lg border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Preview
                    </h2>
                  </div>
                </div>

                <div className="flex justify-center mb-8">
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl shadow-inner border border-slate-200">
                    <canvas
                      ref={canvasRef}
                      className="border border-slate-300 rounded-xl shadow-lg bg-white"
                      style={{ maxWidth: "100%", height: "auto" }}
                    />
                    {/* <img src={dbPhotoData?.images[0]} alt="" /> */}
                  </div>
                </div>

                {selectedPhoto && (
                  <div className="space-y-4">
                    {/* Main Action Buttons - Single Row */}
                    <div className="flex gap-2 justify-center flex-wrap">
                      <button
                        onClick={handleDownload}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>

                      <button
                        onClick={saveToCloudinary}
                        disabled={uploading}
                        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                      >
                        <CloudUpload className="w-4 h-4" />
                        {uploading ? "Saving..." : "Save to Cloud"}
                      </button>

                      <button
                        onClick={shareToWhatsApp}
                        disabled={uploading}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {uploading ? "Sending..." : "Share WhatsApp"}
                      </button>

                      {/* Remove Frame/AI Button */}
                      {(selectedFrame.id !== "none" || aiGeneratedImage) && (
                        <button
                          onClick={handleRemoveFrame}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          {aiGeneratedImage
                            ? "Remove AI & Frame"
                            : "Remove Frame"}
                        </button>
                      )}
                    </div>

                    {/* Message Alert - Smaller Size */}
                    {message && (
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                          <p className="text-xs font-medium text-blue-700">
                            {message}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Controls (Scrollable) */}
            <div className="xl:col-span-2 lg:col-span-1">
              <div className="h-screen overflow-y-auto pb-20 pr-2 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                {/* Frame / Sticker / AI Selection */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Filter className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Customization
                    </h3>
                  </div>

                  {/* Category Tabs */}
                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={() => setActiveCategory("frame")}
                      className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                        activeCategory === "frame"
                          ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg border border-purple-300"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Frames
                    </button>
                    {/* <button
                    onClick={() => setActiveCategory("sticker")}
                    className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                      activeCategory === "sticker"
                        ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg border border-purple-300"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <span className="text-base mr-2">✨</span>
                    Stickers
                  </button> */}
                    <button
                      onClick={() => setActiveCategory("ai")}
                      className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                        activeCategory === "ai"
                          ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg border border-purple-300"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      AI Style
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
                        <div className="grid grid-cols-2 gap-2">
                          {aiList.map((ai) => (
                            <button
                              key={String(ai._id)}
                              onClick={() => setAiPrompt(ai.prompt)}
                              className={`p-2 rounded-lg border transition-all hover:scale-105 text-xs flex items-center gap-2 ${
                                aiPrompt === ai.prompt
                                  ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-400 shadow-md"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm"
                              }`}
                            >
                              <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                                <Image
                                  src={ai.icon}
                                  alt={ai.name}
                                  className="w-full h-full object-cover"
                                  width={16}
                                  height={16}
                                />
                              </div>
                              <span className="flex-1 text-left truncate">
                                {ai.name}
                              </span>
                              {aiPrompt === ai.prompt && (
                                <span className="text-xs">✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {aiErr && (
                        <div className="text-red-600 text-sm">{aiErr}</div>
                      )}

                      {/* Frame Warning */}
                      {selectedFrame.id !== "none" && (
                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            <p className="text-sm text-yellow-800 font-medium">
                              Pilih No Frame terlebih dahulu sebelum generate AI
                              untuk mencegah duplikasi frame.
                            </p>
                          </div>
                        </div>
                      )}

                      <button
                        disabled={!selectedPhoto || !aiPrompt || isGenerating}
                        onClick={() => handleGenerateAI()}
                        className={`w-full px-4 py-3 rounded-lg font-semibold border-2 transition-all shadow ${
                          isGenerating
                            ? "bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed"
                            : selectedFrame.id !== "none"
                            ? "bg-yellow-500 text-white border-yellow-400 hover:bg-yellow-600"
                            : "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-indigo-400 hover:from-indigo-600 hover:to-indigo-700"
                        }`}
                      >
                        {isGenerating
                          ? "Processing…"
                          : selectedFrame.id !== "none"
                          ? "Remove Frame & Generate"
                          : "Generate Style from Preview"}
                      </button>

                      <p className="text-xs text-gray-500">
                        Hasil AI akan menggantikan foto saat ini dan tetap bisa
                        diberi frame/sticker lagi. Pastikan pilih No Frame
                        terlebih dahulu untuk hasil terbaik.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availableFrames
                        .filter(
                          (frame) =>
                            frame.category === activeCategory ||
                            frame.id === "none"
                        )
                        .map((frame) => (
                          <button
                            key={frame.id}
                            onClick={() => handleFrameChange(frame)}
                            className={`p-2 rounded-lg border transition-all hover:scale-105 text-xs ${
                              selectedFrame.id === frame.id
                                ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-400 shadow-md"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center flex-shrink-0">
                                {frame.type === "strip" ? (
                                  <div className="flex flex-col gap-0.5">
                                    {Array(
                                      Math.min(
                                        frame.stripConfig?.photoCount || 2,
                                        3
                                      )
                                    )
                                      .fill(0)
                                      .map((_, i) => (
                                        <div
                                          key={i}
                                          className="w-1.5 h-0.5 bg-current rounded"
                                        ></div>
                                      ))}
                                  </div>
                                ) : frame.src ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={frame.src}
                                    alt={frame.name}
                                    className="w-4 h-4 object-cover rounded"
                                  />
                                ) : (
                                  <X className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-left truncate">
                                  {frame.name}
                                  {frame.type === "strip" && (
                                    <span className="block text-xs opacity-70">
                                      {frame.stripConfig?.photoCount} photos
                                      strip
                                    </span>
                                  )}
                                </div>
                              </div>
                              {selectedFrame.id === frame.id && (
                                <Check className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* QR Code Section */}
                {uploadedPhotoUrl && (
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <ExternalLink className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Quick Access
                      </h3>
                    </div>

                    <div className="text-center">
                      <div className="inline-block bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl shadow-inner border border-slate-200 mb-4">
                        <QRCodeCanvas
                          value={uploadedPhotoUrl}
                          size={120}
                          level="M"
                          className="block"
                        />
                      </div>
                      <div>
                        <a
                          href={uploadedPhotoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open Photo
                        </a>
                      </div>
                    </div>
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

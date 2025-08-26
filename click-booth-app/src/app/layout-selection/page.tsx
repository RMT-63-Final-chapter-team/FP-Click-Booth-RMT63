"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const layouts = [
  {
    id: "single",
    name: "Single Photo",
    shots: 1,
    description: "Perfect for portraits and selfies",
    icon: "📷",
    preview: "/frames/single-preview.png",
  },
  {
    id: "double-vertical",
    name: "Double Vertical",
    shots: 2,
    description: "Two photos stacked vertically",
    icon: "📸",
    preview: "/frames/double-vertical-preview.png",
  },
  {
    id: "double-horizontal",
    name: "Double Horizontal",
    shots: 2,
    description: "Two photos side by side",
    icon: "🖼️",
    preview: "/frames/double-horizontal-preview.png",
  },
  {
    id: "quad",
    name: "Quad Layout",
    shots: 4,
    description: "Classic photo booth strip",
    icon: "🎞️",
    preview: "/frames/quad-preview.png",
  },
  {
    id: "collage",
    name: "Creative Collage",
    shots: 3,
    description: "Artistic arrangement",
    icon: "🎨",
    preview: "/frames/collage-preview.png",
  },
];

export default function LayoutSelectionPage() {
  const [selectedLayout, setSelectedLayout] = useState<string>("");
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();

  const handleLayoutSelect = (layoutId: string) => {
    setSelectedLayout(layoutId);
  };

  const handleStartSession = () => {
    if (!selectedLayout) {
      alert("Please select a layout first!");
      return;
    }

    setIsAnimating(true);

    // Save layout selection to sessionStorage
    const selectedLayoutData = layouts.find((l) => l.id === selectedLayout);
    if (selectedLayoutData) {
      sessionStorage.setItem(
        "selectedLayout",
        JSON.stringify({
          id: selectedLayoutData.id,
          shots: selectedLayoutData.shots,
          name: selectedLayoutData.name,
        })
      );
    }

    // Delay navigation for smooth animation
    setTimeout(() => {
      router.push("/booth");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral-50 via-sage-50 to-cream-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <h1 className="text-5xl font-black text-charcoal-800 mb-4 bg-gradient-to-r from-coral-600 to-sage-600 bg-clip-text text-transparent">
              🎭 Choose Your Layout
            </h1>
            <p className="text-xl text-charcoal-600 max-w-2xl mx-auto leading-relaxed">
              Select the perfect layout for your photo session. Each layout
              offers a unique way to capture and display your memories.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-coral-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <span className="text-coral-600 font-semibold">
                Choose Layout
              </span>
            </div>
            <div className="w-12 h-1 bg-gray-300 rounded"></div>
            <div className="flex items-center space-x-2 opacity-50">
              <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <span className="text-gray-500 font-semibold">Photo Booth</span>
            </div>
          </div>
        </div>

        {/* Layout Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {layouts.map((layout) => (
            <div
              key={layout.id}
              onClick={() => handleLayoutSelect(layout.id)}
              className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                selectedLayout === layout.id
                  ? "ring-4 ring-coral-500 ring-offset-4 ring-offset-white"
                  : "hover:ring-2 hover:ring-sage-400 hover:ring-offset-2 hover:ring-offset-white"
              }`}
            >
              {/* Selection Indicator */}
              {selectedLayout === layout.id && (
                <div className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-coral-500 text-white rounded-full flex items-center justify-center shadow-lg">
                  ✓
                </div>
              )}

              {/* Layout Card */}
              <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden h-full">
                {/* Preview Area */}
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                  <div className="text-6xl opacity-60">{layout.icon}</div>
                  {/* Layout Preview Pattern */}
                  <div className="absolute inset-4 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-2 w-full h-full p-2">
                      {Array.from({ length: layout.shots }).map((_, i) => (
                        <div
                          key={i}
                          className={`bg-white rounded border border-gray-300 ${
                            layout.id === "single"
                              ? "col-span-2"
                              : layout.id === "double-vertical"
                              ? "col-span-2"
                              : layout.id === "collage" && i === 0
                              ? "col-span-2"
                              : ""
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Layout Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-charcoal-800 mb-2">
                    {layout.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{layout.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="bg-sage-100 text-sage-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {layout.shots} {layout.shots === 1 ? "Photo" : "Photos"}
                    </span>
                    <span className="text-2xl">{layout.icon}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              ← Back to Home
            </button>

            <button
              onClick={handleStartSession}
              disabled={!selectedLayout || isAnimating}
              className={`px-12 py-4 rounded-full font-bold text-lg transition-all shadow-xl transform ${
                selectedLayout && !isAnimating
                  ? "bg-gradient-to-r from-coral-500 to-sage-500 hover:from-coral-600 hover:to-sage-600 text-white hover:scale-110 hover:shadow-2xl"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } ${isAnimating ? "animate-pulse" : ""}`}
            >
              {isAnimating
                ? "🚀 Starting Session..."
                : "🎬 Start Photo Session"}
            </button>
          </div>

          {selectedLayout && (
            <div className="mt-6 p-4 bg-white rounded-2xl shadow-lg border-2 border-coral-200 max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">
                  {layouts.find((l) => l.id === selectedLayout)?.icon}
                </span>
                <div className="text-left">
                  <p className="font-bold text-charcoal-800">
                    {layouts.find((l) => l.id === selectedLayout)?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {layouts.find((l) => l.id === selectedLayout)?.shots} photos
                    will be taken
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

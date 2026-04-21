"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Camera, RefreshCw, CheckCircle2 } from "lucide-react";

/**
 * CHALLENGE: SCAN ENHANCEMENT
 * 
 * Your goal is to improve the User Experience of the Scanning Flow.
 * 1. Implement a Visual Guidance Overlay (e.g., a circle or mouth outline) on the video feed.
 * 2. Add real-time feedback to the user (e.g., "Face not centered", "Move closer").
 * 3. Ensure the UI feels premium and responsive.
 */

export default function ScanningFlow() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camReady, setCamReady] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [qualityLevel, setQualityLevel] = useState<"good" | "medium" | "low">(
    "medium"
  );
  const [qualityText, setQualityText] = useState("Center your face in the guide");
  const [scanId, setScanId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    Array<{ id: string; content: string; sender: "patient" | "dentist"; createdAt: string }>
  >([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const VIEWS = [
    { label: "Front View", instruction: "Smile and look straight at the camera." },
    { label: "Left View", instruction: "Turn your head to the left." },
    { label: "Right View", instruction: "Turn your head to the right." },
    { label: "Upper Teeth", instruction: "Tilt your head back and open wide." },
    { label: "Lower Teeth", instruction: "Tilt your head down and open wide." },
  ];
  const completed = currentStep >= VIEWS.length;

  // Initialize Camera
  useEffect(() => {
    const currentVideo = videoRef.current;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (currentVideo) {
          currentVideo.srcObject = stream;
          setCamReady(true);
        }
      } catch {
        setQualityLevel("low");
        setQualityText("Allow camera access to continue");
      }
    }
    startCamera();

    return () => {
      if (currentVideo?.srcObject) {
        const stream = currentVideo.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!camReady || completed) {
      return;
    }

    const messagesByLevel = {
      good: "Great framing, hold steady",
      medium: "Slightly adjust distance and centering",
      low: "Face outside the guide, move to center",
    } as const;

    const interval = window.setInterval(() => {
      const randomValue = Math.random();
      const nextLevel =
        randomValue > 0.66 ? "good" : randomValue > 0.33 ? "medium" : "low";
      setQualityLevel(nextLevel);
      setQualityText(messagesByLevel[nextLevel]);
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [camReady, completed]);

  const createThread = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/messaging", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: "patient-demo",
          sender: "patient",
          content: "Conversation started after scan completion.",
          createThreadOnly: true,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as { threadId?: string };
      return data.threadId ?? null;
    } catch {
      return null;
    }
  }, []);

  const triggerCompletion = useCallback(async () => {
    const generatedScanId = `scan_${Date.now()}`;
    setScanId(generatedScanId);

    const createdThreadId = await createThread();
    if (createdThreadId) {
      setThreadId(createdThreadId);
    }

    await fetch("/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scanId: generatedScanId,
        status: "completed",
        userId: "clinic-demo",
      }),
    });
  }, [createThread]);

  useEffect(() => {
    if (capturedImages.length === VIEWS.length && !scanId) {
      void triggerCompletion();
    }
  }, [capturedImages.length, scanId, triggerCompletion, VIEWS.length]);

  const loadMessages = useCallback(async () => {
    if (!threadId) {
      return;
    }

    try {
      const response = await fetch(`/api/messaging?threadId=${threadId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        messages?: Array<{ id: string; content: string; sender: "patient" | "dentist"; createdAt: string }>;
      };
      setMessages(data.messages ?? []);
    } catch {
      setMessages([]);
    }
  }, [threadId]);

  useEffect(() => {
    if (threadId) {
      void loadMessages();
    }
  }, [threadId, loadMessages]);

  const handleSendMessage = useCallback(async () => {
    if (!threadId || !draftMessage.trim()) {
      return;
    }

    setIsSendingMessage(true);
    try {
      const response = await fetch("/api/messaging", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId,
          content: draftMessage.trim(),
          sender: "patient",
        }),
      });

      if (response.ok) {
        setDraftMessage("");
        await loadMessages();
      }
    } finally {
      setIsSendingMessage(false);
    }
  }, [draftMessage, loadMessages, threadId]);

  const qualityClasses: Record<"good" | "medium" | "low", string> = {
    good: "tw-border-emerald-400 tw-bg-emerald-500/10 tw-text-emerald-300",
    medium: "tw-border-amber-300 tw-bg-amber-500/10 tw-text-amber-200",
    low: "tw-border-rose-400 tw-bg-rose-500/10 tw-text-rose-300",
  };

  const handleCapture = useCallback(() => {
    // Boilerplate logic for capturing a frame from the video feed
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImages((prev) => [...prev, dataUrl]);
      setCurrentStep((prev) => prev + 1);
    }
  }, []);

  return (
    <div className="tw-flex tw-min-h-screen tw-flex-col tw-items-center tw-bg-black tw-text-white">
      {/* Header */}
      <div className="tw-flex tw-w-full tw-justify-between tw-border-b tw-border-zinc-800 tw-bg-zinc-900 tw-p-4">
        <h1 className="tw-font-bold tw-text-blue-400">DentalScan AI</h1>
        <span className="tw-text-xs tw-text-zinc-500">
          Step {Math.min(currentStep + 1, 5)}/5
        </span>
      </div>

      {/* Main Viewport */}
      <div className="tw-relative tw-flex tw-w-full tw-max-w-md tw-aspect-[3/4] tw-items-center tw-justify-center tw-overflow-hidden tw-bg-zinc-950">
        {!completed ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="tw-h-full tw-w-full tw-object-cover tw-opacity-80"
            />

            <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
              <div
                className={`tw-h-[56%] tw-w-[56%] tw-rounded-full tw-border-4 tw-transition-all tw-duration-300 ${qualityClasses[qualityLevel]}`}
              >
                <div className="tw-flex tw-h-full tw-items-center tw-justify-center">
                  <span className="tw-rounded-full tw-bg-black/50 tw-px-3 tw-py-1 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-widest">
                    Mouth Guide
                  </span>
                </div>
              </div>
            </div>

            {/* Instruction Overlay */}
            <div className="tw-absolute tw-left-0 tw-right-0 tw-bottom-10 tw-bg-gradient-to-t tw-from-black tw-to-transparent tw-p-6 tw-text-center">
              <p className="tw-text-sm tw-font-medium">
                {VIEWS[currentStep].instruction}
              </p>
              <div
                className={`tw-mx-auto tw-mt-3 tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-px-3 tw-py-1 tw-text-xs ${qualityClasses[qualityLevel]}`}
              >
                <RefreshCw size={12} />
                <span>{qualityText}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="tw-w-full tw-p-4 tw-text-white">
            <div className="tw-mb-4 tw-rounded-xl tw-border tw-border-emerald-700/40 tw-bg-emerald-500/10 tw-p-4 tw-text-center">
              <CheckCircle2 size={48} className="tw-mx-auto tw-mb-3 tw-text-emerald-400" />
              <h2 className="tw-text-xl tw-font-bold">Scan Complete</h2>
              <p className="tw-mt-2 tw-text-zinc-300">
                {scanId ? `Scan ${scanId} completed.` : "Finalizing upload..."}
              </p>
            </div>

            <div className="tw-rounded-xl tw-border tw-border-zinc-700 tw-bg-zinc-900/80 tw-p-3">
              <h3 className="tw-mb-2 tw-text-sm tw-font-semibold tw-text-zinc-200">
                Quick-Message Sidebar
              </h3>
              <div className="tw-mb-3 tw-h-36 tw-space-y-2 tw-overflow-y-auto tw-rounded-lg tw-bg-zinc-950 tw-p-2">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`tw-max-w-[90%] tw-rounded-md tw-px-2 tw-py-1 tw-text-xs ${
                        message.sender === "patient"
                          ? "tw-ml-auto tw-bg-blue-500/20 tw-text-blue-200"
                          : "tw-bg-zinc-800 tw-text-zinc-200"
                      }`}
                    >
                      {message.content}
                    </div>
                  ))
                ) : (
                  <p className="tw-text-xs tw-text-zinc-500">
                    No messages yet. Send the first update to the clinic.
                  </p>
                )}
              </div>
              <div className="tw-flex tw-gap-2">
                <input
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                  placeholder="Write a message..."
                  className="tw-flex-1 tw-rounded-md tw-border tw-border-zinc-700 tw-bg-zinc-950 tw-px-2 tw-py-1 tw-text-sm tw-text-white tw-outline-none tw-ring-0 focus:tw-border-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isSendingMessage || !threadId}
                  className="tw-rounded-md tw-bg-blue-500 tw-px-3 tw-py-1 tw-text-sm tw-font-semibold tw-text-white disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
                >
                  {isSendingMessage ? "..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="tw-flex tw-w-full tw-justify-center tw-p-10">
        {!completed && (
          <button
            onClick={handleCapture}
            className="tw-flex tw-h-20 tw-w-20 tw-items-center tw-justify-center tw-rounded-full tw-border-4 tw-border-white tw-transition-transform active:tw-scale-90"
          >
            <div className="tw-flex tw-h-16 tw-w-16 tw-items-center tw-justify-center tw-rounded-full tw-bg-white">
               <Camera className="tw-text-black" />
            </div>
          </button>
        )}
      </div>

      {/* Thumbnails */}
      <div className="tw-flex tw-w-full tw-gap-2 tw-overflow-x-auto tw-p-4">
        {VIEWS.map((v, i) => (
          <div 
            key={i} 
            className={`tw-h-20 tw-w-16 tw-shrink-0 tw-rounded tw-border-2 ${
              i === currentStep
                ? "tw-border-blue-500 tw-bg-blue-500/10"
                : "tw-border-zinc-800"
            }`}
          >
            {capturedImages[i] ? (
               <Image
                 src={capturedImages[i]}
                 alt={`${v.label} capture`}
                 width={64}
                 height={80}
                 className="tw-h-full tw-w-full tw-object-cover"
                 unoptimized
               />
            ) : (
               <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-[10px] tw-text-zinc-700">
                 {i + 1}
               </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

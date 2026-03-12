"use client";

import { useState, useEffect, useCallback } from "react";
import ReviewableBlock, {
  ParagraphData,
} from "../components/ReviewableBlock";
import EditorStats from "../components/EditorStats";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [paragraphs, setParagraphs] = useState<ParagraphData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [, setTick] = useState(0);

  // Tick the clock every second so the timer updates
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  async function handleGenerate() {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setError(null);
    setParagraphs([]);
    setStartTime(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate");
      }

      const data = await res.json();
      const paras: ParagraphData[] = data.paragraphs.map(
        (text: string, i: number) => ({
          id: i,
          originalText: text,
          currentText: text,
          status: "pending" as const,
          editHistory: [],
        })
      );
      setParagraphs(paras);
      setStartTime(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  const handleAccept = useCallback((id: number) => {
    setParagraphs((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "accepted" as const,
              editHistory: [
                ...p.editHistory,
                { action: "accepted", timestamp: Date.now() },
              ],
            }
          : p
      )
    );
  }, []);

  const handleEdit = useCallback((id: number, newText: string) => {
    setParagraphs((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              currentText: newText,
              status: "edited" as const,
              editHistory: [
                ...p.editHistory,
                { action: "edited", timestamp: Date.now(), text: newText },
              ],
            }
          : p
      )
    );
  }, []);

  const handleReject = useCallback(
    async (id: number) => {
      setParagraphs((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: "rejected" as const,
                editHistory: [
                  ...p.editHistory,
                  { action: "rejected", timestamp: Date.now() },
                ],
              }
            : p
        )
      );
      setLoadingIds((prev) => new Set(prev).add(id));

      try {
        const currentParagraphs = paragraphs;
        const context = currentParagraphs
          .filter((p) => p.id !== id)
          .map((p) => p.currentText)
          .join("\n\n");

        const res = await fetch("/api/revise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paragraph: currentParagraphs.find((p) => p.id === id)?.originalText,
            instruction:
              "Completely rewrite this paragraph with a different approach, new examples, and fresh perspective. Keep the same general topic.",
            context,
          }),
        });

        if (!res.ok) throw new Error("Failed to regenerate");
        const data = await res.json();

        setParagraphs((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  currentText: data.revised,
                  status: "pending" as const,
                }
              : p
          )
        );
      } catch {
        setParagraphs((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: "pending" as const } : p
          )
        );
      } finally {
        setLoadingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [paragraphs]
  );

  const handleRevise = useCallback(
    async (id: number, instruction: string) => {
      setParagraphs((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: "revising" as const } : p
        )
      );
      setLoadingIds((prev) => new Set(prev).add(id));

      try {
        const currentParagraphs = paragraphs;
        const context = currentParagraphs
          .filter((p) => p.id !== id)
          .map((p) => p.currentText)
          .join("\n\n");

        const paragraph = currentParagraphs.find((p) => p.id === id);

        const res = await fetch("/api/revise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paragraph: paragraph?.currentText,
            instruction,
            context,
          }),
        });

        if (!res.ok) throw new Error("Failed to revise");
        const data = await res.json();

        setParagraphs((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  currentText: data.revised,
                  status: "edited" as const,
                  editHistory: [
                    ...p.editHistory,
                    {
                      action: "revised",
                      timestamp: Date.now(),
                      text: data.revised,
                    },
                  ],
                }
              : p
          )
        );
      } catch {
        setParagraphs((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: "pending" as const } : p
          )
        );
      } finally {
        setLoadingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [paragraphs]
  );

  const contextParagraphs = paragraphs.map((p) => p.currentText);

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#16162a]">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                Review &amp; Supervision
              </h1>
              <p className="text-xs text-slate-500">
                AI writes. You edit. Track your editorial fingerprint.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Topic Input */}
        <div className="mb-8 rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
          <label
            htmlFor="topic"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            What should the AI write about?
          </label>
          <div className="flex gap-3">
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isGenerating) handleGenerate();
              }}
              placeholder="Write me a blog post about the future of renewable energy..."
              className="flex-1 rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-colors"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3v18M3 12h18" />
                  </svg>
                  Generate
                </>
              )}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-400">Error: {error}</p>
          )}
        </div>

        {/* Content area */}
        {paragraphs.length > 0 && (
          <div className="flex gap-8">
            {/* Main content */}
            <div className="flex-1 space-y-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  Document Review
                </h2>
                <span className="text-xs text-slate-500">
                  {paragraphs.filter(
                    (p) => p.status === "accepted" || p.status === "edited"
                  ).length}{" "}
                  of {paragraphs.length} paragraphs reviewed
                </span>
              </div>
              {paragraphs.map((p, i) => (
                <ReviewableBlock
                  key={p.id}
                  paragraph={p}
                  index={i}
                  contextParagraphs={contextParagraphs}
                  onAccept={handleAccept}
                  onEdit={handleEdit}
                  onReject={handleReject}
                  onRevise={handleRevise}
                  isLoading={loadingIds.has(p.id)}
                />
              ))}

              {/* All reviewed message */}
              {paragraphs.length > 0 &&
                paragraphs.every(
                  (p) => p.status === "accepted" || p.status === "edited"
                ) && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6 text-center">
                    <p className="text-lg font-semibold text-emerald-400">
                      Review Complete
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      All paragraphs have been reviewed. Check your editorial
                      fingerprint in the sidebar.
                    </p>
                  </div>
                )}
            </div>

            {/* Sidebar */}
            <aside className="w-72 flex-shrink-0">
              <div className="sticky top-8">
                <EditorStats paragraphs={paragraphs} startTime={startTime} />
              </div>
            </aside>
          </div>
        )}

        {/* Empty state */}
        {paragraphs.length === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-800/50 text-slate-600">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-300">
              No document yet
            </h2>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Enter a topic above and click Generate. The AI will write a blog
              post, then you can review each paragraph as editor-in-chief.
            </p>
          </div>
        )}

        {/* Loading state */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-violet-500" />
            <h2 className="text-xl font-semibold text-slate-300">
              Writing your document...
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Claude is crafting a blog post about your topic
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

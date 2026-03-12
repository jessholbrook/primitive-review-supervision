"use client";

import { useMemo } from "react";
import { ParagraphData } from "./ReviewableBlock";

interface EditorStatsProps {
  paragraphs: ParagraphData[];
  startTime: number | null;
}

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const wordsA = a.split(/\s+/);
  const wordsB = b.split(/\s+/);
  const m = wordsA.length;
  const n = wordsB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (wordsA[i - 1] === wordsB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes === 0) return `${secs}s`;
  return `${minutes}m ${secs}s`;
}

export default function EditorStats({ paragraphs, startTime }: EditorStatsProps) {
  const stats = useMemo(() => {
    const total = paragraphs.length;
    const accepted = paragraphs.filter((p) => p.status === "accepted").length;
    const edited = paragraphs.filter((p) => p.status === "edited").length;
    const rejected = paragraphs.filter(
      (p) => p.status === "rejected"
    ).length;
    const pending = paragraphs.filter(
      (p) => p.status === "pending" || p.status === "revising"
    ).length;
    const reviewed = accepted + edited;

    const originalWords = paragraphs.reduce(
      (sum, p) => sum + wordCount(p.originalText),
      0
    );
    const currentWords = paragraphs.reduce(
      (sum, p) => sum + wordCount(p.currentText),
      0
    );
    const wordDelta = currentWords - originalWords;

    let totalEditDist = 0;
    let totalOriginalWords = 0;
    for (const p of paragraphs) {
      if (p.originalText !== p.currentText) {
        totalEditDist += editDistance(p.originalText, p.currentText);
        totalOriginalWords += wordCount(p.originalText);
      }
    }
    const changePercent =
      totalOriginalWords > 0
        ? Math.round((totalEditDist / totalOriginalWords) * 100)
        : 0;

    const totalActions = paragraphs.reduce(
      (sum, p) => sum + p.editHistory.length,
      0
    );

    // Count action types across all history
    let acceptCount = 0;
    let editCount = 0;
    let rejectCount = 0;
    let reviseCount = 0;
    for (const p of paragraphs) {
      for (const h of p.editHistory) {
        if (h.action === "accepted") acceptCount++;
        else if (h.action === "edited") editCount++;
        else if (h.action === "rejected") rejectCount++;
        else if (h.action === "revised") reviseCount++;
      }
    }

    // Determine editor style
    let editorStyle = "Observer";
    let styleDescription = "Still reviewing...";
    if (totalActions > 0) {
      const rates = [
        { style: "Perfectionist", desc: "You refine every detail by hand", count: editCount },
        { style: "Trusting", desc: "You trust the AI's judgment", count: acceptCount },
        { style: "Harsh Critic", desc: "Nothing gets past your standards", count: rejectCount },
        { style: "Collaborative", desc: "You guide the AI to do better", count: reviseCount },
      ];
      rates.sort((a, b) => b.count - a.count);
      if (rates[0].count > 0) {
        editorStyle = rates[0].style;
        styleDescription = rates[0].desc;
      }
    }

    return {
      total,
      accepted,
      edited,
      rejected,
      pending,
      reviewed,
      originalWords,
      currentWords,
      wordDelta,
      changePercent,
      totalEditDist,
      totalActions,
      acceptCount,
      editCount,
      rejectCount,
      reviseCount,
      editorStyle,
      styleDescription,
    };
  }, [paragraphs]);

  const elapsed = startTime ? Date.now() - startTime : 0;

  // Pie chart data
  const pieData = [
    { label: "Accepted", count: stats.acceptCount, color: "#10b981" },
    { label: "Edited", count: stats.editCount, color: "#f59e0b" },
    { label: "Rejected", count: stats.rejectCount, color: "#ef4444" },
    { label: "Revised", count: stats.reviseCount, color: "#3b82f6" },
  ];
  const pieTotal = pieData.reduce((s, d) => s + d.count, 0);

  function renderPieChart() {
    if (pieTotal === 0) {
      return (
        <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-slate-700">
          <span className="text-xs text-slate-500">No actions</span>
        </div>
      );
    }

    let cumulativePercent = 0;
    const slices: string[] = [];

    for (const d of pieData) {
      if (d.count === 0) continue;
      const percent = (d.count / pieTotal) * 100;
      slices.push(
        `${d.color} ${cumulativePercent}% ${cumulativePercent + percent}%`
      );
      cumulativePercent += percent;
    }

    const gradient = `conic-gradient(${slices.join(", ")})`;

    return (
      <div
        className="h-28 w-28 rounded-full"
        style={{ background: gradient }}
      />
    );
  }

  const barMax = Math.max(
    stats.acceptCount,
    stats.editCount,
    stats.rejectCount,
    stats.reviseCount,
    1
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-100">Editorial Dashboard</h2>
        <p className="mt-1 text-xs text-slate-500">Your editorial fingerprint</p>
      </div>

      {/* Editor Style */}
      <div className="rounded-lg bg-slate-800/50 p-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
          Editor Style
        </p>
        <p className="text-xl font-bold text-white">{stats.editorStyle}</p>
        <p className="text-xs text-slate-400 mt-1">{stats.styleDescription}</p>
      </div>

      {/* Progress */}
      <div className="rounded-lg bg-slate-800/50 p-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
          Review Progress
        </p>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
              style={{
                width:
                  stats.total > 0
                    ? `${(stats.reviewed / stats.total) * 100}%`
                    : "0%",
              }}
            />
          </div>
          <span className="text-xs font-mono text-slate-400">
            {stats.reviewed}/{stats.total}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-400">
              Accepted: <span className="text-slate-200">{stats.accepted}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-slate-400">
              Edited: <span className="text-slate-200">{stats.edited}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-slate-400">
              Rejected: <span className="text-slate-200">{stats.rejected}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-slate-500" />
            <span className="text-slate-400">
              Pending: <span className="text-slate-200">{stats.pending}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Word Count */}
      <div className="rounded-lg bg-slate-800/50 p-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
          Word Count
        </p>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-lg font-bold text-slate-200">
              {stats.originalWords}
            </p>
            <p className="text-xs text-slate-500">Original</p>
          </div>
          <span className="text-slate-600">&#8594;</span>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-200">
              {stats.currentWords}
            </p>
            <p className="text-xs text-slate-500">Current</p>
          </div>
          <div className="text-center">
            <p
              className={`text-lg font-bold ${
                stats.wordDelta > 0
                  ? "text-emerald-400"
                  : stats.wordDelta < 0
                  ? "text-red-400"
                  : "text-slate-400"
              }`}
            >
              {stats.wordDelta > 0 ? "+" : ""}
              {stats.wordDelta}
            </p>
            <p className="text-xs text-slate-500">Delta</p>
          </div>
        </div>
      </div>

      {/* Change Metrics */}
      <div className="rounded-lg bg-slate-800/50 p-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
          Change Metrics
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Edit distance</span>
          <span className="font-mono text-slate-200">
            {stats.totalEditDist} words
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="text-slate-400">Change rate</span>
          <span className="font-mono text-slate-200">{stats.changePercent}%</span>
        </div>
        <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(stats.changePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Time */}
      <div className="rounded-lg bg-slate-800/50 p-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
          Time Reviewing
        </p>
        <p className="text-lg font-bold font-mono text-slate-200">
          {startTime ? formatDuration(elapsed) : "--"}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {stats.totalActions} total actions
        </p>
      </div>

      {/* Decision Distribution */}
      <div className="rounded-lg bg-slate-800/50 p-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
          Decision Distribution
        </p>
        <div className="flex justify-center mb-4">{renderPieChart()}</div>
        <div className="space-y-2">
          {pieData.map((d) => (
            <div key={d.label} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-xs text-slate-400 w-16">{d.label}</span>
              <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(d.count / barMax) * 100}%`,
                    backgroundColor: d.color,
                  }}
                />
              </div>
              <span className="text-xs font-mono text-slate-400 w-5 text-right">
                {d.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

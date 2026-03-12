"use client";

import { useState, useRef, useEffect } from "react";

export type ParagraphStatus =
  | "pending"
  | "accepted"
  | "edited"
  | "rejected"
  | "revising";

export interface ParagraphData {
  id: number;
  originalText: string;
  currentText: string;
  status: ParagraphStatus;
  editHistory: { action: string; timestamp: number; text?: string }[];
}

interface ReviewableBlockProps {
  paragraph: ParagraphData;
  index: number;
  contextParagraphs: string[];
  onAccept: (id: number) => void;
  onEdit: (id: number, newText: string) => void;
  onReject: (id: number) => void;
  onRevise: (id: number, instruction: string) => void;
  isLoading: boolean;
}

const statusConfig: Record<
  ParagraphStatus,
  { border: string; bg: string; label: string; labelColor: string }
> = {
  pending: {
    border: "border-slate-600",
    bg: "bg-slate-800/30",
    label: "Pending Review",
    labelColor: "text-slate-400",
  },
  accepted: {
    border: "border-emerald-500/60",
    bg: "bg-emerald-950/20",
    label: "Accepted",
    labelColor: "text-emerald-400",
  },
  edited: {
    border: "border-amber-500/60",
    bg: "bg-amber-950/20",
    label: "Edited",
    labelColor: "text-amber-400",
  },
  rejected: {
    border: "border-red-500/60",
    bg: "bg-red-950/20",
    label: "Rejected — Regenerating...",
    labelColor: "text-red-400",
  },
  revising: {
    border: "border-blue-500/60",
    bg: "bg-blue-950/20",
    label: "Revising...",
    labelColor: "text-blue-400",
  },
};

export default function ReviewableBlock({
  paragraph,
  index,
  contextParagraphs,
  onAccept,
  onEdit,
  onReject,
  onRevise,
  isLoading,
}: ReviewableBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(paragraph.currentText);
  const [showReviseInput, setShowReviseInput] = useState(false);
  const [reviseInstruction, setReviseInstruction] = useState("");
  const [showDiff, setShowDiff] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const reviseInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditText(paragraph.currentText);
  }, [paragraph.currentText]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [isEditing]);

  useEffect(() => {
    if (showReviseInput && reviseInputRef.current) {
      reviseInputRef.current.focus();
    }
  }, [showReviseInput]);

  const config = statusConfig[paragraph.status];
  const hasBeenModified = paragraph.originalText !== paragraph.currentText;

  function handleSaveEdit() {
    if (editText.trim() && editText !== paragraph.currentText) {
      onEdit(paragraph.id, editText.trim());
    }
    setIsEditing(false);
  }

  function handleCancelEdit() {
    setEditText(paragraph.currentText);
    setIsEditing(false);
  }

  function handleReviseSubmit() {
    if (reviseInstruction.trim()) {
      onRevise(paragraph.id, reviseInstruction.trim());
      setReviseInstruction("");
      setShowReviseInput(false);
    }
  }

  function handleReviseKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleReviseSubmit();
    }
    if (e.key === "Escape") {
      setShowReviseInput(false);
      setReviseInstruction("");
    }
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      handleCancelEdit();
    }
  }

  const busy = isLoading || paragraph.status === "revising" || paragraph.status === "rejected";

  return (
    <div
      className={`relative rounded-lg border-2 ${config.border} ${config.bg} p-5 transition-all duration-300`}
    >
      {/* Status badge */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Paragraph {index + 1}
        </span>
        <span className={`text-xs font-semibold ${config.labelColor}`}>
          {config.label}
        </span>
      </div>

      {/* Diff view */}
      {hasBeenModified && showDiff && !isEditing && (
        <div className="mb-3 rounded-md bg-slate-900/60 p-3 text-sm">
          <p className="mb-1 text-xs font-medium text-slate-500 uppercase">
            Original
          </p>
          <p className="text-red-400/70 line-through leading-relaxed">
            {paragraph.originalText}
          </p>
          <p className="mt-2 mb-1 text-xs font-medium text-slate-500 uppercase">
            Current
          </p>
          <p className="text-emerald-400/80 leading-relaxed">
            {paragraph.currentText}
          </p>
        </div>
      )}

      {/* Content */}
      {isEditing ? (
        <div className="mb-3">
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => {
              setEditText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={handleEditKeyDown}
            className="w-full resize-none rounded-md border border-amber-500/40 bg-slate-900/80 p-3 text-sm leading-relaxed text-slate-200 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-colors"
            rows={4}
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 transition-colors"
            >
              Save Edit
            </button>
            <button
              onClick={handleCancelEdit}
              className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mb-4 text-sm leading-relaxed text-slate-300">
          {paragraph.currentText}
        </p>
      )}

      {/* Revise input */}
      {showReviseInput && (
        <div className="mb-3 flex gap-2">
          <input
            ref={reviseInputRef}
            type="text"
            value={reviseInstruction}
            onChange={(e) => setReviseInstruction(e.target.value)}
            onKeyDown={handleReviseKeyDown}
            placeholder='e.g. "make shorter", "add statistics", "more formal tone"'
            className="flex-1 rounded-md border border-blue-500/40 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition-colors"
          />
          <button
            onClick={handleReviseSubmit}
            disabled={!reviseInstruction.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
          <button
            onClick={() => {
              setShowReviseInput(false);
              setReviseInstruction("");
            }}
            className="rounded-md bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Action buttons */}
      {!isEditing && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onAccept(paragraph.id)}
            disabled={busy || paragraph.status === "accepted"}
            className="flex items-center gap-1.5 rounded-md bg-emerald-700/60 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-600/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span>&#10003;</span> Accept
          </button>
          <button
            onClick={() => {
              setIsEditing(true);
              setShowReviseInput(false);
            }}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-md bg-amber-700/60 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-600/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span>&#9998;</span> Edit
          </button>
          <button
            onClick={() => onReject(paragraph.id)}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-md bg-red-700/60 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-600/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span>&#10007;</span> Reject
          </button>
          <button
            onClick={() => {
              setShowReviseInput(!showReviseInput);
              setIsEditing(false);
            }}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-md bg-blue-700/60 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-600/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span>&#128172;</span> Revise
          </button>

          {hasBeenModified && (
            <button
              onClick={() => setShowDiff(!showDiff)}
              className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showDiff ? "Hide diff" : "Show diff"}
            </button>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {busy && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-900/40">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-500 border-t-white" />
        </div>
      )}
    </div>
  );
}

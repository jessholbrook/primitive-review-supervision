import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { paragraph, instruction, context } = await req.json();

    if (!paragraph || !instruction) {
      return NextResponse.json(
        { error: "paragraph and instruction are required." },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are revising a single paragraph within a larger blog post.

Here is the surrounding context for coherence:
---
${context || "No surrounding context provided."}
---

Here is the paragraph to revise:
---
${paragraph}
---

Revision instruction: ${instruction}

Return ONLY the revised paragraph as plain text. No quotes, no markdown, no explanation — just the revised paragraph.`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text response from Claude." },
        { status: 500 }
      );
    }

    return NextResponse.json({ revised: textBlock.text.trim() });
  } catch (error) {
    console.error("Revise error:", error);
    return NextResponse.json(
      { error: "Failed to revise paragraph." },
      { status: 500 }
    );
  }
}

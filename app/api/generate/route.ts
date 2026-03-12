import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { error: "A topic string is required." },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Write a blog post about: ${topic}

Requirements:
- Write exactly 6 paragraphs
- Each paragraph should be substantial (3-5 sentences)
- Use an engaging, professional tone
- Include specific details, examples, or data points where relevant
- The first paragraph should be an introduction and the last a conclusion

Return ONLY a JSON array of strings, where each string is one paragraph. No markdown, no extra text, just the JSON array. Example format:
["First paragraph...", "Second paragraph...", "Third paragraph..."]`,
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

    const paragraphs: string[] = JSON.parse(textBlock.text);

    if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
      return NextResponse.json(
        { error: "Invalid response format." },
        { status: 500 }
      );
    }

    return NextResponse.json({ paragraphs });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate document." },
      { status: 500 }
    );
  }
}

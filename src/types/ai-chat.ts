/* ==========================================================================
   AI Chat Types — sell_moh_app
   Purpose: Type-safe AI assistant chat with tool calls & recommendations
   Mapped from storeflow_ai schemas (ChatRequest/ChatResponse etc.)
   ========================================================================== */

export type ModelProvider = "groq" | "openai" | "anthropic";

export interface ToolCall {
  tool: string;
  arguments: Record<string, any>;
  result_summary: string;
}

export interface Recommendation {
  action: string;
  description: string;
  api_endpoint: string;
  api_method: "GET" | "POST";
  api_body: Record<string, any>;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  stream: boolean;
}

export interface ChatResponse {
  conversation_id: string;
  answer: string; // Markdown-formatted
  tool_calls: ToolCall[];
  recommendations: Recommendation[];
  confidence: number; // 0.0 – 1.0
  created_at: string; // ISO 8601
}

export interface StreamingToken {
  type: "token";
  text: string;
}

export interface StreamingMetadata {
  type: "metadata";
  data: {
    conversation_id: string;
    answer: string;
    tool_calls: ToolCall[];
    recommendations: Recommendation[];
    confidence: number;
    created_at: string;
  };
}

export interface StreamingDone {
  type: "done";
  conversation_id: string;
}

/* =========================================================================
   AI Chat — Union type for all SSE events
   ========================================================================= */

export type StreamingEvent =
  | StreamingToken
  | StreamingMetadata
  | StreamingDone;
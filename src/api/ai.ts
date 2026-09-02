import { ChatRequest, ChatResponse } from "@/types/ai-chat";
import { getErrorMessage } from "./auth";
import { apiClient } from "./client";

const URL = "/ai";

export interface ConversationListItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

export const sendChatMessage = async (
  data: ChatRequest,
): Promise<ChatResponse> => {
  const res = await apiClient.post<ChatResponse>(`${URL}/chat`, data);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

export const fetchConversations = async (
  page = 1,
  pageSize = 20,
): Promise<{ items: ConversationListItem[]; total: number }> => {
  const res = await apiClient.get<{
    data: ConversationListItem[];
    total: number;
  }>(`${URL}/conversations?page=${page}&page_size=${pageSize}`);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return {
    items: res.data?.data ?? [],
    total: res.data?.total ?? 0,
  };
};

export const getConversation = async (
  conversationId: string,
): Promise<ConversationDetail> => {
  const res = await apiClient.get<{ data: ConversationDetail }>(
    `${URL}/conversations/${conversationId}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const deleteConversation = async (
  conversationId: string,
): Promise<void> => {
  const res = await apiClient.delete(
    `${URL}/conversations/${conversationId}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
};

import {
  deleteConversation,
  fetchConversations,
  getConversation,
} from "@/api/ai";
import type { ConversationListItem } from "@/api/ai";
import { Colors } from "@/constants/theme";
import { streamChat } from "@/lib/sse-client";
import type { ToolCall, Recommendation } from "@/types/ai-chat";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Marked } from "marked";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import {
  KeyboardAvoidingView,
  useKeyboardHandler,
} from "react-native-keyboard-controller";
import { runOnJS } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ─── Marked parser (no Node deps) ─── */

const marked = new Marked({
  gfm: true,
  breaks: true,
});

/* ─── Types ─── */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  recommendations?: Recommendation[];
  isStreaming?: boolean;
  confidence?: number;
  createdAt: Date;
}

/* ─── Suggestion Chips ─── */

const SUGGESTIONS = [
  { label: "What's my best seller?", icon: "trending-up" as const },
  { label: "Show low stock items", icon: "package" as const },
  { label: "Today's revenue summary", icon: "bar-chart-2" as const },
  { label: "Outstanding payments", icon: "credit-card" as const },
];

/* ─── Tool Display Names ─── */

const TOOL_LABELS: Record<string, string> = {
  search_products: "Product Search",
  get_product_details: "Product Details",
  check_stock: "Stock Check",
  get_sales_summary: "Sales Summary",
  get_top_products: "Top Products",
  get_revenue_trend: "Revenue Trend",
  get_recent_transactions: "Recent Transactions",
  get_customer_insights: "Customer Insights",
  get_inventory_alerts: "Inventory Alerts",
  get_profit_loss: "Profit & Loss",
  get_expenses_by_category: "Expenses",
  get_accounts_receivable: "Accounts Receivable",
  compare_product_prices: "Price Comparison",
  search_product_info: "Product Info",
};

/* ─── MarkdownText — renders markdown via marked + RN Text ─── */

function MarkdownText({
  content,
  color,
  backgroundElement,
}: {
  content: string;
  color: string;
  backgroundElement: string;
}) {
  const tokens = marked.lexer(content);

  return (
    <View>
      {tokens.map((token, i) => (
        <TokenRenderer
          key={i}
          token={token}
          color={color}
          backgroundElement={backgroundElement}
        />
      ))}
    </View>
  );
}

function TokenRenderer({
  token,
  color,
  backgroundElement,
}: {
  token: any;
  color: string;
  backgroundElement: string;
}) {
  switch (token.type) {
    case "heading": {
      const size = token.depth === 1 ? 18 : token.depth === 2 ? 16 : 15;
      const weight = "700" as const;
      return (
        <Text
          style={{
            fontSize: size,
            fontWeight: weight,
            color,
            marginTop: 8,
            marginBottom: 4,
          }}
        >
          {renderInlineTokens(token.tokens, color, backgroundElement)}
        </Text>
      );
    }

    case "paragraph":
      return (
        <Text
          style={{
            fontSize: 15,
            lineHeight: 22,
            color,
            marginBottom: 6,
          }}
        >
          {renderInlineTokens(token.tokens, color, backgroundElement)}
        </Text>
      );

    case "list":
      return (
        <View style={{ marginBottom: 6 }}>
          {token.items.map((item: any, idx: number) => (
            <View
              key={idx}
              style={{
                flexDirection: "row",
                marginBottom: 2,
                paddingLeft: 4,
              }}
            >
              <Text style={{ fontSize: 15, color, marginRight: 6 }}>
                {token.ordered ? `${idx + 1}.` : "•"}
              </Text>
              <Text style={{ fontSize: 15, lineHeight: 22, color, flex: 1 }}>
                {renderInlineTokens(item.tokens, color, backgroundElement)}
              </Text>
            </View>
          ))}
        </View>
      );

    case "code":
      return (
        <View
          style={{
            backgroundColor: backgroundElement,
            borderRadius: 8,
            padding: 10,
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
              color,
              lineHeight: 18,
            }}
          >
            {token.text}
          </Text>
        </View>
      );

    case "blockquote":
      return (
        <View
          style={{
            borderLeftWidth: 3,
            borderLeftColor: "#2563eb",
            paddingLeft: 10,
            marginBottom: 6,
          }}
        >
          {token.tokens?.map((t: any, i: number) => (
            <TokenRenderer
              key={i}
              token={t}
              color={color}
              backgroundElement={backgroundElement}
            />
          ))}
        </View>
      );

    case "hr":
      return (
        <View
          style={{
            height: 1,
            backgroundColor: backgroundElement,
            marginVertical: 10,
          }}
        />
      );

    case "table":
      return (
        <View style={{ marginBottom: 8 }}>
          {token.header && (
            <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: backgroundElement }}>
              {(Array.isArray(token.header[0]) ? token.header[0] : token.header).map((cell: any, ci: number) => (
                <View
                  key={ci}
                  style={{
                    flex: 1,
                    padding: 6,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color }}>
                    {cell?.text ?? String(cell)}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {token.rows?.map((row: any[], ri: number) => (
            <View key={`r${ri}`} style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: backgroundElement }}>
              {row.map((cell: any, ci: number) => (
                <View
                  key={ci}
                  style={{
                    flex: 1,
                    padding: 6,
                  }}
                >
                  <Text style={{ fontSize: 13, color }}>{cell?.text ?? String(cell)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );

    default:
      if (token.tokens) {
        return (
          <Text style={{ fontSize: 15, lineHeight: 22, color, marginBottom: 4 }}>
            {renderInlineTokens(token.tokens, color, backgroundElement)}
          </Text>
        );
      }
      if (token.text) {
        return (
          <Text style={{ fontSize: 15, lineHeight: 22, color, marginBottom: 4 }}>
            {token.text}
          </Text>
        );
      }
      return null;
  }
}

function renderInlineTokens(
  tokens: any[],
  color: string,
  backgroundElement: string,
): React.ReactNode[] {
  if (!tokens) return [];

  return tokens.map((token, i) => {
    switch (token.type) {
      case "strong":
        return (
          <Text key={i} style={{ fontWeight: "700", color }}>
            {renderInlineTokens(token.tokens, color, backgroundElement)}
          </Text>
        );

      case "em":
        return (
          <Text key={i} style={{ fontStyle: "italic", color }}>
            {renderInlineTokens(token.tokens, color, backgroundElement)}
          </Text>
        );

      case "codespan":
        return (
          <Text
            key={i}
            style={{
              fontSize: 13,
              fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
              color,
              backgroundColor: backgroundElement,
              paddingHorizontal: 4,
              borderRadius: 4,
            }}
          >
            {token.text}
          </Text>
        );

      case "link":
        return (
          <Text key={i} style={{ color: "#2563eb", fontWeight: "600" }}>
            {token.text}
          </Text>
        );

      case "br":
        return <Text key={i}>{"\n"}</Text>;

      case "text":
      default:
        return <Text key={i}>{token.raw || token.text}</Text>;
    }
  });
}

/* ─── Typing Indicator ─── */

function TypingIndicator({ colors }: { colors: any }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const dots = [dot1, dot2, dot3];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: false,
          }),
        ]),
      ),
    );
    const composite = Animated.parallel(animations);
    composite.start();
    return () => composite.stop();
  }, []);

  return (
    <View style={styles.typingContainer}>
      <View style={[styles.typingBubble, { backgroundColor: colors.card }]}>
        <View style={styles.typingDotsRow}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                styles.typingDot,
                {
                  backgroundColor: colors.textSecondary,
                  opacity: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                  transform: [
                    {
                      scale: dot.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.typingLabel, { color: colors.textSecondary }]}>
          Thinking...
        </Text>
      </View>
    </View>
  );
}

/* ─── Tool Call Card ─── */

function ToolCallCard({ tool, colors }: { tool: ToolCall; colors: any }) {
  const [expanded, setExpanded] = useState(false);
  const label = TOOL_LABELS[tool.tool] ?? tool.tool;

  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      style={[styles.toolCard, { backgroundColor: colors.backgroundElement }]}
    >
      <View style={styles.toolHeader}>
        <Lucide name="wrench" size={12} color="#3b82f6" />
        <Text style={[styles.toolLabel, { color: colors.text }]}>{label}</Text>
        <Lucide
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color={colors.textSecondary}
        />
      </View>
      {expanded && tool.result_summary ? (
        <Text
          style={[styles.toolSummary, { color: colors.textSecondary }]}
          numberOfLines={6}
        >
          {tool.result_summary}
        </Text>
      ) : null}
    </Pressable>
  );
}

/* ─── Recommendation Chip ─── */

function RecommendationChip({
  rec,
  colors,
}: {
  rec: Recommendation;
  colors: any;
}) {
  return (
    <Pressable
      style={[styles.recChip, { backgroundColor: "rgba(37,99,235,0.08)" }]}
    >
      <Lucide name="arrow-right-circle" size={14} color="#2563eb" />
      <Text style={styles.recLabel} numberOfLines={1}>
        {rec.description}
      </Text>
    </Pressable>
  );
}

/* ─── History Drawer ─── */

function HistoryDrawer({
  visible,
  onClose,
  conversations,
  onSelect,
  onDelete,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  conversations: ConversationListItem[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  colors: any;
}) {
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : -300,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      <Pressable style={styles.drawerOverlay} onPress={onClose} />
      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: colors.background,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.drawerHeader}>
          <Text style={[styles.drawerTitle, { color: colors.text }]}>
            History
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Lucide name="x" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.convItem,
                { borderBottomColor: colors.backgroundElement },
              ]}
              onPress={() => {
                onSelect(item.id);
                onClose();
              }}
            >
              <View style={styles.convItemContent}>
                <Lucide
                  name="message-square"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.convItemTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
              </View>
              <Pressable
                onPress={() => onDelete(item.id)}
                hitSlop={8}
                style={styles.convDeleteBtn}
              >
                <Lucide name="trash-2" size={14} color="#ef4444" />
              </Pressable>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyHistory}>
              <Text
                style={[
                  styles.emptyHistoryText,
                  { color: colors.textSecondary },
                ]}
              >
                No conversations yet
              </Text>
            </View>
          }
        />
      </Animated.View>
    </>
  );
}

/* ─── Main Screen ─── */

const AIScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [conversationTitle, setConversationTitle] = useState("AI Assistant");
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const streamingIdRef = useRef<string>("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useKeyboardHandler({
    onEnd: (e) => {
      "worklet";
      const height = e.progress > 0 ? e.height : 0;
      runOnJS(setKeyboardHeight)(height);
    },
  }, []);

  const { data: historyData, refetch: refetchHistory } = useQuery({
    queryKey: ["ai-conversations"],
    queryFn: () => fetchConversations(1, 50),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
    },
  });

  const conversations = historyData?.items ?? [];

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(
    (text?: string) => {
      const msg = (text ?? inputText).trim();
      if (!msg || isStreaming) return;

      Keyboard.dismiss();

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: msg,
        createdAt: new Date(),
      };

      const assistantId = `assistant-${Date.now()}`;
      streamingIdRef.current = assistantId;

      const placeholderMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        isStreaming: true,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, placeholderMsg]);
      setInputText("");
      setIsStreaming(true);

      let accumulatedText = "";

      streamChat({
        message: msg,
        conversationId,
        onToken: (text) => {
          accumulatedText += text;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: accumulatedText }
                : m,
            ),
          );
        },
        onMetadata: (event) => {
          if (event.type === "metadata") {
            const data = event.data;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: typeof data.answer === "string" ? data.answer : JSON.stringify(data.answer) || accumulatedText,
                      toolCalls: data.tool_calls,
                      recommendations: data.recommendations,
                      confidence: data.confidence,
                      isStreaming: false,
                    }
                  : m,
              ),
            );
            setConversationId(data.conversation_id);
          }
        },
        onDone: (convId) => {
          setIsStreaming(false);
          setConversationId(convId);
          refetchHistory();
          queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
        },
        onError: (error) => {
          setIsStreaming(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: `Sorry, something went wrong. ${error.message}`,
                    isStreaming: false,
                  }
                : m,
            ),
          );
        },
      });
    },
    [inputText, isStreaming, conversationId, refetchHistory, queryClient],
  );

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
    setConversationTitle("AI Assistant");
  }, []);

  const handleSelectConversation = useCallback(async (convId: string) => {
    try {
      const detail = await getConversation(convId);
      const loaded: Message[] = detail.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: new Date(m.created_at),
      }));
      setMessages(loaded);
      setConversationId(convId);
      setConversationTitle(detail.title || "AI Assistant");
    } catch {}
  }, []);

  /* ─── Render Message ─── */

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isUser = item.role === "user";

      return (
        <View
          style={[
            styles.messageRow,
            isUser ? styles.messageRowUser : styles.messageRowAssistant,
          ]}
        >
          {!isUser && (
            <View style={[styles.aiAvatar, { backgroundColor: "#2563eb" }]}>
              <Lucide name="sparkles" size={14} color="#ffffff" />
            </View>
          )}

          <View style={styles.messageBubbleWrapper}>
            <View
              style={[
                styles.bubble,
                isUser
                  ? [styles.bubbleUser, { backgroundColor: "#2563eb" }]
                  : [
                      styles.bubbleAssistant,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.backgroundElement,
                      },
                    ],
              ]}
            >
              {item.content ? (
                isUser ? (
                  <Text style={styles.bubbleUserText}>{item.content}</Text>
                ) : (
                  <MarkdownText
                    content={item.content}
                    color={colors.text}
                    backgroundElement={colors.backgroundElement}
                  />
                )
              ) : null}

              {item.isStreaming && !item.content ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : null}
            </View>

            {item.toolCalls && item.toolCalls.length > 0 && (
              <View style={styles.toolCallsContainer}>
                {item.toolCalls.map((tc, i) => (
                  <ToolCallCard key={i} tool={tc} colors={colors} />
                ))}
              </View>
            )}

            {item.recommendations && item.recommendations.length > 0 && (
              <View style={styles.recContainer}>
                {item.recommendations.map((rec, i) => (
                  <RecommendationChip key={i} rec={rec} colors={colors} />
                ))}
              </View>
            )}
          </View>

          {isUser && (
            <View style={[styles.userAvatar, { backgroundColor: "#10b981" }]}>
              <Text style={styles.userAvatarText}>You</Text>
            </View>
          )}
        </View>
      );
    },
    [colors],
  );

  /* ─── Empty State ─── */

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconCircle,
          { backgroundColor: "rgba(37,99,235,0.1)" },
        ]}
      >
        <Lucide name="sparkles" size={32} color="#2563eb" />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        StoreFlow AI
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Ask me anything about your business
      </Text>

      <View style={styles.suggestionsGrid}>
        {SUGGESTIONS.map((s, i) => (
          <Pressable
            key={i}
            style={[
              styles.suggestionChip,
              {
                backgroundColor: colors.card,
                borderColor: colors.backgroundElement,
              },
            ]}
            onPress={() => handleSend(s.label)}
          >
            <Lucide name={s.icon} size={16} color="#2563eb" />
            <Text
              style={[styles.suggestionText, { color: colors.text }]}
              numberOfLines={2}
            >
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
      >
        <View style={styles.flex}>
          {/* ─── Header ─── */}
          <View
            style={[
              styles.header,
              {
                backgroundColor: colors.background,
                borderBottomColor: colors.backgroundElement,
                paddingTop: insets.top + 10,
              },
            ]}
          >
            <Pressable
              onPress={() => router.back()}
              style={styles.headerBtn}
              hitSlop={8}
            >
              <Lucide name="arrow-left" size={22} color={colors.text} />
            </Pressable>

            <View style={styles.headerCenter}>
              <Text
                style={[styles.headerTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {conversationId ? conversationTitle : "AI Assistant"}
              </Text>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                onPress={() => setShowHistory(true)}
                style={styles.headerBtn}
                hitSlop={8}
              >
                <Lucide name="history" size={20} color={colors.textSecondary} />
              </Pressable>
              <Pressable
                onPress={handleNewChat}
                style={styles.headerBtn}
                hitSlop={8}
              >
                <Lucide name="plus" size={22} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {/* ─── Messages ─── */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={[
              styles.messagesList,
              messages.length === 0 && styles.messagesListEmpty,
            ]}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={
              isStreaming &&
              messages.length > 0 &&
              !messages[messages.length - 1]?.content ? (
                <TypingIndicator colors={colors} />
              ) : null
            }
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={scrollToBottom}
          />

          {/* ─── Input Bar ─── */}
          <View
            style={[
              styles.inputBar,
              {
                backgroundColor: colors.background,
                borderTopColor: colors.backgroundElement,
                paddingBottom: keyboardHeight > 0 ? 12 : 8,
              },
            ]}
          >
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.backgroundElement,
                },
              ]}
            >
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="Ask about your business..."
                placeholderTextColor={colors.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={2000}
                editable={!isStreaming}
                returnKeyType="send"
              />
              <Pressable
                onPress={() => {
                  handleSend();
                }}
                disabled={!inputText.trim() || isStreaming}
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor:
                      inputText.trim() && !isStreaming
                        ? "#2563eb"
                        : colors.backgroundElement,
                  },
                ]}
              >
                {isStreaming ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Lucide
                    name="send"
                    size={18}
                    color={
                      inputText.trim() && !isStreaming
                        ? "#ffffff"
                        : colors.textSecondary
                    }
                  />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ─── History Drawer ─── */}
      <HistoryDrawer
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        conversations={conversations}
        onSelect={handleSelectConversation}
        onDelete={(id) => deleteMutation.mutate(id)}
        colors={colors}
      />
    </View>
  );
};

export default AIScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  /* ─── Header ─── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, marginHorizontal: 8 },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: "row",
    gap: 4,
  },

  /* ─── Messages ─── */
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  messagesListEmpty: {
    flex: 1,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 10,
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowAssistant: {
    justifyContent: "flex-start",
  },
  messageBubbleWrapper: {
    maxWidth: "78%",
    gap: 6,
  },

  /* ─── Bubbles ─── */
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bubbleUserText: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 22,
  },

  /* ─── Avatars ─── */
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  userAvatarText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },

  /* ─── Tool Calls ─── */
  toolCallsContainer: { gap: 4 },
  toolCard: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  toolHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  toolLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  toolSummary: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },

  /* ─── Recommendations ─── */
  recContainer: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  recChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  recLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563eb",
    maxWidth: 180,
  },

  /* ─── Typing Indicator ─── */
  typingContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 10,
  },
  typingBubble: {
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  typingDotsRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typingLabel: {
    fontSize: 11,
    fontWeight: "500",
  },

  /* ─── Input Bar ─── */
  inputBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingTop: 4,
    paddingBottom: 4,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ─── Empty State ─── */
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 28,
  },
  suggestionsGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  suggestionChip: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },

  /* ─── History Drawer ─── */
  drawerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 10,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    zIndex: 20,
    paddingTop: 60,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  convItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  convItemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  convItemTitle: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  convDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyHistory: {
    padding: 40,
    alignItems: "center",
  },
  emptyHistoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

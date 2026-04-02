import { supabase } from "../lib/supabase";
import { assertNoPII } from "../lib/pii";
import type { Database } from "../types/supabase";

type Json = Database["public"]["Tables"]["messages"]["Row"]["metadata"];

interface ConversationSummary {
  conversation_id: string;
  other_user_id: string | null;
  other_display_name: string | null;
  other_avatar_url: string | null;
  other_last_read_at: string | null;
  last_message_content: string | null;
  last_message_type: string;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  unread_count: number;
}

interface MessageRow {
  id: string;
  content: string;
  created_at: string | null;
  deleted_at: string | null;
  sender_id: string | null;
  reply_to_id: string | null;
  edited_at: string | null;
  message_type: string;
  metadata: Json | null;
  starred_by: string[];
  expires_at: string | null;
  sender: { id: string; display_name: string | null; avatar_url: string | null }[] | null;
}

interface ReactionRow {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

interface ConvSettings {
  theme_accent: string | null;
  disappear_after: number | null;
}

interface LinkPreviewRow {
  message_id: string;
  url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  [key: string]: unknown;
}

export const messagesApi = {
  // List all conversations for current user with last message + unread count
  getConversations: async (): Promise<ConversationSummary[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: mine, error: e1 } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id);
    if (e1) throw new Error(e1.message);
    if (!mine?.length) return [];

    const convIds = mine.map(p => p.conversation_id);

    const [{ data: others, error: e2 }, { data: msgs, error: e3 }] = await Promise.all([
      supabase
        .from("conversation_participants")
        .select("conversation_id, user_id, last_read_at")
        .in("conversation_id", convIds)
        .neq("user_id", user.id),
      supabase
        .from("messages")
        .select("id, conversation_id, content, created_at, sender_id, message_type")
        .in("conversation_id", convIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    if (e2) throw new Error(e2.message);
    if (e3) throw new Error(e3.message);

    const otherIds = [...new Set((others ?? []).map(o => o.user_id))];
    const { data: profileRows, error: e4 } = otherIds.length
      ? await supabase.from("profiles").select("id, display_name, avatar_url").in("id", otherIds)
      : { data: [], error: null };
    if (e4) throw new Error(e4.message);

    return convIds.map(convId => {
      const me = mine.find(p => p.conversation_id === convId);
      const other = (others ?? []).find(o => o.conversation_id === convId);
      const profile = (profileRows ?? []).find(p => p.id === other?.user_id);
      const convMsgs = (msgs ?? []).filter(m => m.conversation_id === convId);
      const last = convMsgs[0] ?? null;
      const cutoff = me?.last_read_at ? new Date(me.last_read_at) : new Date(0);
      const unread = convMsgs.filter(m => m.sender_id !== user.id && new Date(m.created_at ?? 0) > cutoff).length;
      const displayName = profile?.display_name ?? null;
      return {
        conversation_id: convId,
        other_user_id: other?.user_id ?? null,
        other_display_name: displayName,
        other_avatar_url: profile?.avatar_url ?? null,
        other_last_read_at: other?.last_read_at ?? null,
        last_message_content: last?.content ?? null,
        last_message_type: last?.message_type ?? "text",
        last_message_at: last?.created_at ?? null,
        last_message_sender_id: last?.sender_id ?? null,
        unread_count: unread,
      };
    }).sort((a, b) => {
      if (!a.last_message_at) return 1;
      if (!b.last_message_at) return -1;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });
  },

  getOrCreateDM: async (otherUserId: string): Promise<string> => {
    const { data, error } = await supabase.rpc("get_or_create_dm", { other_user_id: otherUserId });
    if (error) throw new Error(error.message);
    return data as string;
  },

  getMessages: async (conversationId: string): Promise<MessageRow[]> => {
    const { data, error } = await supabase
      .from("messages")
      .select("id, content, created_at, deleted_at, sender_id, reply_to_id, edited_at, message_type, metadata, starred_by, expires_at, sender:profiles(id, display_name, avatar_url)")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as MessageRow[];
  },

  sendMessage: async (
    conversationId: string,
    content: string,
    replyToId: string | null = null,
    messageType = "text",
    metadata: Json = null,
  ): Promise<MessageRow> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    if (messageType === "text") assertNoPII(content);
    const row: Record<string, unknown> = {
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
      message_type: messageType,
    };
    if (replyToId) row.reply_to_id = replyToId;
    if (metadata) row.metadata = metadata;
    const { data, error } = await supabase.from("messages").insert(row).select().single();
    if (error) throw new Error(error.message);
    return data as MessageRow;
  },

  editMessage: async (messageId: string, content: string): Promise<void> => {
    assertNoPII(content);
    const { error } = await supabase
      .from("messages")
      .update({ content: content.trim(), edited_at: new Date().toISOString() })
      .eq("id", messageId);
    if (error) throw new Error(error.message);
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    const { error } = await supabase.from("conversations").delete().eq("id", conversationId);
    if (error) throw new Error(error.message);
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    const { error } = await supabase
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", messageId);
    if (error) throw new Error(error.message);
  },

  markRead: async (conversationId: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  },

  getReactions: async (conversationId: string): Promise<ReactionRow[]> => {
    const { data: msgs } = await supabase
      .from("messages")
      .select("id")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null);
    if (!msgs?.length) return [];
    const msgIds = msgs.map(m => m.id);
    const { data, error } = await supabase
      .from("message_reactions")
      .select("id, message_id, user_id, emoji")
      .in("message_id", msgIds);
    if (error) throw new Error(error.message);
    return (data ?? []) as ReactionRow[];
  },

  toggleReaction: async (messageId: string, userId: string, emoji: string): Promise<"added" | "removed"> => {
    const { data: existing } = await supabase
      .from("message_reactions")
      .select("id")
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .eq("emoji", emoji)
      .maybeSingle();
    if (existing) {
      await supabase.from("message_reactions").delete().eq("id", existing.id);
      return "removed";
    } else {
      await supabase.from("message_reactions").insert({ message_id: messageId, user_id: userId, emoji });
      return "added";
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const convs = await messagesApi.getConversations();
      return convs.reduce((sum, c) => sum + (Number(c.unread_count) || 0), 0);
    } catch {
      return 0;
    }
  },

  // ── Star ──────────────────────────────────────────────────────────────────────
  toggleStar: async (messageId: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc("toggle_message_star", { p_message_id: messageId });
    if (error) throw new Error(error.message);
    return data as boolean; // true = starred, false = unstarred
  },

  getStarred: async (conversationId: string): Promise<MessageRow[]> => {
    const { data, error } = await supabase.rpc("get_starred_messages", { p_conversation_id: conversationId });
    if (error) throw new Error(error.message);
    return (data ?? []) as MessageRow[];
  },

  // ── Search ────────────────────────────────────────────────────────────────────
  searchMessages: async (conversationId: string, query: string): Promise<MessageRow[]> => {
    const { data, error } = await supabase.rpc("search_messages", { p_conversation_id: conversationId, p_query: query });
    if (error) throw new Error(error.message);
    return (data ?? []) as MessageRow[];
  },

  // ── Conversation settings ─────────────────────────────────────────────────────
  getConvSettings: async (conversationId: string): Promise<ConvSettings> => {
    const { data, error } = await supabase.rpc("get_conversation_settings", { p_conversation_id: conversationId });
    if (error) throw new Error(error.message);
    const first = (data as ConvSettings[] | null)?.[0];
    return first ?? { theme_accent: null, disappear_after: null };
  },

  saveConvSettings: async (conversationId: string, themeAccent: string | null, disappearAfter: number | null): Promise<void> => {
    const { error } = await supabase.rpc("upsert_conversation_settings", {
      p_conversation_id: conversationId,
      p_theme_accent: themeAccent,
      p_disappear_after: disappearAfter,
    });
    if (error) throw new Error(error.message);
  },

  // ── Image upload ──────────────────────────────────────────────────────────────
  uploadImage: async (file: File): Promise<string> => {
    const ALLOWED_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp" };
    const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

    if (!ALLOWED_TYPES[file.type]) throw new Error("Only JPEG, PNG, GIF, and WebP images are allowed.");
    if (file.size > MAX_BYTES) throw new Error("Image must be smaller than 5 MB.");

    const ext = ALLOWED_TYPES[file.type];
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("chat-images").upload(path, file, { contentType: file.type });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("chat-images").getPublicUrl(path);
    return data.publicUrl;
  },

  // ── Link previews ─────────────────────────────────────────────────────────────
  getLinkPreviews: async (conversationId: string): Promise<LinkPreviewRow[]> => {
    const { data: msgs } = await supabase.from("messages").select("id").eq("conversation_id", conversationId).is("deleted_at", null);
    if (!msgs?.length) return [];
    const ids = msgs.map(m => m.id);
    const { data, error } = await supabase.from("message_link_previews").select("*").in("message_id", ids);
    if (error) throw new Error(error.message);
    return (data ?? []) as LinkPreviewRow[];
  },

  fetchLinkPreview: async (messageId: string, url: string): Promise<unknown> => {
    const { data: { session } } = await supabase.auth.getSession();
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    try {
      const res = await fetch(`${base}/functions/v1/fetch-link-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ message_id: messageId, url }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // ── Push notification for new message ────────────────────────────────────────
  notifyRecipient: async (conversationId: string, recipientId: string): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id === recipientId) return;
      await supabase.rpc("create_message_notification", {
        p_conversation_id: conversationId,
        p_recipient_id: recipientId,
        p_actor_id: user.id,
      });
    } catch {
      // non-critical
    }
  },
};

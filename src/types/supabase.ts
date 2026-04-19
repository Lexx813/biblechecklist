export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_usage_logs: {
        Row: {
          id: string
          created_at: string
          user_id: string | null
          model: string
          input_tokens: number
          output_tokens: number
          tool_used: string | null
          page: string | null
          cost_usd: number
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string | null
          model: string
          input_tokens?: number
          output_tokens?: number
          tool_used?: string | null
          page?: string | null
          cost_usd?: number
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string | null
          model?: string
          input_tokens?: number
          output_tokens?: number
          tool_used?: string | null
          page?: string | null
          cost_usd?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: number
          metadata: Json | null
          target_email: string | null
          target_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: number
          metadata?: Json | null
          target_email?: string | null
          target_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: number
          metadata?: Json | null
          target_email?: string | null
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_log_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          active: boolean
          author_id: string
          created_at: string
          id: string
          message: string
          type: string
        }
        Insert: {
          active?: boolean
          author_id: string
          created_at?: string
          id?: string
          message: string
          type?: string
        }
        Update: {
          active?: boolean
          author_id?: string
          created_at?: string
          id?: string
          message?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_likes: {
        Row: {
          post_id: string
          user_id: string
        }
        Insert: {
          post_id: string
          user_id: string
        }
        Update: {
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          content: string
          cover_url: string | null
          created_at: string
          embedding: string | null
          excerpt: string
          id: string
          lang: string
          like_count: number
          published: boolean
          search_vector: unknown
          slug: string
          title: string
          translations: Json
          updated_at: string
          view_count: number | null
          read_time_minutes: number
          is_featured: boolean
          subtitle: string | null
          tags: string[]
        }
        Insert: {
          author_id: string
          content?: string
          cover_url?: string | null
          created_at?: string
          embedding?: string | null
          excerpt?: string
          id?: string
          lang?: string
          like_count?: number
          published?: boolean
          search_vector?: unknown
          slug: string
          title: string
          translations?: Json
          updated_at?: string
          view_count?: number | null
          read_time_minutes?: number
          is_featured?: boolean
          subtitle?: string | null
          tags?: string[]
        }
        Update: {
          author_id?: string
          content?: string
          cover_url?: string | null
          created_at?: string
          embedding?: string | null
          excerpt?: string
          id?: string
          lang?: string
          like_count?: number
          published?: boolean
          search_vector?: unknown
          slug?: string
          title?: string
          translations?: Json
          updated_at?: string
          view_count?: number | null
          read_time_minutes?: number
          is_featured?: boolean
          subtitle?: string | null
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          thread_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          thread_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          thread_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_attempts: {
        Row: {
          answers: Json
          challenge_id: string
          completed_at: string
          created_at: string
          id: string
          score: number
          total: number
          user_id: string
        }
        Insert: {
          answers?: Json
          challenge_id: string
          completed_at?: string
          created_at?: string
          id?: string
          score?: number
          total?: number
          user_id: string
        }
        Update: {
          answers?: Json
          challenge_id?: string
          completed_at?: string
          created_at?: string
          id?: string
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "family_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_attempts_user_id_fkey2"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_reads: {
        Row: {
          book_index: number
          chapter: number
          read_at: string
          user_id: string
        }
        Insert: {
          book_index: number
          chapter: number
          read_at?: string
          user_id: string
        }
        Update: {
          book_index?: number
          chapter?: number
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          content_id: string
          content_preview: string | null
          content_type: string
          created_at: string
          id: string
          reason: string | null
          reporter_id: string
          status: string
        }
        Insert: {
          content_id: string
          content_preview?: string | null
          content_type: string
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id: string
          status?: string
        }
        Update: {
          content_id?: string
          content_preview?: string | null
          content_type?: string
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_settings: {
        Row: {
          conversation_id: string
          disappear_after: number | null
          theme_accent: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          disappear_after?: number | null
          theme_accent?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          disappear_after?: number | null
          theme_accent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_settings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      daily_verses: {
        Row: {
          accent_color: string
          id: number
          posted_at: string | null
          reference: string
          reflection: string
          scheduled_date: string
          tiktok_video_id: string | null
          verse_text: string
        }
        Insert: {
          accent_color?: string
          id?: never
          posted_at?: string | null
          reference: string
          reflection: string
          scheduled_date: string
          tiktok_video_id?: string | null
          verse_text: string
        }
        Update: {
          accent_color?: string
          id?: never
          posted_at?: string | null
          reference?: string
          reflection?: string
          scheduled_date?: string
          tiktok_video_id?: string | null
          verse_text?: string
        }
        Relationships: []
      }
      family_challenges: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          question_ids: string[]
          title: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          question_ids: string[]
          title?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          question_ids?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_challenges_creator_id_fkey2"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_categories: {
        Row: {
          created_at: string
          description: string
          description_es: string | null
          icon: string
          id: string
          name: string
          name_es: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string
          description_es?: string | null
          icon?: string
          id?: string
          name: string
          name_es?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string
          description_es?: string | null
          icon?: string
          id?: string
          name?: string
          name_es?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      forum_category_translations: {
        Row: {
          category_id: string
          description: string | null
          lang: string
          name: string
        }
        Insert: {
          category_id: string
          description?: string | null
          lang: string
          name: string
        }
        Update: {
          category_id?: string
          description?: string | null
          lang?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_category_translations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_likes: {
        Row: {
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_reactions: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_solution: boolean
          like_count: number
          thread_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_solution?: boolean
          like_count?: number
          thread_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_solution?: boolean
          like_count?: number
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_thread_watches: {
        Row: {
          created_at: string
          id: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_thread_watches_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          author_id: string
          category_id: string
          content: string
          created_at: string
          has_solution: boolean
          id: string
          lang: string
          like_count: number
          locked: boolean
          pinned: boolean
          search_vector: unknown
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id: string
          category_id: string
          content: string
          created_at?: string
          has_solution?: boolean
          id?: string
          lang?: string
          like_count?: number
          locked?: boolean
          pinned?: boolean
          search_vector?: unknown
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string
          category_id?: string
          content?: string
          created_at?: string
          has_solution?: boolean
          id?: string
          lang?: string
          like_count?: number
          locked?: boolean
          pinned?: boolean
          search_vector?: unknown
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_threads_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_threads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      group_announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          group_id: string
          id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          group_id: string
          id?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          group_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_announcements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_challenges: {
        Row: {
          created_at: string | null
          created_by: string | null
          ended_at: string | null
          group_id: string | null
          id: string
          plan_key: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          ended_at?: string | null
          group_id?: string | null
          id?: string
          plan_key: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          ended_at?: string | null
          group_id?: string | null
          id?: string
          plan_key?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_challenges_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_join_requests: {
        Row: {
          created_at: string
          group_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_join_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_weeks: {
        Row: {
          clam_bible_reading: string | null
          clam_closing_song: number | null
          clam_doc_id: string | null
          clam_midpoint_song: number | null
          clam_opening_song: number | null
          clam_parts: Json | null
          clam_week_title: string | null
          clam_wol_url: string | null
          created_at: string | null
          id: string
          scraped_at: string | null
          week_start: string
          wt_article_title: string | null
          wt_doc_id: string | null
          wt_paragraph_count: number | null
          wt_theme_scripture: string | null
          wt_wol_url: string | null
        }
        Insert: {
          clam_bible_reading?: string | null
          clam_closing_song?: number | null
          clam_doc_id?: string | null
          clam_midpoint_song?: number | null
          clam_opening_song?: number | null
          clam_parts?: Json | null
          clam_week_title?: string | null
          clam_wol_url?: string | null
          created_at?: string | null
          id?: string
          scraped_at?: string | null
          week_start: string
          wt_article_title?: string | null
          wt_doc_id?: string | null
          wt_paragraph_count?: number | null
          wt_theme_scripture?: string | null
          wt_wol_url?: string | null
        }
        Update: {
          clam_bible_reading?: string | null
          clam_closing_song?: number | null
          clam_doc_id?: string | null
          clam_midpoint_song?: number | null
          clam_opening_song?: number | null
          clam_parts?: Json | null
          clam_week_title?: string | null
          clam_wol_url?: string | null
          created_at?: string | null
          id?: string
          scraped_at?: string | null
          week_start?: string
          wt_article_title?: string | null
          wt_doc_id?: string | null
          wt_paragraph_count?: number | null
          wt_theme_scripture?: string | null
          wt_wol_url?: string | null
        }
        Relationships: []
      }
      message_link_previews: {
        Row: {
          fetched_at: string | null
          message_id: string
          og_description: string | null
          og_image: string | null
          og_title: string | null
          url: string
        }
        Insert: {
          fetched_at?: string | null
          message_id: string
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          url: string
        }
        Update: {
          fetched_at?: string | null
          message_id?: string
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_link_previews_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: true
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          expires_at: string | null
          id: string
          message_type: string
          metadata: Json | null
          reply_to_id: string | null
          sender_id: string | null
          starred_by: string[]
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          expires_at?: string | null
          id?: string
          message_type?: string
          metadata?: Json | null
          reply_to_id?: string | null
          sender_id?: string | null
          starred_by?: string[]
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          expires_at?: string | null
          id?: string
          message_type?: string
          metadata?: Json | null
          reply_to_id?: string | null
          sender_id?: string | null
          starred_by?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      note_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          book_index: number
          chapter: number
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          verse: string | null
        }
        Insert: {
          book_index: number
          chapter: number
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          verse?: string | null
        }
        Update: {
          book_index?: number
          chapter?: number
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          verse?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          body_preview: string | null
          conversation_id: string | null
          created_at: string
          id: string
          link_hash: string | null
          post_id: string | null
          read: boolean
          thread_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body_preview?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          link_hash?: string | null
          post_id?: string | null
          read?: boolean
          thread_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body_preview?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          link_hash?: string | null
          post_id?: string | null
          read?: boolean
          thread_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profanity_wordlist: {
        Row: {
          word: string
        }
        Insert: {
          word: string
        }
        Update: {
          word?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          can_blog: boolean
          cover_url: string | null
          is_approved_creator: boolean
          created_at: string
          daily_chapter_goal: number
          display_name: string | null
          email: string
          email_notifications: boolean
          email_notifications_blog: boolean
          email_notifications_digest: boolean
          email_notifications_streak: boolean
          freeze_tokens: number
          id: string
          is_admin: boolean
          is_banned: boolean
          is_moderator: boolean
          last_active_at: string | null
          meeting_day_midweek: number | null
          meeting_day_weekend: number | null
          onboarding_emails_sent: string[]
          reading_goal_date: string | null
          referral_code: string | null
          referred_by: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          terms_accepted_at: string | null
          top_badge_level: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          can_blog?: boolean
          cover_url?: string | null
          is_approved_creator?: boolean
          created_at?: string
          daily_chapter_goal?: number
          display_name?: string | null
          email: string
          email_notifications?: boolean
          email_notifications_blog?: boolean
          email_notifications_digest?: boolean
          email_notifications_streak?: boolean
          freeze_tokens?: number
          id: string
          is_admin?: boolean
          is_banned?: boolean
          is_moderator?: boolean
          last_active_at?: string | null
          meeting_day_midweek?: number | null
          meeting_day_weekend?: number | null
          onboarding_emails_sent?: string[]
          reading_goal_date?: string | null
          referral_code?: string | null
          referred_by?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          terms_accepted_at?: string | null
          top_badge_level?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          can_blog?: boolean
          cover_url?: string | null
          is_approved_creator?: boolean
          created_at?: string
          daily_chapter_goal?: number
          display_name?: string | null
          email?: string
          email_notifications?: boolean
          email_notifications_blog?: boolean
          email_notifications_digest?: boolean
          email_notifications_streak?: boolean
          freeze_tokens?: number
          id?: string
          is_admin?: boolean
          is_banned?: boolean
          is_moderator?: boolean
          last_active_at?: string | null
          meeting_day_midweek?: number | null
          meeting_day_weekend?: number | null
          onboarding_emails_sent?: string[]
          reading_goal_date?: string | null
          referral_code?: string | null
          referred_by?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          terms_accepted_at?: string | null
          top_badge_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_question_translations: {
        Row: {
          explanation: string | null
          lang: string
          options: Json
          question: string
          question_id: string
        }
        Insert: {
          explanation?: string | null
          lang: string
          options: Json
          question: string
          question_id: string
        }
        Update: {
          explanation?: string | null
          lang?: string
          options?: Json
          question?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_question_translations_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_index: number
          created_at: string
          explanation: string | null
          id: string
          level: number
          options: Json
          question: string
        }
        Insert: {
          correct_index: number
          created_at?: string
          explanation?: string | null
          id?: string
          level: number
          options: Json
          question: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          explanation?: string | null
          id?: string
          level?: number
          options?: Json
          question?: string
        }
        Relationships: []
      }
      quiz_timed_scores: {
        Row: {
          achieved_at: string | null
          id: string
          level: number
          score: number
          user_id: string | null
        }
        Insert: {
          achieved_at?: string | null
          id?: string
          level: number
          score: number
          user_id?: string | null
        }
        Update: {
          achieved_at?: string | null
          id?: string
          level?: number
          score?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_timed_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_activity: {
        Row: {
          activity_date: string
          user_id: string
        }
        Insert: {
          activity_date?: string
          user_id: string
        }
        Update: {
          activity_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_log: {
        Row: {
          chapters_read: number
          date: string
          user_id: string
        }
        Insert: {
          chapters_read?: number
          date: string
          user_id: string
        }
        Update: {
          chapters_read?: number
          date?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_plan_completions: {
        Row: {
          completed_at: string | null
          day_number: number
          id: string
          plan_id: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          day_number: number
          id?: string
          plan_id?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          day_number?: number
          id?: string
          plan_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_plan_completions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "user_reading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_progress: {
        Row: {
          progress: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          progress?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          progress?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string | null
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string | null
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      streak_freeze_uses: {
        Row: {
          created_at: string | null
          id: string
          used_date: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          used_date: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          used_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "streak_freeze_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_members: {
        Row: {
          group_id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          group_id: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          group_id: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          group_id?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_message_reactions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "study_group_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_messages: {
        Row: {
          content: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          group_id: string
          id: string
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          group_id: string
          id?: string
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          group_id?: string
          id?: string
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "study_group_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          cover_url: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          goal_deadline: string | null
          goal_label: string | null
          group_type: string
          id: string
          invite_code: string | null
          is_private: boolean | null
          name: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          goal_deadline?: string | null
          goal_label?: string | null
          group_type?: string
          id?: string
          invite_code?: string | null
          is_private?: boolean | null
          name: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          goal_deadline?: string | null
          goal_label?: string | null
          group_type?: string
          id?: string
          invite_code?: string | null
          is_private?: boolean | null
          name?: string
        }
        Relationships: []
      }
      study_note_likes: {
        Row: {
          created_at: string
          id: string
          note_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_note_likes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "study_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_note_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_notes: {
        Row: {
          book_index: number | null
          chapter: number | null
          content: string | null
          created_at: string | null
          folder_id: string | null
          id: string
          is_public: boolean | null
          lang: string
          like_count: number
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          verse: string | null
        }
        Insert: {
          book_index?: number | null
          chapter?: number | null
          content?: string | null
          created_at?: string | null
          folder_id?: string | null
          id?: string
          is_public?: boolean | null
          lang?: string
          like_count?: number
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          verse?: string | null
        }
        Update: {
          book_index?: number | null
          chapter?: number | null
          content?: string | null
          created_at?: string | null
          folder_id?: string | null
          id?: string
          is_public?: boolean | null
          lang?: string
          like_count?: number
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          verse?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_notes_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "note_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_key: string
          earned_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          badge_key: string
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          badge_key?: string
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_keys: {
        Row: {
          public_key_jwk: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          public_key_jwk: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          public_key_jwk?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_meeting_prep: {
        Row: {
          clam_checked: Json | null
          clam_completed: boolean | null
          clam_notes: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
          week_start: string
          wt_checked: Json | null
          wt_completed: boolean | null
          wt_notes: string | null
        }
        Insert: {
          clam_checked?: Json | null
          clam_completed?: boolean | null
          clam_notes?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          week_start: string
          wt_checked?: Json | null
          wt_completed?: boolean | null
          wt_notes?: string | null
        }
        Update: {
          clam_checked?: Json | null
          clam_completed?: boolean | null
          clam_notes?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          week_start?: string
          wt_checked?: Json | null
          wt_completed?: boolean | null
          wt_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_meeting_prep_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          user_id: string
          visibility: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          user_id: string
          visibility?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_progress: {
        Row: {
          attempts: number
          badge_earned: boolean
          best_score: number
          id: string
          level: number
          unlocked: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          badge_earned?: boolean
          best_score?: number
          id?: string
          level: number
          unlocked?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          badge_earned?: boolean
          best_score?: number
          id?: string
          level?: number
          unlocked?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reading_plans: {
        Row: {
          created_at: string | null
          custom_config: Json | null
          id: string
          is_paused: boolean
          paused_at: string | null
          paused_days: number
          start_date: string
          template_key: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          custom_config?: Json | null
          id?: string
          is_paused?: boolean
          paused_at?: string | null
          paused_days?: number
          start_date?: string
          template_key: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          custom_config?: Json | null
          id?: string
          is_paused?: boolean
          paused_at?: string | null
          paused_days?: number
          start_date?: string
          template_key?: string
          user_id?: string | null
        }
        Relationships: []
      }
      verse_embeddings: {
        Row: {
          book_name: string
          book_theme: string
          embed_text: string
          embedding: string | null
          id: number
          verse_ref: string
          verse_text: string
        }
        Insert: {
          book_name: string
          book_theme: string
          embed_text: string
          embedding?: string | null
          id: number
          verse_ref: string
          verse_text: string
        }
        Update: {
          book_name?: string
          book_theme?: string
          embed_text?: string
          embedding?: string | null
          id?: number
          verse_ref?: string
          verse_text?: string
        }
        Relationships: []
      }
      creator_requests: {
        Row: {
          id: string
          user_id: string
          display_name: string
          topic_description: string
          sample_url: string | null
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name: string
          topic_description: string
          sample_url?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string
          topic_description?: string
          sample_url?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          id: string
          slug: string
          title: string
          description: string | null
          creator_id: string
          embed_url: string | null
          storage_path: string | null
          duration_sec: number | null
          thumbnail_url: string | null
          published: boolean
          likes_count: number
          is_spotlight: boolean
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description?: string | null
          creator_id: string
          embed_url?: string | null
          storage_path?: string | null
          duration_sec?: number | null
          thumbnail_url?: string | null
          published?: boolean
          likes_count?: number
          is_spotlight?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          description?: string | null
          creator_id?: string
          embed_url?: string | null
          storage_path?: string | null
          duration_sec?: number | null
          thumbnail_url?: string | null
          published?: boolean
          likes_count?: number
          is_spotlight?: boolean
          created_at?: string
        }
        Relationships: []
      }
      video_likes: {
        Row: { user_id: string; video_id: string; created_at: string }
        Insert: { user_id: string; video_id: string; created_at?: string }
        Update: { user_id?: string; video_id?: string; created_at?: string }
        Relationships: []
      }
      video_comments: {
        Row: {
          id: string
          video_id: string
          author_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          author_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          author_id?: string
          content?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _audit: {
        Args: { p_action: string; p_metadata?: Json; p_target_id?: string }
        Returns: undefined
      }
      admin_ban_user: {
        Args: { new_value: boolean; target_user_id: string }
        Returns: undefined
      }
      admin_delete_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_gift_premium: {
        Args: { new_value: boolean; target_user_id: string }
        Returns: undefined
      }
      admin_lock_thread: {
        Args: { new_value: boolean; p_thread_id: string }
        Returns: undefined
      }
      admin_pin_thread: {
        Args: { new_value: boolean; p_thread_id: string }
        Returns: undefined
      }
      admin_set_admin: {
        Args: { new_value: boolean; target_user_id: string }
        Returns: undefined
      }
      admin_set_blog: {
        Args: { new_value: boolean; target_user_id: string }
        Returns: undefined
      }
      admin_set_moderator: {
        Args: { new_value: boolean; target_user_id: string }
        Returns: undefined
      }
      apply_referral: {
        Args: { p_code: string; p_new_user_id: string }
        Returns: boolean
      }
      can_blog: { Args: never; Returns: boolean }
      confirm_referral: { Args: { p_referred_id: string }; Returns: undefined }
      contains_profanity: { Args: { input: string }; Returns: boolean }
      create_message_notification: {
        Args: {
          p_actor_id: string
          p_conversation_id: string
          p_recipient_id: string
        }
        Returns: undefined
      }
      create_notification: {
        Args: {
          p_actor_id: string
          p_link_hash?: string
          p_post_id?: string
          p_preview?: string
          p_thread_id?: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      decrement_freeze_token: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      generate_referral_code: { Args: { p_user_id: string }; Returns: string }
      get_conversation_settings: {
        Args: { p_conversation_id: string }
        Returns: {
          disappear_after: number
          theme_accent: string
        }[]
      }
      get_conversations: {
        Args: never
        Returns: {
          conversation_id: string
          last_message_at: string
          last_message_content: string
          last_message_sender_id: string
          other_avatar_url: string
          other_display_name: string
          other_user_id: string
          unread_count: number
        }[]
      }
      get_early_adopter_spots_left: { Args: never; Returns: number }
      get_global_chapter_count: { Args: never; Returns: number }
      get_group_challenge_progress: {
        Args: { p_challenge_id: string; p_plan_chapters: Json }
        Returns: {
          avatar_url: string
          chapters_done: number
          display_name: string
          pct: number
          total_chapters: number
          user_id: string
        }[]
      }
      get_group_reading_progress: {
        Args: { p_group_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          last_read_date: string
          total_chapters: number
          user_id: string
        }[]
      }
      get_or_create_dm: { Args: { other_user_id: string }; Returns: string }
      get_prep_streak: { Args: { p_user_id: string }; Returns: number }
      get_quiz_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          avatar_url: string
          display_name: string
          levels_completed: number
          subscription_status: string
          top_badge_level: number
          user_id: string
        }[]
      }
      get_reading_heatmap: {
        Args: { p_days?: number; p_user_id: string }
        Returns: {
          chapters: number
          date: string
        }[]
      }
      get_reading_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          avatar_url: string
          books_complete: number
          chapters_read: number
          display_name: string
          pct: number
          subscription_status: string
          user_id: string
        }[]
      }
      get_reading_streak: {
        Args: { p_user_id: string }
        Returns: {
          current_streak: number
          longest_streak: number
          total_days: number
        }[]
      }
      get_reading_streaks: { Args: { p_user_id: string }; Returns: Json }
      get_resend_key: { Args: never; Returns: string }
      get_starred_messages: {
        Args: { p_conversation_id: string }
        Returns: {
          content: string
          conversation_id: string | null
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          expires_at: string | null
          id: string
          message_type: string
          metadata: Json | null
          reply_to_id: string | null
          sender_id: string | null
          starred_by: string[]
        }[]
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_thread_reactions: {
        Args: { p_thread_id: string; p_user_id: string }
        Returns: Json
      }
      get_unread_message_count: { Args: never; Returns: number }
      get_user_blog_likes: { Args: { p_user_id: string }; Returns: string[] }
      get_user_forum_likes: { Args: { p_user_id: string }; Returns: Json }
      get_user_forum_stats: { Args: { p_user_id: string }; Returns: Json }
      get_user_note_likes: { Args: { p_user_id: string }; Returns: string[] }
      get_user_thread_watches: {
        Args: { p_user_id: string }
        Returns: string[]
      }
      global_search: {
        Args: { p_limit?: number; p_query: string }
        Returns: Json
      }
      increment_blog_view: { Args: { post_id: string }; Returns: undefined }
      increment_reading_log: {
        Args: { p_date: string; p_delta: number }
        Returns: undefined
      }
      increment_thread_view: {
        Args: { p_thread_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_conversation_participant: {
        Args: { conv_id: string }
        Returns: boolean
      }
      is_group_admin: { Args: { p_group_id: string }; Returns: boolean }
      is_group_member: { Args: { p_group_id: string }; Returns: boolean }
      is_moderator: { Args: never; Returns: boolean }
      mark_notifications_read: { Args: { p_ids: string[] }; Returns: undefined }
      mark_conversation_notifications_read: { Args: { p_conversation_id: string }; Returns: undefined }
      mark_reply_as_solution: {
        Args: { p_reply_id: string; p_thread_id: string; p_value: boolean }
        Returns: undefined
      }
      search_messages: {
        Args: { p_conversation_id: string; p_query: string }
        Returns: {
          content: string
          conversation_id: string | null
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          expires_at: string | null
          id: string
          message_type: string
          metadata: Json | null
          reply_to_id: string | null
          sender_id: string | null
          starred_by: string[]
        }[]
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_profiles_by_name: {
        Args: { p_limit?: number; p_prefix: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
        }[]
      }
      semantic_search: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: Json
      }
      submit_quiz_result: {
        Args: { p_level: number; p_score: number; p_user_id: string }
        Returns: Json
      }
      toggle_blog_like: { Args: { p_post_id: string }; Returns: Json }
      toggle_bookmark: {
        Args: { p_post_id?: string; p_thread_id?: string }
        Returns: Json
      }
      toggle_follow: { Args: { p_following_id: string }; Returns: boolean }
      toggle_forum_reaction: {
        Args: { p_content_id: string; p_content_type: string; p_emoji: string }
        Returns: Json
      }
      toggle_message_star: { Args: { p_message_id: string }; Returns: boolean }
      toggle_reply_like: { Args: { p_reply_id: string }; Returns: Json }
      toggle_study_note_like: { Args: { p_note_id: string }; Returns: Json }
      toggle_thread_like: { Args: { p_thread_id: string }; Returns: Json }
      toggle_thread_watch: { Args: { p_thread_id: string }; Returns: Json }
      upsert_conversation_settings: {
        Args: {
          p_conversation_id: string
          p_disappear_after?: number
          p_theme_accent?: string
        }
        Returns: undefined
      }
      upsert_quiz_translation: {
        Args: {
          p_lang: string
          p_options: Json
          p_question: string
          p_question_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const


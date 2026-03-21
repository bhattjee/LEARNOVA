import type { UserPublic } from "@/types/auth.types";

export type LessonType = "video" | "document" | "image" | "quiz";
export type AttachmentType = "file" | "link";

export interface AttachmentItem {
  id: string;
  type: AttachmentType;
  url: string;
  label: string;
}

export interface LessonItem {
  id: string;
  title: string;
  type: LessonType;
  video_url: string | null;
  file_url: string | null;
  duration_seconds: number;
  allow_download: boolean;
  description: string | null;
  sort_order: number;
  responsible_user: UserPublic | null;
  attachments: AttachmentItem[];
  quiz_id?: string | null;
}

export interface CreateLessonRequest {
  title: string;
  type: LessonType;
  video_url?: string | null;
  file_url?: string | null;
  duration_seconds?: number;
  allow_download?: boolean;
  description?: string | null;
  responsible_user_id?: string | null;
}

export interface UpdateLessonRequest {
  title?: string;
  type?: LessonType;
  video_url?: string | null;
  file_url?: string | null;
  duration_seconds?: number;
  allow_download?: boolean;
  description?: string | null;
  responsible_user_id?: string | null;
}

export interface CreateAttachmentRequest {
  type: AttachmentType;
  url: string;
  label: string;
}

export interface LessonsListResponse {
  data: LessonItem[];
}

export interface LessonItemEnvelope {
  data: LessonItem;
}

export interface AttachmentItemEnvelope {
  data: AttachmentItem;
}

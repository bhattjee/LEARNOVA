import { useEffect, useState } from "react";
import { FileText, Image as ImageIcon, Link2, Loader2, PlayCircle, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLesson, useLessonMutations } from "@/hooks/useLessons";
import { useStaffUsers } from "@/hooks/useCourses";
import { formatSecondsToHHMM, parseDurationToSeconds } from "@/lib/duration";
import { cn } from "@/lib/utils";
import type { AttachmentItem, AttachmentType, CreateAttachmentRequest, LessonType } from "@/types/lesson.types";

interface LessonEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  lessonId: string | null;
}

interface PendingLink {
  type: "link";
  url: string;
  label: string;
}

export function LessonEditorModal({ open, onOpenChange, courseId, lessonId }: LessonEditorModalProps) {
  const isEdit = Boolean(lessonId);
  const { data: lessonDetail, isLoading: lessonLoading } = useLesson(lessonId ?? undefined, open && isEdit);
  const { data: staffUsers, isLoading: staffLoading } = useStaffUsers();
  const { create, update, addAtt, removeAtt } = useLessonMutations(courseId);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<LessonType>("video");
  const [videoUrl, setVideoUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [durationHHMM, setDurationHHMM] = useState("0:00");
  const [allowDownload, setAllowDownload] = useState(false);
  const [description, setDescription] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [pendingLinks, setPendingLinks] = useState<PendingLink[]>([]);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!isEdit) {
      setTitle("");
      setType("video");
      setVideoUrl("");
      setFileUrl("");
      setDurationHHMM("0:00");
      setAllowDownload(false);
      setDescription("");
      setResponsibleId("");
      setPendingLinks([]);
      setLinkLabel("");
      setLinkUrl("");
    }
  }, [open, isEdit]);

  useEffect(() => {
    if (!open || !isEdit || !lessonDetail || lessonDetail.id !== lessonId) return;
    setTitle(lessonDetail.title);
    setType(lessonDetail.type);
    setVideoUrl(lessonDetail.video_url ?? "");
    setFileUrl(lessonDetail.file_url ?? "");
    setDurationHHMM(formatSecondsToHHMM(lessonDetail.duration_seconds));
    setAllowDownload(lessonDetail.allow_download);
    setDescription(lessonDetail.description ?? "");
    setResponsibleId(lessonDetail.responsible_user?.id ?? "");
    setPendingLinks([]);
    setLinkLabel("");
    setLinkUrl("");
  }, [open, isEdit, lessonId, lessonDetail]);

  function addPendingOrServerLink() {
    const label = linkLabel.trim();
    const url = linkUrl.trim();
    if (!label || !url) {
      toast.message("Enter label and URL.");
      return;
    }
    const body: CreateAttachmentRequest = { type: "link" as AttachmentType, url, label };
    if (isEdit && lessonId) {
      void addAtt.mutateAsync({ lessonId, body }).then(() => {
        toast.success("Link added");
        setLinkLabel("");
        setLinkUrl("");
      });
    } else {
      setPendingLinks((p) => [...p, { type: "link", url, label }]);
      setLinkLabel("");
      setLinkUrl("");
    }
  }

  function removePending(i: number) {
    setPendingLinks((p) => p.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    const t = title.trim();
    if (!t) {
      toast.error("Title is required.");
      return;
    }
    const duration_seconds = parseDurationToSeconds(durationHHMM);
    const desc = description.slice(0, 3000).trim() || null;
    const rid = responsibleId || null;

    const payload = {
      title: t,
      type,
      duration_seconds,
      allow_download: type === "video" ? false : allowDownload,
      description: desc,
      responsible_user_id: rid,
      video_url: type === "video" ? videoUrl.trim() || null : null,
      file_url: type === "document" || type === "image" ? fileUrl.trim() || null : null,
    };

    setSaving(true);
    try {
      if (isEdit && lessonId) {
        await update.mutateAsync({ id: lessonId, body: payload });
        toast.success("Lesson saved");
      } else {
        const created = await create.mutateAsync({
          title: payload.title,
          type: payload.type,
          video_url: payload.video_url,
          file_url: payload.file_url,
          duration_seconds: payload.duration_seconds,
          allow_download: payload.allow_download,
          description: payload.description,
          responsible_user_id: payload.responsible_user_id,
        });
        for (const pl of pendingLinks) {
          await addAtt.mutateAsync({
            lessonId: created.id,
            body: { type: "link", url: pl.url, label: pl.label },
          });
        }
        toast.success("Lesson saved");
      }
      onOpenChange(false);
    } catch {
      toast.error("Could not save lesson.");
    } finally {
      setSaving(false);
    }
  }

  const displayAttachments: AttachmentItem[] = isEdit && lessonDetail ? lessonDetail.attachments : [];
  const showLoader = open && isEdit && lessonLoading;

  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
      )}
      role="presentation"
      onClick={() => !saving && onOpenChange(false)}
    >
      <div
        className="max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-xl border border-brand-mid-grey bg-white shadow-lg"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-brand-mid-grey px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-black">
            {isEdit ? "Edit Lesson" : "Add Lesson"}
          </h2>
        </div>

        {showLoader ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand-dark-grey" />
          </div>
        ) : (
          <>
            <div className="px-6 pt-4">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="flex w-full flex-wrap gap-1">
                  <TabsTrigger value="content" className="flex-1 text-xs sm:text-sm">
                    Content
                  </TabsTrigger>
                  <TabsTrigger value="description" className="flex-1 text-xs sm:text-sm">
                    Description
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="flex-1 text-xs sm:text-sm">
                    Additional Attachments
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="mt-4 space-y-4 pb-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-brand-black">Lesson Title</label>
                    <input
                      type="text"
                      required
                      maxLength={500}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-10 w-full rounded-md border border-brand-mid-grey px-3 text-sm outline-none ring-primary-light focus:border-primary focus:ring-2"
                    />
                  </div>

                  <div>
                    <span className="mb-2 block text-sm font-medium text-brand-black">Content Category</span>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {(
                        [
                          { v: "video" as const, label: "Video", icon: PlayCircle, emoji: "📹" },
                          { v: "document" as const, label: "Document", icon: FileText, emoji: "📄" },
                          { v: "image" as const, label: "Image", icon: ImageIcon, emoji: "🖼️" },
                        ] as const
                      ).map(({ v, label, icon: Icon, emoji }) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setType(v)}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-sm font-medium transition-colors",
                            type === v
                              ? "border-primary text-primary"
                              : "border-brand-mid-grey text-brand-dark-grey hover:border-brand-mid-grey/80",
                          )}
                        >
                          <span className="text-xl" aria-hidden>
                            {emoji}
                          </span>
                          <Icon className="h-5 w-5" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lesson-resp" className="mb-1 block text-sm font-medium text-brand-black">
                      Responsible (optional)
                    </label>
                    <select
                      id="lesson-resp"
                      value={responsibleId}
                      onChange={(e) => setResponsibleId(e.target.value)}
                      disabled={staffLoading}
                      className="h-10 w-full rounded-md border border-brand-mid-grey bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2"
                    >
                      <option value="">None</option>
                      {(staffUsers ?? []).map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {type === "video" ? (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-brand-black">Video Link</label>
                      <input
                        type="url"
                        placeholder="YouTube or Google Drive link"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="h-10 w-full rounded-md border border-brand-mid-grey px-3 text-sm outline-none focus:border-primary focus:ring-2"
                      />
                      <p className="text-xs text-brand-dark-grey">
                        (Google Drive link or YouTube video link is applicable)
                      </p>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-brand-black">
                          Duration (H:MM hours)
                        </label>
                        <input
                          type="text"
                          placeholder="0:45"
                          value={durationHHMM}
                          onChange={(e) => setDurationHHMM(e.target.value)}
                          className="h-10 w-full rounded-md border border-brand-mid-grey px-3 text-sm outline-none focus:border-primary focus:ring-2"
                        />
                      </div>
                    </div>
                  ) : null}

                  {type === "document" ? (
                    <div className="space-y-3">
                      <button
                        type="button"
                        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-brand-mid-grey px-4 text-sm font-medium text-brand-dark-grey hover:bg-brand-light-grey"
                        onClick={() => toast.message("File upload is available in Phase 14.")}
                      >
                        <Upload className="h-4 w-4" />
                        Upload document
                      </button>
                      <label className="flex items-center gap-2 text-sm text-brand-dark-grey">
                        <input
                          type="checkbox"
                          checked={allowDownload}
                          onChange={(e) => setAllowDownload(e.target.checked)}
                          className="rounded border-brand-mid-grey"
                        />
                        Allow download
                      </label>
                    </div>
                  ) : null}

                  {type === "image" ? (
                    <div className="space-y-3">
                      <button
                        type="button"
                        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-brand-mid-grey px-4 text-sm font-medium text-brand-dark-grey hover:bg-brand-light-grey"
                        onClick={() => toast.message("Image upload is available in Phase 14.")}
                      >
                        <Upload className="h-4 w-4" />
                        Upload image
                      </button>
                      <label className="flex items-center gap-2 text-sm text-brand-dark-grey">
                        <input
                          type="checkbox"
                          checked={allowDownload}
                          onChange={(e) => setAllowDownload(e.target.checked)}
                          className="rounded border-brand-mid-grey"
                        />
                        Allow download
                      </label>
                    </div>
                  ) : null}
                </TabsContent>

                <TabsContent value="description" className="mt-4 pb-2">
                  <label className="mb-1 block text-sm font-medium text-brand-black">
                    Lesson description shown to learners
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 3000))}
                    rows={8}
                    maxLength={3000}
                    className="w-full rounded-md border border-brand-mid-grey px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2"
                  />
                  <p className="mt-1 text-xs text-brand-dark-grey">{description.length} / 3000</p>
                </TabsContent>

                <TabsContent value="attachments" className="mt-4 space-y-4 pb-2">
                  <ul className="space-y-2">
                    {displayAttachments.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between rounded-md border border-brand-mid-grey px-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-2 text-brand-black">
                          {a.type === "file" ? (
                            <FileText className="h-4 w-4 text-brand-dark-grey" />
                          ) : (
                            <Link2 className="h-4 w-4 text-brand-dark-grey" />
                          )}
                          {a.label}
                        </span>
                        {isEdit && lessonId ? (
                          <button
                            type="button"
                            className="text-status-danger hover:underline"
                            onClick={() =>
                              void removeAtt.mutateAsync({ lessonId, attachmentId: a.id })
                            }
                            aria-label="Remove attachment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </li>
                    ))}
                    {!isEdit
                      ? pendingLinks.map((p, i) => (
                          <li
                            key={`${p.url}-${i}`}
                            className="flex items-center justify-between rounded-md border border-brand-mid-grey px-3 py-2 text-sm"
                          >
                            <span className="flex items-center gap-2">
                              <Link2 className="h-4 w-4" />
                              {p.label}
                            </span>
                            <button type="button" onClick={() => removePending(i)} aria-label="Remove">
                              <Trash2 className="h-4 w-4 text-status-danger" />
                            </button>
                          </li>
                        ))
                      : null}
                  </ul>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="inline-flex min-h-9 items-center gap-2 rounded-md border border-brand-mid-grey px-3 text-sm font-medium hover:bg-brand-light-grey"
                      onClick={() => toast.message("File upload is available in Phase 14.")}
                    >
                      <Upload className="h-4 w-4" />
                      Upload file
                    </button>
                  </div>

                  <div className="rounded-md border border-dashed border-brand-mid-grey p-3">
                    <p className="mb-2 text-sm font-medium text-brand-black">Add link</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        placeholder="Label"
                        value={linkLabel}
                        onChange={(e) => setLinkLabel(e.target.value)}
                        className="h-10 flex-1 rounded-md border border-brand-mid-grey px-3 text-sm"
                      />
                      <input
                        type="url"
                        placeholder="URL"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        className="h-10 flex-1 rounded-md border border-brand-mid-grey px-3 text-sm"
                      />
                      <button
                        type="button"
                        onClick={addPendingOrServerLink}
                        className="h-10 shrink-0 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex justify-end gap-2 border-t border-brand-mid-grey px-6 py-4">
              <button
                type="button"
                disabled={saving}
                className="inline-flex min-h-9 items-center justify-center rounded-md border border-brand-mid-grey px-4 text-sm font-medium hover:bg-brand-light-grey"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="inline-flex min-h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Lesson"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

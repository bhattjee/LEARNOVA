import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Loader2,
  Mail,
  UserPlus,
} from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AddAttendeesWizard } from "@/components/admin/attendees/AddAttendeesWizard";
import { ContactAttendeesWizard } from "@/components/admin/attendees/ContactAttendeesWizard";
import { CourseOptions } from "@/components/admin/courses/CourseOptions";
import { LessonList } from "@/components/admin/lessons/LessonList";
import { PublishToggle } from "@/components/admin/courses/PublishToggle";
import { QuizTab } from "@/components/admin/quiz/QuizTab";
import { TagInput } from "@/components/admin/courses/TagInput";
import { FileUploadZone } from "@/components/common/FileUploadZone";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCourse, useStaffUsers, useUpdateCourse } from "@/hooks/useCourses";
import { cn } from "@/lib/utils";

const TAB_VALUES = ["content", "description", "options", "quiz"] as const;
type TabValue = (typeof TAB_VALUES)[number];

function normalizeTab(raw: string | null): TabValue {
  if (raw && TAB_VALUES.includes(raw as TabValue)) {
    return raw as TabValue;
  }
  return "content";
}

export function CourseFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = normalizeTab(searchParams.get("tab"));

  const { data: course, isLoading, isError } = useCourse(id);
  const updateMutation = useUpdateCourse(id ?? "");
  const { data: staffUsers, isLoading: staffLoading } = useStaffUsers();

  const [headerTitle, setHeaderTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [website, setWebsite] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [description, setDescription] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [attendeesOpen, setAttendeesOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    if (!course) return;
    setHeaderTitle(course.title);
    setTags([...course.tags]);
    setWebsite(course.website ?? "");
    setResponsibleId(course.responsible_user_id ?? "");
    setDescription(course.description ?? "");
  }, [course]);

  function flashSaved() {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  }

  async function saveField(partial: Parameters<typeof updateMutation.mutateAsync>[0]) {
    if (!id) return;
    try {
      await updateMutation.mutateAsync(partial);
      flashSaved();
    } catch {
      toast.error("Could not save changes.");
    }
  }

  function setTab(next: TabValue) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", next);
    setSearchParams(nextParams, { replace: true });
  }

  function onHeaderTitleBlur() {
    if (!course) return;
    const t = headerTitle.trim();
    if (!t || t === course.title) return;
    void saveField({ title: t });
  }

  function commitTags() {
    if (!course) return;
    const a = [...tags].sort().join("|");
    const b = [...course.tags].sort().join("|");
    if (a === b) return;
    void saveField({ tags: [...tags] });
  }

  function onWebsiteBlur() {
    if (!course) return;
    const w = website.trim();
    const cur = (course.website ?? "").trim();
    if (w === cur) return;
    void saveField({ website: w || null });
  }

  function onResponsibleChange(next: string) {
    setResponsibleId(next);
    if (!course) return;
    const nextId = next === "" ? null : next;
    const cur = course.responsible_user_id ?? null;
    if (nextId === cur) return;
    void saveField({ responsible_user_id: nextId });
  }

  async function saveDescription() {
    if (!course) return;
    const d = description.slice(0, 5000);
    const cur = (course.description ?? "").trim();
    if (d.trim() === cur) {
      toast.message("No changes to save.");
      return;
    }
    try {
      await updateMutation.mutateAsync({ description: d.trim() || null });
      toast.success("Description updated successfully!");
      flashSaved();
    } catch {
      toast.error("Could not save description.");
    }
  }

  if (!id) {
    return <p className="text-sm text-status-danger">Invalid course.</p>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-brand-dark-grey">
        <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-status-danger">Could not load this course.</p>
        <Link to="/admin/dashboard" className="text-sm font-medium text-primary hover:text-primary-hover">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const saving = updateMutation.isPending;

  return (
    <div className="-mx-6 -mt-6">
      <header className="sticky top-16 z-20 flex min-h-16 flex-wrap items-center gap-3 border-b border-brand-mid-grey bg-white px-6 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            to="/admin/dashboard"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-brand-dark-grey hover:bg-brand-light-grey"
            aria-label="Back to courses"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <input
            type="text"
            required
            value={headerTitle}
            onChange={(e) => setHeaderTitle(e.target.value)}
            onBlur={onHeaderTitleBlur}
            disabled={saving}
            className="min-w-0 flex-1 border-0 bg-transparent text-lg font-semibold text-brand-black outline-none focus:ring-0"
            maxLength={500}
            aria-label="Course title"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saving ? (
            <span className="flex items-center gap-1 text-xs text-brand-dark-grey">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving…
            </span>
          ) : savedFlash ? (
            <span className="flex items-center gap-1 text-xs text-status-success">
              <Check className="h-3.5 w-3.5" />
              Saved
            </span>
          ) : null}
          <PublishToggle courseId={id} isPublished={course.is_published} website={course.website} />
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-primary hover:bg-primary-light"
            onClick={() => window.open(`${window.location.origin}/courses/${id}`, "_blank", "noopener,noreferrer")}
          >
            Preview
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium text-primary hover:bg-primary-light"
            onClick={() => setAttendeesOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Add Attendees
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium text-primary hover:bg-primary-light"
            onClick={() => setContactOpen(true)}
          >
            <Mail className="h-4 w-4" />
            Contact Attendees
          </button>
        </div>
      </header>

      <div className="border-b border-brand-mid-grey bg-brand-light-grey px-6 py-4">
        <FileUploadZone
          label="Course Cover Image"
          allowedTypes="image"
          currentUrl={course.cover_image_url}
          onUpload={(url) => void saveField({ cover_image_url: url })}
          onRemove={() => void saveField({ cover_image_url: null })}
          className="max-w-[800px] mx-auto"
        />
      </div>

      <div className="space-y-6 px-6 pb-10 pt-6">
        <div className="rounded-xl border border-brand-mid-grey bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="space-y-4">
            <div>
              <span className="mb-1 block text-sm font-medium text-brand-black">Tags</span>
              <TagInput
                value={tags}
                onChange={setTags}
                onCommit={commitTags}
                disabled={saving}
              />
            </div>
            <div>
              <label htmlFor="course-website" className="mb-1 block text-sm font-medium text-brand-black">
                Website URL
                {course.is_published ? (
                  <span className="ml-1 text-status-danger">*</span>
                ) : null}
              </label>
              <input
                id="course-website"
                type="url"
                inputMode="url"
                placeholder="https://"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                onBlur={onWebsiteBlur}
                disabled={saving}
                className="h-10 w-full rounded-md border border-brand-mid-grey px-3 text-sm outline-none ring-primary-light focus:border-primary focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="course-responsible" className="mb-1 block text-sm font-medium text-brand-black">
                Responsible
              </label>
              <select
                id="course-responsible"
                value={responsibleId}
                onChange={(e) => onResponsibleChange(e.target.value)}
                disabled={saving || staffLoading}
                className="h-10 w-full rounded-md border border-brand-mid-grey bg-white px-3 text-sm outline-none ring-primary-light focus:border-primary focus:ring-2"
              >
                <option value="">None</option>
                {(staffUsers ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(normalizeTab(v))} className="w-full">
          <TabsList className="flex w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="content" className="flex-1 sm:flex-none">
              Content
            </TabsTrigger>
            <TabsTrigger value="description" className="flex-1 sm:flex-none">
              Description
            </TabsTrigger>
            <TabsTrigger value="options" className="flex-1 sm:flex-none">
              Options
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex-1 sm:flex-none">
              Quiz
            </TabsTrigger>
          </TabsList>
          <TabsContent value="content">
            <LessonList courseId={id} />
          </TabsContent>
          <TabsContent value="description">
            <div className="rounded-xl border border-brand-mid-grey bg-white p-6">
              <label htmlFor="course-description" className="block text-sm font-medium text-brand-black">
                Course Description
              </label>
              <p className="mt-1 text-sm text-brand-dark-grey">
                This description is shown to learners on the course page.
              </p>
              <textarea
                id="course-description"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
                rows={10}
                maxLength={5000}
                disabled={saving}
                className="mt-4 w-full rounded-md border border-brand-mid-grey px-3 py-2 text-sm outline-none ring-primary-light focus:border-primary focus:ring-2"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-brand-dark-grey">
                  {description.length} / 5000
                </span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveDescription()}
                  className={cn(
                    "inline-flex min-h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white",
                    "hover:bg-primary-hover disabled:opacity-60",
                  )}
                >
                  Save description
                </button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="options">
            <CourseOptions courseId={id} />
          </TabsContent>
          <TabsContent value="quiz">
            <QuizTab courseId={id} />
          </TabsContent>
        </Tabs>
      </div>

      <AddAttendeesWizard open={attendeesOpen} onOpenChange={setAttendeesOpen} courseId={id} />
      <ContactAttendeesWizard open={contactOpen} onOpenChange={setContactOpen} courseId={id} />
    </div>
  );
}

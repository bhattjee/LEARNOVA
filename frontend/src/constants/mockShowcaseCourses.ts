import type { CourseListItem, LearnerCourseItem } from "@/types/course.types";

/** Sample learner enrollments for empty “My Courses” — same titles/covers as admin samples for a cohesive look. */
export const MOCK_LEARNER_COURSES: LearnerCourseItem[] = [
  {
    id: "mock-learn-odoo-basics",
    title: "Basics of Odoo CRM",
    slug: "basics-odoo-crm",
    cover_image_url:
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&auto=format&fit=crop",
    tags: ["CRM", "Odoo"],
    description_short:
      "Pipelines, leads, activities, and reporting — everything you need to get productive with Odoo CRM.",
    total_lessons_count: 12,
    total_duration_seconds: 7200,
    visibility: "everyone",
    access_rule: "open",
    price_cents: null,
    average_rating: 4.7,
    learner_status: "in_progress",
    completion_percentage: 42,
    enrolled_at: "2024-01-15T10:00:00.000Z",
  },
  {
    id: "mock-learn-data-viz",
    title: "Data Visualization Fundamentals",
    slug: "data-viz-fundamentals",
    cover_image_url:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop",
    tags: ["Analytics", "Charts"],
    description_short: "Turn raw data into clear charts and dashboards your team will actually use.",
    total_lessons_count: 8,
    total_duration_seconds: 5400,
    visibility: "everyone",
    access_rule: "open",
    price_cents: null,
    average_rating: 4.5,
    learner_status: "in_progress",
    completion_percentage: 18,
    enrolled_at: "2024-02-01T14:30:00.000Z",
  },
  {
    id: "mock-learn-odoo-advanced",
    title: "Advanced Odoo CRM",
    slug: "advanced-odoo-crm",
    cover_image_url:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop",
    tags: ["CRM", "Automation"],
    description_short: "Automation rules, multi-company setups, and advanced reporting for power users.",
    total_lessons_count: 16,
    total_duration_seconds: 10800,
    visibility: "everyone",
    access_rule: "on_payment",
    price_cents: 50000,
    average_rating: 4.9,
    learner_status: "not_enrolled",
    completion_percentage: 0,
    enrolled_at: "2024-03-01T09:00:00.000Z",
  },
];

/** Sample course rows for admin dashboard empty states (preview only — not real IDs). */
export const MOCK_ADMIN_COURSE_SAMPLES: CourseListItem[] = [
  {
    id: "mock-admin-odoo-basics",
    title: "Basics of Odoo CRM",
    tags: ["CRM", "Odoo"],
    cover_image_url:
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&auto=format&fit=crop",
    is_published: true,
    views_count: 1240,
    total_lessons_count: 12,
    total_duration_seconds: 7200,
    created_at: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "mock-admin-data-viz",
    title: "Data Visualization Fundamentals",
    tags: ["Analytics", "Charts"],
    cover_image_url:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop",
    is_published: true,
    views_count: 890,
    total_lessons_count: 8,
    total_duration_seconds: 5400,
    created_at: "2024-01-18T00:00:00.000Z",
  },
  {
    id: "mock-admin-odoo-advanced",
    title: "Advanced Odoo CRM",
    tags: ["CRM", "Automation"],
    cover_image_url:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop",
    is_published: false,
    views_count: 0,
    total_lessons_count: 16,
    total_duration_seconds: 10800,
    created_at: "2024-02-20T00:00:00.000Z",
  },
];

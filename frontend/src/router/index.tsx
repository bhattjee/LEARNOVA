import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { CourseCatalogPage } from "@/pages/learner/CourseCatalogPage";
import { CourseDetailPage } from "@/pages/learner/CourseDetailPage";
import { LessonPlayerPage } from "@/pages/learner/LessonPlayerPage";
import { MyCoursesPage } from "@/pages/learner/MyCoursesPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { DashboardPage } from "@/pages/admin/DashboardPage";
import { CourseFormPage } from "@/pages/admin/CourseFormPage";
import { QuizBuilderPage } from "@/pages/admin/QuizBuilderPage";
import { ReportingPage } from "@/pages/admin/ReportingPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { AdminLayout } from "@/components/common/AdminLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/courses" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/courses" element={<CourseCatalogPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route
          path="/my-courses"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["learner"]}>
                <MyCoursesPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/lessons/:lessonId"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["learner"]}>
                <LessonPlayerPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "instructor"]}>
                <AdminLayout title="Courses">
                  <DashboardPage />
                </AdminLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses/:id/edit"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "instructor"]}>
                <AdminLayout title="Edit course">
                  <CourseFormPage />
                </AdminLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses/:id/quiz/:quizId"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "instructor"]}>
                <AdminLayout title="Quiz builder">
                  <QuizBuilderPage />
                </AdminLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reporting"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "instructor"]}>
                <AdminLayout title="Reporting">
                  <ReportingPage />
                </AdminLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

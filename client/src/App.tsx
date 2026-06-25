import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import BuilderPage from "@/pages/BuilderPage";
import AssessmentsPage from "@/pages/AssessmentsPage";
import LaunchPadPage from "@/pages/LaunchPadPage";
import LaunchPadIndexPage from "@/pages/LaunchPadIndexPage";
import ReportsPage from "@/pages/ReportsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/builder" element={<BuilderPage />} />
          <Route path="/assessments" element={<AssessmentsPage />} />
          <Route path="/launch" element={<LaunchPadIndexPage />} />
          <Route path="/launch/:assessmentId" element={<LaunchPadPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/builder" replace />} />
      <Route path="*" element={<Navigate to="/builder" replace />} />
    </Routes>
  );
}

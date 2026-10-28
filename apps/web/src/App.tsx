import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthPage } from './features/auth/AuthPage';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { ProjectEditorPage } from './pages/ProjectEditorPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { PublicProjectPage } from './pages/PublicProjectPage';

export function App() {
  return (
    <BrowserRouter>
      <a className="skip-link" href="#main-content">
        Перейти к содержимому
      </a>
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/public/:publicToken" element={<PublicProjectPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <ProjectEditorPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

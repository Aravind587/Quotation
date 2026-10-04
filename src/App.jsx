import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProjectsPage from './pages/ProjectsPage';
import BuilderPage  from './pages/BuilderPage';
import PreviewPage  from './pages/PreviewPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<ProjectsPage />} />
        <Route path="/builder"  element={<BuilderPage  />} />
        <Route path="/preview"  element={<PreviewPage  />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/quotation" element={<Navigate to="/preview" replace />} />
        <Route path="*"          element={<Navigate to="/"        replace />} />
      </Routes>
    </BrowserRouter>
  );
}

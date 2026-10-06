import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import CollectionsPage from './pages/CollectionsPage'
import UploadPage from './pages/UploadPage'
import GeneratePage from './pages/GeneratePage'
import QuizPage from './pages/QuizPage'
import WrongBookPage from './pages/WrongBookPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'
import ManagePage from './pages/ManagePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<CollectionsPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="generate/:id" element={<GeneratePage />} />
          <Route path="manage/:id" element={<ManagePage />} />
          <Route path="quiz/:id" element={<QuizPage />} />
          <Route path="wrong" element={<WrongBookPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

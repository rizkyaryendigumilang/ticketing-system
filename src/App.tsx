import { Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <Routes>
      <Route path="*" element={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white text-xl">VPS Ticket CRM — Initializing...</div>
        </div>
      } />
    </Routes>
  )
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Dashboard from './pages/Dashboard';
import InterviewSetup from './pages/InterviewSetup';
import LiveInterview from './pages/LiveInterview';
import InterviewReport from './pages/InterviewReport';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#050505] text-white">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/setup" element={<InterviewSetup />} />
          <Route path="/interview" element={<LiveInterview />} />
          <Route path="/report" element={<InterviewReport />} />
        </Routes>
      </div>
      <Toaster />
    </BrowserRouter>
  );
}

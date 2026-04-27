import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./components/RequireAuth.js";
import { Toaster } from "./components/Toaster.js";
import { DailyQueuePage } from "./pages/DailyQueuePage.js";
import { DecisionPage } from "./pages/DecisionPage.js";
import { LiveCallPage } from "./pages/LiveCallPage.js";
import { SignInPage } from "./pages/SignInPage.js";

export const App = (): React.ReactElement => (
  <BrowserRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<DailyQueuePage />} />
        <Route path="/call/:id" element={<LiveCallPage />} />
        <Route path="/call/:id/decision" element={<DecisionPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <Toaster />
  </BrowserRouter>
);

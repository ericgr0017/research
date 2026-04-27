import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./components/RequireAuth.js";
import { CallPlaceholderPage } from "./pages/CallPlaceholderPage.js";
import { DailyQueuePage } from "./pages/DailyQueuePage.js";
import { SignInPage } from "./pages/SignInPage.js";

export const App = (): React.ReactElement => (
  <BrowserRouter>
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<DailyQueuePage />} />
        <Route path="/call/:id" element={<CallPlaceholderPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

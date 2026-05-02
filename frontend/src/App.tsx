import { Toaster } from "@/components/ui/sonner"
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProfileUpdate from "./pages/ProfileSetupModel";
import Interview from "./pages/Interview";
import JdOnboarding from "./pages/JdOnboarding";
import Reviews from "./pages/Reviews";
import NotFound from "./pages/NotFound";

import Test from "./components/DashboardContent/test";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile-update" element={<ProfileUpdate open={false} onClose={function (): void {
            throw new Error("Function not implemented.");
          }} signupData={{
            name: "",
            email: "",
            password: ""
          }} onComplete={function (): void {
            throw new Error("Function not implemented.");
          }} />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/jd/onboarding" element={<JdOnboarding />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/test" element={<Test />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
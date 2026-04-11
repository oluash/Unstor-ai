import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import KnowledgeExplorer from "./pages/KnowledgeExplorer";
import OwnerInspection from "./pages/OwnerInspection";
import FeedManager from "./pages/FeedManager";
import IfaExplorer from "./pages/IfaExplorer";
import OwnerChat from "./pages/OwnerChat";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat" component={Chat} />
      <Route path="/admin" component={Admin} />
      <Route path="/knowledge" component={KnowledgeExplorer} />
      <Route path="/inspect" component={OwnerInspection} />
      <Route path="/feed" component={FeedManager} />
      <Route path="/ifa" component={IfaExplorer} />
      <Route path="/owner-chat" component={OwnerChat} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster theme="dark" position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

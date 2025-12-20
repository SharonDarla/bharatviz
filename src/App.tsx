import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import EmbedDemo from "./pages/EmbedDemo";
import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/embed-demo" element={<EmbedDemo />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;

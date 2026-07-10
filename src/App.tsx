import { Toaster } from '@/components/ui/sonner';
import { Routers } from "@/routes/routes";

function App() {

  return (
    <>
      <Routers />
      <Toaster richColors position="top-right" />
    </>
  );
}

export default App;
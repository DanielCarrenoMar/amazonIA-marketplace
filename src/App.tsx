import { AuthProvider } from './contexts/AuthContext';
import { Hero } from './components/Hero';
import { Navigation } from './components/Navigation';
import { ResumenEjecutivo } from './components/ResumenEjecutivo';
import { MisionVision } from './components/MisionVision';
import { ProblemaPlanteamiento } from './components/ProblemaPlanteamiento';
import { Objetivos } from './components/Objetivos';
import { Features } from './components/Features';
import { Marketplace } from './components/Marketplace';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white">
        <Navigation />
        <Hero />
        <ResumenEjecutivo />
        <MisionVision />
        <Features />
        <ProblemaPlanteamiento />
        <Objetivos />
        <Marketplace />
        <Footer />
      </div>
    </AuthProvider>
  );
}

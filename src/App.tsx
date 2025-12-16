import { Hero } from './components/Hero';
import { Navigation } from './components/Navigation';
import { ResumenEjecutivo } from './components/ResumenEjecutivo';
import { ProblemaPlanteamiento } from './components/ProblemaPlanteamiento';
import { Objetivos } from './components/Objetivos';
import { Features } from './components/Features';
import { Marketplace } from './components/Marketplace';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <ResumenEjecutivo />
      <Features />
      <ProblemaPlanteamiento />
      <Objetivos />
      <Marketplace />
      <Footer />
    </div>
  );
}

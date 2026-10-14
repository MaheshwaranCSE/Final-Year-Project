import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import TrustIndicators from '../components/TrustIndicators';
import Introduction from '../components/Introduction';
import Features from '../components/Features';
import Workflow from '../components/Workflow';
import SecurityArchitecture from '../components/SecurityArchitecture';
import SupabaseSection from '../components/SupabaseSection';
import ChainOfCustodyPreview from '../components/ChainOfCustodyPreview';
import DashboardPreview from '../components/DashboardPreview';
import TamperDetection from '../components/TamperDetection';
import VerificationSection from '../components/VerificationSection';
import WhyBlockVault from '../components/WhyBlockVault';
import About from '../components/About';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustIndicators />
        <Introduction />
        <Features />
        <Workflow />
        <SecurityArchitecture />
        <SupabaseSection />
        <ChainOfCustodyPreview />
        <DashboardPreview />
        <TamperDetection />
        <VerificationSection />
        <WhyBlockVault />
        <About />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

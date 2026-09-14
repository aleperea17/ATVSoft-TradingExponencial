import { HeroCta, HeroSection } from '../components/sections/HeroSection.tsx'
import { VideoSection } from '../components/sections/VideoSection.tsx'
import { TestimonialsSection } from '../components/sections/TestimonialsSection.tsx'
import { ProblemsSection } from '../components/sections/ProblemsSection.tsx'
import { BenefitsSection } from '../components/sections/BenefitsSection.tsx'
import { BonusSection } from '../components/sections/BonusSection.tsx'
import { ResultsSection } from '../components/sections/ResultsSection.tsx'
import { AudienceSection } from '../components/sections/AudienceSection.tsx'
import { FaqSection } from '../components/sections/FaqSection.tsx'
import { FinalCtaSection } from '../components/sections/FinalCtaSection.tsx'
import { FooterSection } from '../components/sections/FooterSection.tsx'

export function LandingPage() {
  return (
    <main>
      <HeroSection />
      <VideoSection />
      <HeroCta />
      <TestimonialsSection />
      <ProblemsSection />
      <BenefitsSection />
      <BonusSection />
      <ResultsSection />
      <AudienceSection />
      <FaqSection />
      <FinalCtaSection />
      <FooterSection />
    </main>
  )
}

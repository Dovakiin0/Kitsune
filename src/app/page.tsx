import HeroSection from "@/components/hero-section";
import PopularSection from "@/components/popular-section";
import SpecialSection from "@/components/special-section";

import TrendingSection from "@/components/trending-section";

export default function Home() {
  return (
    <div className="flex flex-col bg-[#121212]">
      <HeroSection />
      <SpecialSection />
      {/* <FeaturedCollection /> */}
      <TrendingSection />
      <PopularSection />
    </div>
  );
}


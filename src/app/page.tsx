import dynamic from "next/dynamic";

// Dynamically import components
const HeroSection = dynamic(() => import("@/components/hero-section"));
const SpecialSection = dynamic(() => import("@/components/special-section"));
const TrendingSection = dynamic(() => import("@/components/trending-section"));
const PopularSection = dynamic(() => import("@/components/popular-section"));

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


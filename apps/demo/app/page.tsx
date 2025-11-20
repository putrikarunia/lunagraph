import { GreetingCard } from "@/components/GreetingCard";
import ProductList from "@/components/ProductList";
import { SectionCards } from "@/components/section-cards";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full flex-col items-center justify-between py-16 px-16 bg-white dark:bg-black gap-16">
        <SectionCards />
        <div className="flex gap-8 w-full">
          <GreetingCard title="Welcome to our store" ctaText="Contact Us" className="w-[250px]"/>
          <ProductList />
        </div>
      </main>
    </div>
  );
}

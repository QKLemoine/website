import { AgentProvider } from "@/components/agent/agent-provider";
import { Footer } from "@/components/footer";
import { archivo, stix } from "@/components/home/fonts";
import { HOME_WIDTH, Home as HomeContent } from "@/components/home/home";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <AgentProvider>
      <div className={`flex flex-1 flex-col ${stix.variable} ${archivo.variable}`}>
        <Navbar width={HOME_WIDTH} />
        <main className="flex-1">
          <HomeContent />
        </main>
        <Footer width={HOME_WIDTH} />
      </div>
    </AgentProvider>
  );
}

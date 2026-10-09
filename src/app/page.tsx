import { DesktopLoader } from "@/components/desktop/desktop-loader";
import { StaticPortfolio } from "@/components/desktop/static-portfolio";

export default function Home() {
  return (
    <DesktopLoader>
      <StaticPortfolio />
    </DesktopLoader>
  );
}

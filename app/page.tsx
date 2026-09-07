import DashboardShell
  from "./DashboardShell";

import FamilyProvider
  from "./FamilyProvider";

export default function Home() {
  return (
    <FamilyProvider>
      <DashboardShell />
    </FamilyProvider>
  );
}

import { Navigate, Route, Routes } from "react-router-dom";
import { GuildLayout } from "./components/GuildLayout.js";
import { BannedPage } from "./pages/BannedPage.js";
import { GuildSelectPage } from "./pages/GuildSelectPage.js";
import { MembersPage } from "./pages/MembersPage.js";
import { ChannelsPage } from "./pages/ChannelsPage.js";
import { OverviewPage } from "./pages/OverviewPage.js";
import { SettingsPage } from "./pages/SettingsPage.js";
import { AIPage } from "./pages/AIPage.js";
import { CommandsPage } from "./pages/CommandsPage.js";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<GuildSelectPage />} />
      <Route path="/guild/:guildId" element={<GuildLayout />}>
        <Route index element={<Navigate to="members" replace />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="banned" element={<BannedPage />} />
        <Route path="channels" element={<ChannelsPage />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="commands" element={<CommandsPage />} />
        <Route path="ai" element={<AIPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

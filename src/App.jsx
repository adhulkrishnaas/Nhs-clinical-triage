import { useState } from "react";

import "./App.css";
import { SafetyBanner } from "./components/SafetyBanner";
import { Header } from "./components/Header";
import { UrgencyBadge } from "./components/UrgencyBadge";

function App() {
  return (
    <div>
      <SafetyBanner />
      <UrgencyBadge />
      <Header />
    </div>
  );
}

export default App;

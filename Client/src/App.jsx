import React from "react";
import { Home } from "./components/Home";
import { SpeedInsights } from "@vercel/speed-insights/react";

const App = () => {
  return (
    <>
      <SpeedInsights />
      <Home />
    </>
  );
};

export default App;

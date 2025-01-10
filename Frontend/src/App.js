import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import DataProfiling from "./pages/DataProfiling.tsx";
import VisualizeResult from "./pages/VisualizeResult.tsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dataprofile" element={<DataProfiling />} />
        <Route path="/visual" element={<VisualizeResult />} />
      </Routes>
    </Router>
  );
}

export default App;
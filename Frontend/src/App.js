import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";  
import ResetPassword from "./pages/ResetPassword.tsx";
import DataProfiling from "./pages/DataProfiling.tsx";
import VisualizeResult from "./pages/VisualizeResult.tsx";
import Dashboard from "./pages/Dashboard.tsx";
// import DataProfile from "./pages/DataProfile.tsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot_password" element={<ForgotPassword />} />
        <Route path="/reset_password" element={<ResetPassword />} />
        <Route path="/dataprofile/:user_id" element={<DataProfiling />} />
        <Route path="/visualize/:upload_id" element={<VisualizeResult />} />
        <Route path="/dashboard/:user_id" element={<Dashboard />} />
        {/* <Route path="/dataprofile" element={<DataProfile />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
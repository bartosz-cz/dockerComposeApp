import "./App.css";
import React, { useState } from "react";
import Header from "./layout/Header";
import Content from "./layout/Content";

function App() {
  const [activeWindow, setActiveWindow] = useState("");
  const [admin, setAdmin] = useState(false);
  const [logged, setLogged] = useState(false);
  const [email, setEmail] = useState(null);
  return (
    <div className="app">
      <Header
        activeWindow={activeWindow}
        setActiveWindow={setActiveWindow}
        logged={logged}
        setLogged={setLogged}
        setAdmin={setAdmin}
        admin={admin}
      />
      <Content
        activeWindow={activeWindow}
        setActiveWindow={setActiveWindow}
        setLogged={setLogged}
        logged={logged}
        setAdmin={setAdmin}
        setEmail={setEmail}
        email={email}
        admin={admin}
      />
    </div>
  );
}

export default App;

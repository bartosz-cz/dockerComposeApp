import React, { useState, useEffect } from "react";
import IconButton from "../components/IconButton";
import Menu from "./Menu";
import Account from "./Account";
import Admin from "./Admin";
import Share from "./Share";

var classnames = require("classnames");

function Content({
  setLogged,
  logged,
  activeWindow,
  setActiveWindow,
  setAdmin,
  setEmail,
  email,
  admin,
}) {
  const [inputText, setInputText] = useState("");
  const [usedKeys, setKeysUsed] = useState([]);
  const [encrypted, setEncrypted] = useState(false);
  const [copyIcon, setCopyIcon] = useState("Copy");

  const textAreaDisabled = usedKeys[0] !== "?" && encrypted;

  useEffect(() => {
    if (!logged) {
      setInputText("");
      setKeysUsed([]);
      setActiveWindow("");
    }
  }, [logged]);

  const handleChange = (input) => {
    const filtered = input.replace(/[^a-z A-Z]/g, "").toUpperCase();
    if (copyIcon === "Check") setCopyIcon("Copy");
    setInputText(filtered);
  };

  useEffect(() => {
    if (copyIcon === "Check") setCopyIcon("Copy");
  }, [encrypted]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inputText);
      setCopyIcon("Check");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleChange(text);
    } catch (err) {
      console.error("Failed to paste:", err);
    }
  };

  const setActive = (windowName) => {
    setActiveWindow(windowName);
  };

  return (
    <div className="flexColumn content content">
      <div
        className={classnames("flexColumn", "content", {
          hide: activeWindow !== "",
        })}
      >
        <div className="textAreaContainer flexRow">
          <textarea
            value={inputText}
            className="textArea"
            onChange={(e) => handleChange(e.target.value)}
            disabled={textAreaDisabled}
          />
          <IconButton
            name={copyIcon}
            size={28}
            styleClass="cpButton"
            handler={handleCopy}
            visible={inputText !== ""}
          />
          <IconButton
            name="Paste"
            size={28}
            styleClass="cpButton"
            handler={handlePaste}
            visible={inputText === ""}
          />
        </div>
        <Menu
          setInputText={setInputText}
          inputText={inputText}
          usedKeys={usedKeys}
          setKeysUsed={setKeysUsed}
          encrypted={encrypted}
          setEncrypted={setEncrypted}
          logged={logged}
          setActive={setActive}
        />
      </div>
      <div
        className={classnames("flexColumn", "content", {
          hide: activeWindow !== "account",
        })}
      >
        <Account
          setLogged={setLogged}
          setActiveWindow={setActive}
          setAdmin={setAdmin}
          setEmail={setEmail}
        />
      </div>
      <div
        className={classnames("flexColumn", "content", {
          hide: activeWindow !== "admin",
        })}
      >
        <Admin email={email} logged={logged} admin={admin} />
      </div>
      <div
        className={classnames("flexColumn", "content", {
          hide: activeWindow !== "share",
        })}
      >
        <Share email={email} logged={logged} activeWindow={activeWindow} />
      </div>
    </div>
  );
}

export default Content;

import IconButton from "../components/IconButton";
import React from "react";

function Header({
  setActiveWindow,
  activeWindow,
  admin,
  logged,
  setLogged,
  setAdmin,
}) {
  const toggleWindow = (windowName) => {
    if (activeWindow === windowName) {
      setActiveWindow("");
    } else {
      setActiveWindow(windowName);
    }
  };

  const handleLogout = () => {
    setLogged(false);
    setAdmin(false);
    setActiveWindow("");
    localStorage.removeItem("token");
  };

  const accountIcon = logged ? "Logout" : "Login";
  const accountHandler = logged ? handleLogout : () => toggleWindow("account");

  return (
    <div className="flexRow header" style={{ padding: 10 }}>
      <IconButton
        name={accountIcon}
        styleClass="loginButton"
        handler={accountHandler}
      />
      {logged && (
        <IconButton
          name="Share"
          styleClass="loginButton"
          handler={() => toggleWindow("share")}
        />
      )}
      {admin && (
        <IconButton
          name="Admin"
          styleClass="loginButton"
          handler={() => toggleWindow("admin")}
        />
      )}
    </div>
  );
}

export default Header;

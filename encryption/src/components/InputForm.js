import React, { useState, useRef, useEffect } from "react";
import Icon from "./Icon";

function InputForm({
  name,
  value = "",
  onChange,
  placeholder = "",
  type = "text",
}) {
  const mirrorSpan = useRef(null);
  const inputRef = useRef(null);

  const handleChange = (event) => {
    onChange(event);
    adjustWidth();
  };

  const adjustWidth = () => {
    if (mirrorSpan.current && inputRef.current) {
      mirrorSpan.current.textContent = value || placeholder || " ";
      console.log(`Calculated width: ${mirrorSpan.current.offsetWidth}px`);
      inputRef.current.style.width = `${mirrorSpan.current.offsetWidth + 26}px`;
    }
  };

  useEffect(() => {
    adjustWidth();
  }, [value]);

  return (
    <div className="flexRow inputContainer">
      {name !== "" && <Icon name={name} />}

      <input
        ref={inputRef}
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        className="input"
      />
      <span
        ref={mirrorSpan}
        className="mirror-span"
        aria-hidden="true"
        style={{
          visibility: "hidden",
          position: "absolute",
          whiteSpace: "pre",
          height: 0,
          overflow: "hidden",
          fontFamily: "inherit",
          fontSize: "15px",
          fontWeight: "800",
          letterSpacing: "inherit",
        }}
      >
        {value || placeholder}
      </span>
    </div>
  );
}

export default InputForm;

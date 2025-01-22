import React, { useState } from "react";
import InputForm from "../components/InputForm";
import IconButton from "../components/IconButton";
import {
  registerUser,
  checkUserExists,
  loginUser,
} from "../utils/serverRequest";

function Account({
  setLogged,
  setActiveWindow, // Changed from setAccountWindow, setAdminWindow
  setAdmin,
  setEmail,
}) {
  const [formData, setFormData] = useState({
    Username: "",
    Password: "",
  });
  const [errors, setErrors] = useState({
    Username: "",
    Password: "",
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    const newErrors = { ...errors, [name]: "" }; // Clear errors when user types

    if (value.length <= 40) {
      // Fixed maximum character validation
      const filteredValue = value.replace(/[^a-zA-Z0-9@.]/g, ""); // Allow @ and . for emails
      setFormData({ ...formData, [name]: filteredValue });
    } else {
      newErrors[name] = "Maximum 40 characters allowed"; // Corrected error message
    }
    setErrors(newErrors);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    let valid = true;
    const newErrors = { ...errors };

    // Validation for username as email
    if (!formData.Username.includes("@")) {
      newErrors.Username = "Invalid email format";
      valid = false;
    }
    // Validation for password length
    if (formData.Password.length < 6) {
      newErrors.Password = "Password must be at least 6 characters";
      valid = false;
    }

    if (valid) {
      const response1 = await checkUserExists(formData.Username);
      let response2;
      if (response1.exists) {
        response2 = await loginUser(formData.Username, formData.Password);
      } else {
        response2 = await registerUser(formData.Username, formData.Password);
        response2 = await loginUser(formData.Username, formData.Password);
      }

      if (response2.token) {
        setLogged(true);
        setEmail(formData.Username);
        setActiveWindow(""); // Close the account window upon successful login
        setAdmin(response2.admin);
        setErrors({ Username: "", Password: "" }); // Clear errors
        setFormData({ Username: "", Password: "" }); // Clear form data
      } else {
        // Handle errors from response
        newErrors.Password = "Invalid credentials";
        newErrors.Username = "Invalid credentials";
      }
    }
    setErrors(newErrors);
  };

  return (
    <div className="flexColumn loginWindow">
      <form onSubmit={handleSubmit} className="flexColumn center">
        <InputForm
          name="Username"
          placeholder="Email"
          onChange={handleInputChange}
          value={formData.Username}
          type="text"
        />
        {errors.Username && (
          <div style={{ color: "red" }}>{errors.Username}</div>
        )}
        <div style={{ height: 10 }} />
        <InputForm
          name="Password"
          placeholder="Password"
          onChange={handleInputChange}
          value={formData.Password}
          type="password"
        />
        {errors.Password && (
          <div style={{ color: "red" }}>{errors.Password}</div>
        )}
        <div style={{ height: 10 }} />
        <IconButton
          type="submit"
          name="Login"
          styleClass="encryptedAddButton"
          size={48}
        />
      </form>
    </div>
  );
}

export default Account;

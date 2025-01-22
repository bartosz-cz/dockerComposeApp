import React, { useState, useEffect } from "react";
import {
  getSharedCiphers,
  getCiphers,
  shareCipher,
  unshareCipher,
  checkUserExists,
} from "../utils/serverRequest";
import IconButton from "../components/IconButton";
import InputForm from "../components/InputForm";

function Share({ email, logged, activeWindow }) {
  const [shared, setShared] = useState([]);
  const [ciphers, setCiphers] = useState([]);
  const [formData, setFormData] = useState({
    Username: "",
    CipherId: "",
  });
  const [errors, setErrors] = useState({
    Username: "",
    CipherId: "",
  });
  const fetchData = async () => {
    if (activeWindow === "share") {
      console.log("fetching");
      const fetchedShared = await getSharedCiphers();
      console.log(fetchedShared);
      setShared(fetchedShared.filter((cipher) => cipher.Email !== email));

      const fetchedCiphers = await getCiphers();
      setCiphers(fetchedCiphers);
    }
  };
  useEffect(() => {
    if (logged) fetchData();
  }, [email, activeWindow]);

  const handleUnshare = async (sharedUserEmail, cipherName) => {
    await unshareCipher(sharedUserEmail, cipherName);
    const updatedShared = await getSharedCiphers();
    setShared(updatedShared.filter((cipher) => cipher.Email !== email));
  };

  const renderSharedList = () => {
    console.log(shared);
    return shared.length > 0 ? (
      shared.map((cipher) => (
        <div
          key={`${cipher.Cipher_ID}-${cipher.Shared_User_ID}`}
          className="flexRow text center"
          style={{ fontSize: 18, fontWeight: 300 }}
        >
          <span
            style={{ fontWeight: "bold", fontSize: 20, marginRight: "5px" }}
          >
            {cipher.CipherName}
          </span>{" "}
          shared with{" "}
          <span style={{ fontWeight: "bold", fontSize: 20, marginLeft: "5px" }}>
            {cipher.SharedWithEmail}
          </span>
          <IconButton
            name="Unshare"
            styleClass="manageButton"
            handler={() =>
              handleUnshare(cipher.SharedWithEmail, cipher.CipherName)
            }
          />
        </div>
      ))
    ) : (
      <div className="flexColumn text center">No shared ciphers</div>
    );
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setErrors({ ...errors, [name]: "" });

    if (name === "Username") {
      if (value.length <= 40) {
        setFormData({ ...formData, [name]: value });
      } else {
        setErrors({ ...errors, [name]: "Maximum 40 characters allowed" });
      }
    } else if (name === "CipherId") {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleShare = async (event) => {
    event.preventDefault();

    let valid = true;
    const newErrors = { ...errors };

    if (!formData.Username.includes("@")) {
      newErrors.Username = "Invalid email format";
      valid = false;
    }
    if (!formData.CipherId) {
      newErrors.CipherId = "Please select a cipher to share";
      valid = false;
    }

    if (valid) {
      try {
        const sharedUser = await checkUserExists(formData.Username);
        console.log(sharedUser);
        if (sharedUser.exists) {
          console.log("shareeeeeeee");
          let success = await shareCipher(
            formData.Username,
            formData.CipherId,
            false
          );
          console.log("response");
          console.log(success);
          setFormData({ Username: "", CipherId: "" });
          const updatedShared = await getSharedCiphers();
          setShared(updatedShared);
          fetchData();
          if (!success.ok) {
            newErrors.Username = success;
          }
        } else {
          newErrors.Username = "User not found";
        }
      } catch (error) {
        newErrors.Username = error.message;
      }
    }
    setErrors(newErrors);
  };

  return (
    <div className="flexColumn usersWindow">
      {renderSharedList()}

      <form
        onSubmit={handleShare}
        className="flexRow center"
        style={{ marginTop: "25px" }}
      >
        <div className="flexRow">
          <div>
            <InputForm
              name="Username"
              placeholder="Email"
              onChange={handleInputChange}
              value={formData.Username}
              type="text"
            />
          </div>

          <div
            className="flexRow center"
            style={{ marginLeft: "5px", marginRight: "10px" }}
          >
            <select
              name="CipherId"
              value={formData.CipherId}
              onChange={handleInputChange}
            >
              <option value="">Select Cipher</option>
              {ciphers.map((cipher) => (
                <option key={cipher.Cipher_ID} value={cipher.Cipher_ID}>
                  {cipher.Name}
                </option>
              ))}
            </select>
            {errors.CipherId && (
              <div style={{ color: "red" }}>{errors.CipherId}</div>
            )}
          </div>
        </div>

        <IconButton
          type="submit"
          name="Share"
          styleClass="manageButton"
          size={28}
        />
      </form>
      {errors.Username && (
        <div className="center" style={{ color: "red" }}>
          {errors.Username}
        </div>
      )}
    </div>
  );
}

export default Share;

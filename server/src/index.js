require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

const db = require("./db");

const secretKey = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.user = user;
    next();
  });
}

// User Registration
app.post("/api/register", async (req, res) => {
  const { email, password, is_admin } = req.body;

  if (!email || !password) {
    return res.status(400).send("Email and password are required");
  }

  try {
    const [existingUser] = await db.query(
      "SELECT * FROM Users WHERE Email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return res.status(400).send("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO Users (Email, Password, Is_Admin) VALUES (?, ?, ?)",
      [email, hashedPassword, is_admin || false]
    );
    res.status(201).json({ response: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// User Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query("SELECT * FROM Users WHERE Email = ?", [
      email,
    ]);
    if (users.length === 0) {
      return res.status(400).send("Invalid email or password");
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(400).send("Invalid email or password");
    }

    const token = jwt.sign(
      { user_id: user.User_ID, is_admin: user.Is_Admin },
      secretKey,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// Check if a User with a Given Email Exists
app.get("/api/users/exists", async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).send("Email is required");
  }

  try {
    const [users] = await db.query(
      "SELECT User_ID FROM Users WHERE Email = ?",
      [email]
    );
    if (users.length > 0) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// Get All Users (Admin Only)
app.get("/api/users", authenticateToken, async (req, res) => {
  if (!req.user.is_admin) {
    return res.sendStatus(403); // Forbidden
  }

  try {
    const [users] = await db.query(
      "SELECT User_ID, Email, Is_Admin FROM Users"
    );
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// Create a New Cipher
app.post("/api/ciphers", authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const { vigenere_table_shifts, password_word, name } = req.body;

  if (!vigenere_table_shifts || !password_word) {
    return res
      .status(400)
      .send("Vigenere table shifts and password word are required");
  }

  try {
    const [result] = await db.query(
      "INSERT INTO Ciphers (User_ID, Vigenere_Table_Shifts, Password_Word, Name) VALUES (?, ?, ?, ?)",
      [userId, vigenere_table_shifts, password_word, name]
    );

    const cipherId = result.insertId;

    await db.query(
      "INSERT INTO Logs (Cipher_ID, User_ID, Action) VALUES (?, ?, 'CREATE')",
      [cipherId, userId]
    );

    res.status(201).json({ cipher_id: cipherId });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// Get All Ciphers of the Authenticated User
app.get("/api/ciphers", authenticateToken, async (req, res) => {
  const userId = req.user.user_id;

  try {
    const [ciphers] = await db.query(
      `SELECT * FROM Ciphers WHERE User_ID = ?
       UNION
       SELECT C.* FROM Ciphers C
       INNER JOIN Shared_Ciphers SC ON C.Cipher_ID = SC.Cipher_ID
       WHERE SC.Shared_User_ID = ?`,
      [userId, userId]
    );

    res.json(ciphers);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// Delete or Unshare a Cipher
app.delete("/api/ciphers", authenticateToken, async (req, res) => {
  const { name } = req.body;
  const userId = req.user.user_id;

  if (!name) {
    return res.status(400).json({ error: "Cipher name is required" });
  }

  try {
    // First, find the cipher by name
    const [cipherRows] = await db.query(
      "SELECT Cipher_ID, User_ID FROM Ciphers WHERE Name = ?",
      [name]
    );

    if (cipherRows.length === 0) {
      return res.status(404).json({ error: "Cipher not found" });
    }

    const cipher = cipherRows[0];
    const cipherId = cipher.Cipher_ID;
    const cipherOwnerId = cipher.User_ID;

    if (cipherOwnerId === userId) {
      try {
        await db.query("DELETE FROM Logs WHERE Cipher_ID = ?", [cipherId]);

        await db.query("DELETE FROM Shared_Ciphers WHERE Cipher_ID = ?", [
          cipherId,
        ]);

        const [result] = await db.query(
          "DELETE FROM Ciphers WHERE Cipher_ID = ?",
          [cipherId]
        );

        if (result.affectedRows === 0) {
          return res
            .status(404)
            .json({ error: "Cipher not found or already deleted" });
        }

        res.json({ message: "Cipher deleted successfully" });
      } catch (err) {
        console.error("Error deleting cipher:", err);
        res.status(500).json({ error: "Failed to delete cipher" });
      }
    } else {
      const [sharedRows] = await db.query(
        "SELECT * FROM Shared_Ciphers WHERE Cipher_ID = ? AND Shared_User_ID = ?",
        [cipherId, userId]
      );

      if (sharedRows.length === 0) {
        return res
          .status(403)
          .json({ error: "You do not have permission to delete this cipher" });
      }

      // Proceed to unshare the cipher for this user
      try {
        const [result] = await db.query(
          "DELETE FROM Shared_Ciphers WHERE Cipher_ID = ? AND Shared_User_ID = ?",
          [cipherId, userId]
        );

        if (result.affectedRows === 0) {
          return res
            .status(404)
            .json({ error: "Cipher not found or already unshared" });
        }

        res.json({ message: "Cipher unshared successfully" });
      } catch (err) {
        console.error("Error unsharing cipher:", err);
        res.status(500).json({ error: "Failed to unshare cipher" });
      }
    }
  } catch (err) {
    console.error("Error processing request:", err);
    res.status(500).json({ error: "Failed to process request" });
  }
});

// Share a Cipher
app.post("/api/shared_ciphers", authenticateToken, async (req, res) => {
  const ownerId = req.user.user_id;
  const { shared_user_email, cipher_id, can_edit } = req.body;
  if (!shared_user_email || !cipher_id) {
    return res.status(400).send("Shared user email and cipher ID are required");
  }

  try {
    // Verify that the cipher belongs to the owner
    const [ciphers] = await db.query(
      "SELECT * FROM Ciphers WHERE Cipher_ID = ? AND User_ID = ?",
      [cipher_id, ownerId]
    );

    if (ciphers.length === 0) {
      return res
        .status(403)
        .send("You don't have permission to share this cipher");
    }
    const [shared_user_id] = await db.query(
      "SELECT User_ID FROM Users WHERE Email = ?",
      [shared_user_email]
    );
    if (shared_user_id[0].User_ID === ownerId) {
      return res.status(403).send("You can't share the cipher with yourself");
    }
    await db.query(
      "INSERT INTO Shared_Ciphers (Owner_ID, Shared_User_ID, Cipher_ID, Can_Edit) VALUES (?, ?, ?, ?)",
      [ownerId, shared_user_id[0].User_ID, cipher_id, can_edit || false]
    );

    res.send("Cipher shared successfully");
  } catch (err) {
    // Handle duplicate entry error
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).send("Cipher is already shared with this user");
    }

    console.error(err);
    res.status(500).send(err.message);
  }
});

// Get Shared Ciphers for the Authenticated User
app.get("/api/shared_ciphers", authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  console.log("Authenticated user ID (owner):", userId);

  try {
    const [sharedCiphers] = await db.query(
      `SELECT C.Name AS CipherName, U.Email AS SharedWithEmail, SC.Can_Edit
       FROM Ciphers C
       INNER JOIN Shared_Ciphers SC ON C.Cipher_ID = SC.Cipher_ID
       INNER JOIN Users U ON SC.Shared_User_ID = U.User_ID
       WHERE SC.Owner_ID = ?`,
      [userId]
    );
    console.log("Ciphers shared by user:", sharedCiphers.length);
    res.json(sharedCiphers);
  } catch (err) {
    console.error("Error fetching shared ciphers:", err);
    res.status(500).send(err.message);
  }
});

// Delete a User
app.delete("/api/users/:id", authenticateToken, async (req, res) => {
  const userIdToDelete = parseInt(req.params.id);
  const requestingUserId = req.user.user_id;
  const isAdmin = req.user.is_admin;

  if (!userIdToDelete) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // Authorization check
    if (!isAdmin && userIdToDelete !== requestingUserId) {
      return res
        .status(403)
        .json({ error: "You don't have permission to delete this user" });
    }

    // Delete related data: Ciphers, Shared_Ciphers, Logs
    await db.query("DELETE FROM Logs WHERE User_ID = ?", [userIdToDelete]);
    await db.query(
      "DELETE FROM Shared_Ciphers WHERE Owner_ID = ? OR Shared_User_ID = ?",
      [userIdToDelete, userIdToDelete]
    );
    await db.query("DELETE FROM Ciphers WHERE User_ID = ?", [userIdToDelete]);

    // Delete the user
    const [result] = await db.query("DELETE FROM Users WHERE User_ID = ?", [
      userIdToDelete,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "User not found or already deleted" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Unshare a Cipher
app.delete("/api/shared_ciphers", authenticateToken, async (req, res) => {
  const ownerId = req.user.user_id;
  const { email, name } = req.body;

  if (!email || !name) {
    return res
      .status(400)
      .send("Shared user email and cipher name are required");
  }

  try {
    const [shared_id] = await db.query(
      "SELECT User_ID FROM Users WHERE Email = ?",
      [email]
    );
    console.log(name + " " + shared_id[0].User_ID);
    const [ciphers] = await db.query(
      "SELECT * FROM Ciphers WHERE Name = ? AND User_ID = ?",
      [name, ownerId]
    );

    if (ciphers.length === 0) {
      return res
        .status(403)
        .send("You don't have permission to unshare this cipher");
    }

    const [result] = await db.query(
      "DELETE FROM Shared_Ciphers WHERE Owner_ID = ? AND Shared_User_ID = ? AND Cipher_ID = ?",
      [ownerId, shared_id[0].User_ID, ciphers[0].Cipher_ID]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send("Shared cipher not found");
    }

    res.send("Cipher unshared successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// Get Logs (Admin Only)
app.get("/api/logs", authenticateToken, async (req, res) => {
  if (!req.user.is_admin) {
    return res.sendStatus(403); // Forbidden
  }

  try {
    const [logs] = await db.query("SELECT * FROM Logs");
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is running on port ${process.env.PORT || 5000}`);
});

app.put("/api/users/:id/admin", authenticateToken, async (req, res) => {
  if (!req.user.is_admin) {
    return res.sendStatus(403); // Forbidden
  }

  const userIdToUpdate = parseInt(req.params.id);
  const { is_admin } = req.body;

  if (typeof is_admin !== "boolean") {
    return res.status(400).json({ error: "is_admin must be a boolean" });
  }

  try {
    const [result] = await db.query(
      "UPDATE Users SET Is_Admin = ? WHERE User_ID = ?",
      [is_admin, userIdToUpdate]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "User not found or cannot be updated" });
    }

    res.json({ message: "User admin status updated successfully" });
  } catch (err) {
    console.error("Error updating user admin status:", err);
    res.status(500).json({ error: "Failed to update user admin status" });
  }
});

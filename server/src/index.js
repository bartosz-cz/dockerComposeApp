const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const db = require("./db");

// Secret key for JWT (store this securely in environment variables)
const secretKey = process.env.JWT_SECRET || "your-secret-key";

// Middleware for authenticating JWT tokens
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.user = user; // Contains user_id and is_admin
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
    // Check if user already exists
    const [existingUser] = await db.query(
      "SELECT * FROM Users WHERE Email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return res.status(400).send("User already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
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
    // Get user from database
    const [users] = await db.query("SELECT * FROM Users WHERE Email = ?", [
      email,
    ]);
    if (users.length === 0) {
      return res.status(400).send("Invalid email or password");
    }

    const user = users[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(400).send("Invalid email or password");
    }

    // Generate JWT token
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

    // Log the action
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

// Update a Cipher
app.put("/api/ciphers/:id", authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const cipherId = req.params.id;
  const { vigenere_table_shifts, password_word } = req.body;

  try {
    // Check if user has permission to edit
    const [ciphers] = await db.query(
      `SELECT C.* FROM Ciphers C
       LEFT JOIN Shared_Ciphers SC ON C.Cipher_ID = SC.Cipher_ID
       WHERE C.Cipher_ID = ? AND (C.User_ID = ? OR (SC.Shared_User_ID = ? AND SC.Can_Edit = TRUE))`,
      [cipherId, userId, userId]
    );

    if (ciphers.length === 0) {
      return res
        .status(403)
        .send("You don't have permission to edit this cipher");
    }

    // Update the cipher
    await db.query(
      "UPDATE Ciphers SET Vigenere_Table_Shifts = ?, Password_Word = ? WHERE Cipher_ID = ?",
      [vigenere_table_shifts, password_word, cipherId]
    );

    // Log the action
    await db.query(
      "INSERT INTO Logs (Cipher_ID, User_ID, Action) VALUES (?, ?, 'UPDATE')",
      [cipherId, userId]
    );

    res.send("Cipher updated successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// Delete a Cipher
app.delete("/api/ciphers", authenticateToken, async (req, res) => {
  const { name } = req.body; // Extract the cipher name from the request body
  const userId = req.user.user_id; // Get the user ID from the token

  if (!name) {
    return res.status(400).json({ error: "Cipher name is required" });
  }

  try {
    const [cipher_ID] = await db.query(
      "SELECT Cipher_ID FROM Ciphers WHERE User_ID = ? AND Name = ?",
      [userId, name]
    );
    console.log(cipher_ID);
    const [result] = await db.query(
      "DELETE FROM Logs WHERE User_ID = ? AND Cipher_ID = ?",
      [userId, cipher_ID[0].Cipher_ID]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Cipher not found or already deleted" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete cipher" });
  }
  try {
    const [result] = await db.query(
      "DELETE FROM Ciphers WHERE User_ID = ? AND Name = ?",
      [userId, name]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Cipher not found or already deleted" });
    }

    res.json({ message: "Cipher deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete cipher" });
  }
});

// Share a Cipher
app.post("/api/shared_ciphers", authenticateToken, async (req, res) => {
  const ownerId = req.user.user_id;
  const { shared_user_id, cipher_id, can_edit } = req.body;

  if (!shared_user_id || !cipher_id) {
    return res.status(400).send("Shared user ID and cipher ID are required");
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

    // Insert into Shared_Ciphers
    await db.query(
      "INSERT INTO Shared_Ciphers (Owner_ID, Shared_User_ID, Cipher_ID, Can_Edit) VALUES (?, ?, ?, ?)",
      [ownerId, shared_user_id, cipher_id, can_edit || false]
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

  try {
    const [sharedCiphers] = await db.query(
      `SELECT C.*, SC.Can_Edit FROM Ciphers C
       INNER JOIN Shared_Ciphers SC ON C.Cipher_ID = SC.Cipher_ID
       WHERE SC.Shared_User_ID = ?`,
      [userId]
    );

    res.json(sharedCiphers);
  } catch (err) {
    console.error(err);
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
  const { shared_user_id, cipher_id } = req.body;

  if (!shared_user_id || !cipher_id) {
    return res.status(400).send("Shared user ID and cipher ID are required");
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
        .send("You don't have permission to unshare this cipher");
    }

    // Delete from Shared_Ciphers
    const [result] = await db.query(
      "DELETE FROM Shared_Ciphers WHERE Owner_ID = ? AND Shared_User_ID = ? AND Cipher_ID = ?",
      [ownerId, shared_user_id, cipher_id]
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

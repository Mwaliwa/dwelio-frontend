const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

/* =========================================================
   JWT SECRET
========================================================= */

const JWT_SECRET =
  process.env.JWT_SECRET || "secretkey123";

/* =========================================================
   AUTHENTICATION MIDDLEWARE
========================================================= */

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authorization token is required",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Invalid authorization format",
      });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        message: "Authentication token is missing",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    /* Attach authenticated user to request */
    req.user = decoded;

    next();
  } catch (err) {
    console.error("AUTHENTICATION ERROR:", err.message);

    if (
      err.name === "TokenExpiredError" ||
      err.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired authentication token",
      });
    }

    return res.status(401).json({
      message: "Authentication failed",
    });
  }
};

/* =========================================================
   REGISTER USER
========================================================= */

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    if (!cleanName) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    if (!cleanEmail) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message:
          "Password must contain at least 8 characters",
      });
    }

    /* -----------------------------------------------------
       CHECK EMAIL
    ----------------------------------------------------- */

    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [cleanEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    /* -----------------------------------------------------
       HASH PASSWORD
    ----------------------------------------------------- */

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    /* -----------------------------------------------------
       CREATE USER
    ----------------------------------------------------- */

    const [result] = await db.query(
      `
      INSERT INTO users
        (name, email, password)
      VALUES
        (?, ?, ?)
      `,
      [
        cleanName,
        cleanEmail,
        hashedPassword,
      ]
    );

    return res.status(201).json({
      message: "User registered successfully",
      userId: result.insertId,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);

    /* Duplicate email protection */
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message:
          "An account with this email already exists",
      });
    }

    return res.status(500).json({
      message: "Server error",
    });
  }
});

/* =========================================================
   LOGIN USER
========================================================= */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const cleanEmail = String(email)
      .trim()
      .toLowerCase();

    /* -----------------------------------------------------
       FIND USER
    ----------------------------------------------------- */

    const [users] = await db.query(
      `
      SELECT
        id,
        name,
        email,
        password,
        role
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const user = users[0];

    /* -----------------------------------------------------
       CHECK PASSWORD
    ----------------------------------------------------- */

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    /* -----------------------------------------------------
       USER ROLE
    ----------------------------------------------------- */

    const userRole = user.role || "user";

    /* -----------------------------------------------------
       CREATE JWT
    ----------------------------------------------------- */

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: userRole,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    /* -----------------------------------------------------
       RESPONSE
    ----------------------------------------------------- */

    return res.json({
      message: "Login successful",

      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: userRole,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
});

/* =========================================================
   CHANGE PASSWORD
========================================================= */

router.post(
  "/change-password",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        currentPassword,
        newPassword,
      } = req.body;

      /* ---------------------------------------------------
         VALIDATION
      --------------------------------------------------- */

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          message:
            "Current password and new password are required",
        });
      }

      if (typeof currentPassword !== "string") {
        return res.status(400).json({
          message: "Invalid current password",
        });
      }

      if (typeof newPassword !== "string") {
        return res.status(400).json({
          message: "Invalid new password",
        });
      }

      /* ---------------------------------------------------
         PASSWORD LENGTH
      --------------------------------------------------- */

      if (newPassword.length < 8) {
        return res.status(400).json({
          message:
            "New password must contain at least 8 characters",
        });
      }

      /* ---------------------------------------------------
         PASSWORD COMPLEXITY
      --------------------------------------------------- */

      if (!/[A-Z]/.test(newPassword)) {
        return res.status(400).json({
          message:
            "New password must contain at least one uppercase letter",
        });
      }

      if (!/[a-z]/.test(newPassword)) {
        return res.status(400).json({
          message:
            "New password must contain at least one lowercase letter",
        });
      }

      if (!/[0-9]/.test(newPassword)) {
        return res.status(400).json({
          message:
            "New password must contain at least one number",
        });
      }

      if (!/[^A-Za-z0-9]/.test(newPassword)) {
        return res.status(400).json({
          message:
            "New password must contain at least one special character",
        });
      }

      /* ---------------------------------------------------
         GET CURRENT USER
      --------------------------------------------------- */

      const userId = req.user.id;

      const [users] = await db.query(
        `
        SELECT
          id,
          name,
          email,
          password,
          role
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          message: "User account not found",
        });
      }

      const user = users[0];

      /* ---------------------------------------------------
         VERIFY CURRENT PASSWORD
      --------------------------------------------------- */

      const currentPasswordMatches =
        await bcrypt.compare(
          currentPassword,
          user.password
        );

      if (!currentPasswordMatches) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }

      /* ---------------------------------------------------
         PREVENT SAME PASSWORD
      --------------------------------------------------- */

      const samePassword =
        await bcrypt.compare(
          newPassword,
          user.password
        );

      if (samePassword) {
        return res.status(400).json({
          message:
            "New password must be different from your current password",
        });
      }

      /* ---------------------------------------------------
         HASH NEW PASSWORD
      --------------------------------------------------- */

      const hashedPassword = await bcrypt.hash(
        newPassword,
        12
      );

      /* ---------------------------------------------------
         UPDATE PASSWORD
      --------------------------------------------------- */

      const [result] = await db.query(
        `
        UPDATE users
        SET password = ?
        WHERE id = ?
        `,
        [
          hashedPassword,
          userId,
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(500).json({
          message:
            "Password could not be updated",
        });
      }

      /* ---------------------------------------------------
         SUCCESS
      --------------------------------------------------- */

      return res.json({
        success: true,
        message:
          "Password changed successfully",
      });
    } catch (err) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        err
      );

      return res.status(500).json({
        message:
          "Unable to change password",
      });
    }
  }
);

/* =========================================================
   GET CURRENT USER
   Useful for checking the logged-in session
========================================================= */

router.get(
  "/me",
  authenticateToken,
  async (req, res) => {
    try {
      const [users] = await db.query(
        `
        SELECT
          id,
          name,
          email,
          role
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [req.user.id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const user = users[0];

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || "user",
        },
      });
    } catch (err) {
      console.error(
        "GET CURRENT USER ERROR:",
        err
      );

      return res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;
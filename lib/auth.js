
import {
  readStoredData,
  writeStoredData,
  removeStoredData,
  STORAGE_KEYS,
} from "@/lib/storage";

const DEMO_USERS = [
  {
    id: "renter-001",
    name: "Demo Renter",
    email: "renter@sheggarwheels.demo",
    role: "renter",
  },
  {
    id: "owner-001",
    name: "Demo Owner One",
    email: "owner1@sheggarwheels.demo",
    role: "owner",
  },
  {
    id: "owner-002",
    name: "Demo Owner Two",
    email: "owner2@sheggarwheels.demo",
    role: "owner",
  },
  {
    id: "owner-003",
    name: "Demo Owner Three",
    email: "owner3@sheggarwheels.demo",
    role: "owner",
  },
  {
    id: "owner-004",
    name: "Demo Owner Four",
    email: "owner4@sheggarwheels.demo",
    role: "owner",
  },
  {
    id: "owner-005",
    name: "Demo Owner Five",
    email: "owner5@sheggarwheels.demo",
    role: "owner",
  },
  {
    id: "admin-001",
    name: "Demo Administrator",
    email: "admin@sheggarwheels.demo",
    role: "admin",
  },
];

// Demo-only credentials. Not suitable for production authentication.
export const DEMO_LOGIN_CREDENTIALS = {
  "renter-001": {
    email: "renter@sheggarwheels.demo",
    username: "renter",
    password: "Renter123",
  },
  "owner-001": {
    email: "owner1@sheggarwheels.demo",
    username: "owner",
    password: "Owner123",
  },
  "admin-001": {
    email: "admin@sheggarwheels.demo",
    username: "admin",
    password: "Admin123",
  },
};

const DEMO_PASSWORDS = {
  "renter-001": "Renter123",
  "owner-001": "Owner123",
  "owner-002": "Owner123",
  "owner-003": "Owner123",
  "owner-004": "Owner123",
  "owner-005": "Owner123",
  "admin-001": "Admin123",
};

const DEMO_USER_IDS = DEMO_USERS.map((user) => user.id);

export function initializeDemoUsers() {
  const existingUsers = readStoredData(STORAGE_KEYS.users, null);

  if (Array.isArray(existingUsers)) {
    return existingUsers;
  }

  const saved = writeStoredData(STORAGE_KEYS.users, DEMO_USERS);

  return saved ? DEMO_USERS : [];
}

export function getCurrentUser() {
  const session = readStoredData(
    STORAGE_KEYS.session,
    null,
    "session",
  );

  if (!session?.userId) {
    return null;
  }

  const users = readStoredData(STORAGE_KEYS.users, []);

  if (!Array.isArray(users)) {
    return null;
  }

  return users.find((user) => user.id === session.userId) ?? null;
}

function startSession(user) {
  const saved = writeStoredData(
    STORAGE_KEYS.session,
    { userId: user.id },
    "session",
  );

  if (!saved) {
    return {
      success: false,
      message: "Unable to start your session. Please try again.",
    };
  }

  return { success: true, user };
}

export function signInUser(email, password, role) {
  const cleanEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!cleanEmail || typeof password !== "string" || !password) {
    return {
      success: false,
      message: "Please enter your email and password.",
    };
  }

  if (!["renter", "owner", "admin"].includes(role)) {
    return {
      success: false,
      message: "Please select a valid account type.",
    };
  }

  const users = initializeDemoUsers();

  if (!Array.isArray(users)) {
    return {
      success: false,
      message: "Unable to load accounts. Please try again.",
    };
  }

  const user = users.find(
    (item) =>
      typeof item.email === "string" &&
      item.email.toLowerCase() === cleanEmail &&
      item.role === role,
  );

  if (!user) {
    return {
      success: false,
      message: "No account found for that email and account type.",
    };
  }

  const expectedPassword = DEMO_PASSWORDS[user.id] ?? user.password;

  if (!expectedPassword || expectedPassword !== password) {
    return {
      success: false,
      message: "Incorrect password. Please try again.",
    };
  }

  return startSession(user);
}

export function signInDemoUser(userId, username, password) {
  const credentials = DEMO_LOGIN_CREDENTIALS[userId];

  if (!credentials) {
    return {
      success: false,
      message: "Please select a valid demo account.",
    };
  }

  if (
    typeof username !== "string" ||
    username.trim().toLowerCase() !== credentials.username
  ) {
    return {
      success: false,
      message: "The username does not match the selected demo account.",
    };
  }

  if (password !== credentials.password) {
    return {
      success: false,
      message: "The password is incorrect. Please try again.",
    };
  }

  const users = initializeDemoUsers();
  const user = users.find((item) => item.id === userId);

  if (!user) {
    return {
      success: false,
      message: "Demo account not found. Please refresh and try again.",
    };
  }

  return startSession(user);
}

export function registerUser({
  name,
  email,
  password,
  confirmPassword,
  role,
}) {
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (cleanName.length < 2 || cleanName.length > 80) {
    return {
      success: false,
      message: "Your name must be between 2 and 80 characters.",
    };
  }

  if (
    cleanEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
  ) {
    return {
      success: false,
      message: "Please enter a valid email address.",
    };
  }

  if (!["renter", "owner"].includes(role)) {
    return {
      success: false,
      message: "Please choose renter or owner registration.",
    };
  }

  if (typeof password !== "string" || password.length < 8) {
    return {
      success: false,
      message: "Your password must contain at least 8 characters.",
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      message: "The passwords do not match.",
    };
  }

  const users = initializeDemoUsers();

  if (!Array.isArray(users)) {
    return {
      success: false,
      message: "Unable to load accounts. Please try again.",
    };
  }

  const existingUser = users.find(
    (user) =>
      typeof user.email === "string" &&
      user.email.toLowerCase() === cleanEmail,
  );

  if (existingUser) {
    // Allow an older account without a password to set one.
    // Never overwrite a seeded demo account this way.
    if (
      !DEMO_USER_IDS.includes(existingUser.id) &&
      !existingUser.password
    ) {
      const upgradedUser = {
        ...existingUser,
        name: cleanName,
        email: cleanEmail,
        password,
        role,
      };

      const updatedUsers = users.map((user) =>
        user.id === existingUser.id ? upgradedUser : user,
      );

      if (!writeStoredData(STORAGE_KEYS.users, updatedUsers)) {
        return {
          success: false,
          message: "Unable to update your account. Please try again.",
        };
      }

      return startSession(upgradedUser);
    }

    return {
      success: false,
      message: "An account with this email already exists. Please sign in.",
    };
  }

  const user = {
    id: `${role}-${crypto.randomUUID()}`,
    name: cleanName,
    email: cleanEmail,
    password,
    role,
  };

  if (!writeStoredData(STORAGE_KEYS.users, [...users, user])) {
    return {
      success: false,
      message: "Unable to save your account. Please try again.",
    };
  }

  return startSession(user);
}

export function registerRenter(details) {
  return registerUser({ ...details, role: "renter" });
}

export function signOutDemoUser() {
  return removeStoredData(STORAGE_KEYS.session, "session");
}

export function hasRole(user, allowedRoles) {
  return Boolean(user && allowedRoles.includes(user.role));
}

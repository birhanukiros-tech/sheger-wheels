
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

// Demo-only credentials. These are not secure production authentication.
export const DEMO_LOGIN_CREDENTIALS = {
  "renter-001": {
    username: "renter",
    password: "Renter123",
  },
  "owner-001": {
    username: "owner",
    password: "Owner123",
  },
  "admin-001": {
    username: "admin",
    password: "Admin123",
  },
};

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

  if (
    typeof password !== "string" ||
    password !== credentials.password
  ) {
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

  const saved = writeStoredData(
    STORAGE_KEYS.session,
    { userId: user.id },
    "session",
  );

  if (!saved) {
    return {
      success: false,
      message: "Unable to start the demo session.",
    };
  }

  return { success: true, user };
}

export function registerRenter({ name, email }) {
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (cleanName.length < 2) {
    return {
      success: false,
      message: "Please enter a name with at least 2 characters.",
    };
  }

  if (cleanName.length > 80) {
    return {
      success: false,
      message: "Your name must be 80 characters or fewer.",
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

  const users = initializeDemoUsers();

  if (!Array.isArray(users)) {
    return {
      success: false,
      message: "Unable to load accounts. Please try again.",
    };
  }

  const emailExists = users.some(
    (user) =>
      typeof user.email === "string" &&
      user.email.toLowerCase() === cleanEmail,
  );

  if (emailExists) {
    return {
      success: false,
      message: "An account with this email already exists.",
    };
  }

  const user = {
    id: `renter-${crypto.randomUUID()}`,
    name: cleanName,
    email: cleanEmail,
    role: "renter",
  };

  const updatedUsers = [...users, user];

  if (!writeStoredData(STORAGE_KEYS.users, updatedUsers)) {
    return {
      success: false,
      message: "Unable to save your account. Please try again.",
    };
  }

  if (
    !writeStoredData(
      STORAGE_KEYS.session,
      { userId: user.id },
      "session",
    )
  ) {
    return {
      success: false,
      message: "Your account was created, but sign-in failed. Please sign in.",
    };
  }

  return { success: true, user };
}

export function signOutDemoUser() {
  return removeStoredData(STORAGE_KEYS.session, "session");
}

export function hasRole(user, allowedRoles) {
  return Boolean(user && allowedRoles.includes(user.role));
}

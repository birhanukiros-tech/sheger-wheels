
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

export function initializeDemoUsers() {
  const existingUsers = readStoredData(STORAGE_KEYS.users, null);

  // Seed only when user data has not been created yet.
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

export function signInDemoUser(userId) {
  const users = initializeDemoUsers();
  const user = users.find((item) => item.id === userId);

  if (!user) {
    return {
      success: false,
      message: "Demo account not found.",
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

export function signOutDemoUser() {
  return removeStoredData(STORAGE_KEYS.session, "session");
}

export function hasRole(user, allowedRoles) {
  return Boolean(user && allowedRoles.includes(user.role));
}

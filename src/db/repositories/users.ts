import bcrypt from "bcryptjs";
import { getDb } from "../index";
import type { User, UserRole } from "../../shared/types";

interface UserRow {
  id: number;
  name: string;
  username: string;
  password_hash: string;
  role: UserRole;
  active: number;
  created_at: string;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    role: row.role,
    active: !!row.active,
    createdAt: row.created_at,
  };
}

export function listUsers(): User[] {
  const rows = getDb().prepare("SELECT * FROM users ORDER BY name").all() as UserRow[];
  return rows.map(toUser);
}

export function createUser(input: {
  name: string;
  username: string;
  password: string;
  role: UserRole;
}): User {
  const passwordHash = bcrypt.hashSync(input.password, 10);
  const result = getDb()
    .prepare(
      "INSERT INTO users (name, username, password_hash, role, active) VALUES (?, ?, ?, ?, 1)"
    )
    .run(input.name, input.username, passwordHash, input.role);
  const row = getDb()
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as UserRow;
  return toUser(row);
}

export function setUserActive(id: number, active: boolean): void {
  getDb().prepare("UPDATE users SET active = ? WHERE id = ?").run(active ? 1 : 0, id);
}

export function setUserRole(id: number, role: UserRole): void {
  getDb().prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
}

export function verifyLogin(username: string, password: string): User | null {
  const row = getDb().prepare("SELECT * FROM users WHERE username = ? AND active = 1").get(username) as
    | UserRow
    | undefined;
  if (!row) return null;
  if (!bcrypt.compareSync(password, row.password_hash)) return null;
  return toUser(row);
}

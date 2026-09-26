import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const account = process.argv[2];
if (!/^[12]$/.test(account || "")) {
  console.error("Usage: node scripts/hash-password.mjs <1|2>");
  process.exit(1);
}
if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error("Run this command in a terminal so the password can be entered without echoing.");
  process.exit(1);
}

const input = process.stdin;
const output = process.stdout;
input.setRawMode(true);
input.resume();
output.write("Enter password (hidden): ");
let password = "";
input.on("data", async (chunk) => {
  const key = chunk.toString("utf8");
  if (key === "\u0003") { output.write("\nCancelled.\n"); process.exit(130); }
  if (key === "\r" || key === "\n") {
    input.setRawMode(false);
    input.pause();
    output.write("\n");
    if (password.length < 12) { output.write("Use at least 12 characters.\n"); process.exit(1); }
    const salt = randomBytes(16).toString("hex");
    const hash = await scrypt(password, salt, 64);
    password = "";
    output.write(`ADMIN_${account}_PASSWORD_HASH=${salt}:${hash.toString("hex")}\n`);
    output.write("Copy that hash into Hostinger's environment settings; do not commit it.\n");
    process.exit(0);
  }
  if (key === "\u007f" || key === "\b") password = password.slice(0, -1);
  else if (key.length === 1 && key >= " ") password += key;
});

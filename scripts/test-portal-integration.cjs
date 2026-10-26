const { spawn } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const path = require("node:path");
const os = require("node:os");
// Install this test-only dependency outside the application if it is not installed locally.
let MongoMemoryReplSet;
try {
  ({ MongoMemoryReplSet } = require("mongodb-memory-server"));
} catch {
  ({ MongoMemoryReplSet } = require(
    path.join(
      process.env.SBD_TEST_MODULES ||
        path.join(os.tmpdir(), "sbd-portal-test-tools", "node_modules"),
      "mongodb-memory-server",
    ),
  ));
}
const children = [];
function run(args, env) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, args, {
      env,
      stdio: "inherit",
      cwd: path.resolve(__dirname, ".."),
    });
    children.push(p);
    p.on("error", reject);
    p.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`Process failed (${code})`)),
    );
  });
}
(async () => {
  let mongo;
  try {
    mongo = await MongoMemoryReplSet.create({
      replSet: { count: 1 },
      instanceOpts: [{ port: 27189 }],
    });
    const env = {
      ...process.env,
      SBD_PORTAL_TEST_ONLY: "true",
      SBD_BUILD_DIR: ".next-integration",
      MONGODB_URI: mongo.getUri(),
      NEXTAUTH_SECRET: randomBytes(32).toString("hex"),
      NEXTAUTH_URL: "http://localhost:3102",
      SBD_ADMIN_ORIGIN: "http://localhost:3102",
      SBD_PORTAL_ORIGIN: "http://localhost:3102",
      BREVO_API_KEY: "",
    };
    const server = spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "dev", "--port", "3102"],
      { env, stdio: "ignore", cwd: path.resolve(__dirname, "..") },
    );
    children.push(server);
    let ready = false;
    for (let i = 0; i < 60; i++) {
      if (server.exitCode !== null)
        throw new Error("Test web server could not start");
      try {
        const r = await fetch("http://localhost:3102/account/login");
        if (r.ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!ready) throw new Error("Test web server did not become ready");
    await run(["tests/portal.integration.local.cjs"], env);
    await run(["tests/portal.accounts.local.cjs"], env);
  } finally {
    for (const p of children) if (p.exitCode === null) p.kill();
    if (mongo) await mongo.stop();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});

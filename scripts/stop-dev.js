/**
 * npm run stop:dev — frees the ports our dev servers use.
 *
 * Why this exists: closing a terminal (or killing only the npm process) can leave the
 * real server, a child `node` process, running in the background. It keeps the port, so
 * the next `npm run dev` fails ("port already in use") or, worse, an old server keeps
 * answering with old code. This finds whatever listens on our ports and stops it.
 *
 * SAFETY: only `node` processes are stopped. Anything else on these ports (another app)
 * is reported and left alone.
 *
 * Only some ports:  npm run stop:dev -- 3000        (e.g. just the API)
 */
import { execFileSync } from "node:child_process";

const ALL_PORTS = { 3000: "API", 5173: "web (vite dev / preview)", 4173: "vite preview" };
const requested = process.argv.slice(2).map(Number).filter(Number.isInteger);
const PORTS = requested.length
  ? Object.fromEntries(requested.map((port) => [port, ALL_PORTS[port] ?? "requested port"]))
  : ALL_PORTS;
const isWindows = process.platform === "win32";

const run = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return ""; // e.g. lsof exits with 1 when nothing matches
  }
};

/** PIDs listening on `port`. */
function listeners(port) {
  if (isWindows) {
    // "  TCP    [::1]:5173    [::]:0    LISTENING    12744"
    const pids = run("netstat", ["-ano"])
      .split("\n")
      .map((line) => line.trim().match(/^TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)$/))
      .filter((m) => m && Number(m[1]) === port)
      .map((m) => Number(m[2]));
    return [...new Set(pids)];
  }
  return run("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"]).split("\n").filter(Boolean).map(Number);
}

/** The program's name, e.g. "node.exe" or "node". */
function processName(pid) {
  if (isWindows) return run("tasklist", ["/FI", `PID eq ${pid}`, "/FO", "CSV", "/NH"]).split(",")[0]?.replaceAll('"', "").trim() ?? "";
  return run("ps", ["-p", String(pid), "-o", "comm="]).trim();
}

/** Stop the process and everything it started (/T = the whole tree, on Windows). */
function stop(pid) {
  if (isWindows) run("taskkill", ["/PID", String(pid), "/T", "/F"]);
  else process.kill(pid, "SIGTERM");
}

let stopped = 0;
for (const [port, label] of Object.entries(PORTS)) {
  for (const pid of listeners(Number(port))) {
    const name = processName(pid);
    if (!/^node(\.exe)?$/i.test(name)) {
      console.log(`port ${port} (${label}): used by "${name || "unknown"}" (pid ${pid}), not a node process, left alone`);
      continue;
    }
    stop(pid);
    stopped++;
    console.log(`port ${port} (${label}): stopped ${name} (pid ${pid})`);
  }
}
const portList = Object.keys(PORTS).join(", ");
console.log(stopped ? `Done: ${stopped} server(s) stopped.` : `Nothing to stop: port(s) ${portList} are free.`);

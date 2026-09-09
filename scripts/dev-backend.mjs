import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const windows = process.platform === "win32";
const backend = spawn(
  windows ? "mvnw.cmd spring-boot:run" : "sh",
  windows ? [] : ["./mvnw", "spring-boot:run"],
  {
    cwd: fileURLToPath(new URL("../backend/", import.meta.url)),
    stdio: "inherit",
    shell: windows,
    windowsHide: true,
  },
);

backend.on("error", (error) => {
  console.error(`Could not start the backend: ${error.message}`);
  process.exitCode = 1;
});

backend.on("exit", (code) => {
  process.exitCode = code ?? 1;
});

import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);

function run(command, commandArgs, stdio = "inherit") {
  return spawnSync(command, commandArgs, {
    stdio,
  });
}

const modern = run("docker", ["compose", "version"], "ignore");

if (modern.status === 0) {
  const result = run("docker", ["compose", ...args]);
  process.exit(result.status ?? 1);
}

const legacy = run("docker-compose", ["--version"], "ignore");

if (legacy.status === 0) {
  const result = run("docker-compose", args);
  process.exit(result.status ?? 1);
}

process.stderr.write("Docker Compose is not available. Install Docker Compose and retry.\n");
process.exit(1);

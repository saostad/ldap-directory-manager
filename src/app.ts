/** this file used to just run some internal tests while developing the package */
import dotenv from "dotenv";
dotenv.config();
import { version } from "./";

import { createLogger, writeLog } from "fast-node-logger";

export async function main() {
  /** ready to use instance of logger */
  const logger = await createLogger({
    level: "trace",
    prettyPrint: { colorize: true, translateTime: " yyyy-mm-dd HH:MM:ss" },
  });

  /** put your code below here */
  console.log(`File: app.ts,`, `Line: 16 => `, version);
}

main().catch((err: Error) => {
  writeLog(err, { level: "error", stdout: true });
});

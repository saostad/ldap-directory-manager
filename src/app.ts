/** this file used to just run some internal tests while developing the package */
import dotenv from "dotenv";
dotenv.config();
import { version, Studio } from "./";

import { createLogger, writeLog } from "fast-node-logger";

export async function main() {
  /** ready to use instance of logger */
  const logger = await createLogger({
    level: "info",
    prettyPrint: { colorize: true, translateTime: " yyyy-mm-dd HH:MM:ss" },
  });

  /** put your code below here */
  const st = new Studio({
    logger,
    url: process.env.AD_URI ?? "",
    bindDN: process.env.AD_USER ?? "",
    secret: process.env.AD_Pass ?? "",
    baseDN: "DC=ki,DC=local",
  });
  const interfaceDirPath = await st.init({
    generateInterfaces: true,
    useCachedInterfaces: true,
  });

  const query = await st.findUser("*@kajimausa.com", {
    attributes: ["displayName", "userPrincipalName"],
  });

  console.log(`File: app.ts,`, `Line: 31 => `, query);

  st.unbind();
}

main().catch((err: Error) => {
  writeLog(err, { level: "error", stdout: true });
});

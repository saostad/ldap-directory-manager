/** this file used to just run some internal tests while developing the package */
import dotenv from "dotenv";
dotenv.config();
import { version, Studio } from "./";

import { createLogger, writeLog } from "fast-node-logger";
import { User } from "./generated/interfaces/User";

export async function main() {
  /** ready to use instance of logger */
  const logger = await createLogger({
    level: "trace",
    prettyPrint: { colorize: true, translateTime: " yyyy-mm-dd HH:MM:ss" },
  });

  /** put your code below here */
  const st = new Studio({
    logger,
    url: "ldap://ki.local",
    baseDN: "DC=KI, DC=local",
    bindDN: "ki\\adquery",
    secret: "3tNj7lJG56Hi^xAPGows",
  });
  await st.init({ generateInterfaces: true, useCachedInterfaces: true });

  const query = (await st.find<User>({ attributes: ["displayName"] }))
    .where({ field: "objectClass", criteria: "user" })
    .whereAnd({ field: "objectCategory", criteria: "person" })
    .toString();

  console.log(`File: app.ts,`, `Line: 31 => `, query);

  st.unbind();
}

main().catch((err: Error) => {
  writeLog(err, { level: "error", stdout: true });
});

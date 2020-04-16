/** this file used to just run some internal tests while developing the package */
import dotenv from "dotenv";
dotenv.config();
import { version, Ldap } from "./";

import { createLogger, writeLog } from "fast-node-logger";

export async function main() {
  /** ready to use instance of logger */
  const logger = await createLogger({
    level: "trace",
    prettyPrint: { colorize: true, translateTime: " yyyy-mm-dd HH:MM:ss" },
  });

  /** put your code below here */
  const st = new Ldap({
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

  const singleUser = await st.findFirstUser("sostad*", {
    attributes: ["displayName", "userPrincipalName"],
  });
  console.log(`File: app.ts,`, `Line: 31 => `, singleUser);

  const allUsers = await st.findUsers("*@kajimausa.com", {
    attributes: ["displayName", "userPrincipalName"],
  });
  console.log(`File: app.ts,`, `Line: 36 => `, allUsers.length);

  const firstGroup = await st.findFirstGroup("KUSA_VP_ACCESS", {
    attributes: ["cn"],
  });
  console.log(`File: app.ts,`, `Line: 41 => `, firstGroup);

  const groups = await st.findGroups("*KUSA*", {
    attributes: ["cn"],
  });
  console.log(`File: app.ts,`, `Line: 46 => `, groups.length);

  const groupsOfUser = await st.findGroupMembershipForUser("sostad*", {
    attributes: ["cn"],
  });
  console.log(`File: app.ts,`, `Line: 51 => `, groupsOfUser.length);

  const groupsMembers = await st.findGroupMembers("KUSA_VP_ACCESS", {
    attributes: ["cn"],
  });
  console.log(`File: app.ts,`, `Line: 56=> `, groupsMembers.length);

  await st.unbind();
}

main().catch((err: Error) => {
  writeLog(err, { level: "error", stdout: true });
});

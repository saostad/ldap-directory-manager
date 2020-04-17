/** this file used to just run some internal tests while developing the package */
import dotenv from "dotenv";
dotenv.config();
import {
  version,
  initial,
  userModifyAttribute,
  userFindOne,
  usersFindAll,
  groupFindOne,
  groupsFindAll,
  userFindGroupMembership,
  groupFindMembers,
  QueryGenerator,
} from "./";

import { createLogger, writeLog } from "fast-node-logger";
import { Group, User } from "./generated/interfaces";
import { Client, IClientConfig } from "ldap-ts-client";

export async function main() {
  /** ready to use instance of logger */
  const logger = await createLogger({
    level: "trace",
    prettyPrint: { colorize: true, translateTime: " yyyy-mm-dd HH:MM:ss" },
  });

  /** put your code below here */
  const baseDN = "DC=ki,DC=local";
  const config: IClientConfig = {
    logger,
    ldapServerUrl: process.env.AD_URI ?? "",
    user: process.env.AD_USER ?? "",
    pass: process.env.AD_Pass ?? "",
    baseDN,
  };

  /** generate typescript interfaces from ldap schema */
  const interfaceDirPath = await initial({
    generateInterfaces: true,
    useCachedInterfaces: true,
    ...config,
  });

  const client = new Client(config);

  const singleUser = await userFindOne<User>("sostad*", {
    attributes: [
      "displayName",
      "userPrincipalName",
      "adminDisplayName",
      "assistant",
      "manager",
    ],
    client,
    baseDN,
  });
  console.log(`File: app.ts,`, `Line: 31 => `, singleUser);

  const allUsers = await usersFindAll<User>("*@kajimausa.com", {
    client,
    baseDN,
    attributes: ["displayName", "userPrincipalName"],
  });
  console.log(`File: app.ts,`, `Line: 36 => `, allUsers.length);

  const firstGroup = await groupFindOne("KUSA_VP_ACCESS", {
    client,
    baseDN,
    attributes: ["cn"],
  });
  console.log(`File: app.ts,`, `Line: 41 => `, firstGroup);

  const groups = await groupsFindAll("*KUSA*", {
    client,
    baseDN,
    attributes: ["cn"],
  });
  console.log(`File: app.ts,`, `Line: 46 => `, groups.length);

  const groupsOfUser = await userFindGroupMembership("sostad*", {
    client,
    baseDN,
    attributes: ["cn"],
  });
  console.log(`File: app.ts,`, `Line: 51 => `, groupsOfUser.length);

  const groupsMembers = await groupFindMembers<Group>("KUSA_VP_ACCESS", {
    client,
    baseDN,
    attributes: ["cn", "gidNumber"],
  });
  console.log(`File: app.ts,`, `Line: 56=> `, groupsMembers.length);

  await userModifyAttribute<User>({
    client,
    dn: "dc",
    changes: [
      {
        operation: "add",
        modification: {
          mail: "user@domain.com",
        },
      },
    ],
  });

  await client.unbind();
}

main().catch((err: Error) => {
  writeLog(err, { level: "error", stdout: true });
});

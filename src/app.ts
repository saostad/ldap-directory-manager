/** this file used to just run some internal tests while developing the package */
import dotenv from "dotenv";
dotenv.config();
import {
  initial,
  userGetOne,
  userGetAll,
  groupGetOne,
  groupGetAll,
  userGetGroupMembership,
  groupGetMembers,
  userAdd,
  entryCountryUpdate,
  entryGetByDn,
  userGetByUserName,
  userGetByName,
  userGetByNameApproxMatch,
  userGetNotDisabled,
  userGetDisabled,
  userGetPasswordNeverExpires,
  userGetPasswordNotRequired,
  userGetLockedOut,
  userGetByUserAccountControl,
} from "./index";

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
  const config: IClientConfig = {
    logger,
    ldapServerUrl: process.env.AD_URI ?? "",
    user: process.env.AD_USER ?? "",
    pass: process.env.AD_Pass ?? "",
  };

  const client = new Client(config);
  try {
    /** generate typescript interfaces from ldap schema */
    // await initial({
    //   client,
    //   options: {
    //     generateInterfaces: true,
    //     useCachedInterfaces: true,
    //     generateCountryIsoCodes: true,
    //     logger,
    //   },
    // });

    // const activeUsers = await userGetNotDisabled({ configs: { client } });
    // console.log(`File: app.ts,`, `Line: 54 => `, activeUsers.length);

    // const disabledUsers = await userGetDisabled({
    //   criteria: "*kcswest.com",
    //   configs: { client },
    // });
    // console.log(`File: app.ts,`, `Line: 54 => `, disabledUsers.length);

    // const passNeverExpireUsers = await userGetPasswordNeverExpire({
    //   configs: { client },
    // });
    // console.log(`File: app.ts,`, `Line: 54 => `, passNeverExpireUsers.length);

    // const lockedOutUsers = await userGetLockedOut({
    //   criteria: "*",
    //   configs: { client, criteriaAttribute: "cn" },
    // });
    // console.log(`File: app.ts,`, `Line: 54 => `, lockedOutUsers.length);

    const userData = await userGetByUserAccountControl({
      configs: { client },
      accountControls: ["NORMAL_ACCOUNT", "ACCOUNTDISABLE"],
      criteria: "*kbd.group",
    });
    console.log(`File: app.ts,`, `Line: 82 => `, userData.length);

    // const passNotReqUsers = await userGetPasswordNotRequired({
    //   configs: { client },
    // });
    // console.log(`File: app.ts,`, `Line: 54 => `, passNotReqUsers);

    // const userItem = await userGetByUserName("*s", { client });
    // console.log(`File: app.ts,`, `Line: 51 => `, userItem);
    // const userItem2 = await userGetByName("Ostad*", { client });
    // console.log(`File: app.ts,`, `Line: 55 => `, userItem2);
    // const userItem3 = await userGetByNameApproxMatch("Ostad Safied", {
    //   client,
    // });
    // console.log(`File: app.ts,`, `Line: 58 => `, userItem3);
    // const userDn = "CN=Ostad\\, Saeid,OU=Users,OU=KII,DC=ki,DC=local";
    // const updatedUser = await adEntryCountryUpdate({
    //   dn: userDn,
    //   client,
    //   data: {
    //     c: "US",
    //     co: "United States of America",
    //     countryCode: 840,
    //   },
    // });
    // console.log(`File: app.ts,`, `Line: 59 => `, updatedUser);
    // const singleUser = await userGetOne<User>("sostad*", {
    //   client,
    //   attributes: [
    //     "displayName",
    //     "userPrincipalName",
    //     "adminDisplayName",
    //     "assistant",
    //     "manager",
    //     "c",
    //     "co",
    //     "countryCode",
    //   ],
    // });
    // console.log(`File: app.ts,`, `Line: 31 => `, singleUser);
    // const allUsers = await userGetAll<User>("*@kajimausa.com", {
    //   client,
    //   attributes: ["displayName", "userPrincipalName"],
    // });
    // console.log(`File: app.ts,`, `Line: 36 => `, allUsers.length);
    // const firstGroup = await groupGetOne("KUSA_VP_ACCESS", {
    //   client,
    //   attributes: ["cn"],
    // });
    // console.log(`File: app.ts,`, `Line: 41 => `, firstGroup);
    // const groups = await groupGetAll("*KUSA*", {
    //   client,
    //   attributes: ["cn"],
    // });
    // console.log(`File: app.ts,`, `Line: 46 => `, groups.length);
    // const groupsOfUser = await userGetGroupMembership("sostad*", {
    //   client,
    //   attributes: ["cn"],
    // });
    // console.log(`File: app.ts,`, `Line: 51 => `, groupsOfUser.length);
    // const groupsMembers = await groupGetMembers<Group>("KUSA_VP_ACCESS", {
    //   client,
    //   attributes: ["cn", "gidNumber"],
    // });
    // console.log(`File: app.ts,`, `Line: 56=> `, groupsMembers.length);
    // const newUser = { company: "test" };
    // const userAddResult = await userAdd<User>(newUser, {
    //   client,
    //   cn: "Test\\, User",
    //   ou: "OU=Users,OU=KII,DC=ki,DC=local",
    // });
    // console.log(`File: app.ts,`, `Line: 100 => `, userAddResult);
    // const userByDn = await entryGetByDn(userDn, { client, attributes: ["*"] });
    // console.log(`File: app.ts,`, `Line: 98 => `, userByDn);
    // const groupDn =
    //   "CN=KUSA_All_Knowbe4_Users,OU=KnowBe4,OU=Groups,DC=ki,DC=local";
    // const groupByDn = await entryGetByDn(groupDn, {
    //   client,
    //   attributes: ["*"],
    // });
    // console.log(`File: app.ts,`, `Line: 102 => `, groupByDn);
    // const updatedUser = await userUpdate<User>({
    //   client,
    //   dn: "dc",
    //   changes: [
    //     {
    //       operation: "add",
    //       modification: {
    //         mail: "user@domain.com",
    //       },
    //     },
    //   ],
    // });
    // console.log(`File: app.ts,`, `Line: 108 => `, updatedUser);
  } finally {
    if (client.getConnectionStatus()) {
      await client.unbind();
    }
  }
}

main().catch((err: Error) => {
  writeLog(err, { level: "error", stdout: true });
});

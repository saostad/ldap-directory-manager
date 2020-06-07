import { writeLog, logToFile as logger } from "fast-node-logger";
import { QueryGenerator } from "ldap-query-generator";
import type { Client } from "ldap-ts-client";
import { groupGetOne } from "./group";
import { parseDn } from "../helpers/utils";

type GetUserInputOptions<User = any> = {
  client: Client;
  baseDN?: string;
  attributes?: Array<Extract<keyof User, string>>;
};

/** @description return first found user
 * @note it search in userPrincipalName attribute, result can be multiple entry but it ignore those and just return first entry.
 */
export async function userGetOne<User = any>(
  criteria: string,
  options: GetUserInputOptions<User>,
) {
  writeLog("userGetOne()", { level: "trace" });
  const qGen = new QueryGenerator({
    logger,
  });

  const { query } = qGen
    .where({ field: "userPrincipalName", action: "substrings", criteria })
    .whereAnd({ field: "objectClass", action: "equal", criteria: "user" })
    .whereOr({ field: "objectClass", action: "equal", criteria: "person" })
    .whereNot({
      field: "objectClass",
      action: "equal",
      criteria: "computer",
    })
    .whereNot({ field: "objectClass", action: "equal", criteria: "group" })
    .select(["displayName", "userPrincipalName"]);

  console.log(`File: user.ts,`, `Line: 38 => `, query.toString());

  const filter =
    "&(userPrincipalName=sostad*)(&(objectClass=user))(|(objectClass=person))(!(objectClass=computer)(objectClass=group))";

  const data = await options.client.queryAttributes({
    base: options.baseDN,
    attributes: options?.attributes ?? query.attributes,
    options: {
      filter: query.toString(),
      // filter,
      scope: "sub",
      paged: true,
    },
  });
  return data[0];
}

/** search against UPN of users
 * - ["*"] from all users
 * @example `*@domain.com` for all users from domain.com in their UPN
 */
export async function userGetAll<User = any>(
  criteria: string,
  options: GetUserInputOptions<User>,
) {
  writeLog("usersGetAll()", { level: "trace" });

  const qGen = new QueryGenerator({
    logger,
  });

  const { query } = qGen
    .where({ field: "userPrincipalName", action: "substrings", criteria })
    .whereAnd({ field: "objectClass", action: "equal", criteria: "user" })
    .whereOr({ field: "objectClass", action: "equal", criteria: "person" })
    .whereNot({
      field: "objectClass",
      action: "equal",
      criteria: "computer",
    })
    .whereNot({ field: "objectClass", action: "equal", criteria: "group" })
    .select(["displayName", "userPrincipalName"]);

  const data = await options.client.queryAttributes({
    base: options.baseDN,
    attributes: options?.attributes ?? query.attributes,
    options: {
      filter: query.toString(),
      scope: "sub",
      paged: true,
    },
  });

  return data;
}

/** @description return array of found users that members of that group */
export async function groupGetMembers<User = any>(
  criteria: string,
  { attributes, client, baseDN }: GetUserInputOptions<User>,
) {
  writeLog("groupGetMembers()", { level: "trace" });

  /**
   * 1. get group dn
   * 2. get all users that memberOf field has that dn
   */
  const group = await groupGetOne(criteria, {
    baseDN,
    client,
    attributes: ["distinguishedName"],
  });

  const qGen = new QueryGenerator({
    logger,
  });

  const { query } = qGen
    .where({
      field: "memberOf",
      action: "equal",
      criteria: parseDn(group.dn),
    })
    .whereAnd({ field: "objectClass", action: "equal", criteria: "user" })
    .whereOr({ field: "objectClass", action: "equal", criteria: "person" })
    .whereNot({
      field: "objectClass",
      action: "equal",
      criteria: "computer",
    })
    .whereNot({ field: "objectClass", action: "equal", criteria: "group" })
    .select(["displayName", "userPrincipalName"]);

  const data = await client.queryAttributes({
    base: baseDN,
    attributes: attributes ?? query.attributes,
    options: {
      filter: query.toString(),
      scope: "sub",
      paged: true,
    },
  });

  return data;
}

type UserAddFnOptions = {
  /** DN of parent OU */
  ou: string;
  /** Full Name of user in format: 'LastName, FirstName' e.g. 'Doe, John' */
  cn: string;
  client: Client;
};
// TODO: use generic type User to auto-complete entry properties
export async function userAdd<User = any>(
  entry: { [key: string]: string | string[] },
  { client, ou, cn }: UserAddFnOptions,
) {
  /**@step make sure objectClass is an array */
  if (entry.objectClass) {
    if (!Array.isArray(entry.objectClass)) {
      entry.objectClass = [entry.objectClass];
    }
  } else {
    entry.objectClass = [];
  }

  /**@step add necessary values for attribute objectClass */
  if (!entry.objectClass.includes("top")) {
    entry.objectClass.push("top");
  }
  if (!entry.objectClass.includes("person")) {
    entry.objectClass.push("person");
  }
  if (!entry.objectClass.includes("organizationalPerson")) {
    entry.objectClass.push("organizationalPerson");
  }
  if (!entry.objectClass.includes("user")) {
    entry.objectClass.push("user");
  }

  return client.add({ entry, dn: `CN=${cn},${ou}` });
}

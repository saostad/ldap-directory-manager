import { writeLog, logToFile as logger } from "fast-node-logger";
import { User } from "../generated/interfaces";
import { QueryGenerator } from "ldap-query-generator";
import { Client } from "ldap-ts-client";
import { findFirstGroup } from "./group";
import { parseDn } from "../helpers/utils";

interface FindUserInputOptions<T = any> {
  client: Client;
  baseDN: string;
  attributes: Array<keyof T>;
}
/** @description return first found user */
export async function findFirstUser(
  criteria: string,
  options: FindUserInputOptions<User>,
) {
  writeLog("findUser()", { level: "trace" });
  const qGen = new QueryGenerator<User>({
    logger,
    scope: "sub",
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
    options: {
      attributes: options?.attributes ?? (query.attributes as string[]),
      filter: query.toString(),
      scope: query.scope,
      paged: true,
    },
  });
  return data[0];
}

/** @description return array of found users */
export async function findUsers(
  criteria: string,
  options: FindUserInputOptions<User>,
) {
  writeLog("findUser()", { level: "trace" });

  const qGen = new QueryGenerator<User>({
    logger,
    scope: "sub",
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
    options: {
      attributes: options?.attributes ?? (query.attributes as string[]),
      filter: query.toString(),
      scope: query.scope,
      paged: true,
    },
  });

  return data;
}

/** @description return array of found users that members of that group */
export async function findGroupMembers(
  criteria: string,
  { attributes, client, baseDN }: FindUserInputOptions<User>,
) {
  writeLog("findGroupMembers()", { level: "trace" });

  /**
   * 1. get group dn
   * 2. get all users that memberOf field has that dn
   */
  const group = await findFirstGroup(criteria, {
    baseDN,
    client,
    attributes: ["distinguishedName"],
  });

  const qGen = new QueryGenerator<User>({
    logger,
    scope: "sub",
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
    options: {
      attributes: attributes ?? (query.attributes as string[]),
      filter: query.toString(),
      scope: query.scope,
      paged: true,
    },
  });

  return data;
}

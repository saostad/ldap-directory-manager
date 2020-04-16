import type { Group } from "../generated/interfaces";
import type { Client } from "ldap-ts-client";
import { QueryGenerator } from "ldap-query-generator";
import { logToFile as logger, writeLog } from "fast-node-logger";
import { findFirstUser } from "./user";
import { parseDn } from "../helpers/utils";

interface FindGroupInputOptions<T = any> {
  client: Client;
  baseDN: string;
  attributes: Array<keyof T>;
}

/** @description return first found group */
export async function findFirstGroup(
  criteria: string,
  options: FindGroupInputOptions<Group>,
) {
  writeLog("findFirstGroup()", { level: "trace" });
  const qGen = new QueryGenerator<Group>({
    logger,
    scope: "sub",
  });

  const { query } = qGen
    .where({ field: "cn", action: "substrings", criteria })
    .whereAnd({ field: "objectCategory", action: "equal", criteria: "group" })
    .select(["displayName"]);

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

/** @description return array of groups */
export async function findGroups(
  criteria: string,
  options: FindGroupInputOptions<Group>,
) {
  writeLog("findGroups()", { level: "trace" });
  const qGen = new QueryGenerator<Group>({
    logger,
    scope: "sub",
  });

  const { query } = qGen
    .where({ field: "cn", action: "substrings", criteria })
    .whereAnd({ field: "objectCategory", action: "equal", criteria: "group" })
    .select(["displayName"]);

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

/** @description return array of groups that username members */
export async function findGroupMembershipForUser(
  criteria: string,
  { baseDN, client, attributes }: FindGroupInputOptions<Group>,
) {
  writeLog("getGroupMembershipForUser()", { level: "trace" });

  /** Plan:
   * 1. get user dn base on user upn
   * 2. find groups that has that dn on their member attribute
   */

  const user = await findFirstUser(criteria, {
    baseDN,
    client,
    attributes: ["distinguishedName"],
  });

  const qGen = new QueryGenerator<Group>({
    logger,
    scope: "sub",
  });

  const { query } = qGen
    .where({
      field: "member",
      action: "equal",
      criteria: parseDn(user.dn),
    })
    .whereAnd({ field: "objectClass", action: "equal", criteria: "group" })
    .select(["displayName"]);

  const data = await client.queryAttributes({
    base: baseDN,
    options: {
      attributes: attributes ?? (query.attributes as string[]),
      filter: query.toString(),
      scope: query.scope,
    },
  });
  return data;
}

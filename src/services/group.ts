import type { Client } from "ldap-ts-client";
import { QueryGenerator } from "ldap-query-generator";
import { logToFile as logger, writeLog } from "fast-node-logger";
import { userGetOne } from "./user";
import { parseDn } from "../helpers/utils";

type GetGroupInputOptions<T> = {
  client: Client;
  baseDN: string;
  attributes: Array<keyof T>;
};

/** @description return first found group */
export async function groupGetOne<T = any>(
  criteria: string,
  options: GetGroupInputOptions<T>,
) {
  writeLog("groupGetOne()", { level: "trace" });
  const qGen = new QueryGenerator<T>({
    logger,
    scope: "sub",
  });

  const { query } = qGen
    .where({ field: "cn", action: "substrings", criteria })
    .whereAnd({ field: "objectCategory", action: "equal", criteria: "group" })
    .select(["displayName"]);

  const data = await options.client.queryAttributes<T>({
    base: options.baseDN,
    attributes: options?.attributes ?? query.attributes,
    options: {
      filter: query.toString(),
      scope: query.scope,
      paged: true,
    },
  });
  return data[0];
}

export async function groupGetByDn<T = any>(
  dn: string,
  options: GetGroupInputOptions<T>,
) {
  writeLog("groupGetByDn()", { level: "trace" });
  const qGen = new QueryGenerator<T>({
    logger,
    scope: "sub",
  });

  const { query } = qGen
    .where({ field: "cn", action: "equal", criteria: dn })
    .whereAnd({ field: "objectCategory", action: "equal", criteria: "group" })
    .select(["displayName"]);

  const data = await options.client.queryAttributes<T>({
    base: options.baseDN,
    attributes: options?.attributes ?? query.attributes,
    options: {
      filter: query.toString(),
      scope: query.scope,
      paged: true,
    },
  });
  return data[0];
}

/** @description return array of groups */
export async function groupGetAll<T = any>(
  criteria: string,
  options: GetGroupInputOptions<T>,
) {
  writeLog("findGroups()", { level: "trace" });
  const qGen = new QueryGenerator<T>({
    logger,
    scope: "sub",
  });

  const { query } = qGen
    .where({ field: "cn", action: "substrings", criteria: criteria ?? "dn=*" })
    .whereAnd({ field: "objectCategory", action: "equal", criteria: "group" })
    .select(["displayName"]);

  const data = await options.client.queryAttributes<T>({
    base: options.baseDN,
    attributes: options?.attributes ?? query.attributes,
    options: {
      filter: query.toString(),
      scope: query.scope,
      paged: true,
    },
  });
  return data;
}

/** @description return array of groups that username members */
export async function userGetGroupMembership<T = any>(
  criteria: string,
  { baseDN, client, attributes }: GetGroupInputOptions<T>,
) {
  writeLog("userGetGroupMembership()", { level: "trace" });

  /** @step Plan:
   * 1. get user dn base on user upn
   * 2. find groups that has that dn on their member attribute
   */

  /** */
  const user = await userGetOne(criteria, {
    baseDN,
    client,
    attributes: ["distinguishedName"],
  });

  const qGen = new QueryGenerator<T>({
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

  const data = await client.queryAttributes<T>({
    base: baseDN,
    attributes: attributes ?? query.attributes,
    options: {
      filter: query.toString(),
      scope: query.scope,
    },
  });
  return data;
}

//TODO groupUpdate & groupDelete

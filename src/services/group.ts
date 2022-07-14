import type { Client } from "ldap-ts-client";
import { QueryGenerator } from "ldap-query-generator";
import { logToFile as logger, writeLog } from "fast-node-logger";
import { userGetOne } from "./user";
import { parseDn } from "../helpers/utils";
import { getDefaultNamingContext } from "ldap-schema-ts-generator";

type GetGroupInputConfigs<T> = {
  client: Client;
  /**A base dn is the point from where a server will search for.
   * default is DefaultNamingContext defined in schema
   */
  baseDn?: string;
  attributes?: Array<Extract<keyof T, string>>;
};

/** @description return first found group */
export async function groupGetOne<T = any>(
  criteria: string,
  configs: GetGroupInputConfigs<T>,
) {
  writeLog("groupGetOne()", { level: "trace" });

  let base: string;
  if (configs.baseDn) {
    base = configs.baseDn;
  } else {
    base = await getDefaultNamingContext({ client: configs.client });
  }

  const qGen = new QueryGenerator({
    logger,
  });

  const { query } = qGen
    .where({ field: "cn", action: "substrings", criteria })
    .whereAnd({ field: "objectCategory", action: "equal", criteria: "group" })
    .select(["*"]);

  const data = await configs.client.queryAttributes({
    base,
    attributes: configs?.attributes ?? query.attributes,
    options: {
      filter: query.toString(),
      scope: "sub",
      paged: true,
    },
  });
  return data[0];
}

type GroupGetAll<T> = {
  criteria?: string;
  configs: GetGroupInputConfigs<T>;
};
/** @description return array of groups */
export async function groupGetAll<T = any>({
  configs,
  criteria,
}: GroupGetAll<T>) {
  writeLog("groupGetAll()", { level: "trace" });

  let base: string;
  if (configs.baseDn) {
    base = configs.baseDn;
  } else {
    base = await getDefaultNamingContext({ client: configs.client });
  }

  const qGen = new QueryGenerator({
    logger,
  });

  const { query } = qGen
    .where({ field: "cn", action: "substrings", criteria: criteria ?? "*" })
    .whereAnd({ field: "objectCategory", action: "equal", criteria: "group" })
    .select(["displayName"]);

  const data = await configs.client.queryAttributes({
    base,
    attributes: configs?.attributes ?? query.attributes,
    options: {
      filter: query.toString(),
      scope: "sub",
      paged: true,
    },
  });
  return data;
}

/** @description return array of groups that username members */
export async function userGetGroupMembership<T = any>(
  criteria: string,
  configs: GetGroupInputConfigs<T>,
) {
  writeLog("userGetGroupMembership()", { level: "trace" });

  let base: string;
  if (configs.baseDn) {
    base = configs.baseDn;
  } else {
    base = await getDefaultNamingContext({ client: configs.client });
  }

  /** @step Plan:
   * 1. get user dn base on user upn
   * 2. find groups that has that dn on their member attribute
   */

  /** */
  const user = await userGetOne(criteria, {
    baseDn: base,
    client: configs.client,
    attributes: ["distinguishedName"],
  });

  const qGen = new QueryGenerator({
    logger,
  });

  const { query } = qGen
    .where({
      field: "member",
      action: "equal",
      criteria: parseDn(user.dn),
    })
    .whereAnd({ field: "objectClass", action: "equal", criteria: "group" })
    .select(["displayName"]);

  const data = await configs.client.queryAttributes({
    base,
    attributes: configs.attributes ?? query.attributes,
    options: {
      filter: query.toString(),
      scope: "sub",
    },
  });
  return data;
}

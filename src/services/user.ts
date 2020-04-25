import { writeLog, logToFile as logger } from "fast-node-logger";
import { QueryGenerator } from "ldap-query-generator";
import type { Client, ModifyChange } from "ldap-ts-client";
import { groupGetOne } from "./group";
import { parseDn } from "../helpers/utils";

type GetUserInputOptions<T = any> = {
  client: Client;
  baseDN: string;
  attributes: Array<keyof T>;
};
/** @description return first found user */
export async function userGetOne<T = any>(
  criteria: string,
  options: GetUserInputOptions<T>,
) {
  writeLog("userGetOne()", { level: "trace" });
  const qGen = new QueryGenerator<T>({
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

/** @description return array of found users */
export async function userGetAll<T = any>(
  criteria: string,
  options: GetUserInputOptions<T>,
) {
  writeLog("usersGetAll()", { level: "trace" });

  const qGen = new QueryGenerator<T>({
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

/** @description return array of found users that members of that group */
export async function groupGetMembers<T = any>(
  criteria: string,
  { attributes, client, baseDN }: GetUserInputOptions<T>,
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

  const qGen = new QueryGenerator<T>({
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

  const data = await client.queryAttributes<T>({
    base: baseDN,
    attributes: attributes ?? query.attributes,
    options: {
      filter: query.toString(),
      scope: query.scope,
      paged: true,
    },
  });

  return data;
}

type UserUpdateFnInput<T> = {
  client: Client;
  dn: string;
  controls?: any;
  changes: ModifyChange<T>[];
};
export function userUpdate<T>({
  dn,
  changes,
  controls,
  client,
}: UserUpdateFnInput<T>) {
  client.modifyAttribute({ dn: parseDn(dn), changes, controls });
}

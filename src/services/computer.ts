import type { Client } from "ldap-ts-client";
import { QueryGenerator } from "ldap-query-generator";
import { logToFile as logger, writeLog } from "fast-node-logger";
import { getDefaultNamingContext } from "ldap-schema-ts-generator";

type GetComputerInputConfigs<T> = {
  client: Client;
  /**A base dn is the point from where a server will search for.
   * default is DefaultNamingContext defined in schema
   */
  baseDn?: string;
  attributes?: Array<Extract<keyof T, string>>;
};

type computerGetAllFnInput<T> = {
  configs: GetComputerInputConfigs<T>;
  criteria?: string;
};

/** @description return array of computers */
export async function computerGetAll<T = any>({
  configs,
  criteria,
}: computerGetAllFnInput<T>) {
  writeLog("computerGetAll()", { level: "trace" });

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
    .whereAnd({
      field: "objectCategory",
      action: "equal",
      criteria: "computer",
    })
    .select(["cn", "description"]);

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

/** @description return array of disabled computer accounts */
export async function computerGetDisabled<T = any>(
  configs: GetComputerInputConfigs<T>,
) {
  writeLog("computerGetDisabled()", { level: "trace" });

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
    .where({
      field: "userAccountControl",
      action: "extensible",
      criteria: "2",
      extensibleConfig: {
        ignoreField: false,
        dn: false,
        matchingRuleId: "1.2.840.113556.1.4.803",
      },
    })
    .whereAnd({
      field: "objectClass",
      action: "equal",
      criteria: "computer",
    })
    .select(["cn", "description"]);

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

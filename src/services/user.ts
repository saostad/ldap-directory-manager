import { writeLog, logToFile as logger } from "fast-node-logger";
import { QueryGenerator } from "ldap-query-generator";
import type { Client, SearchEntryObject } from "ldap-ts-client";
import { groupGetOne } from "./group";
import { parseDn } from "../helpers/utils";
import { getDefaultNamingContext } from "ldap-schema-ts-generator";
import Fuse from "fuse.js";

const defaultUserAttributes = [
  "displayName",
  "userPrincipalName",
  "distinguishedName",
  "cn",
];

type GetUserInputConfigs<User = any> = {
  client: Client;
  baseDn?: string;
  attributes?: Array<Extract<keyof User, string>>;
};

/** @description return first found user
 * @note it search in "userPrincipalName" attribute, result can be multiple entry but it ignore those and just return first entry.
 */
export async function userGetOne<User = any>(
  criteria: string,
  configs: GetUserInputConfigs<User>,
) {
  writeLog("userGetOne()", { level: "trace" });

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
    .where({ field: "userPrincipalName", action: "substrings", criteria })
    .whereAnd({ field: "objectClass", action: "equal", criteria: "user" })
    .whereOr({ field: "objectClass", action: "equal", criteria: "person" })
    .whereNot({
      field: "objectClass",
      action: "equal",
      criteria: "computer",
    })
    .whereNot({ field: "objectClass", action: "equal", criteria: "group" })
    .select(defaultUserAttributes);

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

type UserGetAllFnInput<User> = {
  criteria?: string;
  configs: GetUserInputConfigs<User>;
};

/** search against "userPrincipalName" attribute of users
 * - ["*"] from all users
 * @example `*@domain.com` for all users from domain.com in their UPN
 */
export async function userGetAll<User = any>({
  criteria,
  configs,
}: UserGetAllFnInput<User>) {
  writeLog("usersGetAll()", { level: "trace" });

  let base: string;
  if (configs.baseDn) {
    base = configs.baseDn;
  } else {
    base = await getDefaultNamingContext({ client: configs.client });
  }

  const qGen = new QueryGenerator({
    logger,
  });

  /** if criteria not provided return all users */
  const { query } = qGen
    .where({
      field: "userPrincipalName",
      action: "substrings",
      criteria: criteria ?? "*",
    })
    .whereAnd({ field: "objectClass", action: "equal", criteria: "user" })
    .whereOr({ field: "objectClass", action: "equal", criteria: "person" })
    .whereNot({
      field: "objectClass",
      action: "equal",
      criteria: "computer",
    })
    .whereNot({ field: "objectClass", action: "equal", criteria: "group" })
    .select(defaultUserAttributes);

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

/** @description return array of found users that members of that group */
export async function groupGetMembers<User = any>(
  criteria: string,
  configs: GetUserInputConfigs<User>,
) {
  writeLog("groupGetMembers()", { level: "trace" });

  let base: string;
  if (configs.baseDn) {
    base = configs.baseDn;
  } else {
    base = await getDefaultNamingContext({ client: configs.client });
  }
  /**
   * 1. get group dn
   * 2. get all users that memberOf field has that dn
   */
  const group = await groupGetOne(criteria, {
    baseDn: base,
    client: configs.client,
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
    .select(defaultUserAttributes);

  const data = await configs.client.queryAttributes({
    base,
    attributes: configs.attributes ?? query.attributes,
    options: {
      filter: query.toString(),
      scope: "sub",
      paged: true,
    },
  });

  return data;
}

type UserAddFnConfigs = {
  /** DN of parent OU */
  ou: string;
  /** Full Name of user in format: 'LastName, FirstName' e.g. 'Doe, John' */
  cn: string;
  client: Client;
};
// TODO: use generic type User to auto-complete entry properties
export async function userAdd<User = any>(
  entry: { [key: string]: string | string[] },
  { client, ou, cn }: UserAddFnConfigs,
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

/** search against "sAmAccountName" attribute of users */
export async function userGetByUserName<User = any>(
  sAmAccountName: string,
  configs: GetUserInputConfigs<User>,
): Promise<SearchEntryObject[]> {
  writeLog("userGetByUserName()", { level: "trace" });

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
      field: "sAmAccountName",
      action: "substrings",
      criteria: sAmAccountName,
    })
    .whereAnd({ field: "objectClass", action: "equal", criteria: "user" })
    .whereOr({ field: "objectClass", action: "equal", criteria: "person" })
    .whereNot({
      field: "objectClass",
      action: "equal",
      criteria: "computer",
    })
    .whereNot({ field: "objectClass", action: "equal", criteria: "group" })
    .select(defaultUserAttributes);

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

/** search against "cn" attribute of users */
export async function userGetByName<User = any>(
  cn: string,
  configs: GetUserInputConfigs<User>,
): Promise<SearchEntryObject[]> {
  writeLog("userGetByName()", { level: "trace" });

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
      field: "cn",
      action: "substrings",
      criteria: cn,
    })
    .whereAnd({ field: "objectClass", action: "equal", criteria: "user" })
    .whereOr({ field: "objectClass", action: "equal", criteria: "person" })
    .whereNot({
      field: "objectClass",
      action: "equal",
      criteria: "computer",
    })
    .whereNot({ field: "objectClass", action: "equal", criteria: "group" })
    .select(defaultUserAttributes);

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

/** fussy search against common name "cn" attribute of users
 * @note depend on number of users this can be slow process
 */
export async function userGetByNameApproxMatch<User = any>(
  cn: string,
  configs: GetUserInputConfigs<User>,
) {
  writeLog("userGetByName()", { level: "trace" });

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
      field: "cn",
      action: "present",
      criteria: "",
    })
    .whereAnd({ field: "objectClass", action: "equal", criteria: "user" })
    .whereOr({ field: "objectClass", action: "equal", criteria: "person" })
    .whereNot({
      field: "objectClass",
      action: "equal",
      criteria: "computer",
    })
    .whereNot({ field: "objectClass", action: "equal", criteria: "group" })
    .select(defaultUserAttributes);

  const data = await configs.client.queryAttributes({
    base,
    attributes: configs?.attributes ?? query.attributes,
    options: {
      filter: query.toString(),
      scope: "sub",
      paged: true,
    },
  });

  /**@step fussy search */
  const fuse = new Fuse(data, {
    keys: ["cn"],
  });

  const result = fuse.search(cn).map((el) => ({ ...el.item }));
  return result;
}

/** @description use the UserAccountControl flags to manipulate user account properties.
 * [source](https://support.microsoft.com/en-us/help/305144/how-to-use-useraccountcontrol-to-manipulate-user-account-properties) */
export function userAccountControlFlags(input: number) {
  /** get type of object values of object */
  function t<V extends string, T extends { [key in string]: V }>(o: T): T {
    return o;
  }

  const adUserAccountControlText = t({
    "1": "SCRIPT",
    "2": "ACCOUNTDISABLE",
    "8": "HOMEDIR_REQUIRED",
    "16": "LOCKOUT",
    "32": "PASSWD_NOTREQD",
    "64": "PASSWD_CANT_CHANGE",
    "128": "ENCRYPTED_TEXT_PWD_ALLOWED",
    "256": "TEMP_DUPLICATE_ACCOUNT",
    "512": "NORMAL_ACCOUNT",
    "2048": "INTERDOMAIN_TRUST_ACCOUNT",
    "4096": "WORKSTATION_TRUST_ACCOUNT",
    "8192": "SERVER_TRUST_ACCOUNT",
    "65536": "DONT_EXPIRE_PASSWORD",
    "131072": "MNS_LOGON_ACCOUNT",
    "262144": "SMARTCARD_REQUIRED",
    "524288": "TRUSTED_FOR_DELEGATION",
    "1048576": "NOT_DELEGATED",
    "2097152": "USE_DES_KEY_ONLY",
    "4194304": "DONT_REQ_PREAUTH",
    "8388608": "PASSWORD_EXPIRED",
    "16777216": "TRUSTED_TO_AUTH_FOR_DELEGATION",
    "67108864": "PARTIAL_SECRETS_ACCOUNT",
  });

  type Keys = keyof typeof adUserAccountControlText;
  type UserAccountControlValue = typeof adUserAccountControlText[Keys];

  const accountControls: UserAccountControlValue[] = [];
  Object.entries(adUserAccountControlText).forEach(([key, value]) => {
    if (Number(key) & input) {
      accountControls.push(value);
    }
  });
  return accountControls;
}

// TODO: complete it
export async function userGetNotDisabled(input: number) {
  // do something
}

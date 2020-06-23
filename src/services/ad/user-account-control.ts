// active-directory specific functionalities

import { writeLog } from "fast-node-logger";

import {
  UserGetAllFnInput,
  defaultUserAttributes,
  userGetAll,
  UserGetAllConfigs,
} from "../user";

/** get type of object values of an object [source](https://stackoverflow.com/questions/53662208/types-from-both-keys-and-values-of-object-in-typescript) */
function JUST_FOR_TYPINGS<V extends string, T extends { [key in string]: V }>(
  o: T,
): T {
  return o;
}

const adUserAccountControlText = JUST_FOR_TYPINGS({
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

type UserAccountControlKeys = keyof typeof adUserAccountControlText;
type UserAccountControlValue = typeof adUserAccountControlText[UserAccountControlKeys];

/** @description analyse integer value of the UserAccountControl attribute and return equivalent flags.
 * @usage to manipulate user account properties. [source](https://support.microsoft.com/en-us/help/305144/how-to-use-useraccountcontrol-to-manipulate-user-account-properties)
 * [powershell](https://docs.microsoft.com/en-us/powershell/module/addsadministration/set-adaccountcontrol?view=win10-ps)*/
export function analyseUserAccountControlFlags(input: number) {
  writeLog("analyseUserAccountControlFlags()", { level: "trace" });

  const accountControls: UserAccountControlValue[] = [];
  Object.entries(adUserAccountControlText).forEach(([key, value]) => {
    if (Number(key) & input) {
      accountControls.push(value);
    }
  });
  return accountControls;
}

/** based on criteria return not disabled users respecting userAccountControl flags */
export async function userGetNotDisabled<User = any>({
  criteria,
  configs,
}: UserGetAllFnInput<User>) {
  writeLog("userGetNotDisabled()", { level: "trace" });
  const attributes = configs.attributes ?? defaultUserAttributes;
  attributes.push("userAccountControl");

  const users = await userGetAll({
    criteria,
    configs: {
      ...configs,
      attributes,
    },
  });
  const data = users.filter((el) => {
    const uac = el.userAccountControl;

    const flags = analyseUserAccountControlFlags(Number(uac));
    if (!flags.includes("ACCOUNTDISABLE")) {
      return true;
    }
  });

  return data;
}

/** based on criteria return not disabled users respecting userAccountControl flags */
export async function userGetDisabled<User = any>({
  criteria,
  configs,
}: UserGetAllFnInput<User>) {
  writeLog("userGetDisabled()", { level: "trace" });
  const attributes = configs.attributes ?? defaultUserAttributes;
  attributes.push("userAccountControl");

  const users = await userGetAll({
    criteria,
    configs: {
      ...configs,
      attributes,
    },
  });
  const data = users.filter((el) => {
    const uac = el.userAccountControl;

    const flags = analyseUserAccountControlFlags(Number(uac));
    if (flags.includes("ACCOUNTDISABLE")) {
      return true;
    }
  });

  return data;
}

/** based on criteria return not password never expire users respecting userAccountControl flags */
export async function userGetPasswordNeverExpires<User = any>({
  criteria,
  configs,
}: UserGetAllFnInput<User>) {
  writeLog("userGetPasswordNeverExpire()", { level: "trace" });
  const attributes = configs.attributes ?? defaultUserAttributes;
  attributes.push("userAccountControl");

  const users = await userGetAll({
    criteria,
    configs: {
      ...configs,
      attributes,
    },
  });
  const data = users.filter((el) => {
    const uac = el.userAccountControl;

    const flags = analyseUserAccountControlFlags(Number(uac));
    if (flags.includes("DONT_EXPIRE_PASSWORD")) {
      return true;
    }
  });

  return data;
}

/** based on criteria return not password not required users respecting userAccountControl flags */
export async function userGetPasswordNotRequired<User = any>({
  criteria,
  configs,
}: UserGetAllFnInput<User>) {
  writeLog("userGetPasswordNotRequired()", { level: "trace" });
  const attributes = configs.attributes ?? defaultUserAttributes;
  attributes.push("userAccountControl");

  const users = await userGetAll({
    criteria,
    configs: {
      ...configs,
      attributes,
    },
  });
  const data = users.filter((el) => {
    const uac = el.userAccountControl;

    const flags = analyseUserAccountControlFlags(Number(uac));
    if (flags.includes("PASSWD_NOTREQD")) {
      return true;
    }
  });

  return data;
}

/** based on criteria return Cannot change password accounts respecting userAccountControl flags */
export async function userGetCannotChangePassword<User = any>({
  criteria,
  configs,
}: UserGetAllFnInput<User>) {
  writeLog("userGetCannotChangePassword()", { level: "trace" });
  const attributes = configs.attributes ?? defaultUserAttributes;
  attributes.push("userAccountControl");

  const users = await userGetAll({
    criteria,
    configs: {
      ...configs,
      attributes,
    },
  });
  const data = users.filter((el) => {
    const uac = el.userAccountControl;

    const flags = analyseUserAccountControlFlags(Number(uac));
    if (flags.includes("PASSWD_CANT_CHANGE")) {
      return true;
    }
  });

  return data;
}

/** based on criteria return user accounts required a home directory respecting userAccountControl flags */
export async function userGetHomedirRequired<User = any>({
  criteria,
  configs,
}: UserGetAllFnInput<User>) {
  writeLog("userGetHomedirRequired()", { level: "trace" });
  const attributes = configs.attributes ?? defaultUserAttributes;
  attributes.push("userAccountControl");

  const users = await userGetAll({
    criteria,
    configs: {
      ...configs,
      attributes,
    },
  });
  const data = users.filter((el) => {
    const uac = el.userAccountControl;

    const flags = analyseUserAccountControlFlags(Number(uac));
    if (flags.includes("HOMEDIR_REQUIRED")) {
      return true;
    }
  });

  return data;
}

type UserGetByUserAccountControlInput<User> = {
  criteria?: string;
  accountControls: UserAccountControlValue[];
  configs: UserGetAllConfigs<User>;
};
/** based on criteria return user accounts respecting multiple userAccountControl flags */
export async function userGetByUserAccountControl<User = any>({
  criteria,
  accountControls,
  configs,
}: UserGetByUserAccountControlInput<User>) {
  writeLog("userGetHomedirRequired()", { level: "trace" });
  const attributes = configs.attributes ?? defaultUserAttributes;
  attributes.push("userAccountControl");

  const users = await userGetAll({
    criteria,
    configs: {
      ...configs,
      attributes,
    },
  });

  const data = users.filter((el) => {
    const uac = el.userAccountControl;
    const flags = analyseUserAccountControlFlags(Number(uac));
    return accountControls.every((item) => flags.includes(item));
  });

  return data;
}

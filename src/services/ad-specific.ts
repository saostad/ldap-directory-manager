// active-directory specific functionalities

import { writeLog } from "fast-node-logger";
import { entryUpdate } from "./common";
import { Client } from "ldap-ts-client";
import fs from "fs";
import { promisify } from "util";
import path from "path";
import { variables } from "../helpers/variables";
import {
  generateCountryIsoCodesFile,
  getCountryIsoCodes,
  CountryIsoCode,
} from "ldap-schema-ts-generator";

export type CountryCodeAttributes = {
  /**
   * ISO-3166 2-digit string value
   * Admin DisplayName: Country-Name
   * Description: Country-Name
   * ldapDisplayName: c
   * attributeSyntax: 2.5.5.12
   * attributeID: 2.5.4.6
   */
  c: string;
  /**
   * ISO-3166 Integer value
   * Admin DisplayName: Country-Code
   * Description: Country-Code
   * ldapDisplayName: countryCode
   * attributeSyntax: 2.5.5.9
   * attributeID: 1.2.840.113556.1.4.25
   */
  countryCode: number;
  /**
   * Country Text Open string value
   * Admin DisplayName: Text-Country
   * Description: Text-Country
   * ldapDisplayName: co
   * attributeSyntax: 2.5.5.12
   * attributeID: 1.2.840.113556.1.2.131
   */
  co: string;
};

/** check if file already exist, if not generate it. */
async function makeSureJsonIsoFileExist(filePath: string): Promise<boolean> {
  writeLog("makeSureJsonIsoFileExist()", { level: "trace" });

  const exist = promisify(fs.exists);
  const isFileExist = await exist(filePath);
  if (!isFileExist) {
    writeLog(`generating json file...`, { level: "info", stdout: true });
    const countryCodes = await getCountryIsoCodes({ useCache: true });
    generateCountryIsoCodesFile({ countryCodes });
  }
  return true;
}

async function countryCodeValidate(
  filePath: string,
  input: CountryCodeAttributes,
): Promise<boolean | undefined> {
  writeLog(`countryCodeValidate()`, { level: "trace" });
  /**@step make sure file exist */
  const isExist = await makeSureJsonIsoFileExist(filePath);
  // const isExist = true; // TODO delete me
  if (isExist) {
    const rawData = await fs.promises.readFile(filePath, {
      encoding: "utf8",
      flag: "r",
    });
    const processedData: CountryIsoCode[] = JSON.parse(rawData);
    const isValid = processedData.find((el) => {
      return (
        el.c === input.c &&
        el.co === input.co &&
        el.countryCode === input.countryCode
      );
    });
    return !!isValid;
  } else {
    throw new Error(`error in reading file ${filePath}`);
  }
}

export type AdEntryCountryUpdateInput<Entry = any> = {
  client: Client;
  dn: string;
  data: CountryCodeAttributes;
  options?: {
    attributes?: Array<Extract<keyof Entry, string> | "*">;
    controls?: any;
  };
};

export async function adEntryCountryUpdate({
  dn,
  data,
  client,
  options,
}: AdEntryCountryUpdateInput) {
  writeLog("adEntryCountryUpdate()", { level: "trace" });

  const countryIsoCodesPath = path.join(
    variables.defaultJsonDir,
    "CountryIsoCodes.json",
  );

  /**@step validate input against iso-3166 country codes */

  const isValid = await countryCodeValidate(countryIsoCodesPath, data);

  if (isValid) {
    const result = await entryUpdate(dn, {
      client,
      // TODO: fix typings to remove 'as any' part
      attributes: options?.attributes as any,
      controls: options?.controls,
      changes: [
        {
          operation: "replace",
          modification: data,
        },
      ],
    });
    return result;
  } else {
    throw new Error(
      `input ${JSON.stringify(
        data,
        undefined,
        2,
      )} is not valid base on iso-3166 codes.`,
    );
  }
}

// active-directory specific functionalities

import { writeLog } from "fast-node-logger";
import { entryUpdate } from "./common";
import { Client } from "ldap-ts-client";
import fs from "fs";
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
  return new Promise((resolve) => {
    fs.exists(filePath, (isFileExist) => {
      if (!isFileExist) {
        writeLog(`generating json file...`, { level: "info", stdout: true });
        getCountryIsoCodes({ useCache: true }).then((countryCodes) => {
          generateCountryIsoCodesFile({ countryCodes }).then(() => {
            /** json code file generated! */
            resolve(true);
          });
        });
      }
      resolve(true);
    });
  });
}

async function countryCodeValidate(
  filePath: string,
  input: CountryCodeAttributes,
): Promise<boolean | undefined> {
  /**@step make sure file exist */
  const isExist = await makeSureJsonIsoFileExist(filePath);
  if (isExist) {
    const rawData = await fs.promises.readFile(filePath, { encoding: "utf8" });
    const processedData: CountryIsoCode[] = JSON.parse(rawData);
    const isValid = processedData.find((el) => {
      return (
        el.c === input.c &&
        el.co === input.co &&
        el.countryCode === input.countryCode
      );
    });
    return !!isValid;
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
  // const isValid = true;

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

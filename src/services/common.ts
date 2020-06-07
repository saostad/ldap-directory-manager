import { Client, ModifyChange } from "ldap-ts-client";
import { QueryGenerator } from "ldap-query-generator";
import { writeLog, logToFile as logger } from "fast-node-logger";

type EntryGetByDnFnOptions<Entry = any> = {
  /** initialized client object */
  client: Client;
  /** attributes to return */
  attributes?: Array<Extract<keyof Entry, string> | "*">;
};
export async function entryGetByDn<Entry = any>(
  dn: string,
  { client, attributes }: EntryGetByDnFnOptions,
) {
  /**@note dn is not an attribute. Only attribute types, OIDs, and names can be used in filters.
   * When you get the manager attribute, to get the attributes for the DN that is the manager, use the value of the manager attribute as the base object in a search request. Set the scope of the search to BASE, the filter to either (&) or (objectClass=*) and request the attributes required. Then transmit than search request to the server and interpret the response. [source](https://stackoverflow.com/questions/17303967/ldap-filter-for-distinguishedname)
   */
  writeLog("entryGetByDn()", { level: "trace" });
  const qGen = new QueryGenerator({
    logger,
  });

  const { query } = qGen
    .where({ field: "objectClass", action: "present", criteria: "" })
    /** default attributes if attributes in options not provided */
    .select(["displayName", "userPrincipalName"]);

  const data = await client.queryAttributes({
    base: dn,
    attributes: attributes ?? query.attributes!,
    options: {
      filter: query.toString(),
      scope: "base",
      paged: true,
    },
  });
  return data[0];
}

type EntryUpdateFnOptions<Entry = any> = {
  client: Client;
  changes: ModifyChange<Entry>[];
  attributes?: Array<Extract<keyof Entry, string> | "*">;
  controls?: any;
};
/** @description update entry attributes from existing entry
 * @returns updated entry with all attributes
 */
export async function entryUpdate<Entry = any>(
  dn: string,
  { changes, controls, client, attributes }: EntryUpdateFnOptions<Entry>,
) {
  writeLog("entryUpdate()", { level: "trace" });
  /**@step update entry */
  const result = await client.modifyAttribute({ dn, changes, controls });

  /**@step return updated entry */
  if (result) {
    const updatedEntry = await entryGetByDn(dn, {
      client,
      attributes: attributes ?? ["*"],
    });
    return updatedEntry;
  } else {
    throw new Error(`something went wrong in updating attributes of entry.`);
  }
}

type EntryDeleteFnOptions = {
  client: Client;
  controls?: any;
};
/** @description delete entry */
export async function entryDelete(
  dn: string,
  { controls, client }: EntryDeleteFnOptions,
) {
  writeLog("entryDelete()", { level: "trace" });

  /**@step delete entry */
  return client.del({ dn, controls });
}

type EntryAddFnOptions = {
  client: Client;
  dn: string;
  controls?: any;
};
/** @description add entry */
export async function entryAdd(
  entry: { [key: string]: string | string[] },
  { dn, controls, client }: EntryAddFnOptions,
) {
  writeLog("entryAdd()", { level: "trace" });

  /**@step add entry */
  return client.add({ entry, dn, controls });
}

type EntryModifyDnFnOptions = {
  client: Client;
  currentDn: string;
  newDn: string;
  controls?: any;
};
/** @description modifyDn of an existing entry */
export async function entryModifyDn({
  currentDn,
  newDn,
  controls,
  client,
}: EntryModifyDnFnOptions) {
  writeLog("entryModifyDn()", { level: "trace" });

  /**@step modifyDn of an existing entry */
  return client.modifyDn({ newDn, dn: currentDn, controls });
}

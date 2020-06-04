import {
  generateInterfaceFiles,
  getSchemaAttributes,
  getSchemaClasses,
  getSchemaNamingContext,
  getCountryIsoCodes,
  generateCountryIsoCodesFile,
} from "ldap-schema-ts-generator";
import { Logger } from "fast-node-logger";
import { variables } from "./variables";
import { Client } from "ldap-ts-client";

type InitOptions = {
  client: Client;
  options?: {
    /** generate schema interface. default true */
    generateInterfaces?: boolean;
    /** use cached interfaces if exist. default true. if set false regenerate interfaces */
    useCachedInterfaces?: boolean;
    /** instance of Logger mostly used in tracing */
    logger?: Logger;
    /** generate country iso-3166 codes. default false */
    generateCountryIsoCodes?: boolean;
  };
};

/** this is necessary to run this function first time you want to use the library.  it does:
 * 1. generate interface files from ldap schema
 *  @returns location of generated files
 */
export async function initial({ client, options }: InitOptions) {
  /**@step set defaults */
  /** */
  let generateInterfaces = true;
  if (typeof options?.generateInterfaces === "boolean") {
    generateInterfaces = options?.generateInterfaces;
  }

  let useCachedInterfaces = true;
  if (typeof options?.useCachedInterfaces === "boolean") {
    useCachedInterfaces = options?.useCachedInterfaces;
  }

  let generateCountryIsoCodes = false;
  if (typeof options?.generateCountryIsoCodes === "boolean") {
    generateCountryIsoCodes = options?.generateCountryIsoCodes;
  }

  if (generateInterfaces) {
    if (!useCachedInterfaces) {
      const objectAttributes = await getSchemaAttributes({
        client,
        options: { logger: options?.logger },
      });
      const objectClasses = await getSchemaClasses({
        client,
        options: { logger: options?.logger },
      });
      await generateInterfaceFiles({
        objectAttributes,
        objectClasses,
        options: {
          indexFile: true,
          outputFolder: variables.defaultInterfaceDir,
          usePrettier: true,
        },
      });
    }
  }

  if (generateCountryIsoCodes) {
    const countryCodes = await getCountryIsoCodes({ useCache: true });
    await generateCountryIsoCodesFile({
      countryCodes,
      options: { outDir: variables.defaultJsonDir },
    });
  }
}

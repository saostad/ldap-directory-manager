import path from "path";
import {
  generateInterfaceFiles,
  getSchemaAttributes,
  getSchemaClasses,
  getSchemaNamingContext,
} from "ldap-schema-ts-generator";
import { Logger } from "fast-node-logger";

type InitOptions = {
  /** generate schema interface. default true */
  generateInterfaces?: boolean;
  /** use cached interfaces if exist. default true. if set false regenerate interfaces */
  useCachedInterfaces?: boolean;
  user: string;
  pass: string;
  ldapServerUrl: string;
  logger?: Logger;
};

/** this is necessary to run this function first time you want to use the library.  it does:
 * 1. generate interface files from ldap schema
 *  @returns location of generated files
 */
export async function initial(config: InitOptions) {
  /** set defaults */
  const generateInterfaces = config.generateInterfaces ?? true;
  const useCachedInterfaces = config.useCachedInterfaces ?? true;

  const outputFolder = path.join(
    process.cwd(),
    "src",
    "generated",
    "interfaces",
  );

  if (generateInterfaces) {
    if (!useCachedInterfaces) {
      const options = {
        user: config.user,
        pass: config.pass,
        ldapServerUrl: config.ldapServerUrl,
        logger: config.logger,
      };
      const schemaDn = await getSchemaNamingContext({ options });
      const objectAttributes = await getSchemaAttributes({
        schemaDn,
        options,
      });
      const objectClasses = await getSchemaClasses({ schemaDn, options });
      await generateInterfaceFiles({
        objectAttributes,
        objectClasses,
        options: {
          indexFile: true,
          outputFolder,
          usePrettier: true,
        },
      });
    }
  }
  return outputFolder;
}

/** package version number */
export const version = require("../package.json").version;

import { Client, IClientConfig } from "ldap-ts-client";
import {
  generateInterfaceFiles,
  getSchemaAttributes,
  getSchemaClasses,
  getSchemaNamingContext,
} from "ldap-schema-ts-generator";

import { QueryGenerator } from "ldap-query-generator";
import path from "path";
import type { Logger } from "fast-node-logger";
import {
  userFindOne,
  usersFindAll,
  groupFindMembers,
  userModify,
} from "./services/user";
import {
  groupFindOne,
  groupsFindAll,
  userFindGroupMembership,
} from "./services/group";

interface InitOptions {
  /** generate schema interface. default true */
  generateInterfaces: boolean;
  /** use cached interfaces if exist. default true. false regenerate interfaces */
  useCachedInterfaces: boolean;
}

export class Ldap {
  private config: IClientConfig;
  private client!: Client;
  private logger?: Logger;
  public baseDN: string;
  public queryBuilder = QueryGenerator;
  public unbind: () => Promise<void>;

  constructor(config: IClientConfig) {
    this.config = config;
    this.baseDN = config.baseDN;
    this.client = new Client(config);
    this.logger = config.logger;
    this.unbind = this.client.unbind;
  }

  /** this is necessary to run this function first time you want to use the library.  it does:
   * 1. generate interface files from ldap schema
   */
  public async initial(
    { generateInterfaces, useCachedInterfaces }: InitOptions = {
      generateInterfaces: true,
      useCachedInterfaces: true,
    },
  ) {
    const outputFolder = path.join(
      process.cwd(),
      "src",
      "generated",
      "interfaces",
    );

    if (generateInterfaces) {
      if (!useCachedInterfaces) {
        const options = {
          user: this.config.bindDN,
          pass: this.config.secret,
          ldapServerUrl: this.config.url,
          logger: this.logger,
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

  public async userFindOne(
    criteria: string,
    options: Pick<Parameters<typeof userFindOne>[1], "attributes">,
  ) {
    return userFindOne(criteria, {
      attributes: options.attributes,
      client: this.client,
      baseDN: this.baseDN,
    });
  }

  public async usersFindAll(
    criteria: string,
    options: Pick<Parameters<typeof usersFindAll>[1], "attributes">,
  ) {
    return usersFindAll(criteria, {
      attributes: options.attributes,
      client: this.client,
      baseDN: this.baseDN,
    });
  }

  public async groupFindOne(
    criteria: string,
    { attributes }: Pick<Parameters<typeof groupFindOne>[1], "attributes">,
  ) {
    return groupFindOne(criteria, {
      attributes,
      client: this.client,
      baseDN: this.baseDN,
    });
  }

  public async groupsFindAll(
    criteria: string,
    options: Pick<Parameters<typeof groupsFindAll>[1], "attributes">,
  ) {
    return groupsFindAll(criteria, {
      attributes: options.attributes,
      client: this.client,
      baseDN: this.baseDN,
    });
  }

  public async userFindGroupMembership(
    criteria: string,
    {
      attributes,
    }: Pick<Parameters<typeof userFindGroupMembership>[1], "attributes">,
  ) {
    return userFindGroupMembership(criteria, {
      attributes,
      client: this.client,
      baseDN: this.baseDN,
    });
  }

  public async groupFindMembers(
    criteria: string,
    options: Pick<Parameters<typeof groupFindMembers>[1], "attributes">,
  ) {
    return groupFindMembers(criteria, {
      attributes: options.attributes,
      client: this.client,
      baseDN: this.baseDN,
    });
  }

  public async userModify() {
    await userModify({
      client: this.client,
      controls: undefined,
      dn: "",
      changes: [
        {
          operation: "delete",
          modification: { cn: "hello", mail: "to" },
        },
      ],
    });
  }
}

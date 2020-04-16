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
import { findFirstUser, findUsers, findGroupMembers } from "./services/user";
import {
  findFirstGroup,
  findGroups,
  findGroupMembershipForUser,
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

  public async init(
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

  public async findFirstUser(
    criteria: string,
    options: Pick<Parameters<typeof findFirstUser>[1], "attributes">,
  ) {
    return findFirstUser(criteria, {
      attributes: options.attributes,
      client: this.client,
      baseDN: this.baseDN,
    });
  }

  public async findUsers(
    criteria: string,
    options: Pick<Parameters<typeof findUsers>[1], "attributes">,
  ) {
    return findUsers(criteria, {
      attributes: options.attributes,
      client: this.client,
      baseDN: this.baseDN,
    });
  }

  public async findFirstGroup(
    criteria: string,
    { attributes }: Pick<Parameters<typeof findFirstGroup>[1], "attributes">,
  ) {
    return findFirstGroup(criteria, {
      attributes,
      client: this.client,
      baseDN: this.baseDN,
    });
  }

  public async findGroups(
    criteria: string,
    options: Pick<Parameters<typeof findGroups>[1], "attributes">,
  ) {
    return findGroups(criteria, {
      attributes: options.attributes,
      client: this.client,
      baseDN: this.baseDN,
    });
  }

  public async findGroupMembershipForUser(
    criteria: string,
    {
      attributes,
    }: Pick<Parameters<typeof findGroupMembershipForUser>[1], "attributes">,
  ) {
    return findGroupMembershipForUser(criteria, {
      attributes,
      client: this.client,
      baseDN: this.baseDN,
    });
  }

  public async findGroupMembers(
    criteria: string,
    options: Pick<Parameters<typeof findGroupMembers>[1], "attributes">,
  ) {
    return findGroupMembers(criteria, {
      attributes: options.attributes,
      client: this.client,
      baseDN: this.baseDN,
    });
  }
}

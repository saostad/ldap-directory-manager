/** package version number */
export const version = require("../package.json").version;

import { Client, IClientConfig } from "ldap-ts-client";
import {
  generateInterfaceFiles,
  getSchemaAttributes,
  getSchemaClasses,
  getSchemaNamingContext,
} from "ldap-schema-ts-generator";

import { Generator } from "ldap-query-generator";
import type { Logger } from "pino";
import path from "path";

interface FindInputOptions<T = any> {
  attributes: Array<keyof T>;
}
interface InitOptions {
  /** generate schema interface. default true */
  generateInterfaces: boolean;
  /** use cached interfaces if exist. default true. false regenerate interfaces */
  useCachedInterfaces: boolean;
}

export class Studio {
  private config: IClientConfig;
  private client!: Client;
  private logger?: Logger;
  public baseDN: string;

  constructor(config: IClientConfig) {
    this.config = config;
    this.baseDN = config.baseDN;
    this.client = new Client(config);
    this.bind();
  }

  public async bind() {
    this.logger?.trace("bind()");
    return this.client.bind();
  }

  public unbind() {
    this.logger?.trace("unbind()");
    this.client.unbind();
  }

  private async connect() {
    this.logger?.trace("connect()");
    if (this.client?.isConnected()) {
      return this.client;
    }
    const client = await this.bind();
    return client;
  }

  public async init(
    { generateInterfaces, useCachedInterfaces }: InitOptions = {
      generateInterfaces: true,
      useCachedInterfaces: true,
    },
  ) {
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
            outputFolder: path.join(
              process.cwd(),
              "src",
              "generated",
              "interfaces",
            ),
            usePrettier: true,
          },
        });
      }
    }
  }

  /** @description return first found user */
  public async find<T = any>(options?: FindInputOptions<T>) {
    this.logger?.trace("find()");
    await this.connect();
    const generator = new Generator<T>({ logger: this.logger });
    return generator.select(options?.attributes ?? ["*"]);
  }

  // /** @deprecated will be remove in next major version. this functionality will be added to another package soon
  //  * @description return array of users based on UPN
  //  */
  // public async findUsers(
  //   searchCriteria: string,
  //   options?: FindUsersInputOptions,
  // ) {
  //   process.emitWarning(
  //     "deprecated",
  //     "findUsers deprecated. this functionality will be added to another package soon",
  //   );
  //   this.logger?.trace("findUsers()");
  //   const query = `userPrincipalName=*${searchCriteria}`;
  //   await this.connect();
  //   return findUsers({
  //     client: this.client,
  //     base: this.config.baseDN,
  //     query,
  //     attributes: options?.attributes,
  //   });
  // }

  // /** @deprecated will be remove in next major version. this functionality will be added to another package soon
  //  * @description return first found group or fail
  //  */
  // public async findGroup(groupName: string, options?: FindGroupsInputOptions) {
  //   process.emitWarning(
  //     "deprecated",
  //     "findGroup deprecated. this functionality will be added to another package soon",
  //   );
  //   this.logger?.trace("findGroup()");
  //   await this.connect();
  //   return findGroup({
  //     client: this.client,
  //     base: this.config.baseDN,
  //     groupName,
  //     attributes: options?.attributes,
  //   });
  // }

  // /** @deprecated will be remove in next major version. this functionality will be added to another package soon
  //  * @description return array of groups
  //  */
  // public async getGroupMembershipForUser(
  //   username: string,
  //   options?: FindGroupsInputOptions,
  // ) {
  //   process.emitWarning("deprecated", "getGroupMembershipForUser deprecated");
  //   this.logger?.trace("getGroupMembershipForUser()");
  //   await this.connect();
  //   return getGroupMembershipForUser({
  //     client: this.client,
  //     base: this.config.baseDN,
  //     username,
  //     attributes: options?.attributes,
  //   });
  // }
}

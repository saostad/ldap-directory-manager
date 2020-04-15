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
import type { Logger } from "pino";
import path from "path";
import { User } from "./generated/interfaces";
import { writeLog } from "fast-node-logger";

interface FindUserInputOptions<T = any> {
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
  public queryBuilder = QueryGenerator;

  constructor(config: IClientConfig) {
    this.config = config;
    this.baseDN = config.baseDN;
    this.client = new Client(config);
    this.logger = config.logger;
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

  /** @description return first found user */
  public async findUser(
    criteria: string,
    options?: FindUserInputOptions<User>,
  ) {
    try {
      this.logger?.trace("findUser()");
      await this.connect();
      const qGen = new QueryGenerator<User>({
        logger: this.logger,
        scope: "sub",
      });

      const { query } = qGen
        .where({ field: "userPrincipalName", criteria: criteria })
        .whereAnd({ field: "objectClass", criteria: "user" })
        .whereOr({ field: "objectClass", criteria: "person" })
        .whereNot({ field: "objectClass", criteria: "computer" })
        .whereNot({ field: "objectClass", criteria: "group" })
        .select(["displayName", "userPrincipalName"]);

      const data = await this.client.queryAttributes({
        base: this.baseDN,
        options: {
          attributes: options?.attributes ?? (query.attributes as string[]),
          filter: query.toString(),
          scope: query.scope,
          paged: true,
        },
      });

      return data;
    } catch (error) {
      writeLog(error, { stdout: true });
    } finally {
      this.client.unbind();
    }
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

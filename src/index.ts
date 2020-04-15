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

  /** @description return first found user */
  public async findFirstUser(
    criteria: string,
    options?: FindUserInputOptions<User>,
  ) {
    this.logger?.trace("findUser()");
    const qGen = new QueryGenerator<User>({
      logger: this.logger,
      scope: "sub",
    });

    const { query } = qGen
      .where({ field: "userPrincipalName", action: "substrings", criteria })
      .whereAnd({ field: "objectClass", action: "equal", criteria: "user" })
      .whereOr({ field: "objectClass", action: "equal", criteria: "person" })
      .whereNot({
        field: "objectClass",
        action: "equal",
        criteria: "computer",
      })
      .whereNot({ field: "objectClass", action: "equal", criteria: "group" })
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
    return data[0];
  }

  /** @description return array of found users */
  public async findUsers(
    criteria: string,
    options?: FindUserInputOptions<User>,
  ) {
    this.logger?.trace("findUser()");

    const qGen = new QueryGenerator<User>({
      logger: this.logger,
      scope: "sub",
    });

    const { query } = qGen
      .where({ field: "userPrincipalName", action: "substrings", criteria })
      .whereAnd({ field: "objectClass", action: "equal", criteria: "user" })
      .whereOr({ field: "objectClass", action: "equal", criteria: "person" })
      .whereNot({
        field: "objectClass",
        action: "equal",
        criteria: "computer",
      })
      .whereNot({ field: "objectClass", action: "equal", criteria: "group" })
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
  }

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

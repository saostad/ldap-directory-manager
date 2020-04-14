/** package version number */
export const version = require("../package.json").version;

import { Client, IClientConfig } from "ldap-ts-client";
import {
  generateInterfaceFiles,
  getSchemaAttributes,
  getSchemaClasses,
} from "ldap-schema-ts-generator";

import { Generator } from "ldap-query-generator";
import type { Logger } from "pino";

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

  public bind = async () => {
    this.logger?.trace("bind()");
    return this.client.bind();
  };

  public unbind = () => {
    this.logger?.trace("unbind()");
    this.client.unbind();
  };

  private async connect() {
    this.logger?.trace("connect()");
    if (this.client?.isConnected()) {
      return this.client;
    }
    const client = await this.bind();
    return client;
  }

  /**  @description return first found user
   */
  public async findUser(username: string, options?: FindUsersInputOptions) {
    process.emitWarning(
      "deprecated",
      "findUser deprecated. this functionality will be added to another package soon",
    );
    this.logger?.trace("findUser()");
    await this.connect();
    return findUser({
      client: this.client,
      base: this.config.baseDN,
      username,
      attributes: options.attributes,
    });
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

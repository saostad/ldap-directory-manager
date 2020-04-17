/** package version number */
export const version = require("../package.json").version;
export { Client, IClientConfig } from "ldap-ts-client";
export { QueryGenerator } from "ldap-query-generator";
export { initial } from "./services/generate";

export {
  userFindOne,
  usersFindAll,
  groupFindMembers,
  userModifyAttribute,
} from "./services/user";

export {
  groupFindOne,
  groupsFindAll,
  userFindGroupMembership,
} from "./services/group";

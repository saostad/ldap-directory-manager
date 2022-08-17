# LDAP Directory Manager

schema-aware, type-safe LDAP manager, written in typescript to create hight-level functionalities.

### How to ues

```ts
import { Client, IClientConfig } from "ldap-directory-manager";
const baseDN = "DC=Domain,DC=Com";

const config: IClientConfig = {
  ldapServerUrl: process.env.AD_URI ?? "",
  user: process.env.AD_USER ?? "",
  pass: process.env.AD_Pass ?? "",
};
const client = new Client(config);

const user = await userGetOne("username*", {
  attributes: ["displayName", "userPrincipalName"],
  client,
});
console.log(user);
```

### Api Documentations

[Full API documentation](https://saostad.github.io/ldap-directory-manager/)

### Advance Uses

generate typescript interfaces from ldap schema.
(this is recommended just for first time and after each ldap schema modification)

```ts
const config = {
  ldapServerUrl: process.env.AD_URI ?? "",
  user: process.env.AD_USER ?? "",
  pass: process.env.AD_Pass ?? "",
};
const interfaceDirPath = await initial({
  generateInterfaces: true,
  useCachedInterfaces: false,
  ...config,
});
```

auto complete and type check, base on ldap schema interfaces that generated at first time.

Example 1

```ts
import { Client } from "ldap-directory-manager";
import { User } from "./generated/interfaces";

const baseDN = "DC=Domain,DC=Com";
const config: IClientConfig = {
  ldapServerUrl: process.env.AD_URI ?? "",
  user: process.env.AD_USER ?? "",
  pass: process.env.AD_Pass ?? "",
};
const client = new Client(config);

const user = await userGetOne<User>("username*", {
  attributes: [
    "displayName",
    "userPrincipalName",
    "adminDisplayName",
    "assistant",
    "manager",
  ],
  client,
});
console.log(user);
```

Example 2 (using [ldap-query-generator](https://www.npmjs.com/package/ldap-query-generator) which will be install with package):

```ts
import { QueryGenerator } from "ldap-query-generator";
import { Client } from "ldap-directory-manager";
import { User } from "./generated/interfaces";

const baseDN = "DC=Domain,DC=Com";
const config: IClientConfig = {
  ldapServerUrl: process.env.AD_URI ?? "",
  user: process.env.AD_USER ?? "",
  pass: process.env.AD_Pass ?? "",
};
const client = new Client(config);

const qGen = new QueryGenerator<User>({
  logger,
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

const data = await client.queryAttributes<User>({
  base: baseDN,
  attributes: query.attributes,
  options: {
    filter: query.toString(),
    scope: query.scope,
    paged: true,
  },
});
```

### Motivations:

Dealing with LDAP servers to get information is hard!

the goal of this package is to:

- Provide High level functions to interact with LDAP servers
- Taking advantage of typescript type safety and auto code competition

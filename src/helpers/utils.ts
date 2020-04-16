const re = {
  isDistinguishedName: /(([^=]+=.+),?)+/gi,
  isUserResult: /CN=Person,CN=Schema,CN=Configuration,.*/i,
  isGroupResult: /CN=Group,CN=Schema,CN=Configuration,.*/i,
};

export function isDn(value: string) {
  if (!value || value.length === 0) return false;
  re.isDistinguishedName.lastIndex = 0; // Reset the regular expression
  return re.isDistinguishedName.test(value);
}

export function parseDn(dn: string) {
  if (!dn) return dn;

  dn = dn.replace(/"/g, '\\"');
  return dn.replace("\\,", "\\\\,");
}

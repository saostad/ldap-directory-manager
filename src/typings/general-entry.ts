export type GeneralEntry = {
  /**
   * Admin DisplayName: Object-Class
   * Description: Object-Class
   * ldapDisplayName: objectClass
   * attributeSyntax: 2.5.5.2
   * attributeID: 2.5.4.0
   */
  objectClass?: string | string[];
  /**
   * Admin DisplayName: Object-Category
   * Description: Object-Category
   * ldapDisplayName: objectCategory
   * attributeSyntax: 2.5.5.1
   * attributeID: 1.2.840.113556.1.4.782
   */
  objectCategory?: string | string[];
  /**
   * Admin DisplayName: Instance-Type
   * Description: Instance-Type
   * ldapDisplayName: instanceType
   * attributeSyntax: 2.5.5.9
   * attributeID: 1.2.840.113556.1.2.1
   */
  instanceType?: string | string[];
  /**
   * Admin DisplayName: Obj-Dist-Name
   * Description: Obj-Dist-Name
   * ldapDisplayName: distinguishedName
   * attributeSyntax: 2.5.5.1
   * attributeID: 2.5.4.49
   */
  distinguishedName?: string | string[];
  /**
   * Admin DisplayName: Common-Name
   * Description: Common-Name
   * ldapDisplayName: cn
   * attributeSyntax: 2.5.5.12
   * attributeID: 2.5.4.3
   */
  cn?: string | string[];
  /**
   * Admin DisplayName: Display-Name
   * Description: Display-Name
   * ldapDisplayName: displayName
   * attributeSyntax: 2.5.5.12
   * attributeID: 1.2.840.113556.1.2.13
   */
  displayName?: string | string[];
  /**
   * Admin DisplayName: Description
   * Description: Description
   * ldapDisplayName: description
   * attributeSyntax: 2.5.5.12
   * attributeID: 2.5.4.13
   */
  description?: string | string[];
  /**
   * Admin DisplayName: Admin-Display-Name
   * Description: Admin-Display-Name
   * ldapDisplayName: adminDisplayName
   * attributeSyntax: 2.5.5.12
   * attributeID: 1.2.840.113556.1.2.194
   */
  adminDisplayName?: string | string[];
  /**
   * Admin DisplayName: Admin-Description
   * Description: Admin-Description
   * ldapDisplayName: adminDescription
   * attributeSyntax: 2.5.5.12
   * attributeID: 1.2.840.113556.1.2.226
   */
  adminDescription?: string | string[];
  /**
   * ISO-3166 2-digit string value
   * Admin DisplayName: Country-Name
   * Description: Country-Name
   * ldapDisplayName: c
   * attributeSyntax: 2.5.5.12
   * attributeID: 2.5.4.6
   */
  c: string | string[];
  /**
   * ISO-3166 Integer value
   * Admin DisplayName: Country-Code
   * Description: Country-Code
   * ldapDisplayName: countryCode
   * attributeSyntax: 2.5.5.9
   * attributeID: 1.2.840.113556.1.4.25
   */
  countryCode: string | string[];
  /**
   * Country Name Open string value
   * Admin DisplayName: Text-Country
   * Description: Text-Country
   * ldapDisplayName: co
   * attributeSyntax: 2.5.5.12
   * attributeID: 1.2.840.113556.1.2.131
   */
  co: string | string[];
};

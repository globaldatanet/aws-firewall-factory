import * as ip from "neoip";

type JSONValue = string | number | boolean | { [key: string]: JSONValue } | JSONValue[];

export function extractIPAddressesFromJson(
  jsonData: JSONValue,
  targetKey: string,
  conditionKey: string,
  conditionValue: string,
  type: "IPV4" | "IPV6"
): string[] {
  const cidrs: string[] = [];

  function search(data: JSONValue) {
    if (Array.isArray(data)) {
      data.forEach(search); // Recursively search each element if it's an array
    } else if (typeof data === "object" && data !== null) {
      if (data[conditionKey] === conditionValue && targetKey in data) {
        const target = data[targetKey];
        if (Array.isArray(target)) {
          target.forEach((cidr) => validateAndAdd(cidr));
        } else {
          validateAndAdd(target);
        }
      }

      // Recursively search in each property of the object
      Object.values(data).forEach(search);
    }
  }

  function validateAndAdd(cidr: JSONValue) {
    if (typeof cidr === "string" && ip.cidr(cidr)) {
      if (type === "IPV4" && !cidr.includes(":")) cidrs.push(cidr);
      if (type === "IPV6" && cidr.includes(":")) cidrs.push(cidr);
    }
  }

  search(jsonData);
  return cidrs;
}

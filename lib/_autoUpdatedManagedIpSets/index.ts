/** 
 * @packageDocumentation
 * # AWS Firewall Factory - Automated Managed IpSets
 *
 * The Prequisites Stack is used to deploy the  Automated Managed IpSets for the AWS Firewall Factory.
 * 
 * It contains the following resources:
 *  - Lambda to update the Managed IpSets
 *  - Event Schedule Rules to trigger the Lambda
 *  - SSM Parameter with information for the Managed IpSets
 * @description
 * 
 * @example
import { autoUpdatedManagedIpSets } from "../../lib/types/config/index";
import { AWSRegion } from "../../lib/types/enums/general";
import * as events from "aws-cdk-lib/aws-events";
import * as cdk from "aws-cdk-lib";

export const config: autoUpdatedManagedIpSets.config = {
  General: {
    Prefix: "aws-firewall-factory",
  },
  ManagedIpSets: [
    {
      name: "entraid-ipaddresses",
      description: "EntraID IP Addresses",
      ipAddressVersion: "IPV4",
      updateSchedule: events.Schedule.rate(cdk.Duration.days(1)),
      cidrLocations: [
        {
          downloadUrl: "https://www.microsoft.com/en-us/download/details.aspx?id=56519",
          downloadSearchRegexOnUrl: /https:\/\/download\.microsoft\.com\/download\/[0-9A-Za-z]+\/[0-9A-Za-z]+\/[0-9A-Za-z]+\/[0-9A-Za-z-]+\/ServiceTags_Public_\d{8}\.json/,
          outputType: "JSON",
          OutputInformation: {
            outputConditionKey: "systemService",
            outputConditionValue: "AzureAD",
            outputTargetKey: "addressPrefixes",
          },
        },
        {
          downloadUrl: "https://learn.microsoft.com/de-de/microsoft-365/enterprise/urls-and-ip-address-ranges?view=o365-worldwide",
          downloadSearchRegexOnUrl: /https:\/\/endpoints\.office\.com\/endpoints\/worldwide\?clientrequestid=[a-f0-9\-]{36}/,
          outputType: "JSON",
          OutputInformation: {
            outputConditionKey: "serviceArea",
            outputConditionValue: "Common",
            outputTargetKey: "ips",
          },
        },
      ],
      region: AWSRegion.EU_CENTRAL_1,
      scope: "REGIONAL",
    },
  ],
};

 */
export * from "./stack";
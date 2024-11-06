import { CfnTag } from "aws-cdk-lib";
import { general } from "../enums/index";
import * as events from "aws-cdk-lib/aws-events";
import { IPAddressVersion } from "@aws-sdk/client-wafv2";

/**
 * Interface for AutoUpdatedManagedIpSets Stacks in the Firewall Factory
 */
export interface AutoUpdatedManagedIpSetsConfig {
    readonly General: {
      /**
       * Defines a Prefix which will be added to all resources.
       */
      readonly Prefix: string;
    };
    ManagedIpSets: ManagedIpSet[];
  }
/**
 * Defines a Set of Custom Rules and AWS ManagedRulesGroups.
 */
export interface ManagedIpSet {
  /**
   * @TJS-pattern ^[a-zA-Z0-9]+$
   */
  name: string; // This name will be used as a CloudFormation logical ID, so it can't have a already used name and must be alphanumeric
  /*
   * @TJS-pattern ^[a-zA-Z0-9=:#@/\-,.][a-zA-Z0-9+=:#@/\-,.\s]+[a-zA-Z0-9+=:#@/\-,.]{1,256}$
   */
  description?: string;
  /**
   * Defines the IP address version of the set. Valid Values are IPV4 and IPV6.
   */
  ipAddressVersion: IPAddressVersion;
  /**
   * Defines Array of Tags to be added to the IPSet
   * More info: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-resource-tags.html
   */
  tags?: CfnTag[];
  /**
   * Defines the Schedule how often the IPSet will be updated
   * More info: https://docs.aws.amazon.com/eventbridge/latest/userguide/scheduled-events.html
   */
  updateSchedule: events.Schedule;
  /**
   * Defines the Locations where the IPSet will be updated from
   */
  cidrLocations: CidrLocation[];
  /**
   * Defines the Region where the IPSet will be deployed
   */
  region: general.AWSRegion,
  /**
   * Defines the Scope of the IPSet
   */
  scope: "REGIONAL" | "CLOUDFRONT";
  }

export interface CidrLocation {
    /**
     * Defines the URL where the File containing CIDR will be downloaded from
     */
    downloadUrl: string;
    /**
     * Defines the Type of the Output of the File
     */
    outputType: "JSON";
    /**
     * Defines the Regex to search for the File on the Url
     */
    downloadSearchRegexOnUrl: RegExp;
    /**
     * Defines where to extract the CIDRs from the File
     */
    OutputInformation: OutputInformation;

}

export interface OutputInformation {
    /**
     * Define the key where the CIDR should be extracted from
     */
    outputTargetKey: string;
    /**
     * Define the key that must be met for a specified value
     */
    outputConditionKey: string;
    /**
     * Define the value that must be met for the conditionKey
     */
    outputConditionValue: string;
}

export type JSONValue = string | number | boolean | { [x: string]: JSONValue } | Array<JSONValue>;
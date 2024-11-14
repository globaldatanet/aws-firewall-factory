/**
 * Represents Enum for all AWS Regions
 */
export enum AWSRegion {
    US_EAST_1 = "us-east-1",
    US_EAST_2 = "us-east-2",
    US_WEST_1 = "us-west-1",
    US_WEST_2 = "us-west-2",
    AF_SOUTH_1 = "af-south-1",
    AP_EAST_1 = "ap-east-1",
    AP_SOUTH_1 = "ap-south-1",
    AP_NORTHEAST_1 = "ap-northeast-1",
    AP_NORTHEAST_2 = "ap-northeast-2",
    AP_NORTHEAST_3 = "ap-northeast-3",
    AP_SOUTHEAST_1 = "ap-southeast-1",
    AP_SOUTHEAST_2 = "ap-southeast-2",
    CA_CENTRAL_1 = "ca-central-1",
    CN_NORTH_1 = "cn-north-1",
    CN_NORTHWEST_1 = "cn-northwest-1",
    EU_CENTRAL_1 = "eu-central-1",
    EU_WEST_1 = "eu-west-1",
    EU_WEST_2 = "eu-west-2",
    EU_WEST_3 = "eu-west-3",
    EU_NORTH_1 = "eu-north-1",
    EU_SOUTH_1 = "eu-south-1",
    ME_SOUTH_1 = "me-south-1",
    SA_EAST_1 = "sa-east-1"
  }

/**
 * Represents all AWS Regions
 */
export type RegionString =
        | "us-west-2"
        | "us-west-1"
        | "us-east-2"
        | "us-east-1"
        | "ap-south-1"
        | "ap-northeast-2"
        | "ap-northeast-1"
        | "ap-southeast-1"
        | "ap-southeast-2"
        | "ca-central-1"
        | "cn-north-1"
        | "eu-central-1"
        | "eu-west-1"
        | "eu-west-2"
        | "eu-west-3"
        | "sa-east-1"
        | "us-gov-west-1"
        | "ap-east-1"
        | "ap-southeast-3"
        | "ap-northeast-3"
        | "eu-south-1"
        | "eu-north-1"
        | "me-south-1";
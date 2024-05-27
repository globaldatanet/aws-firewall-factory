import {EC2Client, DescribeRegionsCommand} from "@aws-sdk/client-ec2";
import { AwsCredentialIdentity } from "@aws-sdk/types";

/**
 * Get all active regions
 * @returns list of region names
 */
export async function getallactiveregions(credentials?: AwsCredentialIdentity): Promise<string[]> {
  try {
    const client = new EC2Client({region: process.env.AWS_DEFAULT_REGION, credentials: credentials});
    const command = new DescribeRegionsCommand({});
    const response = await client.send(command);
    // Filter regions where "opt-in-not-required" is true
    const activeRegions = response.Regions!.filter(region => region.OptInStatus === "Enabled" || region.OptInStatus === "opt-in-not-required");
    // Extract names of the regions
    const regionNames = activeRegions.map(region => region.RegionName!);
    return regionNames;
  }
  catch (error) {
    console.error("Error listing regions:", error);
    throw error;
  }
}
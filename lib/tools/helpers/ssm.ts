import { SSMClient, paginateGetParametersByPath } from "@aws-sdk/client-ssm";
import { RuntimeProperties } from "../../types/runtimeprops";
/**
 * Get all AWS regions from public SSM parameter
 * @param deploymentRegion AWS region, e.g. eu-central-1
 */

export async function getAllAwsRegionsFromPublicSsmParameter(deploymentRegion: string, runtimeProps: RuntimeProperties): Promise<boolean> {
  const client = new SSMClient({ region: deploymentRegion });
  const paginator = paginateGetParametersByPath(
    { client, pageSize: 10 }, {
      Path: "/aws/service/global-infrastructure/services/ssm/regions"
    });
  const regions: string[] = [];

  for await (const page of paginator) {
    if (page.Parameters) {
      page.Parameters.map(region => regions.push(region.Value!));
    }
  }
  runtimeProps.AllAwsRegions = regions.flat();
  return true;
}
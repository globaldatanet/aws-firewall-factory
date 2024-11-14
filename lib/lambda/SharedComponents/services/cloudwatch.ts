import { CloudWatchClient, PutMetricDataCommand, PutMetricDataCommandInput } from "@aws-sdk/client-cloudwatch";
import { general } from "../../../types/enums/index";

/**
 * Set the IpSet metric to CloudWatch to see whenever the IPSet was updated during the last schedule
 * @param region The AWS region to send the metric to
 * @param namespace The namespace of the metric
 * @param metricName The name of the metric
 * @param value The value of the metric
 * @param dimension The dimension of the metric
 */
export async function putIpSetMetric(
  region: general.AWSRegion,
  namespace: string,
  metricName: string,
  value: number,
  dimension: { Name: string, Value: string }
): Promise<void> {
  // Initialize CloudWatch client
  const cloudwatchClient = new CloudWatchClient({ region });
  try {
    // Prepare the metric data
    const input: PutMetricDataCommandInput = {
      Namespace: namespace,
      MetricData: [
        {
          MetricName: metricName,
          Dimensions: [dimension],
          Unit: "None",
          Value: value
        }
      ]
    };

    // Send the metric data to CloudWatch
    const command = new PutMetricDataCommand(input);
    await cloudwatchClient.send(command);
    console.log(`ℹ️ Set Metric "${metricName}" with value ${value} sent to CloudWatch.`);
  } catch (error) {
    console.error("🚨 Failed to send metric data to CloudWatch:", error);
    throw new Error("Failed to send metric data to CloudWatch");
  }
}
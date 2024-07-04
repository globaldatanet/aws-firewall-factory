import * as cdk from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import { Construct } from "constructs";

export interface ShieldDashboardProps extends cdk.StackProps {
  shieldConfig: {
    General: {
      Prefix: string;
      Stage: string;
    };
    includeMap?: {
      account?: string[];
    };
  };
}

export class ShieldDashboard extends Construct {
  constructor(scope: Construct, id: string, props: ShieldDashboardProps) {
    super(scope, id);

    const dashboard = new cloudwatch.Dashboard(this, "ShieldDashboard", {
      dashboardName: `ShieldAdvancedDashboard-${props.shieldConfig.General.Prefix.toUpperCase()}-${
        props.shieldConfig.General.Stage
      }`,
      periodOverride: cloudwatch.PeriodOverride.AUTO,
      start: "-PT24H",
    });

    const REGION = process.env.AWS_REGION || "us-east-1";

    const infoWidget = new cloudwatch.TextWidget({
      markdown: `# 🛡️ Shield Advanced Dashboard\n\n🌎 Region: ${REGION}\n\n💡 Type: Shield Advanced`,
      width: 24,
      height: 4,
    });

    dashboard.addWidgets(infoWidget);

    const metricsAccounts = props.shieldConfig.includeMap?.account || [];
    for (const account of metricsAccounts) {
      const attackBitsPerSecond = new cloudwatch.GraphWidget({
        title: `DDoS Attack Bits Per Second in ${account}`,
        width: 24,
        height: 6,
        left: [
          new cloudwatch.MathExpression({
            expression: `SEARCH('{AWS/DDoSProtection,Region,Account} Account="${account}" MetricName="DDoSAttackBitsPerSecond"', 'Sum', 300)`,
            usingMetrics: {
              ddosAttackBitsPerSecond: new cloudwatch.Metric({
                namespace: "AWS/DDoSProtection",
                metricName: "DDoSAttackBitsPerSecond",
                dimensionsMap: {
                  Account: account,
                  Region: REGION,
                },
              }),
            },
            searchAccount: account,
            searchRegion: REGION,
            label: "DDoS Attack Bits Per Second",
            color: "#00FF00",
          }),
        ],
        leftYAxis: {
          label: "Bits per Second",
          showUnits: true,
          min: 0,
        },
      });

      const attackPacketsPerSecond = new cloudwatch.GraphWidget({
        title: `DDoS Attack Packets Per Second in ${account}`,
        width: 24,
        height: 6,
        left: [
          new cloudwatch.MathExpression({
            expression: `SEARCH('{AWS/DDoSProtection,Region,Account} Account="${account}" MetricName="DDoSAttackPacketsPerSecond"', 'Sum', 300)`,
            usingMetrics: {
              ddosAttackPacketsPerSecond: new cloudwatch.Metric({
                namespace: "AWS/DDoSProtection",
                metricName: "DDoSAttackPacketsPerSecond",
                dimensionsMap: {
                  Account: account,
                  Region: REGION,
                },
              }),
            },
            searchAccount: account,
            searchRegion: REGION,
            label: "DDoS Attack Packets Per Second",
            color: "#00FF00",
          }),
        ],
        leftYAxis: {
          label: "Packets per Second",
          showUnits: true,
          min: 0,
        },
      });

      const ddosDetected = new cloudwatch.GraphWidget({
        title: `DDoS Detected in ${account}`,
        width: 24,
        height: 6,
        left: [
          new cloudwatch.MathExpression({
            expression: `SEARCH('{AWS/DDoSProtection,ResourceArn} :aws.AccountId=${account}', 'Sum', 300)`,
            searchAccount: account,
            searchRegion: REGION,
            label: "DDoS Detected",
            color: "#00FF00",
          }),
        ],
        leftYAxis: {
          label: "Count",
          showUnits: true,
          min: 0,
        },
      });

      dashboard.addWidgets(
        attackBitsPerSecond,
        attackPacketsPerSecond,
        ddosDetected
      );
    }
  }
}

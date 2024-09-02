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

/**
 * Shield Dashboard Construct
 */
export class ShieldDashboard extends Construct {
  constructor(scope: Construct, id: string, props: ShieldDashboardProps) {
    super(scope, id);

    const REGION = process.env.AWS_REGION;

    const dashboard = new cloudwatch.Dashboard(this, "ShieldDashboard", {
      dashboardName: `ShieldAdvancedDashboard-${props.shieldConfig.General.Prefix.toUpperCase()}-${
        props.shieldConfig.General.Stage
      }-${REGION}`,
      periodOverride: cloudwatch.PeriodOverride.AUTO,
      start: "-PT24H",
    });

    const infoWidget = new cloudwatch.TextWidget({
      markdown: `# 🛡️ Shield Advanced Dashboard\n\n🌎 Region: ${REGION}\n\n💡 Type: Shield Advanced`,
      width: 24,
      height: 4,
    });

    dashboard.addWidgets(infoWidget);

    const metricsAccounts = props.shieldConfig.includeMap?.account || [];
    for (const account of metricsAccounts) {
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

      dashboard.addWidgets(ddosDetected);
    }
  }
}

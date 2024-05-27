/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { aws_cloudwatch as cloudwatch } from "aws-cdk-lib";
import * as packageJsonObject from "../../package.json";
import * as cdk from "aws-cdk-lib";
import { Config } from "../types/config";
import { Construct } from "constructs";

const REGION = cdk.Aws.REGION;

/**
 * Version of the AWS Firewall Factory - extracted from package.json
 */
const FIREWALL_FACTORY_VERSION = packageJsonObject.version;

export class WafCloudWatchDashboard extends Construct {

  constructor(scope: Construct, id: string, config: Config,managedRuleGroupsInfo:string[]) {
    super(scope, id);
    console.log("\n🎨 Creating central CloudWatch Dashboard \n   📊 DashboardName: ","\u001b[32m", `${config.General.Prefix.toUpperCase()}-${config.WebAcl.Name}-${config.General.Stage}${config.General.DeployHash ? "-"+config.General.DeployHash : ""}`,"\u001b[0m");
    console.log("   ℹ️  Warnings for Math expressions can be ignored.");
    const cwdashboard = new cloudwatch.Dashboard(this, "dashboard", {
      dashboardName: `${config.General.Prefix.toUpperCase()}-${config.WebAcl.Name}-${config.General.Stage}${config.General.DeployHash ? "-"+config.General.DeployHash : ""}`,
      periodOverride: cloudwatch.PeriodOverride.AUTO,
      start: "-PT24H"
    });
    const webaclName = `${config.General.Prefix.toUpperCase()}-${config.WebAcl.Name}-${config.General.Stage}${config.General.DeployHash ? "-"+config.General.DeployHash : ""}`;
    const webaclNamewithPrefix =  `FMManagedWebACLV2-${config.General.Prefix.toUpperCase()}-${config.WebAcl.Name}-${config.General.Stage}${config.General.DeployHash ? "-"+config.General.DeployHash : ""}`;

    if(config.WebAcl.IncludeMap.account){
      const infowidget = new cloudwatch.TextWidget({
        markdown: "# 🔥 "+webaclName+"\n + 🏗  Deployed to: \n\n 📦 Accounts: "+config.WebAcl.IncludeMap.account.toString() + "\n\n 🌎 REGION: " + REGION + "\n\n 💡 Type: " + config.WebAcl.Type,
        width: 14,
        height: 4
      });

      const securedDomain = config.General.SecuredDomain.toString();

      const app = new cloudwatch.TextWidget({
        markdown: "⚙️ Used [ManagedRuleGroups](https://docs.aws.amazon.com/waf/latest/developerguide/waf-managed-rule-groups.html):\n" + managedRuleGroupsInfo.filter(value => Object.keys(value).length !== 0).toString().replace(/,/g,"\n - ") + "\n\n--- \n\n\nℹ️ Link to your secured [Application]("+securedDomain+")",
        width: 7,
        height: 4
      });
      let fwmessage = "";
      if(process.env.LASTEST_FIREWALLFACTORY_VERSION !== FIREWALL_FACTORY_VERSION){
        fwmessage = "🚨 old or beta version";
      }
      else{
        fwmessage = "💚 latest version";
      }
      const fwfactory = new cloudwatch.TextWidget({
        markdown: "**AWS FIREWALL FACTORY** \n\n ![Image](https://github.com/globaldatanet/aws-firewall-factory/raw/master/static/icon/firewallfactory.png) \n\n 🏷 Version: [" + FIREWALL_FACTORY_VERSION + "](https://github.com/globaldatanet/aws-firewall-factory/releases/tag/" + FIREWALL_FACTORY_VERSION + ")  \n" + fwmessage,
        width: 3,
        height: 4
      });
      const firstrow = new cloudwatch.Row(infowidget,app,fwfactory);
      cwdashboard.addWidgets(firstrow);
      for(const account of config.WebAcl.IncludeMap.account){
        // eslint-disable-next-line no-useless-escape
        const countexpression = "SEARCH('{AWS\/WAFV2,\Region,\WebACL,\Rule} \WebACL="+webaclNamewithPrefix+" \MetricName=\"\CountedRequests\"', '\Sum', 300)";

        const countedRequests = new cloudwatch.GraphWidget({
          title: "🔢 Counted Requests in " + account,
          width: 8,
          height: 8
        });
        countedRequests.addLeftMetric(
          new cloudwatch.MathExpression({
            expression: countexpression,
            usingMetrics: {},
            label: "CountedRequests",
            searchAccount: account,
            searchRegion: REGION,
            color: "#9dbcd4"
          }));
        // eslint-disable-next-line no-useless-escape
        const blockedexpression = "SEARCH('{AWS\/WAFV2,\Region,\WebACL,\Rule} \WebACL="+webaclNamewithPrefix+" \MetricName=\"\BlockedRequests\"', '\Sum', 300)";
        const blockedRequests = new cloudwatch.GraphWidget({
          title: "❌ Blocked Requests in " + account,
          width: 8,
          height: 8
        });
        blockedRequests.addLeftMetric(
          new cloudwatch.MathExpression({
            expression: blockedexpression,
            usingMetrics: {},
            label: "BlockedRequests",
            searchAccount: account,
            searchRegion: REGION,
            color: "#ff0000"
          }));
        // eslint-disable-next-line no-useless-escape  
        const allowedexpression = "SEARCH('{AWS\/WAFV2,\Region,\WebACL,\Rule} \WebACL="+webaclNamewithPrefix+" \MetricName=\"\AllowedRequests\"', '\Sum', 300)";
        const allowedRequests = new cloudwatch.GraphWidget({
          title: "✅ Allowed Requests in " + account,
          width: 8,
          height: 8
        });
        allowedRequests.addLeftMetric(
          new cloudwatch.MathExpression({
            expression: allowedexpression,
            usingMetrics: {},
            label: "AllowedRequests",
            searchAccount: account,
            searchRegion: REGION,
            color: "#00FF00"
          }));
        // eslint-disable-next-line no-useless-escape
        const sinlevaluecountedrequestsexpression = "SEARCH('{AWS\/WAFV2,\Rule,\WebACL,\Region} \WebACL="+webaclNamewithPrefix+" \MetricName=\"CountedRequests\" \Rule=\"ALL\"', '\Sum', 300)";
        // eslint-disable-next-line no-useless-escape
        const expression1 = "SEARCH('{AWS\/WAFV2,\Rule,\WebACL,\Region} \WebACL="+webaclNamewithPrefix+" \MetricName=\"AllowedRequests\" \Rule=\"ALL\"', '\Sum', 300)";
        // eslint-disable-next-line no-useless-escape
        const expression2 = "SEARCH('{AWS\/WAFV2,\Rule,\WebACL,\Region} \WebACL="+webaclNamewithPrefix+" \MetricName=\"BlockedRequests\" \Rule=\"ALL\"', '\Sum', 300)";
        // eslint-disable-next-line no-useless-escape
        const expression3 = "SEARCH('{AWS\/WAFV2,\LabelName,\LabelNamespace,\WebACL,\Region} \WebACL="+webaclNamewithPrefix+" \LabelNamespace=\"awswaf:managed:aws:bot-control:bot:category\" \MetricName=\"AllowedRequests\" \Rule=\"ALL\"', '\Sum', 300)";
        // eslint-disable-next-line no-useless-escape
        const expression4 = "SEARCH('{AWS\/WAFV2,\LabelName,\LabelNamespace,\WebACL,\Region} \WebACL="+webaclNamewithPrefix+" \LabelNamespace=\"awswaf:managed:aws:bot-control:bot:category\" \MetricName=\"BlockedRequests\" \Rule=\"ALL\"', '\Sum', 300)";
        const expression5 = "SUM([e3,e4])";
        const expression6 = "SUM([e1,e2,-e3,-e4])";

        const botrequestsvsnonbotrequests = new cloudwatch.GraphWidget({
          title: "🤖 Bot requests vs 😁 Non-bot requests in " + account,
          width: 24,
          height: 8
        });

        botrequestsvsnonbotrequests.addLeftMetric(
          new cloudwatch.MathExpression({
            expression: expression5,
            usingMetrics: {
              "e3": new cloudwatch.MathExpression({expression: expression3,searchAccount: account, searchRegion: REGION}),
              "e4": new cloudwatch.MathExpression({expression: expression4,searchAccount: account, searchRegion: REGION})
            },
            label: "Bot requests",
            searchAccount: account,
            searchRegion: REGION,
            color: "#ff0000"
          }));
        botrequestsvsnonbotrequests.addLeftMetric(new cloudwatch.MathExpression({
          expression: expression6,
          usingMetrics: {
            "e1": new cloudwatch.MathExpression({expression: expression1,searchAccount: account, searchRegion: REGION}),
            "e2": new cloudwatch.MathExpression({expression: expression2,searchAccount: account, searchRegion: REGION}),
            "e3": new cloudwatch.MathExpression({expression: expression3,searchAccount: account, searchRegion: REGION}),
            "e4": new cloudwatch.MathExpression({expression: expression4,searchAccount: account, searchRegion: REGION})
          },
          label: "Non-bot requests",
          searchAccount: account,
          searchRegion: REGION,
          color: "#00FF00"
        }));


        const sinlevaluecountedrequests = new cloudwatch.SingleValueWidget({
          title: "🔢 Counted Request in " + account,
          metrics: [
            new cloudwatch.MathExpression({
              expression: "SUM(" +sinlevaluecountedrequestsexpression +")",
              usingMetrics: {},
              label: "CountedRequests",
              searchAccount: account,
              searchRegion: REGION,
              color: "#9dbcd4"
            })
          ],
          width: 8,
          height: 3
        });
        const singlevalueallowedrequest = new cloudwatch.SingleValueWidget({
          title: "✅ Allowed Request in " + account,
          metrics: [
            new cloudwatch.MathExpression({
              expression: "SUM(" +expression1 +")",
              usingMetrics: {},
              label: "AllowedRequests",
              searchAccount: account,
              searchRegion: REGION,
              color: "#00FF00"
            })
          ],
          width: 8,
          height: 3
        });
        const singlevaluebockedrequest = new cloudwatch.SingleValueWidget({
          title: "❌ Blocked Request in " + account,
          metrics: [
            new cloudwatch.MathExpression({
              expression: "SUM(" +expression2 +")",
              usingMetrics: {},
              label: "BlockedRequests",
              searchAccount: account,
              searchRegion: REGION,
              color: "#ff0000"
            })
          ],
          width: 8,
          height: 3
        });
        const row = new cloudwatch.Row(sinlevaluecountedrequests,singlevalueallowedrequest,singlevaluebockedrequest);
        const row2 = new cloudwatch.Row(botrequestsvsnonbotrequests);
        const row1 = new cloudwatch.Row(countedRequests,allowedRequests, blockedRequests);
        cwdashboard.addWidgets(row,row1,row2);
      }
    }
  }
}
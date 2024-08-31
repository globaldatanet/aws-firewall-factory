import { wafConfig } from "../../lib/types/config";
export const config: wafConfig = {
  General: {
    Prefix: "testcases",
    Stage: "test",
    S3LoggingBucketName: "aws-waf-logs-aws-firewall-factory-test",
    LoggingConfiguration: "S3",
    SecuredDomain: ["test.aws-firewall-factory.com"]
  },
  WebAcl: {
    Name: "rate-based-test",
    Scope: "REGIONAL",
    Type: "AWS::ApiGateway::Stage",
    IncludeMap: {
      account: [
        "859220371210" // gdn-test
      ],
    },
    IPSets: [
      {
        name: "RateIPsString",
        addresses: [
          "192.168.178.1/32",
        ],
        ipAddressVersion: "IPV4",
      },
    ],
    PreProcess: {
      CustomRules: [
        {
          name: "ip-allow-ratebased-ten-test",
          statement: {
            rateBasedStatement: {
              aggregateKeyType: "IP",
              limit: 10,
              evaluationWindowSec: 60,
            },
          },
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "ip-allow-ratebased-ten-test",
          },
          priority: 10,
        },
        {
          name: "ip-allow",
          statement: {
            rateBasedStatement: {
              aggregateKeyType: "IP",
              limit: 100,
              scopeDownStatement: {
                ipSetReferenceStatement: {
                  arn: "RateIPsString"
                }
              },
            },
          },
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "rate-test",
          },
          priority: 100,
        },
        {
          name: "ip-allow-two",
          statement: {
            rateBasedStatement: {
              aggregateKeyType: "IP",
              limit: 100,
              evaluationWindowSec: 60,
            },
          },
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "rate-test",
          },
          priority: 200,
        },
      ],
    },
    PostProcess : {
      ManagedRuleGroups: undefined,
      CustomRules: undefined,
    },
  }
};
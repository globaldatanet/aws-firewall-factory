import { wafConfig } from "../../lib/types/config";
export const config: wafConfig = {
  General: {
    Prefix: "aws-firewall-factory",
    Stage: "dev",
    SecuredDomain: [
      "",
    ],
    LoggingConfiguration: "Firehose",
    FireHoseKeyArn: "",
    S3LoggingBucketName: "",
    CreateDashboard: true,
  },
  WebAcl: {
    Name: "ip-sets-managed-test",
    Scope: "REGIONAL",
    Type: "AWS::ApiGateway::Stage",
    IncludeMap: {
      account: [
        "",
      ],
    },
    IPSets: [
      {
        name: "IPsString",
        addresses: [
          "192.168.178.1/32",
        ],
        ipAddressVersion: "IPV4",
      },
    ],
    PreProcess: {
      CustomRules: [
        {
          name: "ip-allow",
          statement: {
            ipSetReferenceStatement: {
              arn: "IPsString",
            },
          },
          action: {
            allow: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "ip-allow",
          },
          priority: 100,
        },
      ],
    },
    PostProcess: {
      ManagedRuleGroups: [
        {
          vendorName: "AWS",
          name: "AWSManagedRulesAmazonIpReputationList",
          capacity: 25,
          version: "",
        },
        {
          vendorName: "AWS",
          name: "AWSManagedRulesCommonRuleSet",
          capacity: 700,
          version: "Version_1.6",
        }
      ]
    }
  }
};
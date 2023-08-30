import { Config } from "../../lib/types/config";
export const config: Config = {
  General: {
    Prefix: "test",
    Stage: "test",
    SecuredDomain: [
      "",
    ],
    LoggingConfiguration: "Firehose",
    FireHoseKeyArn: "",
    S3LoggingBucketName: "",
    CreateDashboard: true,
  },
  WebAcl: {
    Name: "firewall-factory-demo",
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
          vendor: "AWS",
          name: "AWSManagedRulesAmazonIpReputationList",
          capacity: 25,
          version: "",
        },
        {
          vendor: "AWS",
          name: "AWSManagedRulesCommonRuleSet",
          capacity: 700,
          version: "Version_1.6",
        }
      ]
    }
  }
};
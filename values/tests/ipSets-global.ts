import { Config } from "../../lib/types/config";
import * as fwmEnums from "../../lib/types/enums";

export const config: Config = {
  General: {
    Prefix: "testcases",
    Stage: "test",
    S3LoggingBucketName: "aws-waf-logs-aws-firewall-factory-test",
    LoggingConfiguration: "S3",
    SecuredDomain: ["test.aws-firewall-factory.com"]
  },
  WebAcl: {
    IncludeMap: {
      account: [
        "859220371210" // gdn-test
      ],
    },
    Name: "ipssets",
    IPSets: [
      {
        name: "test-ipSet",
        addresses: [
          "192.168.1.1/32"
        ],
        ipAddressVersion: "IPV4"
      }
    ],
    PreProcess: {
      ManagedRuleGroups: [],
      CustomRules: [
        {
          name: "test-statement-ipSet",
          priority: 10,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-statement-ipSet",
            sampledRequestsEnabled: true
          },
          statement: {
            ipSetReferenceStatement: {
              arn: "test-ipSet"
            }
          },
          action: {
            block: {}
          }
        },
        {
          name: "test-andStatemment-statement-ipSet",
          priority: 20,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-andStatemment-statement-ipSet",
            sampledRequestsEnabled: true
          },
          statement: {
            andStatement: {
              statements: [
                {
                  notStatement: {
                    statement: {
                      ipSetReferenceStatement: {
                        arn: "test-ipSet"
                      }
                    }
                  }
                },
                {
                  byteMatchStatement: {
                    searchString: "test",
                    positionalConstraint: "CONTAINS",
                    fieldToMatch: {
                      uriPath: {}
                    },
                    textTransformations: [{
                      priority: 0,
                      type: "NONE"
                    }]
                  }
                }
              ]
            }
          },
          action: {
            block: {}
          }
        },
        {
          name: "test-orStatemment-statement-ipSet",
          priority: 30,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-orStatemment-notStatement-ipSet",
            sampledRequestsEnabled: true
          },
          statement: {
            orStatement: {
              statements: [
                {
                  ipSetReferenceStatement: {
                    arn: "test-ipSet"
                  }
                },
                {
                  byteMatchStatement: {
                    searchString: "test",
                    positionalConstraint: "CONTAINS",
                    fieldToMatch: {
                      uriPath: {}
                    },
                    textTransformations: [{
                      priority: 0,
                      type: "NONE"
                    }]
                  }
                }
              ]
            }
          },
          action: {
            block: {}
          }
        },
        {
          name: "test-notStatement-ipSet",
          priority: 40,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-notStatement-ipSet",
            sampledRequestsEnabled: true
          },
          statement: {
            notStatement: {
              statement: {
                ipSetReferenceStatement: {
                  arn: "test-ipSet"
                }
              }
            }
          },
          action: {
            block: {}
          }
        },
        {
          name: "test-andStatemment-notStatement-ipSet",
          priority: 50,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-andStatemment-notStatement-ipSet",
            sampledRequestsEnabled: true
          },
          statement: {
            andStatement: {
              statements: [
                {
                  notStatement: {
                    statement: {
                      ipSetReferenceStatement: {
                        arn: "test-ipSet"
                      }
                    }
                  }
                },
                {
                  byteMatchStatement: {
                    searchString: "test",
                    positionalConstraint: "CONTAINS",
                    fieldToMatch: {
                      uriPath: {}
                    },
                    textTransformations: [{
                      priority: 0,
                      type: "NONE"
                    }]
                  }
                }
              ]
            }
          },
          action: {
            block: {}
          }
        },
        {
          name: "test-orStatemment-notStatement-ipSet",
          priority: 60,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-orStatemment-notStatement-ipSet",
            sampledRequestsEnabled: true
          },
          statement: {
            orStatement: {
              statements: [
                {
                  notStatement: {
                    statement: {
                      ipSetReferenceStatement: {
                        arn: "test-ipSet"
                      }
                    }
                  }
                },
                {
                  byteMatchStatement: {
                    searchString: "test",
                    positionalConstraint: "CONTAINS",
                    fieldToMatch: {
                      uriPath: {}
                    },
                    textTransformations: [{
                      priority: 0,
                      type: "NONE"
                    }]
                  }
                }
              ]
            }
          },
          action: {
            block: {}
          }
        }
      ]
    },
    PostProcess: {
      ManagedRuleGroups: [],

    },
    Scope: fwmEnums.WebAclScope.CLOUDFRONT,
    Type: fwmEnums.WebAclTypeEnum.CLOUDFRONT_DISTRIBUTION
  },
};
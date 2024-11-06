import { waf } from "../../lib/types/config";
import {WebAclScope, WebAclTypeEnum} from "../../lib/types/enums/waf";

export const config: waf.WafConfig = {
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
        },
        {
          name: "test-statement-ipSet-Arn",
          priority: 70,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-statement-ipSet-Arn",
            sampledRequestsEnabled: true
          },
          statement: {
            ipSetReferenceStatement: {
              arn: "arn:aws:wafv2:eu-central-1:859220371210:regional/ipset/TEST/ee32e47f-e3b0-44ca-a0bd-5ee2ecde9b23"
            }
          },
          action: {
            block: {}
          }
        },
        {
          name: "test-andStatemment-statement-ipSet-Arn",
          priority: 80,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-andStatemment-statement-ipSet-Arn",
            sampledRequestsEnabled: true
          },
          statement: {
            andStatement: {
              statements: [
                {
                  notStatement: {
                    statement: {
                      ipSetReferenceStatement: {
                        arn: "arn:aws:wafv2:eu-central-1:859220371210:regional/ipset/TEST/ee32e47f-e3b0-44ca-a0bd-5ee2ecde9b23"
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
          name: "test-orStatemment-statement-ipSet-Arn",
          priority: 90,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-orStatemment-notStatement-ipSet-Arn",
            sampledRequestsEnabled: true
          },
          statement: {
            orStatement: {
              statements: [
                {
                  ipSetReferenceStatement: {
                    arn: "arn:aws:wafv2:eu-central-1:859220371210:regional/ipset/TEST/ee32e47f-e3b0-44ca-a0bd-5ee2ecde9b23"
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
          name: "test-notStatement-ipSet-Arn",
          priority: 100,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-notStatement-ipSet-Arn",
            sampledRequestsEnabled: true
          },
          statement: {
            notStatement: {
              statement: {
                ipSetReferenceStatement: {
                  arn: "arn:aws:wafv2:eu-central-1:859220371210:regional/ipset/TEST/ee32e47f-e3b0-44ca-a0bd-5ee2ecde9b23"
                }
              }
            }
          },
          action: {
            block: {}
          }
        },
        {
          name: "test-andStatemment-notStatement-ipSet-Arn",
          priority: 110,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-andStatemment-notStatement-ipSet-Arn",
            sampledRequestsEnabled: true
          },
          statement: {
            andStatement: {
              statements: [
                {
                  notStatement: {
                    statement: {
                      ipSetReferenceStatement: {
                        arn: "arn:aws:wafv2:eu-central-1:859220371210:regional/ipset/TEST/ee32e47f-e3b0-44ca-a0bd-5ee2ecde9b23"
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
          name: "test-orStatemment-notStatement-ipSet-Arn",
          priority: 120,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-orStatemment-notStatement-ipSet-Arn",
            sampledRequestsEnabled: true
          },
          statement: {
            orStatement: {
              statements: [
                {
                  notStatement: {
                    statement: {
                      ipSetReferenceStatement: {
                        arn: "arn:aws:wafv2:eu-central-1:859220371210:regional/ipset/TEST/ee32e47f-e3b0-44ca-a0bd-5ee2ecde9b23"
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
    Scope: WebAclScope.REGIONAL,
    Type: WebAclTypeEnum.ELASTICLOADBALANCINGV2_LOADBALANCER
  },
};
import { wafConfig } from "../../lib/types/config";
import * as fwmEnums from "../../lib/types/enums";

export const config: wafConfig = {
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
    Name: "regexpatternsets",
    RegexPatternSets: [{
      name: "test-regexPatternSet",
      regularExpressionList: ["^.*\/test", "^.*\/regex"]
    }],
    PreProcess: {
      ManagedRuleGroups: [],
      CustomRules: [
        {
          name: "test-statement-regexPatternSet",
          priority: 10,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-statement-regexPatternSet",
            sampledRequestsEnabled: true
          },
          statement: {
            regexPatternSetReferenceStatement: {
              arn: "test-regexPatternSet",
              fieldToMatch: {
                uriPath: {}
              },
              textTransformations: [{ priority: 0, type: "NONE" }]
            }
          },
          action: {
            block: {}
          }
        },
        {
          name: "test-andStatemment-statement-regexPatternSet",
          priority: 20,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-andStatemment-statement-regexPatternSet",
            sampledRequestsEnabled: true
          },
          statement: {
            andStatement: {
              statements: [
                {
                  notStatement: {
                    statement: {
                      regexPatternSetReferenceStatement: {
                        arn: "test-regexPatternSet",
                        fieldToMatch: {
                          uriPath: {}
                        },
                        textTransformations: [{ priority: 0, type: "NONE" }]
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
          name: "test-orStatemment-statement-regexPatternSet",
          priority: 30,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-orStatemment-notstatement-regexPatternSet",
            sampledRequestsEnabled: true
          },
          statement: {
            orStatement: {
              statements: [
                {
                  regexPatternSetReferenceStatement: {
                    arn: "test-regexPatternSet",
                    fieldToMatch: {
                      uriPath: {}
                    },
                    textTransformations: [{ priority: 0, type: "NONE" }]
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
          name: "test-notstatement-regexPatternSet",
          priority: 40,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-notstatement-regexPatternSet",
            sampledRequestsEnabled: true
          },
          statement: {
            notStatement: {
              statement: {
                regexPatternSetReferenceStatement: {
                  arn: "test-regexPatternSet",
                  fieldToMatch: {
                    uriPath: {}
                  },
                  textTransformations: [{ priority: 0, type: "NONE" }]
                }
              }
            }
          },
          action: {
            block: {}
          }
        },
        {
          name: "test-andStatemment-notstatement-regexPatternSet",
          priority: 50,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-andStatemment-notstatement-regexPatternSet",
            sampledRequestsEnabled: true
          },
          statement: {
            andStatement: {
              statements: [
                {
                  notStatement: {
                    statement: {
                      regexPatternSetReferenceStatement: {
                        arn: "test-regexPatternSet",
                        fieldToMatch: {
                          uriPath: {}
                        },
                        textTransformations: [{ priority: 0, type: "NONE" }]
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
          name: "test-orStatemment-notstatement-regexPatternSet",
          priority: 60,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-orStatemment-notstatement-regexPatternSet",
            sampledRequestsEnabled: true
          },
          statement: {
            orStatement: {
              statements: [
                {
                  notStatement: {
                    statement: {
                      regexPatternSetReferenceStatement: {
                        arn: "test-regexPatternSet",
                        fieldToMatch: {
                          uriPath: {}
                        },
                        textTransformations: [{ priority: 0, type: "NONE" }]
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
          name: "test-statement-regexPatternSet-Arn",
          priority: 70,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-statement-regexPatternSet-Arn",
            sampledRequestsEnabled: true
          },
          statement: {
            regexPatternSetReferenceStatement: {
              arn: "arn:aws:wafv2:eu-central-1:859220371210:regional/regexpatternset/TEST/2335872f-2c5b-4326-8d45-955a388212b5",
              fieldToMatch: {
                uriPath: {}
              },
              textTransformations: [{ priority: 0, type: "NONE" }]
            }
          },
          action: {
            block: {}
          }
        },
        {
          name: "test-andStatemment-statement-regexPatternSet-Arn",
          priority: 80,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-andStatemment-statement-regexPatternSet-Arn",
            sampledRequestsEnabled: true
          },
          statement: {
            andStatement: {
              statements: [
                {
                  notStatement: {
                    statement: {
                      regexPatternSetReferenceStatement: {
                        arn: "arn:aws:wafv2:eu-central-1:859220371210:regional/regexpatternset/TEST/2335872f-2c5b-4326-8d45-955a388212b5",
                        fieldToMatch: {
                          uriPath: {}
                        },
                        textTransformations: [{ priority: 0, type: "NONE" }]
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
          name: "test-orStatemment-statement-regexPatternSet-Arn",
          priority: 90,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-orStatemment-notstatement-regexPatternSet-Arn",
            sampledRequestsEnabled: true
          },
          statement: {
            orStatement: {
              statements: [
                {
                  regexPatternSetReferenceStatement: {
                    arn: "arn:aws:wafv2:eu-central-1:859220371210:regional/regexpatternset/TEST/2335872f-2c5b-4326-8d45-955a388212b5",
                    fieldToMatch: {
                      uriPath: {}
                    },
                    textTransformations: [{ priority: 0, type: "NONE" }]
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
          name: "test-notstatement-regexPatternSet-Arn",
          priority: 100,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-notstatement-regexPatternSet-Arn",
            sampledRequestsEnabled: true
          },
          statement: {
            notStatement: {
              statement: {
                regexPatternSetReferenceStatement: {
                  arn: "arn:aws:wafv2:eu-central-1:859220371210:regional/regexpatternset/TEST/2335872f-2c5b-4326-8d45-955a388212b5",
                  fieldToMatch: {
                    uriPath: {}
                  },
                  textTransformations: [{ priority: 0, type: "NONE" }]
                }
              }
            }
          },
          action: {
            block: {}
          }
        },
        {
          name: "test-andStatemment-notstatement-regexPatternSet-Arn",
          priority: 110,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-andStatemment-notstatement-regexPatternSet-Arn",
            sampledRequestsEnabled: true
          },
          statement: {
            andStatement: {
              statements: [
                {
                  notStatement: {
                    statement: {
                      regexPatternSetReferenceStatement: {
                        arn: "arn:aws:wafv2:eu-central-1:859220371210:regional/regexpatternset/TEST/2335872f-2c5b-4326-8d45-955a388212b5",
                        fieldToMatch: {
                          uriPath: {}
                        },
                        textTransformations: [{ priority: 0, type: "NONE" }]
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
          name: "test-orStatemment-notstatement-regexPatternSet-Arn",
          priority: 120,
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "test-orStatemment-notstatement-regexPatternSet-Arn",
            sampledRequestsEnabled: true
          },
          statement: {
            orStatement: {
              statements: [
                {
                  notStatement: {
                    statement: {
                      regexPatternSetReferenceStatement: {
                        arn: "arn:aws:wafv2:eu-central-1:859220371210:regional/regexpatternset/TEST/2335872f-2c5b-4326-8d45-955a388212b5",
                        fieldToMatch: {
                          uriPath: {}
                        },
                        textTransformations: [{ priority: 0, type: "NONE" }]
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
    Scope: fwmEnums.WebAclScope.REGIONAL,
    Type: fwmEnums.WebAclTypeEnum.ELASTICLOADBALANCINGV2_LOADBALANCER
  },
};
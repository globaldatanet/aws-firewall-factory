import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_wafv2 as wafv2 } from "aws-cdk-lib";
import { aws_fms as fms } from "aws-cdk-lib";
import { aws_kinesisfirehose as firehouse } from "aws-cdk-lib";
import { aws_iam as iam } from "aws-cdk-lib";
import { aws_logs as logs } from "aws-cdk-lib";
import { Config } from "./types/config";
import { ManagedRuleGroup, ManagedServiceData, ServiceDataManagedRuleGroup, ServiceDataRuleGroup, Rule } from "./types/fms";
import { RuntimeProperties, ProcessProperties } from "./types/runtimeprops";
import { promises as fsp } from "fs";
import { toAwsCamel } from "./tools/helpers";

export interface ConfigStackProps extends cdk.StackProps {
  readonly config: Config;
  runtimeProperties: RuntimeProperties;
}

export class PlattformWafv2CdkAutomationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ConfigStackProps) {
    super(scope, id, props);
    const account_id = cdk.Aws.ACCOUNT_ID;
    const region = cdk.Aws.REGION;

    const CfnRole = new iam.CfnRole(this, "KinesisS3DeliveryRole", {
      assumeRolePolicyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "",
            Effect: "Allow",
            Principal: { Service: "firehose.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      },
    });

    const CfnLogGroup = new logs.CfnLogGroup(this, "KinesisErrorLogging", {
      retentionInDays: 90,
    });

    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "s3:AbortMultipartUpload",
            "s3:GetBucketLocation",
            "s3:GetObject",
            "s3:ListBucket",
            "s3:ListBucketMultipartUploads",
            "s3:PutObject",
            "s3:PutObjectAcl",
          ],
          Resource: [
            "arn:aws:s3:::" + props.config.General.S3LoggingBucketName,
            "arn:aws:s3:::" + props.config.General.S3LoggingBucketName + "/*",
          ],
        },
        {
          Effect: "Allow",
          Action: ["logs:PutLogEvents"],
          Resource: [CfnLogGroup.attrArn],
        },
        {
          Effect: "Allow",
          Action: ["kms:Decrypt", "kms:GenerateDataKey"],
          Resource: [props.config.General.FireHoseKeyArn],
        },
      ],
    };

    new iam.CfnPolicy(this, "KinesisS3DeliveryPolicy", {
      policyDocument: policy,
      policyName: "firehose_delivery_policy",
      roles: [CfnRole.ref],
    });

    new firehouse.CfnDeliveryStream(this, "S3DeliveryStream", {
      deliveryStreamName:
        "aws-waf-logs-" +
        props.config.General.Prefix +
        "-kinesis-wafv2log-" +
        props.config.WebAcl.Name +
        props.config.General.Stage +
        props.config.General.DeployHash,
      extendedS3DestinationConfiguration: {
        bucketArn: "arn:aws:s3:::" + props.config.General.S3LoggingBucketName,
        encryptionConfiguration: {
          kmsEncryptionConfig: {
            awskmsKeyArn: props.config.General.FireHoseKeyArn,
          },
        },
        roleArn: CfnRole.attrArn,
        bufferingHints: { sizeInMBs: 50, intervalInSeconds: 60 },
        compressionFormat: "UNCOMPRESSED",
        prefix: "AWSLogs/" + account_id + "/FirewallManager/" + region + "/",
        errorOutputPrefix:
          "AWSLogs/" + account_id + "/FirewallManager/" + region + "/Errors",
      },
    });

    const preProcessRuleGroups = [];
    const postProcessRuleGroups = [];
    console.log("Creating DEFAULT Policy.");
    if (props.config.WebAcl.PreProcess.ManagedRuleGroups) {
      preProcessRuleGroups.push(...buildServiceDataManagedRGs(props.config.WebAcl.PreProcess.ManagedRuleGroups));
    } else {
      console.log("\nℹ️  No ManagedRuleGroups defined in PreProcess.");
    }
    if (props.config.WebAcl.PostProcess.ManagedRuleGroups) {
      postProcessRuleGroups.push(...buildServiceDataManagedRGs(props.config.WebAcl.PostProcess.ManagedRuleGroups));
    } else {
      console.log("ℹ️  No ManagedRuleGroups defined in PostProcess.");
    }
    if (props.config.WebAcl.PreProcess.CustomRules) {
      const customRgs = buildServiceDataCustomRGs(this, "Pre", props.runtimeProperties.PreProcess.Capacity, props.config.General.DeployHash, props.config.WebAcl.Name, props.config.WebAcl.Scope, props.config.General.Stage, props.runtimeProperties.PreProcess, props.config.General.Prefix, props.config.WebAcl.PreProcess.CustomRules);
      preProcessRuleGroups.push(...customRgs);
    } else {
      console.log("\nℹ️  No Custom Rules defined in PreProcess.");
    }
    if (props.config.WebAcl.PostProcess.CustomRules) {
      const customRgs = buildServiceDataCustomRGs(this, "Post", props.runtimeProperties.PostProcess.Capacity, props.config.General.DeployHash, props.config.WebAcl.Name, props.config.WebAcl.Scope, props.config.General.Stage, props.runtimeProperties.PostProcess, props.config.General.Prefix, props.config.WebAcl.PostProcess.CustomRules);
      postProcessRuleGroups.push(...customRgs);
    } else {
      console.log("\nℹ️  No Custom Rules defined in PostProcess.");
    }

    const managedServiceData : ManagedServiceData = {
      type: "WAFV2",
      defaultAction: { type: "ALLOW" },
      preProcessRuleGroups: preProcessRuleGroups,
      postProcessRuleGroups: postProcessRuleGroups,
      overrideCustomerWebACLAssociation: true,
      loggingConfiguration: {
        logDestinationConfigs: ["${S3DeliveryStream.Arn}"],
      },
    };

    new fms.CfnPolicy(this, "CfnPolicy", {
      excludeResourceTags: false,
      remediationEnabled: false,
      resourceType: props.config.WebAcl.Type,
      policyName:
        props.config.General.Prefix.toUpperCase() +
        "-" +
        props.config.WebAcl.Name +
        "-" +
        props.config.General.Stage +
        "-" +
        props.config.General.DeployHash,
      includeMap: { account: props.config.General.DeployTo },
      securityServicePolicyData: {
        Type: "WAFV2",
        ManagedServiceData: cdk.Fn.sub(
          JSON.stringify(managedServiceData)
        ),
      },
    });

    const options = { flag: "w", force: true };
    (async () => {
      try {
        if (process.env.PROCESS_PARAMETERS) {
          await fsp.writeFile(
            process.env.PROCESS_PARAMETERS,
            JSON.stringify(props.config, null, 2),
            options
          );
        }
      } catch (error) {
        console.log("Error " + error);
      }
    })();
  }
}

function buildServiceDataManagedRGs(managedRuleGroups: ManagedRuleGroup[]) : ServiceDataManagedRuleGroup[] {
  const cfnManagedRuleGroup : ServiceDataManagedRuleGroup[] = [];
  for (const managedRuleGroup of managedRuleGroups) {
    cfnManagedRuleGroup.push({
      managedRuleGroupIdentifier: {
        vendorName: managedRuleGroup.Vendor,
        managedRuleGroupName: managedRuleGroup.Name,
        version: managedRuleGroup.Version !== "" ? managedRuleGroup.Version : null,
      },
      overrideAction: managedRuleGroup.ExcludeRules && managedRuleGroup.OverrideAction ? managedRuleGroup.OverrideAction : { type: "NONE" },
      ruleGroupArn: null,
      excludeRules: managedRuleGroup.ExcludeRules ?  toAwsCamel(managedRuleGroup.ExcludeRules) : [],
      ruleGroupType: "ManagedRuleGroup"
    });
  }
  return cfnManagedRuleGroup;
}

function buildServiceDataCustomRGs(scope: Construct, type: "Pre" | "Post", capacity: number, deployHash: string, webaclName: string, webAclScope: string, stage: string, processRuntimeProps: ProcessProperties, prefix: string, ruleGroupSet: Rule[]) : ServiceDataRuleGroup[] {
  const serviceDataRuleGroup : ServiceDataRuleGroup[] = [];
  let icon;
  if (type === "Pre") {
    icon = "🥇 ";
  } else {
    icon = "🥈";
  }
  console.log(
    "\u001b[1m",
    "\n"+icon+"  Custom Rules " + type + "Process: ",
    "\x1b[0m\n"
  );
  if (capacity < 1000) {
    const rules = [];
    let count = 1;
    for (const statement of ruleGroupSet) {
      let rulename = "";
      if (statement.Name !== undefined) {
        rulename =
          statement.Name + "-" + type.toLocaleLowerCase() + "-" + deployHash;
      } else {
        rulename =
          webaclName +
          "-" +
          type.toLocaleLowerCase() +
          "-" +
          stage +
          "-" +
          count.toString() +
          "-" +
          deployHash;
      }
      let CfnRuleProperty;
      if ("Captcha" in statement.Action) {
        CfnRuleProperty = {
          name: rulename,
          priority: count,
          action: toAwsCamel(statement.Action),
          statement: toAwsCamel(statement.Statement),
          visibilityConfig: {
            sampledRequestsEnabled:
              statement.VisibilityConfig.SampledRequestsEnabled,
            cloudWatchMetricsEnabled:
              statement.VisibilityConfig.CloudWatchMetricsEnabled,
            metricName: rulename + "-metric",
          },
          captchaConfig: toAwsCamel(statement.CaptchaConfig),
          ruleLabels: toAwsCamel(statement.RuleLabels),
        };
      } else {
        CfnRuleProperty = {
          name: rulename,
          priority: count,
          action: toAwsCamel(statement.Action),
          statement: toAwsCamel(statement.Statement),
          visibilityConfig: {
            sampledRequestsEnabled:
              statement.VisibilityConfig.SampledRequestsEnabled,
            cloudWatchMetricsEnabled:
              statement.VisibilityConfig.CloudWatchMetricsEnabled,
            metricName: rulename + "-metric",
          },
          ruleLabels: toAwsCamel(statement.RuleLabels),
        };
      }
      let CfnRuleProperties: wafv2.CfnRuleGroup.RuleProperty;
      if (statement.RuleLabels) {
        CfnRuleProperties = CfnRuleProperty;
      } else {
        const { ruleLabels, ...CfnRulePropertii } = CfnRuleProperty;
        CfnRuleProperties = CfnRulePropertii;
      }
      rules.push(CfnRuleProperties);
      count += 1;
    }

    let name =
      webaclName +
      "-"+type.toLocaleLowerCase()+"-" +
      stage +
      "-" +
      deployHash;
    let rulegroupidentifier = type + "RuleGroup";
    if (processRuntimeProps.DeployedRuleGroupCapacities[0]) {
      if (
        processRuntimeProps.DeployedRuleGroupCapacities[0] !==
        capacity
      ) {
        console.log(
          "⭕️ Deploy new RuleGroup because the Capacity has changed!"
        );
        console.log(
          "\n 🟥 Old Capacity: [" +
            processRuntimeProps.DeployedRuleGroupCapacities[0] +
            "]\n 🟩 New Capacity: [" +
            processRuntimeProps.Capacity +
            "]"
        );
        if (
          processRuntimeProps.DeployedRuleGroupIdentifier[0] ===
          type+"RuleGroup"
        ) {
          rulegroupidentifier = type + "RG";
        }

        if (
          processRuntimeProps.DeployedRuleGroupNames[0] ===
          webaclName +
            "-" +
            type.toLowerCase() +
            "-" +
            stage +
            "-" +
            deployHash
        ) {
          name =
            prefix.toUpperCase() +
            "-G" +
            webaclName +
            "-" +
            stage +
            "-" +
            deployHash;
        }
        console.log(" 💬 New Name: " + name);
        console.log(" 📇 New Identifier: " + rulegroupidentifier);
      }
    }
    new wafv2.CfnRuleGroup(scope, rulegroupidentifier, {
      capacity: processRuntimeProps.Capacity,
      scope: webAclScope,
      rules: rules,
      name: name,
      visibilityConfig: {
        sampledRequestsEnabled: false,
        cloudWatchMetricsEnabled: false,
        metricName:
          prefix.toUpperCase() +
          "-" +
          webaclName +
          "-" +
          stage +
          "-" +
          deployHash,
      },
    });
    serviceDataRuleGroup.push({
      ruleGroupType: "RuleGroup",
      ruleGroupArn: "${" + rulegroupidentifier + ".Arn}",
      overrideAction: { type: "NONE" },
    });
    console.log(
      "  ➡️  Creating " +
        rulegroupidentifier +
        " with calculated capacity: [" +
        processRuntimeProps.Capacity +
        "]"
    );
    processRuntimeProps.DeployedRuleGroupCapacities.splice(0);
    processRuntimeProps.DeployedRuleGroupIdentifier.splice(0);
    processRuntimeProps.DeployedRuleGroupNames.splice(0);

    processRuntimeProps.DeployedRuleGroupIdentifier[0] =
      rulegroupidentifier;
    processRuntimeProps.DeployedRuleGroupNames[0] = name;
    processRuntimeProps.DeployedRuleGroupCapacities[0] =
      processRuntimeProps.Capacity;

    new cdk.CfnOutput(scope, type+"ProcessDeployedRuleGroupNames", {
      value:
        processRuntimeProps.DeployedRuleGroupNames.toString(),
      description: type+"ProcessDeployedRuleGroupNames",
      exportName:
        type+"ProcessDeployedRuleGroupNames" +
        deployHash,
    });

    new cdk.CfnOutput(scope, type+"ProcessDeployedRuleGroupCapacities", {
      value:
        processRuntimeProps.DeployedRuleGroupCapacities.toString(),
      description: type+"ProcessDeployedRuleGroupCapacities",
      exportName:
        type+"ProcessDeployedRuleGroupCapacities" +
        deployHash,
    });

    new cdk.CfnOutput(scope, type+"ProcessDeployedRuleGroupIdentifier", {
      value:
        processRuntimeProps.DeployedRuleGroupIdentifier.toString(),
      description: type+"ProcessDeployedRuleGroupIdentifier",
      exportName:
        type+"ProcessDeployedRuleGroupIdentifier" +
        deployHash,
    });
  } else {
    const threshold = 1000;
    const rulesets: any[] = [];
    const indexes: number[] = [];
    const rulegroupcapacities = [];
    while (
      indexes.length < processRuntimeProps.RuleCapacities.length
    ) {
      let tracker = 0;
      const ruleset: any[] = [];
      processRuntimeProps.RuleCapacities.map((v, i) => {
        if (!indexes.find((e) => e === i + 1)) {
          if (v + tracker <= threshold) {
            tracker += v;
            ruleset.push(i);
            indexes.push(i + 1);
          }
        }
      });
      rulesets.push(ruleset);
      rulegroupcapacities.push(tracker);
    }

    console.log(
      `  🖖 Split Rules into ${rulesets.length.toString()} RuleGroups: \n`
    );
    let count = 0;
    let rulegroupidentifier = "";
    let name = "";
    while (count < rulesets.length) {
      if (processRuntimeProps.DeployedRuleGroupCapacities[count]) {
        if (
          rulegroupcapacities[count] ===
          processRuntimeProps.DeployedRuleGroupCapacities[count]
        ) {
          rulegroupidentifier = type + "R" + count.toString();
          name =
            webaclName +
            "-" +
            type.toLocaleLowerCase() +
            "-" +
            stage +
            "-" +
            count.toString() +
            "-" +
            deployHash;
        } else {
          console.log(
            "\n⭕️ Deploy new RuleGroup because the Capacity has changed for " +
              processRuntimeProps.DeployedRuleGroupIdentifier[
                count
              ] +
              " !"
          );
          console.log(
            "\n 🟥 Old Capacity: [" +
              processRuntimeProps.DeployedRuleGroupCapacities[
                count
              ] +
              "]\n 🟩 New Capacity: [" +
              rulegroupcapacities[count] +
              "]"
          );
          if (processRuntimeProps.DeployedRuleGroupCapacities[count]) {
            if (
              processRuntimeProps.DeployedRuleGroupNames[
                count
              ] ===
              webaclName +
                "-" +
                stage +
                "-" +
                count.toString() +
                "-" +
                deployHash
            ) {
              name =
                webaclName +
                "-" +
                stage +
                "-"+ type.toLocaleLowerCase() + "R-" +
                count.toString() +
                "-" +
                deployHash;
            } else {
              name =
                webaclName +
                "-" +
                stage +
                "-"+ type.toLocaleLowerCase() +"-" +
                count.toString() +
                "-" +
                deployHash;
            }
            console.log(" 💬 New Name: " + name);
          }
          if (processRuntimeProps.DeployedRuleGroupIdentifier[count]) {
            if (
              processRuntimeProps.DeployedRuleGroupIdentifier[
                count
              ] ===
              "R" + count.toString()
            ) {
              rulegroupidentifier = type + "G" + count.toString();
            } else {
              rulegroupidentifier = type + "R" + count.toString();
            }
            console.log(
              " 📇 New Identifier: " + rulegroupidentifier + "\n"
            );
          }
        }
      } else {
        rulegroupidentifier = type + "R" + count.toString();
        name =
          webaclName +
          "-" +
          stage +
          "-" +
          count.toString() +
          "-" +
          deployHash;
      }
      const CfnRuleProperties = [];
      let rulegroupcounter = 0;
      while (rulegroupcounter < rulesets[count].length) {
        const statementindex = rulesets[count][rulegroupcounter];
        let rulename = "";
        if (
          ruleGroupSet[statementindex]
            .Name !== undefined
        ) {
          const Temp_Hash = Date.now().toString(36);
          rulename =
            ruleGroupSet[statementindex]
              .Name +
            "-" +
            Temp_Hash;
        } else {
          rulename =
            webaclName +
            "-" +
            stage +
            "-"+type.toLocaleLowerCase()+"-" +
            rulegroupcounter.toString() +
            "-" +
            deployHash;
        }
        let CfnRuleProperty;
        if (
          "Captcha" in
          ruleGroupSet[statementindex]
            .Action
        ) {
          CfnRuleProperty = {
            name: rulename,
            priority: rulegroupcounter,
            action: toAwsCamel(
              ruleGroupSet[statementindex]
                .Action
            ),
            statement: toAwsCamel(
              ruleGroupSet[statementindex]
                .Statement
            ),
            visibilityConfig: {
              sampledRequestsEnabled:
                ruleGroupSet[statementindex]
                  .VisibilityConfig.SampledRequestsEnabled,
              cloudWatchMetricsEnabled:
                ruleGroupSet[statementindex]
                  .VisibilityConfig.CloudWatchMetricsEnabled,
              metricName: rulename + "-metric",
            },
            captchaConfig: toAwsCamel(
              ruleGroupSet[statementindex]
                .CaptchaConfig
            ),
            ruleLabels: toAwsCamel(
              ruleGroupSet[statementindex]
                .RuleLabels
            ),
          };
        } else {
          CfnRuleProperty = {
            name: rulename,
            priority: rulegroupcounter,
            action: toAwsCamel(
              ruleGroupSet[statementindex]
                .Action
            ),
            statement: toAwsCamel(
              ruleGroupSet[statementindex]
                .Statement
            ),
            visibilityConfig: {
              sampledRequestsEnabled:
                ruleGroupSet[statementindex]
                  .VisibilityConfig.SampledRequestsEnabled,
              cloudWatchMetricsEnabled:
                ruleGroupSet[statementindex]
                  .VisibilityConfig.CloudWatchMetricsEnabled,
              metricName: rulename + "-metric",
            },
            ruleLabels: toAwsCamel(
              ruleGroupSet[statementindex]
                .RuleLabels
            ),
          };
        }
        let CfnRuleProperti: wafv2.CfnRuleGroup.RuleProperty;
        if (
          ruleGroupSet[statementindex]
            .RuleLabels
        ) {
          CfnRuleProperti = CfnRuleProperty;
        } else {
          const { ruleLabels, ...CfnRulePropertii } = CfnRuleProperty;
          CfnRuleProperti = CfnRulePropertii;
        }
        CfnRuleProperties.push(CfnRuleProperti);
        rulegroupcounter++;
      }
      new wafv2.CfnRuleGroup(scope, rulegroupidentifier, {
        capacity: rulegroupcapacities[count],
        scope: webAclScope,
        rules: CfnRuleProperties,
        name: name,
        visibilityConfig: {
          sampledRequestsEnabled: false,
          cloudWatchMetricsEnabled: false,
          metricName: name + "-metric",
        },
      });

      serviceDataRuleGroup.push({
        ruleGroupType: "RuleGroup",
        ruleGroupArn: "${" + rulegroupidentifier + ".Arn}",
        overrideAction: { type: "NONE" },
      });
      console.log(
        "   ➡️  Creating " +
          rulegroupidentifier +
          " with calculated capacity: [" +
          rulegroupcapacities[count].toString() +
          "]"
      );
      processRuntimeProps.DeployedRuleGroupCapacities[count] =
        rulegroupcapacities[count];
      processRuntimeProps.DeployedRuleGroupIdentifier[count] =
        rulegroupidentifier;
      processRuntimeProps.DeployedRuleGroupNames[count] = name;
      count++;
    }
    const lenght = rulesets.length;
    processRuntimeProps.DeployedRuleGroupCapacities.splice(
      lenght
    );
    processRuntimeProps.DeployedRuleGroupIdentifier.splice(
      lenght
    );
    processRuntimeProps.DeployedRuleGroupNames.splice(lenght);

    new cdk.CfnOutput(scope, type+"ProcessDeployedRuleGroupNames", {
      value:
        processRuntimeProps.DeployedRuleGroupNames.toString(),
      description: type+"ProcessDeployedRuleGroupNames",
      exportName:
        type+"ProcessDeployedRuleGroupNames" +
        deployHash,
    });

    new cdk.CfnOutput(scope, type+"ProcessDeployedRuleGroupCapacities", {
      value:
        processRuntimeProps.DeployedRuleGroupCapacities.toString(),
      description: type+"ProcessDeployedRuleGroupCapacities",
      exportName:
        type+"ProcessDeployedRuleGroupCapacities" +
        deployHash,
    });

    new cdk.CfnOutput(scope, type+"ProcessDeployedRuleGroupIdentifier", {
      value:
        processRuntimeProps.DeployedRuleGroupIdentifier.toString(),
      description: type+"ProcessDeployedRuleGroupIdentifier",
      exportName:
        type+"ProcessDeployedRuleGroupIdentifier" +
        deployHash,
    });
  }
  return serviceDataRuleGroup;
}
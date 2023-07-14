/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import cloneDeep from "lodash/cloneDeep";
import { aws_wafv2 as wafv2 } from "aws-cdk-lib";
import { aws_fms as fms } from "aws-cdk-lib";
import { aws_kinesisfirehose as firehouse } from "aws-cdk-lib";
import { aws_iam as iam } from "aws-cdk-lib";
import { aws_logs as logs } from "aws-cdk-lib";
import { Config, CustomResponseBodies } from "./types/config";
import { ManagedRuleGroup, ManagedServiceData, ServiceDataManagedRuleGroup, ServiceDataRuleGroup, Rule } from "./types/fms";
import { RuntimeProperties, ProcessProperties } from "./types/runtimeprops";
import {WafCloudWatchDashboard} from "./constructs/cloudwatch";
import { promises as fsp } from "fs";
import { toAwsCamel } from "./tools/helpers";

export interface ConfigStackProps extends cdk.StackProps {
  readonly config: Config;
  runtimeProperties: RuntimeProperties;
}

export class FirewallStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ConfigStackProps) {
    super(scope, id, props);
    const accountId = cdk.Aws.ACCOUNT_ID;
    const region = cdk.Aws.REGION;
    let loggingConfiguration;
    if(props.config.General.LoggingConfiguration === "Firehose"){
      const cfnRole = new iam.CfnRole(this, "KinesisS3DeliveryRole", {
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

      const cfnLogGroup = new logs.CfnLogGroup(this, "KinesisErrorLogging", {
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
            Resource: [cfnLogGroup.attrArn],
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
        roles: [cfnRole.ref],
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
              awskmsKeyArn: props.config.General.FireHoseKeyArn || "",
            },
          },
          roleArn: cfnRole.attrArn,
          bufferingHints: { sizeInMBs: 50, intervalInSeconds: 60 },
          compressionFormat: "UNCOMPRESSED",
          prefix: "AWSLogs/" + accountId + "/FirewallManager/" + region + "/",
          errorOutputPrefix:
          "AWSLogs/" + accountId + "/FirewallManager/" + region + "/Errors",
        },
      });
      loggingConfiguration = "${S3DeliveryStream.Arn}";
    }
    if(props.config.General.LoggingConfiguration === "S3"){
      loggingConfiguration = "arn:aws:s3:::"+props.config.General.S3LoggingBucketName;
    }
    // --------------------------------------------------------------------
    // IPSets
    const ipSets: cdk.aws_wafv2.CfnIPSet[] = [];
    if(props.config.WebAcl.IPSets) {
      const ipSetsNames: string[] =[];
      for(const ipSet of props.config.WebAcl.IPSets) {
        const addresses: string[] = [];
        for(const address of ipSet.Addresses) {
          if(typeof address === "string") addresses.push(address);
          else addresses.push(address.IP);
        }

        const cfnipset = new wafv2.CfnIPSet(this, ipSet.Name+props.config.General.DeployHash, {
          name: `${props.config.General.Prefix}-${props.config.General.Stage}-${ipSet.Name}-${props.config.General.DeployHash}`,
          description: ipSet.Description ? ipSet.Description : "IP Set created by AWS Firewall Factory \n used in " +props.config.General.Prefix.toUpperCase() +
          "-" +
          props.config.WebAcl.Name +
          "-" +
          props.config.General.Stage +
          "-" +
          props.config.General.DeployHash + " Firewall",
          addresses: addresses,
          ipAddressVersion: ipSet.IPAddressVersion,
          scope: props.config.WebAcl.Scope,
          tags: ipSet.Tags ? ipSet.Tags : undefined
        });
        ipSetsNames.push(ipSet.Name);
        ipSets.push(cfnipset);
      }
    }

    // --------------------------------------------------------------------
    const preProcessRuleGroups = [];
    const postProcessRuleGroups = [];
    if (props.config.WebAcl.PreProcess.ManagedRuleGroups) {
      preProcessRuleGroups.push(...buildServiceDataManagedRgs(props.config.WebAcl.PreProcess.ManagedRuleGroups));
    } else {
      console.log("\nℹ️  No ManagedRuleGroups defined in PreProcess.");
    }
    if (props.config.WebAcl.PostProcess.ManagedRuleGroups) {
      postProcessRuleGroups.push(...buildServiceDataManagedRgs(props.config.WebAcl.PostProcess.ManagedRuleGroups));
    } else {
      console.log("ℹ️  No ManagedRuleGroups defined in PostProcess.");
    }
    if (props.config.WebAcl.PreProcess.CustomRules) {
      const customRgs = buildServiceDataCustomRgs(this, "Pre", props.runtimeProperties.PreProcess.Capacity, props.config.General.DeployHash, props.config.WebAcl.Name, props.config.WebAcl.Scope, props.config.General.Stage, props.runtimeProperties.PreProcess, props.config.General.Prefix, props.config.WebAcl.PreProcess.CustomRules, props.config.WebAcl.PreProcess.CustomResponseBodies);
      preProcessRuleGroups.push(...customRgs);
    } else {
      console.log("\nℹ️  No Custom Rules defined in PreProcess.");
    }
    if (props.config.WebAcl.PostProcess.CustomRules) {
      const customRgs = buildServiceDataCustomRgs(this, "Post", props.runtimeProperties.PostProcess.Capacity, props.config.General.DeployHash, props.config.WebAcl.Name, props.config.WebAcl.Scope, props.config.General.Stage, props.runtimeProperties.PostProcess, props.config.General.Prefix, props.config.WebAcl.PostProcess.CustomRules, props.config.WebAcl.PostProcess.CustomResponseBodies);
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
        logDestinationConfigs: [loggingConfiguration || ""],
      },
    };
    const cfnPolicyProps = {
      remediationEnabled: props.config.WebAcl.RemediationEnabled ? props.config.WebAcl.RemediationEnabled : false,
      resourceType: props.config.WebAcl.Type,
      resourceTypeList: props.config.WebAcl.TypeList ? props.config.WebAcl.TypeList : undefined,
      policyName:
        props.config.General.Prefix.toUpperCase() +
        "-" +
        props.config.WebAcl.Name +
        "-" +
        props.config.General.Stage +
        "-" +
        props.config.General.DeployHash,
      includeMap: props.config.WebAcl.IncludeMap,
      excludeMap: props.config.WebAcl.ExcludeMap,
      securityServicePolicyData: {
        type: "WAFV2",
        managedServiceData: cdk.Fn.sub(
          JSON.stringify(managedServiceData)
        ),
      },
      resourcesCleanUp: props.config.WebAcl.ResourcesCleanUp ? props.config.WebAcl.ResourcesCleanUp : false,
      resourceTags: props.config.WebAcl.ResourceTags,
      excludeResourceTags: props.config.WebAcl.ExcludeResourceTags ? props.config.WebAcl.ExcludeResourceTags : false,
      policyDescription: props.config.WebAcl.Description ? props.config.WebAcl.Description : undefined
    };

    const fmspolicy = new fms.CfnPolicy(this, "CfnPolicy", cfnPolicyProps);
    if(ipSets.length !== 0){
      for(const ipSet of ipSets){
        fmspolicy.addDependency(ipSet);
      }
    }

    if(props.config.General.CreateDashboard && props.config.General.CreateDashboard === true) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      new WafCloudWatchDashboard(this, "cloudwatch",props.config, MANAGEDRULEGROUPSINFO);
    }
    const options = { flag: "w", force: true };
    void (async () => {
      try {
        if (process.env.PROCESS_PARAMETERS) {
          await fsp.writeFile(
            process.env.PROCESS_PARAMETERS,
            JSON.stringify(props.config, null, 2),
            options
          );
        }
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        console.log("Error " + error);
      }
    })();
  }
}
const MANAGEDRULEGROUPSINFO: string[]= [""];
function buildServiceDataManagedRgs(managedRuleGroups: ManagedRuleGroup[]) : ServiceDataManagedRuleGroup[] {
  const cfnManagedRuleGroup : ServiceDataManagedRuleGroup[] = [];
  for (const managedRuleGroup of managedRuleGroups) {
    cfnManagedRuleGroup.push({
      managedRuleGroupIdentifier: {
        vendorName: managedRuleGroup.Vendor,
        managedRuleGroupName: managedRuleGroup.Name,
        version: managedRuleGroup.Version !== "" ? managedRuleGroup.Version : null,
        versionEnabled: managedRuleGroup.Version !== "" ? true : undefined,
      },
      overrideAction: managedRuleGroup.OverrideAction ? managedRuleGroup.OverrideAction : { type: "NONE" },
      ruleGroupArn: null,
      
      excludeRules: managedRuleGroup.ExcludeRules ?  toAwsCamel(managedRuleGroup.ExcludeRules) : [],
      ruleGroupType: "ManagedRuleGroup",
      
      ruleActionOverrides: managedRuleGroup.RuleActionOverrides ?  toAwsCamel(managedRuleGroup.RuleActionOverrides) : undefined,
    });
    let version ="";
    if(managedRuleGroup.Version !== ""){
      version = "**"+ managedRuleGroup.Version+"**";
    }
    MANAGEDRULEGROUPSINFO.push(managedRuleGroup.Name+" ["+managedRuleGroup.Vendor +"] " + version);
  }
  return cfnManagedRuleGroup;
}

function buildServiceDataCustomRgs(scope: Construct, type: "Pre" | "Post", capacity: number, deployHash: string, webaclName: string, webAclScope: string, stage: string, processRuntimeProps: ProcessProperties, prefix: string, ruleGroupSet: Rule[], customResponseBodies: CustomResponseBodies | undefined) : ServiceDataRuleGroup[] {
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

  if (capacity < 1500) {
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



      // Add Fn::Sub for replacing IPSets logical name with its real ARN after deployment
      const subStatement = cloneDeep(statement.Statement);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      if (subStatement.IPSetReferenceStatement && !subStatement.IPSetReferenceStatement.ARN.startsWith("arn")) {
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        subStatement.IPSetReferenceStatement.ARN = cdk.Fn.getAtt(subStatement.IPSetReferenceStatement.ARN+deployHash, "Arn");
      }
      let cfnRuleProperty;
      if ("Captcha" in statement.Action) {
        cfnRuleProperty = {
          name: rulename,
          priority: count,

          action: toAwsCamel(statement.Action),
          statement: toAwsCamel(subStatement),
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
        cfnRuleProperty = {
          name: rulename,
          priority: count,
          action: toAwsCamel(statement.Action),
          statement: toAwsCamel(subStatement),
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
      let cfnRuleProperties: wafv2.CfnRuleGroup.RuleProperty;
      if (statement.RuleLabels) {
        cfnRuleProperties = cfnRuleProperty;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
        const { ruleLabels, ...cfnRulePropertii } = cfnRuleProperty;
        cfnRuleProperties = cfnRulePropertii;
      }
      rules.push(cfnRuleProperties);
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
          // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
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
    // Don't lowercase the first char of the Key of the Custom Response Body,
    // only toAwsCamel the properties below the Key
    let cstResBodies: { [key:string]: any} | undefined = {};
    if(customResponseBodies) {
      cstResBodies = Object.keys(customResponseBodies).reduce((acc, curr) => { acc[curr] = toAwsCamel(customResponseBodies[curr]); return acc; }, cstResBodies);
    }
    else {
      cstResBodies = undefined;
    }

    const rulegroup = new wafv2.CfnRuleGroup(scope, rulegroupidentifier, {
      capacity: processRuntimeProps.Capacity,
      scope: webAclScope,
      rules: rules,
      name: name,
      customResponseBodies: cstResBodies,
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
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
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
    const threshold = 1500;
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
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
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
      const cfnRuleProperties = [];
      let rulegroupcounter = 0;
      
      while (rulegroupcounter < rulesets[count].length) {
        
        const statementindex = rulesets[count][rulegroupcounter];
        let rulename = "";
        if (
          
          ruleGroupSet[statementindex]
            .Name !== undefined
        ) {
          const tempHash = Date.now().toString(36);
          rulename =
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands, @typescript-eslint/no-unsafe-member-access
            ruleGroupSet[statementindex]
              .Name +
            "-" +
            tempHash;
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

        let cfnRuleProperty;

        // Add Fn::Sub for replacing IPSets logical name with its real ARN after deployment
        const subStatement = cloneDeep(ruleGroupSet[statementindex].Statement);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        if (subStatement.IPSetReferenceStatement && !subStatement.IPSetReferenceStatement.ARN.startsWith("arn")) {
          // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
          subStatement.IPSetReferenceStatement.ARN = cdk.Fn.getAtt(subStatement.IPSetReferenceStatement.ARN+deployHash, "Arn");
        }

        if (
          "Captcha" in
          ruleGroupSet[statementindex]
            .Action
        ) {
          cfnRuleProperty = {
            name: rulename,
            priority: rulegroupcounter,
            action: toAwsCamel(
              ruleGroupSet[statementindex]
                .Action
            ),
            statement: toAwsCamel(subStatement),
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
          cfnRuleProperty = {
            name: rulename,
            priority: rulegroupcounter,
            action: toAwsCamel(
              ruleGroupSet[statementindex]
                .Action
            ),
            statement: toAwsCamel(subStatement),
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
        let cfnRuleProperti: wafv2.CfnRuleGroup.RuleProperty;
        if (
          ruleGroupSet[statementindex]
            .RuleLabels
        ) {
          cfnRuleProperti = cfnRuleProperty;
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { ruleLabels, ...cfnRulePropertii } = cfnRuleProperty;
          cfnRuleProperti = cfnRulePropertii;
        }
        cfnRuleProperties.push(cfnRuleProperti);
        rulegroupcounter++;
      }

      // Don't lowercase the first char of the Key of the Custom Response Body,
      // only toAwsCamel the properties below the Key
      let cstResBodies: { [key:string]: any} | undefined = {};
      if(customResponseBodies) {
        cstResBodies = Object.keys(customResponseBodies).reduce((acc, curr) => { acc[curr] = toAwsCamel(customResponseBodies[curr]); return acc; }, cstResBodies);
      }
      else {
        cstResBodies = undefined;
      }

      const rulegroup = new wafv2.CfnRuleGroup(scope, rulegroupidentifier, {
        capacity: rulegroupcapacities[count],
        scope: webAclScope,
        rules: cfnRuleProperties,
        name: name,
        customResponseBodies: cstResBodies,
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
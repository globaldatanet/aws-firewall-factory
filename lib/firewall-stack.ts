/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_wafv2 as wafv2 } from "aws-cdk-lib";
import { aws_fms as fms } from "aws-cdk-lib";
import { aws_lambda_nodejs as NodejsFunction } from "aws-cdk-lib";
import { aws_lambda as lambda } from "aws-cdk-lib";
import { aws_kinesisfirehose as firehouse } from "aws-cdk-lib";
import { aws_iam as iam } from "aws-cdk-lib";
import { aws_logs as logs } from "aws-cdk-lib";
import { Config, CustomResponseBodies, NONEVERSIONEDMANAGEDRULEGRPOUP } from "./types/config";
import { ManagedRuleGroup, ManagedServiceData, ServiceDataManagedRuleGroup, ServiceDataRuleGroup, Rule, NotStatementProperty } from "./types/fms";
import { RuntimeProperties, ProcessProperties } from "./types/runtimeprops";
import {WafCloudWatchDashboard} from "./constructs/cloudwatch";
import * as path from "path";
import * as cr from "aws-cdk-lib/custom-resources";
import { v5 as uuidv5 } from "uuid";

export interface ConfigStackProps extends cdk.StackProps {
  readonly config: Config;
  runtimeProperties: RuntimeProperties;
}

export class FirewallStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ConfigStackProps) {

    /**
     * uuid v5 url namespace
     * @see https://www.npmjs.com/package/uuid#uuidv5name-namespace-buffer-offset
     */
    
    const uuidFirewallFactoryResourceIdentitfier = uuidv5(`${props.config.General.Prefix}-${props.config.WebAcl.Name}${props.config.General.Stage}${props.config.General.DeployHash ?? ""}`, uuidv5.URL);

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
        
        
        deliveryStreamName: `aws-waf-logs-${uuidFirewallFactoryResourceIdentitfier}`.slice(0,65),
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
      for(const ipSet of props.config.WebAcl.IPSets) {
        const addresses: string[] = [];
        for(const address of ipSet.addresses) {
          if(typeof address === "string") addresses.push(address);
          else addresses.push(address.ip);
        }

        const cfnipset = new wafv2.CfnIPSet(this, ipSet.name, {
          name: `${props.config.General.Prefix}-${props.config.General.Stage}-${ipSet.name}`,
          description: ipSet.description ? ipSet.description : `IP Set created by AWS Firewall Factory \n used in ${props.config.General.Prefix.toUpperCase()}-${props.config.WebAcl.Name}-${props.config.General.Stage}-Firewall${props.config.General.DeployHash ? "-"+props.config.General.DeployHash : ""}`,
          addresses: addresses,
          ipAddressVersion: ipSet.ipAddressVersion,
          scope: props.config.WebAcl.Scope,
          tags: ipSet.tags ? ipSet.tags : undefined
        });
        ipSets.push(cfnipset);
      }
    }
    // --------------------------------------------------------------------

    // ----------------------------------------------------------------
    // RegexPatternSet
    const regexPatternSets: cdk.aws_wafv2.CfnRegexPatternSet[]=[];
    if(props.config.WebAcl.RegexPatternSets){
      for(const regexPatternSet of props.config.WebAcl.RegexPatternSets) {
        const cfnRegexPatternSet = new wafv2.CfnRegexPatternSet(this, regexPatternSet.name, {
          name: `${props.config.General.Prefix}-${props.config.General.Stage}-${regexPatternSet.name}`,
          regularExpressionList: regexPatternSet.regularExpressionList,
          scope: props.config.WebAcl.Scope,
          tags: regexPatternSet.tags ?? undefined,
          description: regexPatternSet.description ?? `Regex Pattern Set created by AWS Firewall Factory \n used in ${props.config.General.Prefix.toUpperCase()}-${props.config.WebAcl.Name}-${props.config.General.Stage}-Firewall${props.config.General.DeployHash ? "-"+props.config.General.DeployHash : ""}`
        });
        regexPatternSets.push(cfnRegexPatternSet);
      }
    }

    // --------------------------------------------------------------------
    // ManagedRuleGroupsVersion
    const managedRuleGroupVersionLambdaRole = new iam.Role(this, "managedRuleGroupVersionLambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    managedRuleGroupVersionLambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName(
      "service-role/AWSLambdaBasicExecutionRole",
    ),);
    const wafGetManagedRuleGroupVersion = new iam.PolicyStatement({
      actions:["wafv2:ListAvailableManagedRuleGroupVersions"],
      resources: ["*"]});

    managedRuleGroupVersionLambdaRole.addToPolicy(wafGetManagedRuleGroupVersion);

    const managedRuleGroupVersionLambda = new NodejsFunction.NodejsFunction(this, "managedRuleGroupVersionLambdaFunction", {
      entry: path.join(__dirname, "../lib/lambda/ManagedRuleGroupVersion/index.ts"),
      handler: "handler",
      timeout: cdk.Duration.seconds(30),
      architecture:lambda.Architecture.ARM_64,
      role: managedRuleGroupVersionLambdaRole,
      memorySize: 128,
      bundling: {
        minify: true,
      },
      logRetention: logs.RetentionDays.TWO_WEEKS,
      runtime: lambda.Runtime.NODEJS_18_X,
    });

    const managedRuleGroupVersionProvider = new cr.Provider(this, "CustomResourceProviderManagedRuleGroupVersionLambda", {
      onEventHandler: managedRuleGroupVersionLambda
    });


    // --------------------------------------------------------------------

    const preProcessRuleGroups = [];
    const postProcessRuleGroups = [];
    if (props.config.WebAcl.PreProcess.ManagedRuleGroups) {
      preProcessRuleGroups.push(...buildServiceDataManagedRgs(this, props.config.WebAcl.PreProcess.ManagedRuleGroups, managedRuleGroupVersionProvider, props.config.WebAcl.Scope));
    } else {
      console.log("\nℹ️  No ManagedRuleGroups defined in PreProcess.");
    }
    if (props.config.WebAcl.PostProcess.ManagedRuleGroups) {
      postProcessRuleGroups.push(...buildServiceDataManagedRgs(this, props.config.WebAcl.PostProcess.ManagedRuleGroups, managedRuleGroupVersionProvider, props.config.WebAcl.Scope));
    } else {
      console.log("ℹ️  No ManagedRuleGroups defined in PostProcess.");
    }
    if (props.config.WebAcl.PreProcess.CustomRules) {
      const customRgs = buildServiceDataCustomRgs(this, "Pre", props.runtimeProperties.PreProcess.Capacity, props.config.WebAcl.Name, props.config.WebAcl.Scope, props.config.General.Stage, props.runtimeProperties.PreProcess, props.config.General.Prefix, props.config.WebAcl.PreProcess.CustomRules, props.config.WebAcl.PreProcess.CustomResponseBodies, ipSets, regexPatternSets, props.config.General.DeployHash);
      preProcessRuleGroups.push(...customRgs);
    } else {
      console.log("\nℹ️  No Custom Rules defined in PreProcess.");
    }
    if (props.config.WebAcl.PostProcess.CustomRules) {
      const customRgs = buildServiceDataCustomRgs(this, "Post", props.runtimeProperties.PostProcess.Capacity, props.config.WebAcl.Name, props.config.WebAcl.Scope, props.config.General.Stage, props.runtimeProperties.PostProcess, props.config.General.Prefix, props.config.WebAcl.PostProcess.CustomRules, props.config.WebAcl.PostProcess.CustomResponseBodies, ipSets, regexPatternSets, props.config.General.DeployHash);
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
      policyName: `${props.config.General.Prefix.toUpperCase()}-${props.config.WebAcl.Name}-${props.config.General.Stage}${props.config.General.DeployHash ? "-"+props.config.General.DeployHash : ""}`,
      includeMap: props.config.WebAcl.IncludeMap,
      excludeMap: props.config.WebAcl.ExcludeMap,
      securityServicePolicyData: {
        type: "WAFV2",
        managedServiceData: cdk.Fn.sub(
          JSON.stringify(managedServiceData),
          subVariables
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
  }
}
interface SubVariables {
  [key: string]: string;
}

const MANAGEDRULEGROUPSINFO: string[]= [""];
const subVariables : SubVariables = {};

function buildServiceDataManagedRgs(scope: Construct, managedRuleGroups: ManagedRuleGroup[], managedRuleGroupVersionProvider: cr.Provider, wafScope: string) : ServiceDataManagedRuleGroup[] {
  const cfnManagedRuleGroup : ServiceDataManagedRuleGroup[] = [];
  for (const managedRuleGroup of managedRuleGroups) {
    if(managedRuleGroup.overrideAction?.type === "COUNT"){
      // eslint-disable-next-line quotes
      console.log("\x1b[31m",`\n🚨 OverrideAction of ManagedRuleGroup ${managedRuleGroup.name} is set to COUNT, which simply tallies all rules within the group.\n   However, this practice may create a vulnerability in your firewall and is not recommended.`,"\x1b[0m");
    }
    if(NONEVERSIONEDMANAGEDRULEGRPOUP.find((rulegroup) => rulegroup === managedRuleGroup.name)){
      console.log("\nℹ️  ManagedRuleGroup " + managedRuleGroup.name + " is not versioned. Skip Custom Resource for Versioning.");
      cfnManagedRuleGroup.push({
        managedRuleGroupIdentifier: {
          vendorName: managedRuleGroup.vendor,
          managedRuleGroupName: managedRuleGroup.name,
          version: null,
          versionEnabled: undefined,
        },
        overrideAction: managedRuleGroup.overrideAction ? managedRuleGroup.overrideAction : { type: "NONE" },
        ruleGroupArn: null,
        excludeRules: managedRuleGroup.excludeRules ?  managedRuleGroup.excludeRules : [],
        ruleGroupType: "ManagedRuleGroup",
        ruleActionOverrides: managedRuleGroup.ruleActionOverrides ?  managedRuleGroup.ruleActionOverrides : undefined,
      });
      MANAGEDRULEGROUPSINFO.push(managedRuleGroup.name+" ["+managedRuleGroup.vendor +"]");
      continue;
    }
    else{
      const crManagedRuleGroupanagedRuleGroupVersion = new cdk.CustomResource(scope, `Cr${managedRuleGroup.name}` , {
        properties: {
          VendorName: managedRuleGroup.vendor,
          Name: managedRuleGroup.name,
          Scope: wafScope,
          ManagedRuleGroupVersion: managedRuleGroup.version,
          Latest: managedRuleGroup.latestVersion ? managedRuleGroup.latestVersion : false,
          EnforceUpdate: managedRuleGroup.enforceUpdate ? Date.now() : false
        },
        serviceToken: managedRuleGroupVersionProvider.serviceToken,
      });
      const cwVersion = "**"+ crManagedRuleGroupanagedRuleGroupVersion.getAttString("Version") +"**";
      subVariables[managedRuleGroup.name] = crManagedRuleGroupanagedRuleGroupVersion.getAttString("Version");
      const version = `\${${managedRuleGroup.name}}`;

      // if a version is supplied, create an output
      new cdk.CfnOutput(scope, `${managedRuleGroup.name}Version`, {
        value: crManagedRuleGroupanagedRuleGroupVersion.getAttString("Version"),
        description: `Version of ${managedRuleGroup.name} used in ${managedRuleGroup.name} RuleGroup`
      });

      cfnManagedRuleGroup.push({
        managedRuleGroupIdentifier: {
          vendorName: managedRuleGroup.vendor,
          managedRuleGroupName: managedRuleGroup.name,
          version,
          versionEnabled: managedRuleGroup.versionEnabled ? true : undefined,
        },
        overrideAction: managedRuleGroup.overrideAction ? managedRuleGroup.overrideAction : { type: "NONE" },
        ruleGroupArn: null,
        excludeRules: managedRuleGroup.excludeRules ?  managedRuleGroup.excludeRules : [],
        ruleGroupType: "ManagedRuleGroup",
        ruleActionOverrides: managedRuleGroup.ruleActionOverrides ?  managedRuleGroup.ruleActionOverrides : undefined,
      });
      MANAGEDRULEGROUPSINFO.push(managedRuleGroup.name+" ["+managedRuleGroup.vendor +"] " + cwVersion);
    }
  }
  return cfnManagedRuleGroup;
}

function buildServiceDataCustomRgs(scope: Construct, type: "Pre" | "Post", capacity: number, webaclName: string, webAclScope: string, stage: string, processRuntimeProps: ProcessProperties, prefix: string, ruleGroupSet: Rule[], customResponseBodies: CustomResponseBodies | undefined, ipSets: cdk.aws_wafv2.CfnIPSet[], regexPatternSets: cdk.aws_wafv2.CfnRegexPatternSet[], deployHash?: string) : ServiceDataRuleGroup[] {
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
    for (const rule of ruleGroupSet) {
      let rulename = "";
      if (rule.name !== undefined) {
        rulename = `${rule.name}-${type.toLocaleLowerCase()}${deployHash ? "-"+deployHash : ""}`;
      } else {
        rulename = `${webaclName}-${type.toLocaleLowerCase()}-${stage}-${count.toString()}${deployHash ? "-"+deployHash : ""}`;
      }
      // transform ipSetReferenceStatements
      const statement = transformRuleStatements(rule, prefix, stage, ipSets,regexPatternSets);

      const cfnRuleProperty = {
        name: rulename,
        priority: rule.priority,
        action: rule.action,
        statement,
        captchaConfig: (Object.keys(rule.action)[0] === "captcha") ? rule.captchaConfig : undefined,
        visibilityConfig: {
          sampledRequestsEnabled:
            rule.visibilityConfig.sampledRequestsEnabled,
          cloudWatchMetricsEnabled:
            rule.visibilityConfig.cloudWatchMetricsEnabled,
          metricName: rule.visibilityConfig.metricName,
        },
        ruleLabels: rule.ruleLabels,
      };
      let cfnRuleProperties: wafv2.CfnRuleGroup.RuleProperty;
      if (rule.ruleLabels) {
        cfnRuleProperties = cfnRuleProperty as wafv2.CfnWebACL.RuleProperty;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
        const { ruleLabels, ...cfnRulePropertii } = cfnRuleProperty;
        cfnRuleProperties = cfnRulePropertii as wafv2.CfnWebACL.RuleProperty;
      }
      rules.push(cfnRuleProperties);
      count += 1;
    }

    let name = `${webaclName}-${type.toLocaleLowerCase()}-${stage}${deployHash ? "-"+deployHash : ""}`;
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
          processRuntimeProps.DeployedRuleGroupNames[0] === `${webaclName}-${type.toLocaleLowerCase()}-${stage}${deployHash ? "-"+deployHash : ""}`
        ) {
          name = `${prefix.toUpperCase()}-G${webaclName}-${type.toLocaleLowerCase()}-${stage}${deployHash ? "-"+deployHash : ""}`;
        }
        console.log(" 💬 New Name: " + name);
        console.log(" 📇 New Identifier: " + rulegroupidentifier);
      }
    }
    // Don't lowercase the first char of the Key of the Custom Response Body,
    // only toAwsCamel the properties below the Key
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cstResBodies: { [key:string]: any} | undefined = {};
    if(customResponseBodies) {
      cstResBodies = Object.keys(customResponseBodies).reduce((acc, curr) => { acc[curr] = customResponseBodies[curr]; return acc; }, cstResBodies);
    }
    else {
      cstResBodies = undefined;
    }
    new wafv2.CfnRuleGroup(scope, rulegroupidentifier, {
      capacity: processRuntimeProps.Capacity,
      scope: webAclScope,
      rules: rules,
      name: name,
      customResponseBodies: cstResBodies,
      visibilityConfig: {
        sampledRequestsEnabled: false,
        cloudWatchMetricsEnabled: false,
        metricName: `${prefix.toUpperCase()}-${webaclName}-${stage}${deployHash ? "-"+deployHash : ""}`,
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
    });

    new cdk.CfnOutput(scope, type+"ProcessDeployedRuleGroupCapacities", {
      value:
        processRuntimeProps.DeployedRuleGroupCapacities.toString(),
      description: type+"ProcessDeployedRuleGroupCapacities",
    });

    new cdk.CfnOutput(scope, type+"ProcessDeployedRuleGroupIdentifier", {
      value:
        processRuntimeProps.DeployedRuleGroupIdentifier.toString(),
      description: type+"ProcessDeployedRuleGroupIdentifier",
    });
  } else {
    const threshold = 1500;
    const rulesets: any[] = [];
    const indexes: number[] = [];
    const rulegroupcapacities = [];
    //ORDER BY Priority DESC
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
          name = `${webaclName}-${type.toLocaleLowerCase()}-${stage}-${count.toString()}${deployHash ? "-"+deployHash : ""}`;
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
              ] === `${webaclName}-${type.toLocaleLowerCase()}-${stage}-${count.toString()}${deployHash ? "-"+deployHash : ""}`
            ) {
              name = `${prefix.toUpperCase()}-G${webaclName}-${type.toLocaleLowerCase()}-${stage}-${count.toString()}${deployHash ? "-"+deployHash : ""}`;
            } else {
              name = `${webaclName}-${type.toLocaleLowerCase()}-${stage}-${count.toString()}${deployHash ? "-"+deployHash : ""}`;
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
        name = `${webaclName}-${stage}-${count.toString()}${deployHash ? "-"+deployHash : ""}`;
      }
      const cfnRuleProperties = [];
      let rulegroupcounter = 0;
      while (rulegroupcounter < rulesets[count].length) {
        const statementindex = rulesets[count][rulegroupcounter];
        let rulename = "";
        if (
          ruleGroupSet[statementindex]
            .name !== undefined
        ) {
          const tempHash = Date.now().toString(36);
          rulename =
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands, @typescript-eslint/no-unsafe-member-access
            ruleGroupSet[statementindex]
              .name +
            "-" +
            tempHash;
        } else {
          rulename = `${webaclName}-${stage}-${type.toLocaleLowerCase()}-${rulegroupcounter.toString()}${deployHash ? "-"+deployHash : ""}`;
        }

        const statement = transformRuleStatements(ruleGroupSet[statementindex],prefix, stage, ipSets, regexPatternSets);
        const cfnRuleProperty = {
          name: rulename,
          priority: ruleGroupSet[statementindex].priority,
          action: ruleGroupSet[statementindex].action,
          statement,
          visibilityConfig: {
            sampledRequestsEnabled:
              ruleGroupSet[statementindex]
                .visibilityConfig.sampledRequestsEnabled,
            cloudWatchMetricsEnabled:
              ruleGroupSet[statementindex]
                .visibilityConfig.cloudWatchMetricsEnabled,
            metricName: ruleGroupSet[statementindex].visibilityConfig.metricName,
          },
          captchaConfig: (Object.keys(ruleGroupSet[statementindex]
            .action)[0] === "captcha") ? ruleGroupSet[statementindex].captchaConfig : undefined,
          ruleLabels: ruleGroupSet[statementindex].ruleLabels,
        };
        let cfnRuleProperti: wafv2.CfnRuleGroup.RuleProperty;
        if (
          ruleGroupSet[statementindex]
            .ruleLabels
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

      let cstResBodies: { [key:string]: any} | undefined = {};
      if(customResponseBodies) {
        cstResBodies = Object.keys(customResponseBodies).reduce((acc, curr) => { acc[curr] = customResponseBodies[curr]; return acc; }, cstResBodies);
      }
      else {
        cstResBodies = undefined;
      }

      new wafv2.CfnRuleGroup(scope, rulegroupidentifier, {
        capacity: rulegroupcapacities[count],
        scope: webAclScope,
        rules: cfnRuleProperties,
        name: name,
        customResponseBodies: cstResBodies,
        visibilityConfig: {
          sampledRequestsEnabled: false,
          cloudWatchMetricsEnabled: false,
          metricName: name,
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
      description: type+"ProcessDeployedRuleGroupNames"
    });

    new cdk.CfnOutput(scope, type+"ProcessDeployedRuleGroupCapacities", {
      value:
        processRuntimeProps.DeployedRuleGroupCapacities.toString(),
      description: type+"ProcessDeployedRuleGroupCapacities"
    });

    new cdk.CfnOutput(scope, type+"ProcessDeployedRuleGroupIdentifier", {
      value:
        processRuntimeProps.DeployedRuleGroupIdentifier.toString(),
      description: type+"ProcessDeployedRuleGroupIdentifier"
    });
  }
  return serviceDataRuleGroup;
}

function getActualIpReferenceStatementInStatement(ipSetReferenceStatement: wafv2.CfnWebACL.IPSetReferenceStatementProperty, prefix: string, stage: string, ipSets: cdk.aws_wafv2.CfnIPSet[]) {
  let actualIpSetReferenceStatement: wafv2.CfnWebACL.IPSetReferenceStatementProperty;
  if (ipSetReferenceStatement.arn.startsWith("arn")) {
    actualIpSetReferenceStatement = ipSetReferenceStatement;
  } else {
    const foundIpSet = ipSets.find((ipSet) => ipSet.name === `${prefix}-${stage}-${ipSetReferenceStatement.arn}`);
    if (foundIpSet === undefined) throw new Error(`IPSet ${ipSetReferenceStatement.arn} not found in stack`);
    actualIpSetReferenceStatement = {
      arn: cdk.Fn.getAtt(foundIpSet.logicalId, "Arn").toString(),
      ipSetForwardedIpConfig: ipSetReferenceStatement.ipSetForwardedIpConfig
    };
  }
  const statement : wafv2.CfnWebACL.StatementProperty = {
    ipSetReferenceStatement: actualIpSetReferenceStatement
  };
  return statement;
}

function getActualRegexPatternSetReferenceStatementProperty(regexPatternSetStatement: wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty, prefix: string, stage: string, regexPatternSets: cdk.aws_wafv2.CfnRegexPatternSet[]) {
  let actualRegexPAtternSetReferenceStatement: wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty;
  if (regexPatternSetStatement.arn.startsWith("arn")) {
    actualRegexPAtternSetReferenceStatement = regexPatternSetStatement;
  } else {
    const foundRegexPatternSet = regexPatternSets.find((regexPatternSet) => regexPatternSet.name === `${prefix}-${stage}-${regexPatternSetStatement.arn}`);
    if (foundRegexPatternSet === undefined) throw new Error(`RegexPatternSet ${regexPatternSetStatement.arn} not found in stack`);
    actualRegexPAtternSetReferenceStatement = {
      arn: cdk.Fn.getAtt(foundRegexPatternSet.logicalId, "Arn").toString(),
      fieldToMatch: regexPatternSetStatement.fieldToMatch,
      textTransformations: regexPatternSetStatement.textTransformations
    };
  }
  const statement : wafv2.CfnWebACL.StatementProperty = {
    regexPatternSetReferenceStatement: actualRegexPAtternSetReferenceStatement
  };
  return statement;
}

function transformRuleStatements(rule: Rule, prefix: string, stage: string, ipSets?: cdk.aws_wafv2.CfnIPSet[], regexPatternSets?: cdk.aws_wafv2.CfnRegexPatternSet[]) {
  let ipSetReferenceStatement = rule.statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
  let regexPatternSetReferenceStatement = rule.statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;

  const notStatement = rule.statement.notStatement as NotStatementProperty | undefined;

  if(notStatement) {
    let statement = notStatement.statement as cdk.aws_wafv2.CfnWebACL.StatementProperty;
    const notipSetReferenceStatement = statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
    if (notipSetReferenceStatement && ipSets) {
      statement = getActualIpReferenceStatementInStatement(notipSetReferenceStatement, prefix, stage, ipSets);
    }
    const notregexPatternSetReferenceStatement = statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
    if(notregexPatternSetReferenceStatement && regexPatternSets) {
      statement = getActualRegexPatternSetReferenceStatementProperty(notregexPatternSetReferenceStatement, prefix, stage, regexPatternSets);
    }
    notStatement.statement = statement;
    rule.statement.notStatement as wafv2.CfnWebACL.NotStatementProperty;
  }

  const andStatement = rule.statement.andStatement as wafv2.CfnWebACL.AndStatementProperty | undefined;

  if (andStatement) {
    const statements = andStatement.statements as cdk.aws_wafv2.CfnWebACL.StatementProperty[];
    for (let i=0; i<statements.length; i++) {
      ipSetReferenceStatement = statements[i].ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
      if (ipSetReferenceStatement && ipSets) {
        statements[i] = getActualIpReferenceStatementInStatement(ipSetReferenceStatement, prefix, stage, ipSets);
      }
      regexPatternSetReferenceStatement = statements[i].regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
      if(regexPatternSetReferenceStatement && regexPatternSets) {
        statements[i] = getActualRegexPatternSetReferenceStatementProperty(regexPatternSetReferenceStatement, prefix, stage, regexPatternSets);
      }
      const notStatement = statements[i].notStatement as wafv2.CfnWebACL.NotStatementProperty | undefined;
      if(notStatement && (ipSets || regexPatternSets)) {
        let statement = notStatement.statement as cdk.aws_wafv2.CfnWebACL.StatementProperty;
        ipSetReferenceStatement = statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
        if (ipSetReferenceStatement && ipSets) {
          statement = getActualIpReferenceStatementInStatement(ipSetReferenceStatement, prefix, stage, ipSets);
        }
        regexPatternSetReferenceStatement = statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
        if(regexPatternSetReferenceStatement && regexPatternSets) {
          statement = getActualRegexPatternSetReferenceStatementProperty(regexPatternSetReferenceStatement, prefix, stage, regexPatternSets);
        }
        const adjustedstatement = {notStatement: {statement}};
        statements[i] = adjustedstatement as cdk.aws_wafv2.CfnWebACL.StatementProperty;
      }
    }
  }

  const orStatement = rule.statement.orStatement as wafv2.CfnWebACL.OrStatementProperty | undefined;

  if (orStatement) {
    const statements = orStatement.statements as cdk.aws_wafv2.CfnWebACL.StatementProperty[];
    for (let i=0; i<statements.length; i++) {
      ipSetReferenceStatement = statements[i].ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
      if (ipSetReferenceStatement && ipSets) {
        statements[i] = getActualIpReferenceStatementInStatement(ipSetReferenceStatement, prefix, stage, ipSets);
      }
      regexPatternSetReferenceStatement = statements[i].regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
      if(regexPatternSetReferenceStatement && regexPatternSets) {
        statements[i] = getActualRegexPatternSetReferenceStatementProperty(regexPatternSetReferenceStatement, prefix, stage, regexPatternSets);
      }
      const notStatement = statements[i].notStatement as wafv2.CfnWebACL.NotStatementProperty | undefined;
      if(notStatement && (ipSets || regexPatternSets)) {
        let statement = notStatement.statement as cdk.aws_wafv2.CfnWebACL.StatementProperty;
        ipSetReferenceStatement = statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
        if (ipSetReferenceStatement && ipSets) {
          statement = getActualIpReferenceStatementInStatement(ipSetReferenceStatement, prefix, stage, ipSets);
        }
        regexPatternSetReferenceStatement = statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
        if(regexPatternSetReferenceStatement && regexPatternSets) {
          statement = getActualRegexPatternSetReferenceStatementProperty(regexPatternSetReferenceStatement, prefix, stage, regexPatternSets);
        }
        const adjustedstatement = {notStatement: {statement}};
        statements[i] = adjustedstatement as cdk.aws_wafv2.CfnWebACL.StatementProperty;
      }
    }
  }

  let statement : wafv2.CfnWebACL.StatementProperty;
  if (ipSetReferenceStatement && ipSets) {
    statement = getActualIpReferenceStatementInStatement(ipSetReferenceStatement, prefix, stage, ipSets);
  } else if(regexPatternSetReferenceStatement && regexPatternSets) {
    statement = getActualRegexPatternSetReferenceStatementProperty(regexPatternSetReferenceStatement, prefix, stage, regexPatternSets);
  } else if (andStatement) {
    statement = { andStatement };
  } else if (orStatement) {
    statement = { orStatement };
  } else {
    statement = rule.statement;
  }
  return statement;
}
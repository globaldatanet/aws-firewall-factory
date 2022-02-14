import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {aws_wafv2 as wafv2} from "aws-cdk-lib";
import {aws_fms as fms} from "aws-cdk-lib";
import {aws_kinesisfirehose as firehouse} from "aws-cdk-lib";
import {aws_iam as iam} from "aws-cdk-lib";
import {aws_logs as logs} from "aws-cdk-lib";
import { print } from "util";
import { Config } from "./types/config";
import { Runtimeprops } from "./types/runtimeprops";

function toCamel(o: any) {
  var newO: any, origKey: any, newKey: any, value: any
  if (o instanceof Array) {
    return o.map(function(value) {
      if (typeof value === "object") {
        value = toCamel(value)
      }
      if(value == "aRN"){
        value = "arn"
      }
      if(value == "iPSetReferenceStatement"){
        value = "ipSetReferenceStatement"
      }
      return value
    })
  } else {
    newO = {}
    for (origKey in o) {
      if (o.hasOwnProperty(origKey)) {
        newKey = (origKey.charAt(0).toLowerCase() + origKey.slice(1) || origKey).toString()
        if(newKey == "aRN"){
          newKey = "arn"
        }
        if(newKey == "iPSetReferenceStatement"){
          newKey = "ipSetReferenceStatement"
        }
        value = o[origKey]
        if (value instanceof Array || (value !== null && value.constructor === Object)) {
          value = toCamel(value)
          if(value == "aRN"){
            value = "arn"
          }
        }
        newO[newKey] = value
      }
    }
  }
  return newO
}

export interface ConfigStackProps extends cdk.StackProps {
  readonly config: Config;
  runtimeprops: Runtimeprops;
}


export class PlattformWafv2CdkAutomationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ConfigStackProps) {
    super(scope, id, props);
    const account_id = cdk.Aws.ACCOUNT_ID;
    const region = cdk.Aws.REGION;
    if(props.runtimeprops.PreProcessDeployedRuleGroupCapacities === undefined){
      console.log("⚙️ Initialize PreProcess lists for Update mechanism.")
      props.runtimeprops.PreProcessDeployedRuleGroupCapacities = []
      props.runtimeprops.PreProcessDeployedRuleGroupNames = []
      props.runtimeprops.PreProcessDeployedRuleGroupIdentifier = []}
    if(props.runtimeprops.PostProcessDeployedRuleGroupCapacities === undefined){
      console.log("⚙️ Initialize PostProcess lists for Update mechanism.")
      props.runtimeprops.PostProcessDeployedRuleGroupCapacities = []
      props.runtimeprops.PostProcessDeployedRuleGroupNames = []
      props.runtimeprops.PostProcessDeployedRuleGroupIdentifier = []}
    const CfnRole = new iam.CfnRole(this, "KinesisS3DeliveryRole",{
      assumeRolePolicyDocument: {"Version":"2012-10-17","Statement":[{"Sid":"","Effect":"Allow","Principal":{"Service":"firehose.amazonaws.com"},"Action":"sts:AssumeRole"}]}
    })

    const CfnLogGroup = new logs.CfnLogGroup(this, "KinesisErrorLogging",{
      retentionInDays: 90})

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
            "s3:PutObjectAcl"
          ],
          Resource: [
            "arn:aws:s3:::"+props.config.General.S3LoggingBucketName,
            "arn:aws:s3:::"+props.config.General.S3LoggingBucketName +"/*"
          ]
        },
        {
          Effect: "Allow",
          Action: [
            "logs:PutLogEvents"
          ],
          Resource: [
            CfnLogGroup.attrArn
          ]
        },
        {
          Effect: "Allow",
          Action: [
            "kms:Decrypt",
            "kms:GenerateDataKey"
          ],
          Resource: [
            props.config.General.FireHoseKeyArn
          ]
        }
      ]
    }

    const IamPolicy = new iam.CfnPolicy(this, "KinesisS3DeliveryPolicy",{
      policyDocument: policy,
      policyName: "firehose_delivery_policy",
      roles: [CfnRole.ref]
    })

    const CfnDeliveryStream = new firehouse.CfnDeliveryStream(this, "S3DeliveryStream",{
      deliveryStreamName: "aws-waf-logs-"+props.config.General.Prefix+"-kinesis-wafv2log-"+props.config.WebAcl.Name+props.config.General.Stage+props.config.General.DeployHash,
      extendedS3DestinationConfiguration: {
        bucketArn:"arn:aws:s3:::"+props.config.General.S3LoggingBucketName,
        encryptionConfiguration:{kmsEncryptionConfig:{awskmsKeyArn:props.config.General.FireHoseKeyArn}},
        roleArn: CfnRole.attrArn,
        bufferingHints: {sizeInMBs:50, intervalInSeconds:60},
        compressionFormat: "UNCOMPRESSED",
        prefix: "AWSLogs/"+ account_id +"/FirewallManager/"+region+"/",
        errorOutputPrefix: "AWSLogs/"+ account_id +"/FirewallManager/"+region+"/Errors"
      },

    })

    if(props.config.WebAcl.PreProcess.CustomRules == undefined && props.config.WebAcl.PostProcess.CustomRules == undefined)
    {
      console.log("Creating DEFAULT Policy.")
      const novalue = null
      let mangedrule;
      let ExcludeRules;
      let OverrideAction;
      const preProcessRuleGroups = []
      const postProcessRuleGroups = []
      if(props.config.WebAcl.PreProcess.ManagedRuleGroups === undefined){
        console.log("\nℹ️  No ManagedRuleGroups defined in PreProcess.")
      }
      else{
        for(mangedrule of props.config.WebAcl.PreProcess.ManagedRuleGroups){
          if(mangedrule.ExcludeRules){
            ExcludeRules = toCamel(mangedrule.ExcludeRules)
            OverrideAction = mangedrule.OverrideAction
          }
          else{
            ExcludeRules = []
            OverrideAction = { "type": "NONE" }
          }
          if(mangedrule.Version == ""){
            preProcessRuleGroups.push({"managedRuleGroupIdentifier": {"vendorName": mangedrule.Vendor,
              "managedRuleGroupName":mangedrule.Name,"version": novalue},"overrideAction": OverrideAction,
            "ruleGroupArn": novalue,"excludeRules": ExcludeRules,"ruleGroupType": "ManagedRuleGroup"});}
          else{
            preProcessRuleGroups.push({"managedRuleGroupIdentifier": {"vendorName": mangedrule.Vendor,
              "managedRuleGroupName":mangedrule.Name,"version": mangedrule.Version},"overrideAction": OverrideAction,
            "ruleGroupArn": novalue,"excludeRules": ExcludeRules,"ruleGroupType": "ManagedRuleGroup"});}
        }
      }
      if(props.config.WebAcl.PostProcess.ManagedRuleGroups === undefined){
        console.log("ℹ️  No ManagedRuleGroups defined in PostProcess.")
      }
      else{
        for(mangedrule of props.config.WebAcl.PostProcess.ManagedRuleGroups){
          if(mangedrule.ExcludeRules){
            ExcludeRules = toCamel(mangedrule.ExcludeRules)
            OverrideAction = mangedrule.OverrideAction
          }
          else{
            ExcludeRules = []
            OverrideAction = { "type": "NONE" }
          }
          if(mangedrule.Version == ""){
            postProcessRuleGroups.push({"managedRuleGroupIdentifier": {"vendorName": mangedrule.Vendor,
              "managedRuleGroupName":mangedrule.Name,"version": novalue},"overrideAction": OverrideAction,
            "ruleGroupArn": novalue,"excludeRules": ExcludeRules,"ruleGroupType": "ManagedRuleGroup"});}
          else{
            postProcessRuleGroups.push({"managedRuleGroupIdentifier": {"vendorName": mangedrule.Vendor,
              "managedRuleGroupName":mangedrule.Name,"version": mangedrule.Version},"overrideAction": OverrideAction,
            "ruleGroupArn": novalue,"excludeRules": ExcludeRules,"ruleGroupType": "ManagedRuleGroup"});}
        }
      }
      const securityservicepolicydata = {
        "type":"WAFV2",
        "defaultAction":{ "type":"ALLOW" },
        "preProcessRuleGroups": preProcessRuleGroups,
        "postProcessRuleGroups": postProcessRuleGroups,
        "overrideCustomerWebACLAssociation":true,
        "loggingConfiguration": {
          "logDestinationConfigs":["${S3DeliveryStream.Arn}"]
        }
      }

      const fmsPolicy = new fms.CfnPolicy(this, "CfnPolicy", {
        excludeResourceTags: false,
        remediationEnabled: false,
        resourceType: props.config.WebAcl.Type,
        policyName: props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage+ "-" +props.config.General.DeployHash,
        includeMap: {account: props.config.General.DeployTo },
        securityServicePolicyData: {"Type": "WAFV2","ManagedServiceData": cdk.Fn.sub(JSON.stringify(securityservicepolicydata))}
      });

    }
    else{
      const preProcessRuleGroups = []
      const postProcessRuleGroups = []
      if(props.config.WebAcl.PreProcess.CustomRules == undefined){
        console.log("\nℹ️  No Custom Rules defined in PreProcess.")
      }
      else{
        console.log("\u001b[1m","\n🥇  Custom Rules PreProcess: ","\x1b[0m\n")
        if (props.runtimeprops.PreProcessCapacity < 100){
            const rules = [];
            let count = 1
            for(const statement of props.config.WebAcl.PreProcess.CustomRules){
              let rulename = ""
              if(statement.Name !== undefined){
                rulename = statement.Name  + "-pre-" + props.config.General.DeployHash
              }
              else{
                rulename = props.config.WebAcl.Name + "-pre-" + props.config.General.Stage + "-" + count.toString() + "-" +props.config.General.DeployHash
              }
              let CfnRuleProperty
              if("Captcha" in statement.Action){
                CfnRuleProperty = {
                  name: rulename,
                  priority: count,
                  action: toCamel(statement.Action),
                  statement: toCamel(statement.Statement),
                  visibilityConfig: {
                    sampledRequestsEnabled: statement.VisibilityConfig.SampledRequestsEnabled,
                    cloudWatchMetricsEnabled: statement.VisibilityConfig.CloudWatchMetricsEnabled,
                    metricName: rulename + "-metric",
                  },
                  captchaConfig: toCamel(statement.CaptchaConfig),
                  ruleLabels: toCamel(statement.RuleLabels)
                }
              }
              else{ 
                CfnRuleProperty = {
                name: rulename,
                priority: count,
                action: toCamel(statement.Action),
                statement: toCamel(statement.Statement),
                visibilityConfig: {
                  sampledRequestsEnabled: statement.VisibilityConfig.SampledRequestsEnabled,
                  cloudWatchMetricsEnabled: statement.VisibilityConfig.CloudWatchMetricsEnabled,
                  metricName: rulename + "-metric",
                },
                ruleLabels: toCamel(statement.RuleLabels)
              };}
              let CfnRuleProperties: wafv2.CfnRuleGroup.RuleProperty
              if(CfnRuleProperty.ruleLabels = []){
                const { ruleLabels, ...CfnRulePropertii } = CfnRuleProperty
                CfnRuleProperties = CfnRulePropertii
              }
              else{
                CfnRuleProperties = CfnRuleProperty
              }
              rules.push(CfnRuleProperties)
              count +=1
            }
    
            let name = props.config.WebAcl.Name + "-pre-" + props.config.General.Stage + "-" +props.config.General.DeployHash
            let rulegroupidentifier = "PreRuleGroup"
            if(typeof props.runtimeprops.PreProcessDeployedRuleGroupCapacities[0] !== "undefined"){
              if(props.runtimeprops.PreProcessDeployedRuleGroupCapacities[0] != props.runtimeprops.PreProcessCapacity){
                console.log("⭕️ Deploy new RuleGroup because the Capacity has changed!")
                console.log("\n 🟥 Old Capacity: ["+ props.runtimeprops.PreProcessDeployedRuleGroupCapacities[0] + "]\n 🟩 New Capacity: [" + props.runtimeprops.PreProcessCapacity+"]")
                if(props.runtimeprops.PreProcessDeployedRuleGroupIdentifier[0] == "RuleGroup"){
                  rulegroupidentifier ="preRG"
                }
    
                if(props.runtimeprops.PreProcessDeployedRuleGroupNames[0] == props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" +props.config.General.DeployHash){
                  name = props.config.General.Prefix.toUpperCase() + "-G" + props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" +props.config.General.DeployHash
                }
                console.log(" 💬 New Name: "+ name)
                console.log(" 📇 New Identifier: "+ rulegroupidentifier)
              }
            }
            const rulegroup = new wafv2.CfnRuleGroup(this,rulegroupidentifier, {
              capacity: props.runtimeprops.PreProcessCapacity,
              scope: props.config.WebAcl.Scope,
              rules: rules,
              name: name,
              visibilityConfig: {
                sampledRequestsEnabled: false,
                cloudWatchMetricsEnabled: false,
                metricName: props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" +props.config.General.DeployHash,
              }
            });
            preProcessRuleGroups.push({"ruleGroupType":"RuleGroup","ruleGroupArn":"${"+ rulegroupidentifier +".Arn}","overrideAction":{"type":"NONE"}});
            console.log("  ➡️  Creating " + rulegroupidentifier + " with calculated capacity: [" + props.runtimeprops.PreProcessCapacity +"]")
            props.runtimeprops.PreProcessDeployedRuleGroupCapacities.splice(0)
            props.runtimeprops.PreProcessDeployedRuleGroupIdentifier.splice(0)
            props.runtimeprops.PreProcessDeployedRuleGroupNames.splice(0)
    
            props.runtimeprops.PreProcessDeployedRuleGroupIdentifier[0] = rulegroupidentifier
            props.runtimeprops.PreProcessDeployedRuleGroupNames[0] = name
            props.runtimeprops.PreProcessDeployedRuleGroupCapacities[0] = props.runtimeprops.PreProcessCapacity
    
    
            new cdk.CfnOutput(this, "PreProcessDeployedRuleGroupNames", {
              value: props.runtimeprops.PreProcessDeployedRuleGroupNames.toString(),
              description: "PreProcessDeployedRuleGroupNames",
              exportName: "PreProcessDeployedRuleGroupNames"+props.config.General.DeployHash,
            });
    
            new cdk.CfnOutput(this, "PreProcessDeployedRuleGroupCapacities", {
              value: props.runtimeprops.PreProcessDeployedRuleGroupCapacities.toString(),
              description: "PreProcessDeployedRuleGroupCapacities",
              exportName: "PreProcessDeployedRuleGroupCapacities"+props.config.General.DeployHash,
            });
    
            new cdk.CfnOutput(this, "PreProcessDeployedRuleGroupIdentifier", {
              value: props.runtimeprops.PreProcessDeployedRuleGroupIdentifier.toString(),
              description: "PreProcessDeployedRuleGroupIdentifier",
              exportName: "PreProcessDeployedRuleGroupIdentifier"+props.config.General.DeployHash,
            });
    
        }
        else{
          const threshold = 100
          const rulesets: any[]  = []
          const indexes: number[] = []
          const rulegroupcapacities = []
          while(indexes.length<props.runtimeprops.PreProcessRuleCapacities.length){
            let tracker = 0
            const ruleset: any[] = []
            props.runtimeprops.PreProcessRuleCapacities.map((v,i) => {
              if(!(indexes.find((e)=> e === i+1))){ 
                if(v+tracker <= threshold){
                  tracker += v
                  ruleset.push(i)
                  indexes.push(i+1)
                }
              }
            })
            rulesets.push(ruleset)
            rulegroupcapacities.push(tracker)
          }

          console.log(`  🖖 Split Rules into ${rulesets.length.toString()} RuleGroups: \n`);
          let count = 0
          let rulegroupidentifier = ""
          let name =""
          while (count < rulesets.length){
            if(typeof props.runtimeprops.PreProcessDeployedRuleGroupCapacities[count] !== "undefined"){
              if(rulegroupcapacities[count] == props.runtimeprops.PreProcessDeployedRuleGroupCapacities[count]){
                rulegroupidentifier = "preR"+count.toString()
                name = props.config.WebAcl.Name + "-pre-" + props.config.General.Stage + "-" + count.toString() + "-" +props.config.General.DeployHash
              }
              else{
                console.log("\n⭕️ Deploy new RuleGroup because the Capacity has changed for " +props.runtimeprops.PreProcessDeployedRuleGroupIdentifier[count] + " !")
                console.log("\n 🟥 Old Capacity: ["+ props.runtimeprops.PreProcessDeployedRuleGroupCapacities[count] + "]\n 🟩 New Capacity: [" + rulegroupcapacities[count] +"]")
                if(typeof props.runtimeprops.PreProcessDeployedRuleGroupCapacities[count] !== "undefined"){
                  if(props.runtimeprops.PreProcessDeployedRuleGroupNames[count] == props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" + count.toString()+ "-" +props.config.General.DeployHash){
                    name = props.config.WebAcl.Name + "-" + props.config.General.Stage + "-preR-" + count.toString() + "-" +props.config.General.DeployHash
                  }
                  else{
                    name = props.config.WebAcl.Name + "-" + props.config.General.Stage + "-pre-" + count.toString() + "-" +props.config.General.DeployHash
                  }
                  console.log(" 💬 New Name: "+ name)
                }
                if(typeof props.runtimeprops.PreProcessDeployedRuleGroupIdentifier[count] !== undefined){
                  if(props.runtimeprops.PreProcessDeployedRuleGroupIdentifier[count] == "R"+count.toString()){
                    rulegroupidentifier = "preG"+count.toString()
                  }
                  else{
                    rulegroupidentifier = "preR"+count.toString()
                  }
                  console.log(" 📇 New Identifier: "+ rulegroupidentifier + "\n")
                }
              }
            }else{
              rulegroupidentifier = "preR"+count.toString()
              name = props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" + count.toString() + "-" +props.config.General.DeployHash
            }
            const CfnRuleProperties = []
            let rulegroupcounter = 0
            while( rulegroupcounter < rulesets[count].length){
              const statementindex = rulesets[count][rulegroupcounter]
              let rulename = ""
              if(props.config.WebAcl.PreProcess.CustomRules[statementindex].Name !== undefined){
                const Temp_Hash = Date.now().toString(36)
                rulename = props.config.WebAcl.PreProcess.CustomRules[statementindex].Name  + "-" + Temp_Hash
              }
              else{
                rulename = props.config.WebAcl.Name + "-" + props.config.General.Stage + "-pre-" + rulegroupcounter.toString() + "-" +props.config.General.DeployHash
              }
              let CfnRuleProperty
              if("Captcha" in props.config.WebAcl.PreProcess.CustomRules[statementindex].Action){
                CfnRuleProperty = {
                  name: rulename,
                  priority: rulegroupcounter,
                  action: toCamel(props.config.WebAcl.PreProcess.CustomRules[statementindex].Action),
                  statement: toCamel(props.config.WebAcl.PreProcess.CustomRules[statementindex].Statement),
                  visibilityConfig: {
                    sampledRequestsEnabled: props.config.WebAcl.PreProcess.CustomRules[statementindex].VisibilityConfig.SampledRequestsEnabled,
                    cloudWatchMetricsEnabled: props.config.WebAcl.PreProcess.CustomRules[statementindex].VisibilityConfig.CloudWatchMetricsEnabled,
                    metricName: rulename + "-metric",
                  },
                  captchaConfig: toCamel(props.config.WebAcl.PreProcess.CustomRules[statementindex].CaptchaConfig),
                  ruleLabels: toCamel(props.config.WebAcl.PreProcess.CustomRules[statementindex].RuleLabels)
                }
              }
              else{
                CfnRuleProperty = {
                  name: rulename,
                  priority: rulegroupcounter,
                  action: toCamel(props.config.WebAcl.PreProcess.CustomRules[statementindex].Action),
                  statement: toCamel(props.config.WebAcl.PreProcess.CustomRules[statementindex].Statement),
                  visibilityConfig: {
                    sampledRequestsEnabled: props.config.WebAcl.PreProcess.CustomRules[statementindex].VisibilityConfig.SampledRequestsEnabled,
                    cloudWatchMetricsEnabled: props.config.WebAcl.PreProcess.CustomRules[statementindex].VisibilityConfig.CloudWatchMetricsEnabled,
                    metricName: rulename + "-metric",
                  },
                  ruleLabels: toCamel(props.config.WebAcl.PreProcess.CustomRules[statementindex].RuleLabels)
                }
              }
              let CfnRuleProperti: wafv2.CfnRuleGroup.RuleProperty

              if(CfnRuleProperty.ruleLabels = []){
                const { ruleLabels, ...CfnRulePropertii } = CfnRuleProperty
                CfnRuleProperti = CfnRulePropertii
              }
              else{
                CfnRuleProperti = CfnRuleProperty
              }
              CfnRuleProperties.push(CfnRuleProperti)
              rulegroupcounter++
            }
            const rulegroup = new wafv2.CfnRuleGroup(this,rulegroupidentifier, {
              capacity: rulegroupcapacities[count],
              scope: props.config.WebAcl.Scope,
              rules: CfnRuleProperties,
              name: name,
              visibilityConfig: {
                sampledRequestsEnabled: false,
                cloudWatchMetricsEnabled: false,
                metricName: name + "-metric",
              }
            });

            preProcessRuleGroups.push({"ruleGroupType":"RuleGroup","ruleGroupArn":"${"+ rulegroupidentifier +".Arn}","overrideAction":{"type":"NONE"}});
            console.log("   ➡️  Creating " + rulegroupidentifier + " with calculated capacity: [" + rulegroupcapacities[count].toString() +"]")
            props.runtimeprops.PreProcessDeployedRuleGroupCapacities[count] = rulegroupcapacities[count]
            props.runtimeprops.PreProcessDeployedRuleGroupIdentifier[count] = rulegroupidentifier
            props.runtimeprops.PreProcessDeployedRuleGroupNames[count] = name
            count++
          }
          const lenght = rulesets.length
          props.runtimeprops.PreProcessDeployedRuleGroupCapacities.splice(lenght)
          props.runtimeprops.PreProcessDeployedRuleGroupIdentifier.splice(lenght)
          props.runtimeprops.PreProcessDeployedRuleGroupNames.splice(lenght)
          const novalue = null

          new cdk.CfnOutput(this, "PreProcessDeployedRuleGroupNames", {
            value: props.runtimeprops.PreProcessDeployedRuleGroupNames.toString(),
            description: "PreProcessDeployedRuleGroupNames",
            exportName: "PreProcessDeployedRuleGroupNames"+props.config.General.DeployHash,
          });

          new cdk.CfnOutput(this, "PreProcessDeployedRuleGroupCapacities", {
            value: props.runtimeprops.PreProcessDeployedRuleGroupCapacities.toString(),
            description: "PreProcessDeployedRuleGroupCapacities",
            exportName: "PreProcessDeployedRuleGroupCapacities"+props.config.General.DeployHash,
          });

          new cdk.CfnOutput(this, "PreProcessDeployedRuleGroupIdentifier", {
            value: props.runtimeprops.PreProcessDeployedRuleGroupIdentifier.toString(),
            description: "PreProcessDeployedRuleGroupIdentifier",
            exportName: "PreProcessDeployedRuleGroupIdentifier"+props.config.General.DeployHash,
          });
        }
      }
      if(props.config.WebAcl.PostProcess.CustomRules === undefined){
        console.log("\nℹ️  No Custom Rules defined in PostProcess.")
      }
      else{
        console.log("\u001b[1m","\n🥈  Custom Rules PostProcess:","\x1b[0m\n")
        if (props.runtimeprops.PostProcessCapacity < 100){
          const rules = [];
          let count = 1
      
          for(const statement of props.config.WebAcl.PostProcess.CustomRules){
            let rulename = ""
            if(statement.Name !== undefined){
              rulename = statement.Name  + "-post-" + props.config.General.DeployHash
            }
            else{
              rulename = props.config.WebAcl.Name + "-" + props.config.General.Stage + "-post-" + count.toString() + "-" +props.config.General.DeployHash
            }
            let CfnRuleProperty
            if("Captcha" in statement.Action){
              CfnRuleProperty = {
                name: rulename,
                priority: count,
                action: toCamel(statement.Action),
                statement: toCamel(statement.Statement),
                visibilityConfig: {
                  sampledRequestsEnabled: statement.VisibilityConfig.SampledRequestsEnabled,
                  cloudWatchMetricsEnabled: statement.VisibilityConfig.CloudWatchMetricsEnabled,
                  metricName: rulename + "-metric",
                },
                captchaConfig: toCamel(statement.CaptchaConfig),
                ruleLabels: toCamel(statement.RuleLabels)
              }
            }
            else{ 
              CfnRuleProperty = {
              name: rulename,
              priority: count,
              action: toCamel(statement.Action),
              statement: toCamel(statement.Statement),
              visibilityConfig: {
                sampledRequestsEnabled: statement.VisibilityConfig.SampledRequestsEnabled,
                cloudWatchMetricsEnabled: statement.VisibilityConfig.CloudWatchMetricsEnabled,
                metricName: rulename + "-metric",
              },
              ruleLabels: toCamel(statement.RuleLabels)
            };}
            let CfnRuleProperti: wafv2.CfnRuleGroup.RuleProperty
            if(CfnRuleProperty.ruleLabels = []){
              const { ruleLabels, ...CfnRulePropertii } = CfnRuleProperty
              CfnRuleProperti = CfnRulePropertii
            }
            else{
              CfnRuleProperti = CfnRuleProperty
            }
            rules.push(CfnRuleProperti)
            count +=1
          }
      
          let name = props.config.WebAcl.Name + "-post-" + props.config.General.Stage + "-" +props.config.General.DeployHash
          let rulegroupidentifier = "PostRuleGroup"
          if(typeof props.runtimeprops.PostProcessDeployedRuleGroupCapacities[0] !== "undefined"){
            if(props.runtimeprops.PostProcessDeployedRuleGroupCapacities[0] != props.runtimeprops.PostProcessCapacity){
              console.log("⭕️ Deploy new RuleGroup because the Capacity has changed!")
              console.log("\n 🟥 Old Capacity: ["+ props.runtimeprops.PostProcessDeployedRuleGroupCapacities[0] + "]\n 🟩 New Capacity: [" + props.runtimeprops.PostProcessCapacity+"]")
              if(props.runtimeprops.PostProcessDeployedRuleGroupIdentifier[0] == "RuleGroup"){
                rulegroupidentifier ="postRG"
              }
      
              if(props.runtimeprops.PostProcessDeployedRuleGroupNames[0] == props.config.WebAcl.Name + "-" + props.config.General.Stage + "-post-" +props.config.General.DeployHash){
                name = props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage + "-postG-" +props.config.General.DeployHash
              }
              console.log(" 💬 New Name: "+ name)
              console.log(" 📇 New Identifier: "+ rulegroupidentifier)
            }
          }
          const rulegroup = new wafv2.CfnRuleGroup(this,rulegroupidentifier, {
            capacity: props.runtimeprops.PostProcessCapacity,
            scope: props.config.WebAcl.Scope,
            rules: rules,
            name: name,
            visibilityConfig: {
              sampledRequestsEnabled: false,
              cloudWatchMetricsEnabled: false,
              metricName: name + "-metric",
            }
          });
          postProcessRuleGroups.push({"ruleGroupType":"RuleGroup","ruleGroupArn":"${"+ rulegroupidentifier +".Arn}","overrideAction":{"type":"NONE"}});
          console.log("     ➡️  Creating " + rulegroupidentifier + " with calculated capacity: [" + props.runtimeprops.PostProcessCapacity +"]")
          props.runtimeprops.PostProcessDeployedRuleGroupCapacities.splice(0)
          props.runtimeprops.PostProcessDeployedRuleGroupIdentifier.splice(0)
          props.runtimeprops.PostProcessDeployedRuleGroupNames.splice(0)
      
          props.runtimeprops.PostProcessDeployedRuleGroupIdentifier[0] = rulegroupidentifier
          props.runtimeprops.PostProcessDeployedRuleGroupNames[0] = name
          props.runtimeprops.PostProcessDeployedRuleGroupCapacities[0] = props.runtimeprops.PostProcessCapacity
      
      
          new cdk.CfnOutput(this, "PostProcessDeployedRuleGroupNames", {
            value: props.runtimeprops.PostProcessDeployedRuleGroupNames.toString(),
            description: "PostProcessDeployedRuleGroupNames",
            exportName: "PostProcessDeployedRuleGroupNames"+props.config.General.DeployHash,
          });
      
          new cdk.CfnOutput(this, "PostProcessDeployedRuleGroupCapacities", {
            value: props.runtimeprops.PostProcessDeployedRuleGroupCapacities.toString(),
            description: "PostProcessDeployedRuleGroupCapacities",
            exportName: "PostProcessDeployedRuleGroupCapacities"+props.config.General.DeployHash,
          });
      
          new cdk.CfnOutput(this, "PostProcessDeployedRuleGroupIdentifier", {
            value: props.runtimeprops.PostProcessDeployedRuleGroupIdentifier.toString(),
            description: "PostProcessDeployedRuleGroupIdentifier",
            exportName: "PostProcessDeployedRuleGroupIdentifier"+props.config.General.DeployHash,
          });
      
        }
        else{
          const threshold = 100
          const rulesets: any[]  = []
          const indexes: number[] = []
          const rulegroupcapacities = []
          while(indexes.length<props.runtimeprops.PostProcessRuleCapacities.length){
            let tracker = 0
            const ruleset: any[] = []
            props.runtimeprops.PostProcessRuleCapacities.map((v,i) => {
              if(!(indexes.find((e)=> e === i+1))){ 
                if(v+tracker <= threshold){
                  tracker += v
                  ruleset.push(i)
                  indexes.push(i+1)
                }
              }
            })
            rulesets.push(ruleset)
            rulegroupcapacities.push(tracker)
          }
        
          console.log(`  🖖 Split Rules into ${rulesets.length.toString()} RuleGroups:\n`);
          let count = 0
          let rulegroupidentifier = ""
          let name =""
          while (count < rulesets.length){
            if(typeof props.runtimeprops.PostProcessDeployedRuleGroupCapacities[count] !== "undefined"){
              if(rulegroupcapacities[count] == props.runtimeprops.PostProcessDeployedRuleGroupCapacities[count]){
                rulegroupidentifier = "postR"+count.toString()
                name = props.config.WebAcl.Name + "-post-" + props.config.General.Stage + "-" + count.toString() + "-" +props.config.General.DeployHash
              }
              else{
                console.log("\n⭕️ Deploy new RuleGroup because the Capacity has changed for " +props.runtimeprops.PostProcessDeployedRuleGroupIdentifier[count] + " !")
                console.log("\n 🟥 Old Capacity: ["+ props.runtimeprops.PostProcessDeployedRuleGroupCapacities[count] + "]\n 🟩 New Capacity: [" + rulegroupcapacities[count] +"]")
                if(typeof props.runtimeprops.PostProcessDeployedRuleGroupCapacities[count] !== "undefined"){
                  if(props.runtimeprops.PostProcessDeployedRuleGroupNames[count] == props.config.WebAcl.Name + "-post-" + props.config.General.Stage + "-" + count.toString()+ "-" +props.config.General.DeployHash){
                    name = props.config.WebAcl.Name + "-" + props.config.General.Stage + "-postR-" + count.toString() + "-" +props.config.General.DeployHash
                  }
                  else{
                    name = props.config.WebAcl.Name + "-" + props.config.General.Stage + "-post-" + count.toString() + "-" +props.config.General.DeployHash
                  }
                  console.log(" 💬 New Name: "+ name)
                }
                if(typeof props.runtimeprops.PostProcessDeployedRuleGroupIdentifier[count] !== undefined){
                  if(props.runtimeprops.PostProcessDeployedRuleGroupIdentifier[count] == "R"+count.toString()){
                    rulegroupidentifier = "postG"+count.toString()
                  }
                  else{
                    rulegroupidentifier = "postR"+count.toString()
                  }
                  console.log(" 📇 New Identifier: "+ rulegroupidentifier + "\n")
                }
              }
            }else{
              rulegroupidentifier = "postR"+count.toString()
              name = props.config.WebAcl.Name + "-" + props.config.General.Stage + "-post-" + count.toString() + "-" +props.config.General.DeployHash
            }
            const CfnRuleProperties = []
            let rulegroupcounter = 0
            while( rulegroupcounter < rulesets[count].length){
              const statementindex = rulesets[count][rulegroupcounter]
              let rulename = ""
              if(props.config.WebAcl.PostProcess.CustomRules[statementindex].Name !== undefined){
                const Temp_Hash = Date.now().toString(36)
                rulename = props.config.WebAcl.PostProcess.CustomRules[statementindex].Name  + "-post-" + Temp_Hash
              }
              else{
                rulename = props.config.WebAcl.Name + "-" + props.config.General.Stage + "-post-" + rulegroupcounter.toString() + "-" +props.config.General.DeployHash
              }
              let CfnRuleProperty
              if("Captcha" in props.config.WebAcl.PostProcess.CustomRules[statementindex].Action){
                CfnRuleProperty = {
                  name: rulename,
                  priority: rulegroupcounter,
                  action: toCamel(props.config.WebAcl.PostProcess.CustomRules[statementindex].Action),
                  statement: toCamel(props.config.WebAcl.PostProcess.CustomRules[statementindex].Statement),
                  visibilityConfig: {
                    sampledRequestsEnabled: props.config.WebAcl.PostProcess.CustomRules[statementindex].VisibilityConfig.SampledRequestsEnabled,
                    cloudWatchMetricsEnabled: props.config.WebAcl.PostProcess.CustomRules[statementindex].VisibilityConfig.CloudWatchMetricsEnabled,
                    metricName: rulename + "-metric",
                  },
                  captchaConfig: toCamel(props.config.WebAcl.PostProcess.CustomRules[statementindex].CaptchaConfig),
                  ruleLabels: toCamel(props.config.WebAcl.PostProcess.CustomRules[statementindex].RuleLabels)
                }
              }
              else{
                CfnRuleProperty = {
                  name: rulename,
                  priority: rulegroupcounter,
                  action: toCamel(props.config.WebAcl.PostProcess.CustomRules[statementindex].Action),
                  statement: toCamel(props.config.WebAcl.PostProcess.CustomRules[statementindex].Statement),
                  visibilityConfig: {
                    sampledRequestsEnabled: props.config.WebAcl.PostProcess.CustomRules[statementindex].VisibilityConfig.SampledRequestsEnabled,
                    cloudWatchMetricsEnabled: props.config.WebAcl.PostProcess.CustomRules[statementindex].VisibilityConfig.CloudWatchMetricsEnabled,
                    metricName: rulename + "-metric",
                  },
                  ruleLabels: toCamel(props.config.WebAcl.PostProcess.CustomRules[statementindex].RuleLabels)
                }
              }
              let CfnRuleProperti: wafv2.CfnRuleGroup.RuleProperty
              if(CfnRuleProperty.ruleLabels = []){
                const { ruleLabels, ...CfnRulePropertii } = CfnRuleProperty
                CfnRuleProperti = CfnRulePropertii
              }
              else{
                const CfnRulePropertii = CfnRuleProperty
                CfnRuleProperti = CfnRulePropertii
              }
              CfnRuleProperties.push(CfnRuleProperti)
              rulegroupcounter++
            }
            const rulegroup = new wafv2.CfnRuleGroup(this,rulegroupidentifier, {
              capacity: rulegroupcapacities[count],
              scope: props.config.WebAcl.Scope,
              rules: CfnRuleProperties,
              name: name,
              visibilityConfig: {
                sampledRequestsEnabled: false,
                cloudWatchMetricsEnabled: false,
                metricName: props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" + count.toString() + "-" +props.config.General.DeployHash,
              }
            });
        
            postProcessRuleGroups.push({"ruleGroupType":"RuleGroup","ruleGroupArn":"${"+ rulegroupidentifier +".Arn}","overrideAction":{"type":"NONE"}});
            console.log("   ➡️  Creating " + rulegroupidentifier + " with calculated capacity: [" + rulegroupcapacities[count].toString() +"]")
            props.runtimeprops.PostProcessDeployedRuleGroupCapacities[count] = rulegroupcapacities[count]
            props.runtimeprops.PostProcessDeployedRuleGroupIdentifier[count] = rulegroupidentifier
            props.runtimeprops.PostProcessDeployedRuleGroupNames[count] = name
            count++
          }
          const lenght = rulesets.length
          props.runtimeprops.PostProcessDeployedRuleGroupCapacities.splice(lenght)
          props.runtimeprops.PostProcessDeployedRuleGroupIdentifier.splice(lenght)
          props.runtimeprops.PostProcessDeployedRuleGroupNames.splice(lenght)
          const novalue = null
        
          new cdk.CfnOutput(this, "PostProcessDeployedRuleGroupNames", {
            value: props.runtimeprops.PostProcessDeployedRuleGroupNames.toString(),
            description: "PostProcessDeployedRuleGroupNames",
            exportName: "PostProcessDeployedRuleGroupNames"+props.config.General.DeployHash,
          });
        
          new cdk.CfnOutput(this, "PostProcessDeployedRuleGroupIdentifier", {
            value: props.runtimeprops.PostProcessDeployedRuleGroupIdentifier.toString(),
            description: "PostProcessDeployedRuleGroupIdentifier",
            exportName: "PostProcessDeployedRuleGroupIdentifier"+props.config.General.DeployHash,
          });
        
          new cdk.CfnOutput(this, "PostProcessDeployedRuleGroupCapacities", {
            value: props.runtimeprops.PostProcessDeployedRuleGroupCapacities.toString(),
            description: "PostProcessDeployedRuleGroupCapacities",
            exportName: "PostProcessDeployedRuleGroupCapacities"+props.config.General.DeployHash,
          });
        }
      }
      const novalue = null
      if(props.config.WebAcl.PostProcess.ManagedRuleGroups === undefined){
        console.log("\nℹ️  No ManagedRuleGroups defined in PostProcess.")
      }
      else{
        let mangedrule;
      for(mangedrule of props.config.WebAcl.PostProcess.ManagedRuleGroups){
        let ExcludeRules;
        let OverrideAction;
        if(mangedrule.ExcludeRules){
          ExcludeRules = toCamel(mangedrule.ExcludeRules)
          OverrideAction = mangedrule.OverrideAction
        }
        else{
          ExcludeRules = []
          OverrideAction = { "type": "NONE" }
        }
        if(mangedrule.Version == ""){
          postProcessRuleGroups.push({"managedRuleGroupIdentifier": {"vendorName": mangedrule.Vendor,
            "managedRuleGroupName":mangedrule.Name,"version": novalue},"overrideAction": OverrideAction,
          "ruleGroupArn": novalue,"excludeRules": ExcludeRules,"ruleGroupType": "ManagedRuleGroup"});}
        else{
          postProcessRuleGroups.push({"managedRuleGroupIdentifier": {"vendorName": mangedrule.Vendor,
            "managedRuleGroupName":mangedrule.Name,"version": mangedrule.Version},"overrideAction": OverrideAction,
          "ruleGroupArn": novalue,"excludeRules": ExcludeRules,"ruleGroupType": "ManagedRuleGroup"});}
      }
    }
    if(props.config.WebAcl.PreProcess.ManagedRuleGroups === undefined){
      console.log("ℹ️  No ManagedRuleGroups defined in PreProcess.")
    }
    else{
      let mangedrule;
    for(mangedrule of props.config.WebAcl.PreProcess.ManagedRuleGroups){
      let PreProcessExcludeRules = [];
      let OverrideAction;
      if(mangedrule.ExcludeRules){
        PreProcessExcludeRules = toCamel(mangedrule.ExcludeRules)
        OverrideAction = mangedrule.OverrideAction
      }
      else{
        PreProcessExcludeRules = []
        OverrideAction = { "type": "NONE" }
      }
      if(mangedrule.Version == ""){
        preProcessRuleGroups.push({"managedRuleGroupIdentifier": {"vendorName": mangedrule.Vendor,
          "managedRuleGroupName":mangedrule.Name,"version": novalue},"overrideAction": OverrideAction,
        "ruleGroupArn": novalue,"excludeRules": PreProcessExcludeRules,"ruleGroupType": "ManagedRuleGroup"});}
      else{
        preProcessRuleGroups.push({"managedRuleGroupIdentifier": {"vendorName": mangedrule.Vendor,
          "managedRuleGroupName":mangedrule.Name,"version": mangedrule.Version},"overrideAction": OverrideAction,
        "ruleGroupArn": novalue,"excludeRules": PreProcessExcludeRules,"ruleGroupType": "ManagedRuleGroup"});}
    }
  }
      if(postProcessRuleGroups == []){
        const securityservicepolicydata = {
          "type":"WAFV2",
          "defaultAction":{ "type":"ALLOW" },
          "preProcessRuleGroups": preProcessRuleGroups,
          "postProcessRuleGroups": [],
          "overrideCustomerWebACLAssociation":true,
          "loggingConfiguration": {
            "logDestinationConfigs":["${S3DeliveryStream.Arn}"]
          }
        }
        const fmsPolicy = new fms.CfnPolicy(this, "CfnPolicy", {
          excludeResourceTags: false,
          remediationEnabled: false,
          resourceType: props.config.WebAcl.Type,
          policyName: props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage+ "-" +props.config.General.DeployHash,
          includeMap: {account: props.config.General.DeployTo },
          securityServicePolicyData: {"Type": "WAFV2","ManagedServiceData": cdk.Fn.sub(JSON.stringify(securityservicepolicydata))}
        });
      }
      if(preProcessRuleGroups == []){
      const securityservicepolicydata = {
        "type":"WAFV2",
        "defaultAction":{ "type":"ALLOW" },
        "preProcessRuleGroups": [],
        "postProcessRuleGroups": postProcessRuleGroups,
        "overrideCustomerWebACLAssociation":true,
        "loggingConfiguration": {
          "logDestinationConfigs":["${S3DeliveryStream.Arn}"]
        }
      }
      const fmsPolicy = new fms.CfnPolicy(this, "CfnPolicy", {
        excludeResourceTags: false,
        remediationEnabled: false,
        resourceType: props.config.WebAcl.Type,
        policyName: props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage+ "-" +props.config.General.DeployHash,
        includeMap: {account: props.config.General.DeployTo },
        securityServicePolicyData: {"Type": "WAFV2","ManagedServiceData": cdk.Fn.sub(JSON.stringify(securityservicepolicydata))}
      });
      }
      if(preProcessRuleGroups != [] && postProcessRuleGroups != []){
        const securityservicepolicydata = {
          "type":"WAFV2",
          "defaultAction":{ "type":"ALLOW" },
          "preProcessRuleGroups": preProcessRuleGroups,
          "postProcessRuleGroups": postProcessRuleGroups,
          "overrideCustomerWebACLAssociation":true,
          "loggingConfiguration": {
            "logDestinationConfigs":["${S3DeliveryStream.Arn}"]
          }
        }
        const fmsPolicy = new fms.CfnPolicy(this, "CfnPolicy", {
          excludeResourceTags: false,
          remediationEnabled: false,
          resourceType: props.config.WebAcl.Type,
          policyName: props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage+ "-" +props.config.General.DeployHash,
          includeMap: {account: props.config.General.DeployTo },
          securityServicePolicyData: {"Type": "WAFV2","ManagedServiceData": cdk.Fn.sub(JSON.stringify(securityservicepolicydata))}
        });
        }
    }

    const options = { flag : "w", force: true };
    const { promises: fsp } = require("fs");
    (async () => {
      try {
        await fsp.writeFile(process.env.PROCESS_PARAMETERS,JSON.stringify(props.config,null,2),options);
      } catch (error) {
        console.log("Error " + error)
      }
    })();
  }

}
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
    if(props.runtimeprops.DeployedRuleGroupCapacities === undefined){
      console.log("⚙️ Initialize lists for Update mechanism.")
      props.runtimeprops.DeployedRuleGroupCapacities = []
      props.runtimeprops.DeployedRuleGroupNames = []
      props.runtimeprops.DeployedRuleGroupIdentifier = []}

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

    if(props.config.WebAcl.Rules == undefined)
    {
      console.log("Creating DEFAULT Policy.")
      const novalue = null
      let mangedrule;
      let ExcludeRules;
      let OverrideAction;
      const preProcessRuleGroups = []
      for(mangedrule of props.config.WebAcl.ManagedRuleGroups){
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
    else{
      if (props.runtimeprops.Capacity < 100){
        const rules = [];
        let count = 1

        for(const statement of props.config.WebAcl.Rules){
          let rulename = ""
          if(statement.Name !== undefined){
            const Temp_Hash = Date.now().toString(36)
            rulename = statement.Name  + "-" + Temp_Hash
          }
          else{
            rulename = props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" + count.toString() + "-" +props.config.General.DeployHash
          }
          let CfnRuleProperty: wafv2.CfnRuleGroup.RuleProperty
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
          };}
          rules.push(CfnRuleProperty)
          count +=1
        }

        let name = props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" +props.config.General.DeployHash
        let rulegroupidentifier = "RuleGroup"
        if(typeof props.runtimeprops.DeployedRuleGroupCapacities[0] !== "undefined"){
          if(props.runtimeprops.DeployedRuleGroupCapacities[0] != props.runtimeprops.Capacity){
            console.log("⭕️ Deploy new RuleGroup because the Capacity has changed!")
            console.log("\n 🟥 Old Capacity: ["+ props.runtimeprops.DeployedRuleGroupCapacities[0] + "]\n 🟩 New Capacity: [" + props.runtimeprops.Capacity+"]")
            if(props.runtimeprops.DeployedRuleGroupIdentifier[0] == "RuleGroup"){
              rulegroupidentifier ="RG"
            }

            if(props.runtimeprops.DeployedRuleGroupNames[0] == props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" +props.config.General.DeployHash){
              name = props.config.General.Prefix.toUpperCase() + "-G" + props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" +props.config.General.DeployHash
            }
            console.log(" 💬 New Name: "+ name)
            console.log(" 📇 New Identifier: "+ rulegroupidentifier)
          }
        }
        const rulegroup = new wafv2.CfnRuleGroup(this,rulegroupidentifier, {
          capacity: props.runtimeprops.Capacity,
          scope: props.config.WebAcl.Scope,
          rules: rules,
          name: name,
          visibilityConfig: {
            sampledRequestsEnabled: false,
            cloudWatchMetricsEnabled: false,
            metricName: props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" +props.config.General.DeployHash,
          }
        });
        const preProcessRuleGroups = []

        preProcessRuleGroups.push({"ruleGroupType":"RuleGroup","ruleGroupArn":"${"+ rulegroupidentifier +".Arn}","overrideAction":{"type":"NONE"}});
        console.log("  ➡️  Creating " + rulegroupidentifier + " with calculated capacity: [" + props.runtimeprops.Capacity +"]")
        const novalue = null
        let mangedrule;
        let ExcludeRules;
        let OverrideAction;
        for(mangedrule of props.config.WebAcl.ManagedRuleGroups){
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

        props.runtimeprops.DeployedRuleGroupCapacities.splice(0)
        props.runtimeprops.DeployedRuleGroupIdentifier.splice(0)
        props.runtimeprops.DeployedRuleGroupNames.splice(0)

        props.runtimeprops.DeployedRuleGroupIdentifier[0] = rulegroupidentifier
        props.runtimeprops.DeployedRuleGroupNames[0] = name
        props.runtimeprops.DeployedRuleGroupCapacities[0] = props.runtimeprops.Capacity


        new cdk.CfnOutput(this, "DeployedRuleGroupNames", {
          value: props.runtimeprops.DeployedRuleGroupNames.toString(),
          description: "DeployedRuleGroupNames",
          exportName: "DeployedRuleGroupNames"+props.config.General.DeployHash,
        });

        new cdk.CfnOutput(this, "DeployedRuleGroupCapacities", {
          value: props.runtimeprops.DeployedRuleGroupCapacities.toString(),
          description: "DeployedRuleGroupCapacities",
          exportName: "DeployedRuleGroupCapacities"+props.config.General.DeployHash,
        });

        new cdk.CfnOutput(this, "DeployedRuleGroupIdentifier", {
          value: props.runtimeprops.DeployedRuleGroupIdentifier.toString(),
          description: "DeployedRuleGroupIdentifier",
          exportName: "DeployedRuleGroupIdentifier"+props.config.General.DeployHash,
        });



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
      else{
        const threshold = 100
        const rulesets: any[]  = []
        const indexes: number[] = []
        const rulegroupcapacities = []
        while(indexes.length<props.runtimeprops.RuleCapacities.length){
          let tracker = 0
          const ruleset: any[] = []
          props.runtimeprops.RuleCapacities.map((v,i) => {
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

        console.log(`🖖 Split Rules into ${rulesets.length.toString()} RuleGroups \n  ℹ️  AWS Limitation 100 Capacity per RuleGroup\n`);
        let count = 0
        const preProcessRuleGroups = []
        let rulegroupidentifier = ""
        let name =""
        while (count < rulesets.length){
          if(typeof props.runtimeprops.DeployedRuleGroupCapacities[count] !== "undefined"){
            if(rulegroupcapacities[count] == props.runtimeprops.DeployedRuleGroupCapacities[count]){
              rulegroupidentifier = "R"+count.toString()
              name = props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" + count.toString() + "-" +props.config.General.DeployHash
            }
            else{
              console.log("\n⭕️ Deploy new RuleGroup because the Capacity has changed for " +props.runtimeprops.DeployedRuleGroupIdentifier[count] + " !")
              console.log("\n 🟥 Old Capacity: ["+ props.runtimeprops.DeployedRuleGroupCapacities[count] + "]\n 🟩 New Capacity: [" + rulegroupcapacities[count] +"]")
              if(typeof props.runtimeprops.DeployedRuleGroupNames[count] !== "undefined"){
                if(props.runtimeprops.DeployedRuleGroupNames[count] == props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" + count.toString()+ "-" +props.config.General.DeployHash){
                  name = props.config.WebAcl.Name + "-" + props.config.General.Stage + "-R" + count.toString() + "-" +props.config.General.DeployHash
                }
                else{
                  name = props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" + count.toString() + "-" +props.config.General.DeployHash
                }
                console.log(" 💬 New Name: "+ name)
              }
              if(typeof props.runtimeprops.DeployedRuleGroupIdentifier[count] !== undefined){
                if(props.runtimeprops.DeployedRuleGroupIdentifier[count] == "R"+count.toString()){
                  rulegroupidentifier = "G"+count.toString()
                }
                else{
                  rulegroupidentifier = "R"+count.toString()
                }
                console.log(" 📇 New Identifier: "+ rulegroupidentifier + "\n")
              }
            }
          }else{
            rulegroupidentifier = "R"+count.toString()
            name = props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" + count.toString() + "-" +props.config.General.DeployHash
          }
          const CfnRuleProperties = []
          let rulegroupcounter = 0
          while( rulegroupcounter < rulesets[count].length){
            const statementindex = rulesets[count][rulegroupcounter]
            let rulename = ""
            if(props.config.WebAcl.Rules[statementindex].Name !== undefined){
              const Temp_Hash = Date.now().toString(36)
              rulename = props.config.WebAcl.Rules[statementindex].Name  + "-" + Temp_Hash
            }
            else{
              rulename = rulegroupcounter.toString()
            }
            let CfnRuleProperty: wafv2.CfnRuleGroup.RuleProperty
            if("Captcha" in props.config.WebAcl.Rules[statementindex].Action){
              CfnRuleProperty = {
                name: rulename,
                priority: rulegroupcounter,
                action: toCamel(props.config.WebAcl.Rules[statementindex].Action),
                statement: toCamel(props.config.WebAcl.Rules[statementindex].Statement),
                visibilityConfig: {
                  sampledRequestsEnabled: props.config.WebAcl.Rules[statementindex].VisibilityConfig.SampledRequestsEnabled,
                  cloudWatchMetricsEnabled: props.config.WebAcl.Rules[statementindex].VisibilityConfig.CloudWatchMetricsEnabled,
                  metricName: rulename + "-metric",
                },
                captchaConfig: toCamel(props.config.WebAcl.Rules[statementindex].CaptchaConfig),
              }
            }
            else{
              CfnRuleProperty = {
                name: rulename,
                priority: rulegroupcounter,
                action: toCamel(props.config.WebAcl.Rules[statementindex].Action),
                statement: toCamel(props.config.WebAcl.Rules[statementindex].Statement),
                visibilityConfig: {
                  sampledRequestsEnabled: props.config.WebAcl.Rules[statementindex].VisibilityConfig.SampledRequestsEnabled,
                  cloudWatchMetricsEnabled: props.config.WebAcl.Rules[statementindex].VisibilityConfig.CloudWatchMetricsEnabled,
                  metricName: rulename + "-metric",
                }
              }
            }

            CfnRuleProperties.push(CfnRuleProperty)
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

          preProcessRuleGroups.push({"ruleGroupType":"RuleGroup","ruleGroupArn":"${"+ rulegroupidentifier +".Arn}","overrideAction":{"type":"NONE"}});
          console.log("  ➡️  Creating " + rulegroupidentifier + " with calculated capacity: [" + rulegroupcapacities[count].toString() +"]")
          props.runtimeprops.DeployedRuleGroupCapacities[count] = rulegroupcapacities[count]
          props.runtimeprops.DeployedRuleGroupIdentifier[count] = rulegroupidentifier
          props.runtimeprops.DeployedRuleGroupNames[count] = name
          count++
        }
        const lenght = rulesets.length
        props.runtimeprops.DeployedRuleGroupCapacities.splice(lenght)
        props.runtimeprops.DeployedRuleGroupIdentifier.splice(lenght)
        props.runtimeprops.DeployedRuleGroupNames.splice(lenght)
        const novalue = null

        new cdk.CfnOutput(this, "DeployedRuleGroupNames", {
          value: props.runtimeprops.DeployedRuleGroupNames.toString(),
          description: "DeployedRuleGroupNames",
          exportName: "DeployedRuleGroupNames"+props.config.General.DeployHash,
        });

        new cdk.CfnOutput(this, "DeployedRuleGroupCapacities", {
          value: props.runtimeprops.DeployedRuleGroupCapacities.toString(),
          description: "DeployedRuleGroupCapacities",
          exportName: "DeployedRuleGroupCapacities"+props.config.General.DeployHash,
        });

        new cdk.CfnOutput(this, "DeployedRuleGroupIdentifier", {
          value: props.runtimeprops.DeployedRuleGroupIdentifier.toString(),
          description: "DeployedRuleGroupIdentifier",
          exportName: "DeployedRuleGroupIdentifier"+props.config.General.DeployHash,
        });

        let mangedrule;
        let ExcludeRules;
        let OverrideAction;
        for(mangedrule of props.config.WebAcl.ManagedRuleGroups){
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
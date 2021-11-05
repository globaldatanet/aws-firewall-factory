import * as cdk from "@aws-cdk/core";
import * as wafv2 from "@aws-cdk/aws-wafv2";
import * as fms from "@aws-cdk/aws-fms";
import * as firehouse from "@aws-cdk/aws-kinesisfirehose";
import * as iam from 	"@aws-cdk/aws-iam";
import * as logs from "@aws-cdk/aws-logs";
import * as kms from "@aws-cdk/aws-kms";
import { open, close } from "fs";
import { config, env } from "process";



export interface Config {
  readonly General: {
    readonly Prefix: string,
    readonly Stage: string,
    readonly DeployTo: string[],
  },
  readonly WebAcl:{
    readonly Name: string,
    readonly Scope: string,
    readonly Type: string,
    readonly RuleStatements: any,
    readonly ManagedRuleGroups: any[],
  },
  Capacity: number,
  RuleCapacities: number[],
  DeployedRuleCapacities: number[],
  DeployedRuleNames: string[],
  DeployedRuleIdentifier: string[],
}

function toCamel(o: any) {
  var newO: any, origKey: any, newKey: any, value: any
  if (o instanceof Array) {
    return o.map(function(value) {
      if (typeof value === "object") {
        value = toCamel(value)
      }
      return value
    })
  } else {
    newO = {}
    for (origKey in o) {
      if (o.hasOwnProperty(origKey)) {
        newKey = (origKey.charAt(0).toLowerCase() + origKey.slice(1) || origKey).toString()
        value = o[origKey]
        if (value instanceof Array || (value !== null && value.constructor === Object)) {
          value = toCamel(value)
        }
        newO[newKey] = value
      }
    }
  }
  return newO
}

export interface ConfigStackProps extends cdk.StackProps {
  readonly config: Config;
}


export class PlattformWafv2CdkAutomationStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ConfigStackProps) {
    super(scope, id, props);
    const account_id = cdk.Aws.ACCOUNT_ID;
    const region = cdk.Aws.REGION;
    if(typeof props.config.DeployedRuleCapacities[0] == "undefined"){
      console.log("⚙️ Initialize lists for Update mechanism.")
      props.config.DeployedRuleCapacities = []
      props.config.DeployedRuleNames = []
      props.config.DeployedRuleIdentifier = []}

    const kmskeyArn = kms.Key.fromLookup(this,"S3DefaultKMSKey",{
      aliasName:"alias/"+props.config.General.Prefix.toUpperCase()+"/KMS/S3/DEFAULT/ENCRYPTION"})

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
            "arn:aws:s3:::"+props.config.General.Prefix+"-"+account_id+"-kinesis-wafv2log",
            "arn:aws:s3:::"+props.config.General.Prefix+"-"+account_id+"-kinesis-wafv2log/*"
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
            kmskeyArn.keyArn
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
      deliveryStreamName: "aws-waf-logs-"+props.config.General.Prefix+"-kinesis-wafv2log-"+props.config.WebAcl.Name+props.config.General.Stage,
      extendedS3DestinationConfiguration: {
        bucketArn:"arn:aws:s3:::"+props.config.General.Prefix+"-"+account_id+"-kinesis-wafv2log",
        encryptionConfiguration:{kmsEncryptionConfig:{awskmsKeyArn:kmskeyArn.keyArn}},
        roleArn: CfnRole.attrArn,
        bufferingHints: {sizeInMBs:50, intervalInSeconds:60},
        compressionFormat: "UNCOMPRESSED"
      },

    })

    if(props.config.WebAcl.RuleStatements == "DEFAULT")
    {
      console.log("Creating DEFAULT Policy.")
      const novalue = null
      const securityservicepolicydata = {
        "type":"WAFV2",
        "defaultAction":{ "type":"ALLOW" },
        "preProcessRuleGroups": [
          {
            "managedRuleGroupIdentifier": {
              "vendorName": "AWS",
              "managedRuleGroupName": "AWSManagedRulesCommonRuleSet",
              "version": novalue
            },
            "overrideAction": { "type": "NONE" },
            "ruleGroupArn": novalue,
            "excludeRules": [],
            "ruleGroupType": "ManagedRuleGroup"
          }
        ],
        "postProcessRuleGroups": [
          {
            "managedRuleGroupIdentifier": {
              "vendorName": "AWS",
              "managedRuleGroupName": "AWSManagedRulesAmazonIpReputationList",
              "version": novalue
            },
            "overrideAction": { "type": "NONE" },
            "ruleGroupArn": novalue,
            "excludeRules": [],
            "ruleGroupType": "ManagedRuleGroup"
          }
        ],
        "overrideCustomerWebACLAssociation":true,
        "loggingConfiguration": {
          "logDestinationConfigs":["${S3DeliveryStream.Arn}"]
        }
      }

      const fmsPolicy = new fms.CfnPolicy(this, "CfnPolicy", {
        excludeResourceTags: false,
        remediationEnabled: false,
        resourceType: "AWS::ElasticLoadBalancingV2::LoadBalancer",
        policyName: props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage,
        includeMap: {account: props.config.General.DeployTo },
        securityServicePolicyData: {"Type": "WAFV2","ManagedServiceData": cdk.Fn.sub(JSON.stringify(securityservicepolicydata))}
      });

    }
    else{
      let securityservicepolicydata = {}
      if (props.config.Capacity < 100){
        const rules = [];
        let count = 1
        for(const statement of props.config.WebAcl.RuleStatements){
          const CfnRuleProperty: wafv2.CfnRuleGroup.RuleProperty = {
            name: props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" + count.toString(),
            priority: count,
            action: {
              allow: {}
            },
            statement: toCamel(statement),
            visibilityConfig: {
              sampledRequestsEnabled: false,
              cloudWatchMetricsEnabled: false,
              metricName: props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" + count.toString(),
            },
          };
          rules.push(CfnRuleProperty)
          count +=1
        }

        let name = props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage
        let rulegroupidentifier = "RuleGroup"
        if(typeof props.config.DeployedRuleCapacities[0] !== "undefined"){
          if(props.config.DeployedRuleCapacities[0] != props.config.Capacity){
            console.log("⭕️ Deploy new RuleGroup because the Capacity has changed!")
            console.log("\n 🟥 Old Capacity: ["+ props.config.DeployedRuleCapacities[0] + "]\n 🟩 New Capacity: [" + props.config.Capacity+"]")
            if(props.config.DeployedRuleIdentifier[0] == "RuleGroup"){
              rulegroupidentifier ="RG"
            }

            if(props.config.DeployedRuleNames[0] == props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage){
              name = props.config.General.Prefix.toUpperCase() + "-G" + props.config.WebAcl.Name + "-" + props.config.General.Stage
            }
            console.log(" 💬 New Name: "+ name)
            console.log(" 📇 New Identifier: "+ rulegroupidentifier)
          }
        }
        const rulegroup = new wafv2.CfnRuleGroup(this,rulegroupidentifier, {
          capacity: props.config.Capacity,
          scope: props.config.WebAcl.Scope,
          rules: rules,
          name: name,
          visibilityConfig: {
            sampledRequestsEnabled: false,
            cloudWatchMetricsEnabled: false,
            metricName: props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage,
          }
        });
        const preProcessRuleGroups = []
        const novalue = null
        let mangedrule;
        for(mangedrule of props.config.WebAcl.ManagedRuleGroups){
          if(mangedrule.Version == ""){
            preProcessRuleGroups.push({"managedRuleGroupIdentifier": {"vendorName": mangedrule.Vendor,
              "managedRuleGroupName":mangedrule.Name,"version": novalue},"overrideAction": { "type": "NONE" },
            "ruleGroupArn": novalue,"excludeRules": [],"ruleGroupType": "ManagedRuleGroup"});}
          else{
            preProcessRuleGroups.push({"managedRuleGroupIdentifier": {"vendorName": mangedrule.Vendor,
              "managedRuleGroupName":mangedrule.Name,"version": mangedrule.Version},"overrideAction": { "type": "NONE" },
            "ruleGroupArn": novalue,"excludeRules": [],"ruleGroupType": "ManagedRuleGroup"});}
        }

        props.config.DeployedRuleIdentifier[0] = rulegroupidentifier
        props.config.DeployedRuleNames[0] = name
        props.config.DeployedRuleCapacities[0] = props.config.Capacity
        securityservicepolicydata = {
          "type":"WAFV2",
          "defaultAction":{ "type":"ALLOW" },
          "preProcessRuleGroups": preProcessRuleGroups,
          "postProcessRuleGroups": [],
          "overrideCustomerWebACLAssociation":true,
          "loggingConfiguration": {
            "logDestinationConfigs":["${S3DeliveryStream.Arn}"]
          }
        }
      }
      else{
        const threshold = 100
        const rulesets: any[]  = []
        const indexes: number[] = []
        const rulegroupcapacities = []
        while(indexes.length<props.config.RuleCapacities.length){
          let tracker = 0
          const ruleset: any[] = []
          props.config.RuleCapacities.map((v,i) => {
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
          if(typeof props.config.DeployedRuleCapacities[count] !== "undefined"){

            if(rulegroupcapacities[count] == props.config.DeployedRuleCapacities[count]){
              rulegroupidentifier = "R"+count.toString()
              name = props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" + count.toString()
            }
            else{
              console.log("\n⭕️ Deploy new RuleGroup because the Capacity has changed for " +props.config.DeployedRuleIdentifier[count] + " !")
              console.log("\n 🟥 Old Capacity: ["+ props.config.DeployedRuleCapacities[count] + "]\n 🟩 New Capacity: [" + rulegroupcapacities[count] +"]")
              if(typeof props.config.DeployedRuleNames[count] !== "undefined"){
                if(props.config.DeployedRuleNames[count] == props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" + count.toString()){
                  name = props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage + "-R" + count.toString()
                }
                else{
                  name = props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" + count.toString()
                }
                console.log(" 💬 New Name: "+ name)
              }
              if(typeof props.config.DeployedRuleIdentifier[count] !== "undefined"){
                if(props.config.DeployedRuleIdentifier[count] == "R"+count.toString()){
                  rulegroupidentifier = "G"+count.toString()
                }
                else{
                  rulegroupidentifier = "R"+count.toString()
                }
                console.log(" 📇 New Identifier: "+ rulegroupidentifier + "\n")
              }
            }
          }
          else{
            rulegroupidentifier = "R"+count.toString()
            name = props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" + count.toString()
          }

          const CfnRuleProperties = []
          let rulegroupcounter = 0
          while( rulegroupcounter < rulesets[count].length){
            const statementindex = rulesets[count][rulegroupcounter]
            const CfnRuleProperty: wafv2.CfnRuleGroup.RuleProperty = {
              name: name + rulegroupcounter.toString(),
              priority: rulegroupcounter,
              action: {
                allow: {}
              },
              statement: toCamel(props.config.WebAcl.RuleStatements[statementindex]),
              visibilityConfig: {
                sampledRequestsEnabled: false,
                cloudWatchMetricsEnabled: false,
                metricName: props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" + count.toString(),
              },
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
              metricName: props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage + "-" + count.toString(),
            }
          });

          preProcessRuleGroups.push({"ruleGroupType":"RuleGroup","ruleGroupArn":"${"+ rulegroupidentifier +".Arn}","overrideAction":{"type":"NONE"}});
          console.log("  ➡️  Creating " + rulegroupidentifier + " with calculated capacity: [" + rulegroupcapacities[count].toString() +"]")
          props.config.DeployedRuleCapacities[count] = rulegroupcapacities[count]
          props.config.DeployedRuleIdentifier[count] = rulegroupidentifier
          props.config.DeployedRuleNames[count] = name
          count++
        }
        const lenght = rulesets.length
        props.config.DeployedRuleCapacities.splice(lenght)
        props.config.DeployedRuleIdentifier.splice(lenght)
        props.config.DeployedRuleNames.splice(lenght)
        const novalue = null

        let mangedrule;
        for(mangedrule of props.config.WebAcl.ManagedRuleGroups){
          if(mangedrule.Version == ""){
            preProcessRuleGroups.push({"managedRuleGroupIdentifier": {"vendorName": mangedrule.Vendor,
              "managedRuleGroupName":mangedrule.Name,"version": novalue},"overrideAction": { "type": "NONE" },
            "ruleGroupArn": novalue,"excludeRules": [],"ruleGroupType": "ManagedRuleGroup"});}
          else{
            preProcessRuleGroups.push({"managedRuleGroupIdentifier": {"vendorName": mangedrule.Vendor,
              "managedRuleGroupName":mangedrule.Name,"version": mangedrule.Version},"overrideAction": { "type": "NONE" },
            "ruleGroupArn": novalue,"excludeRules": [],"ruleGroupType": "ManagedRuleGroup"});}
        }

        securityservicepolicydata = {
          "type":"WAFV2",
          "defaultAction":{ "type":"ALLOW" },
          "preProcessRuleGroups": preProcessRuleGroups,
          "postProcessRuleGroups": [],
          "overrideCustomerWebACLAssociation":true,
          "loggingConfiguration": {
            "logDestinationConfigs":["${S3DeliveryStream.Arn}"]
          }
        }
      }
      const fmsPolicy = new fms.CfnPolicy(this, "CfnPolicy", {
        excludeResourceTags: false,
        remediationEnabled: false,
        resourceType: props.config.WebAcl.Type,
        policyName: props.config.General.Prefix.toUpperCase() + "-" + props.config.WebAcl.Name + "-" + props.config.General.Stage,
        includeMap: {account: props.config.General.DeployTo},
        securityServicePolicyData: {"Type": "WAFV2","ManagedServiceData": cdk.Fn.sub(JSON.stringify(securityservicepolicydata))}
      });
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
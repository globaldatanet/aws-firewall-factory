/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_wafv2 as wafv2, aws_fms as fms,aws_lambda_nodejs as NodejsFunction, aws_lambda as lambda, aws_kinesisfirehose as firehouse, aws_iam as iam, aws_logs as logs   } from "aws-cdk-lib";
import { runtime, waf  } from "../types/config/index";
import {WafCloudWatchDashboard} from "../constructs/wafDashboard/index";
import * as path from "path";
import * as cr from "aws-cdk-lib/custom-resources";
import { v5 as uuidv5 } from "uuid";
import { wafHelper } from "../tools/helpers";



/**
 * @group Interfaces
 * @description
 * Specifies the Waf Stack properties.
 * 
 * @param {wafConfig} config  Variable for a WAF Config.
 * @param {RuntimeProperties} runtimeProperties Variable for Runtime Properties.
 */
export interface ConfigStackProps extends cdk.StackProps {
    /**
   * Class Variable for WAF Properties.
   */
  readonly config: waf.WafConfig;
    /**
   * Class Variable for Runtime Properties.
   */
  runtimeProperties: runtime.RuntimeProps;
}

export class WafStack extends cdk.Stack {
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

      new iam.CfnPolicy(this, "KinesisS3DeliveryPolicy", { // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Sonarqube identify the following Error: Either remove this useless object instantiation or use it. 
        policyDocument: policy,
        policyName: "firehose_delivery_policy",
        roles: [cfnRole.ref],
      });

      new firehouse.CfnDeliveryStream(this, "S3DeliveryStream", { // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Sonarqube identify the following Error: Either remove this useless object instantiation or use it. 
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
        const deployHashString = props.config.General.DeployHash ? `-${props.config.General.DeployHash}` : "";
        const ipSetDescription = ipSet.description || `IP Set created by AWS Firewall Factory\nused in ${props.config.General.Prefix.toUpperCase()}-${props.config.WebAcl.Name}-${props.config.General.Stage}-Firewall${deployHashString}`;
        const cfnipset = new wafv2.CfnIPSet(this, ipSet.name, { // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Sonarqube identify the following Error: Either remove this useless object instantiation or use it. 
          // TODO: Push adding the config name to the ipset to upstream
          name: `${props.config.General.Prefix}-${props.config.General.Stage}-${props.config.WebAcl.Name}-${ipSet.name}`,
          description: ipSetDescription,
          addresses: addresses,
          ipAddressVersion: ipSet.ipAddressVersion,
          scope: props.config.WebAcl.Scope,
          tags: ipSet.tags ?? undefined
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
        const cfnRegexPatternSet = new wafv2.CfnRegexPatternSet(this, regexPatternSet.name, { // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Sonarqube identify the following Error: Either remove this useless object instantiation or use it. 
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
    const managedRuleGroupVersionLambdaRole = new iam.Role(this, "managedRuleGroupVersionLambdaRole", { // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Sonarqube identify the following Error: Either remove this useless object instantiation or use it. 
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    managedRuleGroupVersionLambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName(
      "service-role/AWSLambdaBasicExecutionRole",
    ),);
    const wafGetManagedRuleGroupVersion = new iam.PolicyStatement({ // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Sonarqube identify the following Error: Either remove this useless object instantiation or use it. 
      actions:["wafv2:ListAvailableManagedRuleGroupVersions"],
      resources: ["*"]});

    managedRuleGroupVersionLambdaRole.addToPolicy(wafGetManagedRuleGroupVersion);

    const managedRuleGroupVersionLambda = new NodejsFunction.NodejsFunction(this, "AwsManagedRuleGroupVersionLambdaFunction", { // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Sonarqube identify the following Error: Either remove this useless object instantiation or use it. 
      entry: path.join(__dirname, "../lambda/ManagedRuleGroupVersion/index.ts"),
      handler: "handler",
      timeout: cdk.Duration.seconds(30),
      architecture:lambda.Architecture.ARM_64,
      role: managedRuleGroupVersionLambdaRole,
      memorySize: 128,
      bundling: {
        minify: true,
      },
      runtime: lambda.Runtime.NODEJS_20_X,
    });

    new logs.LogGroup(this, "managedRuleGroupVersionLambdaFunctionLogGroup",{
      logGroupName: "/aws/lambda/"+managedRuleGroupVersionLambda.functionName,
      retention: logs.RetentionDays.TWO_WEEKS,
    });

    const managedRuleGroupVersionProvider = new cr.Provider(this, "CustomResourceProviderManagedRuleGroupVersionLambda", { // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Sonarqube identify the following Error: Either remove this useless object instantiation or use it. 
      onEventHandler: managedRuleGroupVersionLambda
    });


    // --------------------------------------------------------------------

    const preProcessRuleGroups = [];
    const postProcessRuleGroups = [];
    const MANAGEDRULEGROUPSINFO: string[]= [""];
    let subVariables : waf.SubVariables = {};
    if (props.config.WebAcl.PreProcess.ManagedRuleGroups) {
      const preProcessmanagedRgs = wafHelper.buildServiceDataManagedRgs(this, props.config.WebAcl.PreProcess.ManagedRuleGroups, managedRuleGroupVersionProvider, props.config.WebAcl.Scope, props.runtimeProperties);
      preProcessRuleGroups.push(...preProcessmanagedRgs.ServiceData);
      MANAGEDRULEGROUPSINFO.push(...preProcessmanagedRgs.ManagedRuleGroupInfo);
      subVariables = {...preProcessmanagedRgs.SubVariables};
    } else {
      console.log("\nℹ️  No ManagedRuleGroups defined in PreProcess.");
    }
    if (props.config.WebAcl.PostProcess.ManagedRuleGroups) {
      const postProcessmanagedRgs = wafHelper.buildServiceDataManagedRgs(this, props.config.WebAcl.PostProcess.ManagedRuleGroups, managedRuleGroupVersionProvider, props.config.WebAcl.Scope, props.runtimeProperties);
      postProcessRuleGroups.push(...postProcessmanagedRgs.ServiceData);
      MANAGEDRULEGROUPSINFO.push(...postProcessmanagedRgs.ManagedRuleGroupInfo);
      subVariables = {...postProcessmanagedRgs.SubVariables};
    } else {
      console.log("ℹ️  No ManagedRuleGroups defined in PostProcess.");
    }
    if (props.config.WebAcl.PreProcess.CustomRules) {
      const customRgs  = wafHelper.buildServiceDataCustomRgs(this, "Pre", props.runtimeProperties, props.config, ipSets, regexPatternSets);
      preProcessRuleGroups.push(...customRgs);
    } else {
      console.log("\nℹ️  No Custom Rules defined in PreProcess.");
    }
    if (props.config.WebAcl.PostProcess.CustomRules) {
      const customRgs = wafHelper.buildServiceDataCustomRgs(this, "Post", props.runtimeProperties, props.config, ipSets, regexPatternSets);
      postProcessRuleGroups.push(...customRgs);
    } else {
      console.log("\nℹ️  No Custom Rules defined in PostProcess.");
    }

    const managedServiceData : waf.ManagedServiceData = {
      type: "WAFV2",
      defaultAction: { type: "ALLOW" },
      preProcessRuleGroups: preProcessRuleGroups,
      postProcessRuleGroups: postProcessRuleGroups,
      overrideCustomerWebACLAssociation: props.config.WebAcl.OverrideCustomerWebACLAssociation ? props.config.WebAcl.OverrideCustomerWebACLAssociation : false,
      loggingConfiguration: {
        logDestinationConfigs: [loggingConfiguration || ""],
      },
    };
    const cfnPolicyProps = {
      remediationEnabled: props.config.WebAcl.RemediationEnabled ? props.config.WebAcl.RemediationEnabled : false,
      resourceType: props.config.WebAcl.Type,
      resourceTypeList: props.config.WebAcl.TypeList ?? undefined,
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
      policyDescription: props.config.WebAcl.Description ?? undefined
    };

    const fmspolicy = new fms.CfnPolicy(this, "CfnPolicy", cfnPolicyProps); // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Sonarqube identify the following Error: Either remove this useless object instantiation or use it. 
    if(ipSets.length !== 0){
      for(const ipSet of ipSets){
        fmspolicy.addDependency(ipSet);
      }
    }

    if(props.config.General.CreateDashboard && props.config.General.CreateDashboard === true) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      new WafCloudWatchDashboard(this, "cloudwatch",props.config, MANAGEDRULEGROUPSINFO); // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Sonarqube identify the following Error: Either remove this useless object instantiation or use it. 
    }
  }
}

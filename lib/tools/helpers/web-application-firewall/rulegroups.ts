import * as cdk from "aws-cdk-lib";
import { aws_wafv2 as wafv2 } from "aws-cdk-lib";
import { CustomResponseBodies, NONEVERSIONEDMANAGEDRULEGRPOUP, Config } from "../../../types/config";
import { ManagedRuleGroup, ServiceDataManagedRuleGroup, ServiceDataRuleGroup, Rule, SubVariables } from "../../../types/fms";
import { Scope, WAFV2Client, ListAvailableManagedRuleGroupVersionsCommand, ListAvailableManagedRuleGroupVersionsCommandInput} from "@aws-sdk/client-wafv2";
import { RuntimeProperties, ProcessProperties } from "../../../types/runtimeprops";
import { transformWafRuleStatements } from "./statements";
import { Construct } from "constructs";
import { guidanceHelper } from "../../helpers";
import * as cr from "aws-cdk-lib/custom-resources";


const MANAGEDRULEGROUPSINFO: string[]= [""];
const subVariables : SubVariables = {};

/**
   * * Build Managed RuleGroups as [ManagedServiceData](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-fms-policy-securityservicepolicydata.html#cfn-fms-policy-securityservicepolicydata-managedservicedata) for FMS Policy
   * @param rule Rule
   * @param prefix string
   * @param stage string
   * @param ipSets cdk.aws_wafv2.CfnIPSet[]
   * @param regexPatternSets cdk.aws_wafv2.CfnRegexPatternSet[]
   * @returns adjustedRule
   */
export function buildServiceDataManagedRgs(scope: Construct, managedRuleGroups: ManagedRuleGroup[], managedRuleGroupVersionProvider: cr.Provider, wafScope: string, runtimeProps: RuntimeProperties): { ServiceData: ServiceDataManagedRuleGroup[], ManagedRuleGroupInfo: string[], SubVariables: SubVariables } {
  const cfnManagedRuleGroup : ServiceDataManagedRuleGroup[] = [];
  for (const managedRuleGroup of managedRuleGroups) {
    if(managedRuleGroup.overrideAction?.type === "COUNT"){
      // eslint-disable-next-line quotes
      guidanceHelper.getGuidance("overrideActionManagedRuleGroup", runtimeProps, managedRuleGroup.name);
    }
    if(managedRuleGroup.name === "AWSManagedRulesBotControlRuleSet"){
      managedRuleGroup.awsManagedRulesBotControlRuleSetProperty ? undefined : guidanceHelper.getGuidance("noBotControlRuleSetProperty",runtimeProps);
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
        ruleActionOverrides: managedRuleGroup.ruleActionOverrides ?? undefined,
        awsManagedRulesBotControlRuleSetProperty: managedRuleGroup.awsManagedRulesBotControlRuleSetProperty ?? undefined,
        awsManagedRulesACFPRuleSetProperty: managedRuleGroup.awsManagedRulesACFPRuleSetProperty ?? undefined,
        awsManagedRulesATPRuleSetProperty: managedRuleGroup.awsManagedRulesATPRuleSetProperty ?? undefined,
      });
      MANAGEDRULEGROUPSINFO.push(managedRuleGroup.name+" ["+managedRuleGroup.vendor +"]");
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
      new cdk.CfnOutput(scope, `${managedRuleGroup.name}Version`, { // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Error: Either remove this useless object instantiation or use it.
        value: crManagedRuleGroupanagedRuleGroupVersion.getAttString("Version"),
        description: `Version of ${managedRuleGroup.name} used in ${managedRuleGroup.name} RuleGroup`
      });

      cfnManagedRuleGroup.push({
        managedRuleGroupIdentifier: {
          vendorName: managedRuleGroup.vendor,
          managedRuleGroupName: managedRuleGroup.name,
          version,
          versionEnabled: managedRuleGroup.versionEnabled ?? undefined,
        },
        overrideAction: managedRuleGroup.overrideAction ?? { type: "NONE" },
        ruleGroupArn: null,
        excludeRules: managedRuleGroup.excludeRules ?? [],
        ruleGroupType: "ManagedRuleGroup",
        ruleActionOverrides: managedRuleGroup.ruleActionOverrides ?? undefined,
      });
      MANAGEDRULEGROUPSINFO.push(managedRuleGroup.name+" ["+managedRuleGroup.vendor +"] " + cwVersion);
    }
  }
  return {ServiceData: cfnManagedRuleGroup, ManagedRuleGroupInfo: MANAGEDRULEGROUPSINFO, SubVariables: subVariables};
}

/**
     * Build Custom RuleGroups as ServiceData for FMS Policy
     * @param scope Construct
     * @param type "Pre" | "Post"
     * @param capacity number
     * @param webaclName string
     * @param webAclScope string
     * @param stage string
     * @param processRuntimeProps RuntimeProperties
     * @param prefix string
     * @param ruleGroupSet: Rule[]
     * @param customResponseBodies CustomResponseBodies  | undefined
     * @param ipSets cdk.aws_wafv2.CfnIPSet[]
     * @param regexPatternSets cdk.aws_wafv2.CfnRegexPatternSet[]
     * @param deployHash string
     * @returns serviceDataRuleGroup
     */
export function buildServiceDataCustomRgs(scope: Construct, type: "Pre" | "Post", runtimeProps: RuntimeProperties, config: Config, ipSets: cdk.aws_wafv2.CfnIPSet[],regexPatternSets: cdk.aws_wafv2.CfnRegexPatternSet[]) : ServiceDataRuleGroup[] {
  const webaclName = config.WebAcl.Name;
  const prefix = config.General.Prefix;
  const webAclScope = config.WebAcl.Scope;
  const stage = config.General.Stage;
  const deployHash = config.General.DeployHash;
  const serviceDataRuleGroup : ServiceDataRuleGroup[] = [];
  let icon;
  let capacity: number;
  let processRuntimeProps: ProcessProperties;
  let customResponseBodies: CustomResponseBodies | undefined;
  let ruleGroupSet: Rule[] | undefined;
  if (type === "Pre") {
    icon = "🥇 ";
    processRuntimeProps = runtimeProps.PreProcess;
    capacity = runtimeProps.PreProcess.Capacity;
    customResponseBodies = config.WebAcl.PreProcess.CustomResponseBodies;
    ruleGroupSet = config.WebAcl.PreProcess.CustomRules;
  } else {
    icon = "🥈";
    processRuntimeProps = runtimeProps.PostProcess;
    capacity = runtimeProps.PostProcess.Capacity;
    customResponseBodies = config.WebAcl.PostProcess.CustomResponseBodies;
    ruleGroupSet = config.WebAcl.PostProcess.CustomRules;
  }
  console.log(
    "\u001b[1m",
    "\n"+icon+"  Custom Rules " + type + "Process: ",
    "\x1b[0m\n"
  );

  if (capacity < 1500) {
    const rules = [];
    let count = 1;
    if(ruleGroupSet){
      for (const rule of ruleGroupSet) {
        let rulename = "";
        if (rule.name !== undefined) {
          rulename = `${rule.name}-${type.toLocaleLowerCase()}${deployHash ? "-"+deployHash : ""}`;
        } else {
          rulename = `${webaclName}-${type.toLocaleLowerCase()}-${stage}-${count.toString()}${deployHash ? "-"+deployHash : ""}`;
        }
        // transform ipSetReferenceStatements
        const statement = transformWafRuleStatements(rule, prefix, stage, ipSets,regexPatternSets);
    
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
          guidanceHelper.getGuidance("noRuleLabels", runtimeProps, rulename);
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
        cstResBodies = Object.keys(customResponseBodies).reduce((acc, curr) => { acc[curr] = customResponseBodies![curr]; return acc; }, cstResBodies);
      }
      else {
        cstResBodies = undefined;
      }
      new wafv2.CfnRuleGroup(scope, rulegroupidentifier, { // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Error: Either remove this useless object instantiation or use it.
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
    
      new cdk.CfnOutput(scope, type+"ProcessDeployedRuleGroupNames", { // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Error: Either remove this useless object instantiation or use it.
        value:
            processRuntimeProps.DeployedRuleGroupNames.toString(),
        description: type+"ProcessDeployedRuleGroupNames",
      });
    
      new cdk.CfnOutput(scope, type+"ProcessDeployedRuleGroupCapacities", { // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Error: Either remove this useless object instantiation or use it.
        value: 
            processRuntimeProps.DeployedRuleGroupCapacities.toString(),
        description: type+"ProcessDeployedRuleGroupCapacities",
      });
    
      new cdk.CfnOutput(scope, type+"ProcessDeployedRuleGroupIdentifier", { // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Error: Either remove this useless object instantiation or use it.
        value:
            processRuntimeProps.DeployedRuleGroupIdentifier.toString(),
        description: type+"ProcessDeployedRuleGroupIdentifier",
      });
    }
  } else{
    if(capacity > 1500 && ruleGroupSet){
      const threshold = 1500;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rulesets: any[] = [];
      const indexes: number[] = [];
      const rulegroupcapacities = [];
      //ORDER BY Priority DESC
      while (
        indexes.length < processRuntimeProps.RuleCapacities.length
      ) {
        let tracker = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ruleset: any[] = [];
        processRuntimeProps.RuleCapacities.forEach((capacity, index) => {
          const ruleIndex = index + 1;
          if (!indexes.includes(ruleIndex)) {
            const meetsThreshold = capacity + tracker <= threshold;
            if (meetsThreshold) {
              tracker += capacity;
              ruleset.push(index);
              indexes.push(ruleIndex);
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
    
          const statement = transformWafRuleStatements(ruleGroupSet[statementindex],prefix, stage, ipSets, regexPatternSets);
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
            guidanceHelper.getGuidance("noRuleLabels", runtimeProps, rulename);
          } else {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { ruleLabels, ...cfnRulePropertii } = cfnRuleProperty;
            cfnRuleProperti = cfnRulePropertii;
          }
          cfnRuleProperties.push(cfnRuleProperti);
          rulegroupcounter++;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let cstResBodies: { [key:string]: any} | undefined = {};
        if(customResponseBodies) {
          cstResBodies = Object.keys(customResponseBodies).reduce((acc, curr) => { acc[curr] = customResponseBodies![curr]; return acc; }, cstResBodies);
        }
        else {
          cstResBodies = undefined;
        }
    
        new wafv2.CfnRuleGroup(scope, rulegroupidentifier, { // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Error: Either remove this useless object instantiation or use it.
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
    
      new cdk.CfnOutput(scope, type+"ProcessDeployedRuleGroupNames", { // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Error: Either remove this useless object instantiation or use it.
        value:
            processRuntimeProps.DeployedRuleGroupNames.toString(),
        description: type+"ProcessDeployedRuleGroupNames"
      });
    
      new cdk.CfnOutput(scope, type+"ProcessDeployedRuleGroupCapacities", { // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Error: Either remove this useless object instantiation or use it.
        value:
            processRuntimeProps.DeployedRuleGroupCapacities.toString(),
        description: type+"ProcessDeployedRuleGroupCapacities"
      });
    
      new cdk.CfnOutput(scope, type+"ProcessDeployedRuleGroupIdentifier", { // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Error: Either remove this useless object instantiation or use it.
        value:
            processRuntimeProps.DeployedRuleGroupIdentifier.toString(),
        description: type+"ProcessDeployedRuleGroupIdentifier"
      });
    }
  }
  return serviceDataRuleGroup;
}

/**
 *
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @param vendor vendor of the Managed Rule Group
 * @param rgName vame of the Managed Rule Group
 * @param scope whether scope is REGIONAL or CLOUDFRONT
 * @returns returns the CurrentDefaultVersion of the Managed Rule Group
 */
export async function getcurrentManagedRuleGroupVersion(deploymentRegion: string, vendor: string, rgName: string, scope: "REGIONAL" | "CLOUDFRONT" ): Promise<string | undefined>{
  const client = new WAFV2Client({ region: deploymentRegion});
  if(scope === "CLOUDFRONT"){
    scope = Scope.CLOUDFRONT;
  }else{
    scope = Scope.REGIONAL;
  }
  const input: ListAvailableManagedRuleGroupVersionsCommandInput = {
    VendorName: vendor,
    Name: rgName,
    Scope: scope,
    Limit: 5,
  };
  const command = new ListAvailableManagedRuleGroupVersionsCommand(input);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any = await client.send(command);
  if(response.Versions.length > 0){
    return response.Versions[0].Name;
  }
  else{
    return undefined;
  }
}

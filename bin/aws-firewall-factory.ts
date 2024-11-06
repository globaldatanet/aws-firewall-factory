import { WafStack } from "../lib/_waf/index";
import { PrerequisitesStack } from "../lib/_prerequisites/index";
import { ShieldStack } from "../lib/_shield-advanced/index";
import { AutoUpdatedManagedIpSetsStack } from "../lib/_autoUpdatedManagedIpSets/index";
import * as cdk from "aws-cdk-lib";
import { waf, shield, autoUpdatedManagedIpSets, prerequisites  } from "../lib/types/config/index";
import { general, pricing } from "../lib/types/enums/index";
import * as helpers from "../lib/tools/helpers";


/** 
 * @Module
 * # AWS Firewall Factory
 */

const app = new cdk.App();

// Main function to handle the user choice and deploy respective stack

void (async () => {
  const values = await import("../values");

  /**
  - * relative path to config file imported from the env PROCESS_PARAMETERS
  - */
  const CONFIG_OBJECT_NAME = process.env.PROCESS_PARAMETERS;

  if (
    !CONFIG_OBJECT_NAME ||
    (values.configs[CONFIG_OBJECT_NAME] === undefined &&
      values.prereq[CONFIG_OBJECT_NAME] === undefined &&
      values.shieldConfigs[CONFIG_OBJECT_NAME] === undefined &&
      values.autoUpdatedManagedIpSetsConfigs[CONFIG_OBJECT_NAME] === undefined)
  ) {
    console.log("Configuration ", CONFIG_OBJECT_NAME, " not found.");
    process.exit(1);
  }

  switch (process.env.STACK_NAME) {
    case "PreRequisiteStack": {
      // ---------------------------------------------------------------------
      // Deploying prerequisite stack
      const prerequisites: prerequisites.PrerequisitesConfig = values.prereq[CONFIG_OBJECT_NAME];
      const deploymentRegion = helpers.afwfHelper.outputInfoBanner();
      const runtimeProperties = helpers.afwfHelper.initRuntimeProperties();
      await helpers.ssmHelper.getAllAwsRegionsFromPublicSsmParameter(
        deploymentRegion,
        runtimeProperties
      );
      console.log("ℹ️   Deploying Prerequisites Stack.");
      const app = new cdk.App();
      new PrerequisitesStack(
        app,
        prerequisites.General.Prefix.toUpperCase() +
          "-AWS-FIREWALL-FACTORY-PREQUISITES",
        {
          // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Error: Either remove this useless object instantiation or use it.
          prerequisites,
          env: {
            region: process.env.AWS_REGION,
            account: process.env.CDK_DEFAULT_ACCOUNT,
          },
          runtimeProperties: runtimeProperties,
        }
      );
      break;
    }
    case "ShieldAdvancedStack": {
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
      const shieldConfig: shield.ShieldConfig = values.shieldConfigs[CONFIG_OBJECT_NAME];
      const deploymentRegion = process.env.AWS_REGION;
      const runtimeProperties =  helpers.afwfHelper.initRuntimeProperties();
      console.log(`🛡️  Deploy Shield Policy: ${shieldConfig.General.Prefix.toUpperCase()}-${
        shieldConfig.General.Stage
      }
       \n ⦂ Type:
       ${shieldConfig.resourceType}\n`);
      console.log("\n 🎯 Targets:");
      if (shieldConfig.includeMap?.account) {
        for (const account of shieldConfig.includeMap.account) {
          console.log("\x1b[32m", `   🛬 ${account}`, "\x1b[0m");
        }
      }
      if (shieldConfig.includeMap?.orgunit) {
        for (const unit of shieldConfig.includeMap.orgunit) {
          console.log("\x1b[32m", `   🛬 ${unit}`, "\x1b[0m");
        }
      }
      console.log("\n 📑 Logging:");
      if (shieldConfig.General.LoggingConfiguration === "Firehose") {
        console.log("   🧯  " + shieldConfig.General.LoggingConfiguration);
        console.log(
          "      ⚙️  [" + shieldConfig.General.S3LoggingBucketName + "]"
        );
      }
      if (shieldConfig.General.LoggingConfiguration === "S3") {
        console.log("   🪣  " + shieldConfig.General.LoggingConfiguration);
        console.log(
          "      ⚙️  [" + shieldConfig.General.S3LoggingBucketName + "]"
        );
      }
      const app = new cdk.App();
      new ShieldStack(
        app,
        shieldConfig.General.Prefix.toUpperCase() +
         "-SHIELD-ADVANCED-" +
         shieldConfig.General.Stage.toUpperCase(),
        {
          shieldConfig,
          env: {
            region: deploymentRegion,
            account: process.env.CDK_DEFAULT_ACCOUNT,
          },
          runtimeProperties: runtimeProperties,
        }
      );
      await  helpers.pricingHelper.isShieldPriceCalculated(shieldConfig);
      helpers.guidanceHelper.outputGuidance(runtimeProperties);
      break;
    }
    case "WAFStack": {
      // ---------------------------------------------------------------------
      // Deploying Firewall stack
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const config: waf.WafConfig = values.configs[CONFIG_OBJECT_NAME];
      const deploymentRegion =  helpers.afwfHelper.outputInfoBanner(config);
      const runtimeProperties =  helpers.afwfHelper.initRuntimeProperties();
      if (process.env.SKIP_QUOTA_CHECK === "true") {
        console.log("❗️ SKIPPING Quota Check for Policies.❗️\n\n");
      } else {
        const policyQuotaReached = await  helpers.wafHelper.isPolicyQuotaReached(
          deploymentRegion
        );
        if (policyQuotaReached) {
          console.error(
            "\u001B[31m",
            "🚨 ERROR: Exit process due Quota Check for Policies 🚨 \n\n",
            "\x1b[0m" + "\n\n"
          );
          process.exit(1);
        }
      }
      await  helpers.cloudformationHelper.setOutputsFromStack(
        deploymentRegion,
        runtimeProperties,
        config
      );
      if (config.General.DeployHash) {
        console.log(
          "#️⃣  Deployment Hash for this WAF: " + config.General.DeployHash
        );
        helpers.guidanceHelper.getGuidance("deploymentHash", runtimeProperties);
      }

      console.log(`🔥 Deploy FMS Policy: ${config.General.Prefix.toUpperCase()}-WAF-${config.WebAcl.Name.toUpperCase()}-${config.General.Stage.toUpperCase()}${
        config.General.DeployHash
          ? "-" + config.General.DeployHash.toUpperCase()
          : ""
      }\n ⦂ Type:
        ${config.WebAcl.Type}\n📚 Stackname:`);
      console.log(
        "\u001b[32m",
        `   ${config.General.Prefix.toUpperCase()}-WAF-${config.WebAcl.Name.toUpperCase()}-${config.General.Stage.toUpperCase()}${
          config.General.DeployHash
            ? "-" + config.General.DeployHash.toUpperCase()
            : ""
        }`,
        "\u001b[0m"
      );
      console.log("\n 🎯 Targets:");
      if (config.WebAcl.IncludeMap.account) {
        for (const account of config.WebAcl.IncludeMap.account) {
          console.log("\x1b[32m", `   🛬 ${account}`, "\x1b[0m");
        }
      }
      if (config.WebAcl.IncludeMap.orgunit) {
        for (const unit of config.WebAcl.IncludeMap.orgunit) {
          console.log("\x1b[32m", `   🛬 ${unit}`, "\x1b[0m");
        }
      }
      console.log("\n 📑 Logging:");
      if (config.General.LoggingConfiguration === "Firehose") {
        console.log("   🧯  " + config.General.LoggingConfiguration);
        console.log("      ⚙️  [" + config.General.S3LoggingBucketName + "]");
      }
      if (config.General.LoggingConfiguration === "S3") {
        console.log("   🪣  " + config.General.LoggingConfiguration);
        console.log("      ⚙️  [" + config.General.S3LoggingBucketName + "]");
      }
      if (
        Array.isArray(config.WebAcl.IPSets) &&
        config.WebAcl.IPSets.length > 0
      ) {
        console.log("\n𝍂 IPSets");
        for (const ipSet of config.WebAcl.IPSets) {
          console.log("   ➕ " + ipSet.name);
          console.log(
            "      ⚙️  [" +
              ipSet.ipAddressVersion +
              "] | 🌎 [" +
              config.WebAcl.Scope +
              "]"
          );
        }
      }
      if (
        Array.isArray(config.WebAcl.RegexPatternSets) &&
        config.WebAcl.RegexPatternSets.length > 0
      ) {
        console.log("\n𝍂 RegexPatternSets");
        for (const regpatternset of config.WebAcl.RegexPatternSets) {
          console.log("   ➕ " + regpatternset.name);
          console.log("      ⚙️ 🌎 [" + config.WebAcl.Scope + "]");
        }
      }
      const wcuQuotaReached = await  helpers.wafHelper.isWcuQuotaReached(
        deploymentRegion,
        runtimeProperties,
        config
      );
      if (wcuQuotaReached) {
        console.error(
          "\u001B[31m",
          "🚨 ERROR: Exit process due Quota Check for WCU 🚨 \n\n",
          "\x1b[0m" + "\n\n"
        );
        process.exit(1);
      }
      if (helpers.afwfHelper.wrongLoggingConfiguration(config)) {
        console.error(
          "\u001B[31m",
          " 🚨 ERROR: Amazon S3 bucket name is invalid 🚨 ",
          "\x1b[0m" +
            "\n     🪣 Amazon S3 bucket name must begin with \"aws-waf-logs-\" followed by at least one \n     of the following characters [a-z0-9_.-]\n\n",
          "\x1b[0m" + "\n\n"
        );

        process.exit(1);
      }
      new WafStack(
        app,
        `${config.General.Prefix.toUpperCase()}-WAF-${config.WebAcl.Name.toUpperCase()}-${config.General.Stage.toUpperCase()}${
          config.General.DeployHash
            ? "-" + config.General.DeployHash.toUpperCase()
            : ""
        }`,
        {
          // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Error: Either remove this useless object instantiation or use it.
          config,
          runtimeProperties: runtimeProperties,
          env: {
            region: deploymentRegion,
            account: process.env.CDK_DEFAULT_ACCOUNT,
          },
        }
      );

      await  helpers.pricingHelper.isWafPriceCalculated(
        pricing.PriceRegions[deploymentRegion as general.RegionString],
        runtimeProperties,
        config,
        deploymentRegion
      );
      helpers.guidanceHelper.outputGuidance(runtimeProperties, config);
      break;
    }
    case "AutoUpdatedManagedIpSets": {
      helpers.afwfHelper.outputInfoBanner();
      console.log("ℹ️  Deploying AutoUpdatedManagedIpSets Stack");
      console.log("\n𝍂 Managed IPSets");
      for (const ipSet of values.autoUpdatedManagedIpSetsConfigs[CONFIG_OBJECT_NAME].ManagedIpSets) {
        console.log("   ➕ " + ipSet.name);
        console.log(`      ⚙️  ${ipSet.ipAddressVersion} | 🌎 ${ipSet.scope} - ${ipSet.region} | ⏱️  ${ipSet.updateSchedule.expressionString}
    `);
      }
      const app = new cdk.App();
      const autoUpdatedManagedIpSetsConfig: autoUpdatedManagedIpSets.AutoUpdatedManagedIpSetsConfig = values.autoUpdatedManagedIpSetsConfigs[CONFIG_OBJECT_NAME];
      new AutoUpdatedManagedIpSetsStack(
        app,
        "AutoUpdatedManagedIpSets",
        {
          env: {
            region: process.env.AWS_REGION,
            account: process.env.CDK_DEFAULT_ACCOUNT,
          },
          config: autoUpdatedManagedIpSetsConfig,
          runtimeProperties:  helpers.afwfHelper.initRuntimeProperties(),
          stackName: autoUpdatedManagedIpSetsConfig.General.Prefix.toUpperCase() + "-AWS-FIREWALL-FACTORY-AUTO-UPDATED-MANAGED-IPSETS",
        });
      break;
    }
    default: {
      helpers.afwfHelper.outputInfoBanner();
      console.log("⚠️ No Stack to deploy found.");
    }
  }
})();



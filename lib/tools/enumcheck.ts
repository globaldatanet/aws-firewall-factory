// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const { WAFV2 } = require("@aws-sdk/client-wafv2");
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const cfonts = require("cfonts");

// Function to read labels from enums.ts file
function readEnumFile(filePath: string) {
  try {
    const lines = fs.readFileSync(filePath, "utf-8").split("\n");
    const labels = [];

    for (const line of lines) {
      if (line.includes("=")) {
        const label = line.split("=")[1].trim().replace(/"/g, "").replace(",", "");
        labels.push(label);
      }
    }

    return labels;
  } catch (error) {
    console.error("An error occurred while reading the file:", error);
    return [];
  }
}

// AWS WAFv2 client
const wafv2Client = new WAFV2({
  region: "eu-central-1"
});

// Function to check labels for a specific managed rule group
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkLabelsForRuleGroup(ruleGroupName: any) {
  try {
    // Describe the managed rule group
    const response = await wafv2Client.describeManagedRuleGroup({
      Name: ruleGroupName,
      Scope: "REGIONAL",
      VendorName: "AWS"
    });

    // Extract available labels from the response
    const availableLabels = response.AvailableLabels.map((label: { Name: unknown; }) => label.Name);

    // Read labels from enums.ts file
    const enumFilePath = "./lib/types/enums.ts";
    const enumLabels = readEnumFile(enumFilePath);

    // Check if available labels are present in the enums.ts file
    const missingLabels = availableLabels.filter((label: unknown) => !enumLabels.includes(label));

    if (missingLabels.length > 0) {
      console.log(" ⧴ Missing Labels:");
      missingLabels.forEach((label: string) => console.log("  - " + label));
    } else {
      console.log(" Labels ✅");
    }
  } catch (error) {
    console.log(`An error occurred while checking rule group ${ruleGroupName}:`, error);
  }
}

// Function to check rules for a specific managed rule group
async function checkRulesForRuleGroup(ruleGroupName: unknown) {
  try {
    // Describe the managed rule group
    const response = await wafv2Client.describeManagedRuleGroup({
      Name: ruleGroupName,
      Scope: "REGIONAL",
      VendorName: "AWS"
    });

    // Extract available rules from the response
    const availableRules = response.Rules.map((rule: { Name: unknown; }) => rule.Name);

    // Read rules from enums.ts file
    const enumFilePath = "./lib/types/enums.ts";
    const enumRules = readEnumFile(enumFilePath);

    // Check if available rules are present in the enums.ts file
    const missingRules = availableRules.filter((rule: unknown) => !enumRules.includes(rule));

    if (missingRules.length > 0) {
      console.log("\n");
      console.log(" ⧴ Missing Rules:");
      missingRules.forEach((rule: string) => console.log("  - " + rule));
    } else {
      console.log(" Rules ✅");
    }
  } catch (error) {
    console.log(`An error occurred while checking rule group ${ruleGroupName}:`, error);
  }
}

// Get a list of all managed rule groups
async function getAllManagedRuleGroups() {
  try {
    const response = await wafv2Client.listAvailableManagedRuleGroups({ Scope: "REGIONAL" });
    const ruleGroups = response.ManagedRuleGroups;

    cfonts.say("ENUM CHECK FOR MANAGED RULE GROUPS", { font: "simple", align: "center", colors: ["#00ecbd"], background: "transparent", letterSpacing: 0, lineHeight: 0, space: true, maxLength: "14", gradient: false, independentGradient: false, transitionGradient: false, env: "node", width: "30%" });
    console.log("\n AWS FIREWALL FACTORY © by globaldatanet\n");

    for (const ruleGroup of ruleGroups) {
      const ruleGroupName = ruleGroup.Name;
      console.log(`\n\n${ruleGroupName}:`);
      await checkLabelsForRuleGroup(ruleGroupName);
      await checkRulesForRuleGroup(ruleGroupName);
    }
  } catch (error) {
    console.log("An error occurred while retrieving managed rule groups:", error);
  }
}

getAllManagedRuleGroups();

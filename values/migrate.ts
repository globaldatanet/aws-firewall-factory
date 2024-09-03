/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import util from "util";
import fs from "fs";
import path from "path";
import { wafConfig } from "../lib/types/config";

interface OldConfig {
  General: any,
  WebAcl: {
    Name: string,
    Scope: string,
    Type: string,
    IncludeMap: {
      account: string[],
    },
    PreProcess: {
      ManagedRuleGroups: any[],
      CustomRules: any[],
    },
    PostProcess: {
      ManagedRuleGroups: any[],
      CustomRules: any[]
    }
  }
}

async function findFile(inputFileName: string, currentPath = "."): Promise<string | null> {
  const files = await fs.promises.readdir(currentPath);
  for (const file of files) {
    const filePath = path.join(currentPath, file);
    const stats = await fs.promises.stat(filePath);

    if (stats.isDirectory()) {
      const foundPath = await findFile(inputFileName, filePath);
      if (foundPath !== null) {
        return foundPath;
      }
    } else if (file === inputFileName) {
      return filePath;
    }
  }
  return null;
}

/**
 * Function to transform property names into camel case like AWS needs it
 * @param o object which property names has to be transformed to camel case
 * @returns the object with the transformed property names in camel case
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function toAwsCamel(o: any): any {
  let newO: any, origKey: any, newKey: any, value: any;
  if (o instanceof Array) {
    return o.map(function(value) {
      if (typeof value === "object") {
        value = toAwsCamel(value);
      }
      if(value === "aRN"){
        value = "arn";
      }
      if(value === "iPSetReferenceStatement"){
        value = "ipSetReferenceStatement";
      }
      return value;
    });
  } else {
    newO = {};
    for (origKey in o) {
      if (Object.prototype.hasOwnProperty.call(o, origKey)) {
        newKey = (origKey.charAt(0).toLowerCase() + origKey.slice(1) || origKey).toString();
        if(newKey === "aRN"){
          newKey = "arn";
        }
        if(newKey === "iPSetReferenceStatement"){
          newKey = "ipSetReferenceStatement";
        }
        value = o[origKey];
        if (value instanceof Array || (value !== null && value.constructor === Object)) {
          value = toAwsCamel(value);
          if(value === "aRN"){
            value = "arn";
          }
        }
        newO[newKey] = value;
      }
    }
  }
  return newO;
}


findFile(process.argv[2], ".").then((filePath) => {
  if (filePath) {
    const filePathWithoutExtension = filePath.substring(0, filePath.lastIndexOf("."));
    const requirePath = "./" + filePathWithoutExtension.substring(filePathWithoutExtension.indexOf("/"));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const valuesFile  = require(requirePath);
    console.log(`🚀 Migrate Config: ${filePathWithoutExtension} to AWS Firewall Factory 4.0 schema...`);
    const oldConfig: OldConfig = valuesFile ;

    const newConfig = {
      General: oldConfig.General,
      WebAcl: {
        Name: oldConfig.WebAcl.Name,
        Scope: oldConfig.WebAcl.Scope,
        Type: oldConfig.WebAcl.Type,
        IncludeMap: oldConfig.WebAcl.IncludeMap,
        PreProcess: {
          ManagedRuleGroups: oldConfig.WebAcl.PreProcess.ManagedRuleGroups ? toAwsCamel(oldConfig.WebAcl.PreProcess.ManagedRuleGroups) : undefined,
          CustomRules: oldConfig.WebAcl.PreProcess.CustomRules ? toAwsCamel(oldConfig.WebAcl.PreProcess.CustomRules) : undefined
        },
        PostProcess: {
          ManagedRuleGroups: oldConfig.WebAcl.PostProcess.ManagedRuleGroups ? toAwsCamel(oldConfig.WebAcl.PostProcess.ManagedRuleGroups) : undefined,
          CustomRules: oldConfig.WebAcl.PostProcess.CustomRules ? toAwsCamel(oldConfig.WebAcl.PostProcess.CustomRules) : undefined
        }
      }
    } as wafConfig;

    let priority = 100;

    if (newConfig.WebAcl.PreProcess.CustomRules) {
      for (let i=0; i<newConfig.WebAcl.PreProcess.CustomRules.length; i++) {
        const rule = newConfig.WebAcl.PreProcess.CustomRules[i];
        if (rule.name === undefined) {
          rule.name = newConfig.General.Prefix +"-"+ newConfig.General.Stage +"-"+ "PreProcessCustom"  + i;
        }
        rule.priority = priority;
        priority += 100;
        if (rule.visibilityConfig.metricName === undefined) {
          rule.visibilityConfig = {
            metricName: rule.name,
            sampledRequestsEnabled: rule.visibilityConfig.sampledRequestsEnabled,
            cloudWatchMetricsEnabled: rule.visibilityConfig.cloudWatchMetricsEnabled
          };
        }
      }
    }

    priority = 100;
    if (newConfig.WebAcl.PostProcess.CustomRules) {
      for (let i=0; i<newConfig.WebAcl.PostProcess.CustomRules.length; i++) {
        const rule = newConfig.WebAcl.PostProcess.CustomRules[i];
        if (rule.name=== undefined) {
          rule.name = newConfig.General.Prefix +"-"+ newConfig.General.Stage +"-"+ "PostProcessCustom"  + i;
        }
        rule.priority = priority;
        priority += 100;
        if (rule.visibilityConfig.metricName === undefined) {
          rule.visibilityConfig = {
            metricName: rule.name,
            sampledRequestsEnabled: rule.visibilityConfig.sampledRequestsEnabled,
            cloudWatchMetricsEnabled: rule.visibilityConfig.cloudWatchMetricsEnabled
          };
        }
      }
    }
    const output = "import { Config } from \"../../lib/types/config\";\nexport const config: Config = " + util.inspect(newConfig, {showHidden: false, depth: null}).replace(/'/g, "\"");

    fs.writeFileSync(filePathWithoutExtension+".ts", output);
    console.log(`✅ Migration of Config: ${filePathWithoutExtension} Done! \n   New Configuration file: ${filePathWithoutExtension}.ts`);
  }
});
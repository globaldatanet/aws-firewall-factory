import * as values from "../values";

/**
 * relative path to config file imported from the env PROCESS_PARAMETERS
 */
const CONFIG_OBJECT_NAME = process.env.PROCESS_PARAMETERS;

if(!CONFIG_OBJECT_NAME || (values.configs[CONFIG_OBJECT_NAME] === undefined && values.prereq[CONFIG_OBJECT_NAME] === undefined)) {
  console.log("Configuration ", CONFIG_OBJECT_NAME, " not found.");
  process.exit(1);
}

console.log(JSON.stringify(values.configs[CONFIG_OBJECT_NAME]));
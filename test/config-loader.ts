import { validatewaf, validateprerequisites } from "../lib/tools/config-validator";
import { Config, Prerequisites } from "../lib/types/config";
import { realpathSync, existsSync } from "fs";

const configFile = process.env.PROCESS_PARAMETERS;

if (configFile && existsSync(configFile)) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const prerequisites: Prerequisites = require(realpathSync(configFile));
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config: Config = require(realpathSync(configFile));
  if(process.env.PREREQUISITE === "true"){
    if(validateprerequisites(prerequisites)){
      console.log("Your config "+ configFile +" is valid.");
    } else {
      console.error("\u001B[31m","🚨 Invalid Configuration File 🚨 \n\n","\x1b[0m" + JSON.stringify(validateprerequisites.errors, null, 2)+ "\n\n");
    }}
  else{
    if(validatewaf(config)){
      console.log("Your config "+ configFile +" is valid.");
    } else {
      console.error("\u001B[31m","🚨 Invalid Configuration File 🚨 \n\n","\x1b[0m" + JSON.stringify(validatewaf.errors, null, 2)+ "\n\n");
    }}
}
else {
  console.error("File not found:", configFile);
}
import { validatewaf, validateprerequisites } from "../lib/tools/config-validator";
import { Config, Prerequisites } from "../lib/types/config";
import { realpathSync, existsSync } from "fs";

const CONFIGFILE = process.env.PROCESS_PARAMETERS;

if (CONFIGFILE && existsSync(CONFIGFILE)) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
  const prerequisites: Prerequisites = require(realpathSync(CONFIGFILE));
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
  const config: Config = require(realpathSync(CONFIGFILE));
  if(process.env.PREREQUISITE === "true"){
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    if(validateprerequisites(prerequisites)){
      console.log("Your config "+ CONFIGFILE +" is valid.");
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.error("\u001B[31m","🚨 Invalid Configuration File 🚨 \n\n","\x1b[0m" + JSON.stringify(validateprerequisites.errors, null, 2)+ "\n\n");
    }}
  else{
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    if(validatewaf(config)){
      console.log("Your config "+ CONFIGFILE +" is valid.");
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.error("\u001B[31m","🚨 Invalid Configuration File 🚨 \n\n","\x1b[0m" + JSON.stringify(validatewaf.errors, null, 2)+ "\n\n");
    }}
}
else {
  console.error("File not found:", CONFIGFILE);
}
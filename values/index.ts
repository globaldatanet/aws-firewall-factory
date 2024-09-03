import {wafConfig, Prerequisites, ShieldConfig} from "../lib/types/config";

import {  owasptopTen, prequisites, ipSetsManagedTest, shieldConfigExample} from "./examples";
import * as tests from "./tests";
export const configs : { [key: string]: wafConfig } = {
  owasptopTen,
  ipSetsManagedTest,
  ...tests,
};
export const shieldConfigs : { [key: string]: ShieldConfig } = {
  shieldConfigExample
};
export const prereq : { [key: string]: Prerequisites } = {
  prequisites,
};
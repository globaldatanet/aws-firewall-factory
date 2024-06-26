import {Config, Prerequisites, ShieldConfig} from "../lib/types/config";

import {  owasptopTen, prequisites, ipSetsManagedTest,shieldAdvancedParameters, shieldAdvancedTest} from "./examples";
import * as tests from "./tests";
export const configs : { [key: string]: Config } = {
  owasptopTen,
  ipSetsManagedTest,
  ...tests,
};
export const shieldConfigs : { [key: string]: ShieldConfig } = {
  shieldAdvancedParameters,
  shieldAdvancedTest
};
export const prereq : { [key: string]: Prerequisites } = {
  prequisites,
};
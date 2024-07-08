import {Config, Prerequisites, ShieldConfig} from "../lib/types/config";

import {  owasptopTen, prequisites, ipSetsManagedTest, shieldConfigExample} from "./examples";
import * as tests from "./tests";
export const configs : { [key: string]: Config } = {
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
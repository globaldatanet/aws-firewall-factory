import {Config, Prerequisites} from "../lib/types/config";

import {  owasptopTen, prequisites, ipSetsManagedTest, NFW} from "./examples";
import * as tests from "./tests";
export const configs : { [key: string]: Config } = {
  owasptopTen,
  NFW,
  ipSetsManagedTest,
  ...tests,
};

export const prereq : { [key: string]: Prerequisites } = {
  prequisites,
};
import Ajv, {JSONSchemaType} from "ajv";
import { Config , Prerequisites} from "../types/config";
import { resolve } from "path";
import * as TJS from "typescript-json-schema";

const settings: TJS.PartialArgs = {
  required: true,
  noExtraProps: true
};

const compilerOptions: TJS.CompilerOptions = {
  strictNullChecks: true,
};

const program = TJS.getProgramFromFiles(
  [resolve("lib/types/config.ts")],
  compilerOptions
);

const wafschema = TJS.generateSchema(program, "Config", settings);

const prerequisitesschema = TJS.generateSchema(program, "Prerequisites", settings);


const ajv = new Ajv();

export const validateWaf = ajv.compile(wafschema as JSONSchemaType<Config>);

export const validatePrerequisites = ajv.compile(prerequisitesschema as JSONSchemaType<Prerequisites>);
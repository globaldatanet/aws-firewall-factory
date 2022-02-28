import Ajv, {JSONSchemaType} from "ajv";
import {Config} from "../types/config";
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

const schema = TJS.generateSchema(program, "Config", settings);

const ajv = new Ajv();

export const validate = ajv.compile(schema as JSONSchemaType<Config>);

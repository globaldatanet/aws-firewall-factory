import { Config } from "../types/config";

/**
 * The function will check if s3 bucket is Parameter is starting with aws-waf-logs- if Logging Configuration is set to S3
 * @param config Config
 */
export function wrongLoggingConfiguration(config: Config): boolean{
  if(config.General.LoggingConfiguration === "S3"){
    if(!config.General.S3LoggingBucketName.startsWith("aws-waf-logs-")){
      return true;
    }
    return false;
  }
  return false;
}

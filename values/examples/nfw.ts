import { Config } from "../../lib/types/config";
export const config: Config = {
  General: {
    Prefix: "aws-firewall-factory",
    Stage: "dev",
    SecuredDomain: [
      "",
    ],
    LoggingConfiguration: "Firehose",
    FireHoseKeyArn: "",
    S3LoggingBucketName: "",
    CreateDashboard: true,
  },
  NetworkFirewall:{
    Name: "test",
    Description: "TEST Network Firewall",
  }
};
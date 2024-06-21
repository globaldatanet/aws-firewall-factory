import { App } from "aws-cdk-lib";
import { ShieldStack } from "../lib/_shield-advanced-stack";

const app = new App();

new ShieldStack(app, "shield-cdk-test-props", {resourceType:'AWS::ElasticLoadBalancing::LoadBalancer'});

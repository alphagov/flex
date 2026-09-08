import { IAspect } from "aws-cdk-lib";
import { CfnLogGroup } from "aws-cdk-lib/aws-logs";
import { IConstruct } from "constructs";

import { resolveLogGroupEncryptionKey } from "../utils/logs";

// Applied app-wide so that log groups created by CDK internals (custom
// resource providers, bucket deployments, CDK-managed Lambda log groups)
// are encrypted with the flex log group key as well as our own.
export class EncryptLogGroups implements IAspect {
  public visit(node: IConstruct): void {
    if (node instanceof CfnLogGroup && node.kmsKeyId === undefined) {
      node.kmsKeyId = resolveLogGroupEncryptionKey(node).keyArn;
    }
  }
}

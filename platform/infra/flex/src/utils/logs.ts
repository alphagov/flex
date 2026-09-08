import { Stack } from "aws-cdk-lib";
import { type IKey, Key } from "aws-cdk-lib/aws-kms";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

import { ENV_KEYS } from "../ssm-keys";

export const LOG_GROUP_KEY_ID = "LogGroupKey";

// Resolves the CloudWatch log group encryption key for the stack containing
// scope: the stack's own key where it provisions one under LOG_GROUP_KEY_ID
// (core, and global for us-east-1), otherwise an import of the core stack's
// key over SSM. Resolved once per stack.
export function resolveLogGroupEncryptionKey(scope: Construct): IKey {
  const stack = Stack.of(scope);
  const existing = stack.node.tryFindChild(LOG_GROUP_KEY_ID);
  if (existing) return existing as IKey;

  const keyArn = StringParameter.valueForStringParameter(
    stack,
    ENV_KEYS.LogGroupKeyArn,
  );
  return Key.fromKeyArn(stack, LOG_GROUP_KEY_ID, keyArn);
}

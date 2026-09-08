import { ArnFormat, Stack } from "aws-cdk-lib";
import { Effect, PolicyStatement, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Key } from "aws-cdk-lib/aws-kms";
import { Construct } from "constructs";

import { LOG_GROUP_KEY_ID } from "../../utils/logs";

export function createLogGroupKey(scope: Construct, alias: string) {
  const stack = Stack.of(scope);

  // Created under LOG_GROUP_KEY_ID so resolveLogGroupEncryptionKey finds the
  // local key in this stack instead of importing one over SSM.
  const logGroupKey = new Key(scope, LOG_GROUP_KEY_ID, {
    alias,
    description: "KMS key for CloudWatch log group encryption",
    enableKeyRotation: true,
  });

  // CloudWatch Logs encrypts and decrypts with the key itself, not via the
  // writing role, so the regional service principal needs use of the key.
  // The encryption context condition constrains it to log groups in this
  // account and region.
  logGroupKey.addToResourcePolicy(
    new PolicyStatement({
      sid: "AllowCloudWatchLogsUse",
      effect: Effect.ALLOW,
      principals: [new ServicePrincipal(`logs.${stack.region}.amazonaws.com`)],
      actions: [
        "kms:Encrypt*",
        "kms:Decrypt*",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:Describe*",
      ],
      resources: ["*"],
      conditions: {
        ArnLike: {
          "kms:EncryptionContext:aws:logs:arn": stack.formatArn({
            service: "logs",
            resource: "log-group",
            resourceName: "*",
            arnFormat: ArnFormat.COLON_RESOURCE_NAME,
          }),
        },
      },
    }),
  );

  return { logGroupKey };
}

# Security policy

Lancer holds AWS credentials and deploys infrastructure into your AWS account. A flaw in it can expose that account, so please report one privately.

## Supported versions

Only the [latest release](https://github.com/lancer-systems/lancer/releases/latest) receives security fixes. Upgrade to it before reporting, if you can.

| Version        | Supported |
| -------------- | --------- |
| Latest release | yes       |
| Older releases | no        |

## Reporting a vulnerability

Report it through GitHub's private vulnerability reporting: [open a draft advisory](https://github.com/lancer-systems/lancer/security/advisories/new). Never open a public issue, pull request or discussion about it.

A useful report holds:

- the Lancer version, or the commit (`git rev-parse HEAD`) of a checkout;
- the AWS region and the part involved: installer, API, dashboard or deployed infrastructure;
- the steps that reproduce the flaw;
- what an attacker gains, and what they need first.

Never send a real AWS access key, secret key, session token, password, or logs that hold them.

## What happens next

- You get an acknowledgement within 7 days.
- You get a fix, or a plan to mitigate the flaw, within 90 days.
- Once the fix ships in a release, the advisory is published on GitHub and credits you, unless you ask not to be named.

Please keep the flaw private until the advisory is published.

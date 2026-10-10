export interface StaticBuildspecConfig {
	bucketName: string;
	distributionId: string;
	buildCommand: string;
	outputDir: string;
}

// Generate buildspec.yml for static site build and S3 deployment
export function generateStaticBuildspec(config: StaticBuildspecConfig): string {
	const { bucketName, distributionId, buildCommand, outputDir } = config;

	return `version: 0.2

env:
  variables:
    S3_BUCKET: "${bucketName}"
    DISTRIBUTION_ID: "${distributionId}"
    OUTPUT_DIR: "${outputDir}"

phases:
  install:
    runtime-versions:
      nodejs: 20
    commands:
      - echo Installing dependencies...
      - npm ci || npm install

  build:
    commands:
      - echo Build started on \`date\`
      - ${buildCommand}
      - echo Build completed on \`date\`

  post_build:
    commands:
      - echo Syncing to S3...
      - aws s3 sync $OUTPUT_DIR s3://$S3_BUCKET --delete --cache-control "public, max-age=31536000, immutable" --exclude "index.html" --exclude "*.json"
      - aws s3 cp $OUTPUT_DIR/index.html s3://$S3_BUCKET/index.html --cache-control "public, max-age=0, must-revalidate"
      - echo Invalidating CloudFront cache...
      - aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
      - echo Deployment completed successfully

cache:
  paths:
    - 'node_modules/**/*'
`;
}

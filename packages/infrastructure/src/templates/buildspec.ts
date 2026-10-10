export interface BuildspecConfig {
	serviceName: string;
	region: string;
	accountId: string;
	ecrRepositoryUrl: string;
	clusterName: string;
	buildCommand?: string;
	dockerfilePath?: string;
}

// Generate buildspec.yml for Docker build and ECS deployment
export function generateBuildspec(config: BuildspecConfig): string {
	const {
		serviceName,
		region,
		accountId,
		ecrRepositoryUrl,
		clusterName,
		buildCommand,
		dockerfilePath = "Dockerfile",
	} = config;

	// Extract repository name from URL (remove tag if present)
	const repositoryUri = ecrRepositoryUrl.split(":")[0];

	return `version: 0.2

env:
  variables:
    AWS_DEFAULT_REGION: "${region}"
    AWS_ACCOUNT_ID: "${accountId}"
    IMAGE_REPO_NAME: "${repositoryUri}"
    SERVICE_NAME: "${serviceName}"
    CLUSTER_NAME: "${clusterName}"

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=\${COMMIT_HASH:=latest}
${buildCommand ? `      - echo Running build command...\n      - ${buildCommand}` : ""}

  build:
    commands:
      - echo Build started on \`date\`
      - echo Building the Docker image...
      - docker build -t $IMAGE_REPO_NAME:latest -f ${dockerfilePath} .
      - docker tag $IMAGE_REPO_NAME:latest $IMAGE_REPO_NAME:$IMAGE_TAG

  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing the Docker images...
      - docker push $IMAGE_REPO_NAME:latest
      - docker push $IMAGE_REPO_NAME:$IMAGE_TAG
      - echo Updating ECS service...
      - aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --force-new-deployment
      - echo Deployment initiated successfully

cache:
  paths:
    - '/root/.docker/**/*'
`;
}

// Generate a simple Dockerfile if one doesn't exist
export function generateDockerfile(startCommand: string, port: number): string {
	return `# Auto-generated Dockerfile by Lancer
# Customize this file for your specific needs

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE ${port}

# Start command
CMD ${JSON.stringify(startCommand.split(" "))}
`;
}

export interface GitRepository {
  provider: 'github' | 'gitlab' | 'bitbucket' | 'azure-repos';
  url: string;
  branch: string;
  accessToken?: string; // PAT or OAuth token (stored encrypted)
  webhookId?: string; // ID of the configured webhook
}

export interface CloudProvider {
  type: 'aws' | 'gcp' | 'azure' | 'self-hosted';
  region?: string;
  accountId?: string;
  credentials?: {
    roleArn?: string;
    serviceAccountId?: string;
    servicePrincipalId?: string;
  };
}

export interface InfrastructureConfig {
  serviceType: 'container' | 'vm' | 'kubernetes' | 'serverless';
  resources: {
    cpu?: string;
    memory?: string;
    storage?: string;
    instances?: number;
  };
  networking: {
    vpcId?: string;
    subnetIds?: string[];
    securityGroupIds?: string[];
    loadBalancer?: boolean;
    highAvailability?: boolean;
    publicAccess?: boolean;
  };
  database?: {
    type?: 'mysql' | 'postgres' | 'mongodb' | 'redis' | 'dynamodb';
    version?: string;
    size?: string;
    replicas?: number;
    highAvailability?: boolean;
  };
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  isSecret: boolean;
}

export interface DockerConfig {
  useCustomDockerfile: boolean;
  dockerfileLocation?: string;
  baseImage?: string;
  registryUrl?: string;
  imageName: string;
  imageTag: string;
}

export interface TerraformConfig {
  stateBucketName?: string;
  stateKey?: string;
  planApproved?: boolean;
  lastPlanOutput?: string;
}

export interface PipelineStep {
  name: string;
  status: 'pending' | 'in-progress' | 'succeeded' | 'failed' | 'skipped';
  startedAt?: Date;
  finishedAt?: Date;
  logs?: string;
  errorMessage?: string;
  aiRecommendation?: string;
}

export interface CostEstimation {
  monthlyCost: number;
  currency: string;
  breakdown: Record<string, number>;
  lastUpdated: Date;
}

export interface SecurityScanResult {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  description: string;
  file?: string;
  line?: number;
  recommendation?: string;
  reference?: string;
}

export interface DeploymentModel {
  id: string;
  projectId: string;
  name: string;
  environment: 'development' | 'staging' | 'production';
  status:
    | 'configuring'
    | 'pending'
    | 'building'
    | 'infrastructure-provisioning'
    | 'deploying'
    | 'deployed'
    | 'rollback'
    | 'failed'
    | 'cancelled';

  gitRepository?: GitRepository;
  cloudProvider?: CloudProvider;
  infrastructureConfig?: InfrastructureConfig;
  environmentVariables?: EnvironmentVariable[];
  dockerConfig?: DockerConfig;
  terraformConfig?: TerraformConfig;

  pipeline?: {
    currentStage: string;
    steps: PipelineStep[];
    startedAt?: Date;
    estimatedCompletionTime?: Date;
  };

  securityScanResults?: SecurityScanResult[];
  staticCodeAnalysis?: {
    score?: number;
    issues?: { severity: string; count: number }[];
    reportUrl?: string;
  };
  costEstimation?: CostEstimation;

  url?: string;
  version?: string;
  logs?: string;
  deployedAt?: Date;

  rollbackVersions?: string[];
  lastSuccessfulDeployment?: string;

  createdAt: Date;
  updatedAt: Date;
}

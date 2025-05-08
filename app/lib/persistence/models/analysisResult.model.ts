import type { ArchitectureModel } from './architecture.model';
import type { BrandIdentityModel } from './brand-identity.model';
import type { DiagramModel } from './diagram.model';
import type { LandingModel } from './landing.model';
import type { PlanningModel } from './planning.model';

export interface AnalysisResultModel {
  id?: string;
  architectures: ArchitectureModel[];
  planning: PlanningModel;
  design: DiagramModel;
  development: string;
  branding: BrandIdentityModel;
  landing: LandingModel;
  testing: string;
  createdAt: Date;
}

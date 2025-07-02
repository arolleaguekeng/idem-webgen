import type { BrandIdentityModel } from '~/lib/persistence/models/brand-identity.model';
import type { ProjectModel } from '~/lib/persistence/models/project.model';

export class WebGenService {
  generateWebsitePrompt(project: ProjectModel): string {
    if (!project?.description) {
      throw new Error('Project description is required');
    }

    const sections = [
      this._buildIntroduction(),
      this._buildProjectOverview(project),
      this._buildTechnicalSpecs(project),
      this._buildBrandGuidelines(project.analysisResultModel.branding),
      this._buildContentStrategy(),
      this._buildDesignRequirements(),
      this._buildOutputRequirements(),
      this._buildQualityStandards(),
    ];

    return sections.filter((section) => section).join('\n\n');
  }

  private _buildIntroduction(): string {
    return `# LANDING PAGE CREATION BRIEF
            **Objective:** Create a high-converting, modern landing page that aligns with the project requirements and brand identity. Follow current web design best practices for layout, performance, and user experience.`;
  }

  private _buildProjectOverview(project: ProjectModel): string {
    return `# PROJECT OVERVIEW
**Name:** ${project.name}
**Description:** ${project.description}
**Target Audience:** ${project.targets || 'Not specified'}
${project.constraints?.length ? `**Constraints:**\n${project.constraints.map((c) => `- ${c}`).join('\n')}` : ''}`;
  }

  private _buildTechnicalSpecs(project: ProjectModel): string {
    const options = project.analysisResultModel.landing?.selectedOptions;

    if (!options) {
      return '';
    }

    return `# TECHNICAL SPECIFICATIONS
** Web Technology:** ${options.stack.toUpperCase()}
**Core Features:**
- SEO: ${options.seoEnabled ? 'Advanced optimization' : 'Basic'}
- Contact Form: ${options.contactFormEnabled ? 'Included' : 'Excluded'}
- Analytics: ${options.analyticsEnabled ? 'Configured' : 'Not included'}
- i18n: ${options.i18nEnabled ? 'Multi-language' : 'Single language'}
- Performance: ${options.performanceOptimized ? 'Optimized' : 'Standard'}

**Requirements:**
- ${project.type === 'web' ? 'Mobile-first responsive design' : 'Platform-specific approach'}
- Component-based architecture
- TypeScript best practices`;
  }

  private _buildBrandGuidelines(brand: BrandIdentityModel): string {
    return `# BRAND GUIDELINES
**Visual Identity:**
- Colors: ${brand.colors.colors}
- Typography: ${brand.typography}
${brand.logo?.svg ? `- Logo: ${brand.logo.svg}` : ''}
`;
  }

  private _buildContentStrategy(): string {
    return `# CONTENT STRATEGY
**Structure:**
1. Hero section with clear value proposition
2. Key benefits/features
3. Social proof
4. Call-to-action

**Guidelines:**
- Concise, scannable content
- Action-oriented language
- Benefit-focused messaging`;
  }

  private _buildDesignRequirements(): string {
    return `# DESIGN REQUIREMENTS
**Principles:**
- Clean, modern aesthetic
- Strong visual hierarchy
- Strategic white space
- Consistent spacing system

**Components:**
- Responsive navigation
- Attractive hero section
- Clearly styled CTAs
- Organized content sections`;
  }

  private _buildOutputRequirements(): string {
    return `# OUTPUT REQUIREMENTS
**Code:**
- Well-structured components
- TypeScript typing
- Environment configuration

**Documentation:**
- Setup instructions
- Style guide reference
- Component documentation`;
  }

  private _buildQualityStandards(): string {
    return `# QUALITY STANDARDS
- WCAG AA accessibility
- Cross-browser compatibility
- Mobile-responsive
- Optimized performance
- Clean, maintainable code`;
  }
}

// Simple zoning service for development
// In production, this would integrate with actual zoning databases

interface ZoningDistrict {
  code: string;
  name: string;
  description: string;
  allowedUses: string[];
  restrictions: {
    maxHeight: number;
    minLotSize: number;
    maxDensity: number;
    setbacks: {
      front: number;
      rear: number;
      side: number;
    };
  };
}

class ZoningService {
  private zoningDistricts: ZoningDistrict[] = [
    {
      code: 'R-1',
      name: 'Single Family Residential',
      description: 'Low-density single-family residential development',
      allowedUses: ['Single-family dwellings', 'Home occupations', 'Accessory structures'],
      restrictions: {
        maxHeight: 35,
        minLotSize: 5000,
        maxDensity: 8.7, // units per acre
        setbacks: {
          front: 25,
          rear: 20,
          side: 10
        }
      }
    },
    {
      code: 'R-2',
      name: 'Multi-Family Residential',
      description: 'Medium-density residential development',
      allowedUses: ['Single-family dwellings', 'Duplexes', 'Multi-family dwellings', 'Home occupations'],
      restrictions: {
        maxHeight: 45,
        minLotSize: 3000,
        maxDensity: 15,
        setbacks: {
          front: 20,
          rear: 15,
          side: 8
        }
      }
    },
    {
      code: 'C-1',
      name: 'Commercial',
      description: 'General commercial development',
      allowedUses: ['Retail stores', 'Offices', 'Restaurants', 'Service businesses'],
      restrictions: {
        maxHeight: 50,
        minLotSize: 2000,
        maxDensity: 0, // Not applicable for commercial
        setbacks: {
          front: 15,
          rear: 10,
          side: 5
        }
      }
    }
  ];

  async getZoningDistrict(code: string): Promise<ZoningDistrict | null> {
    return this.zoningDistricts.find(district => district.code === code) || null;
  }

  async getAllZoningDistricts(): Promise<ZoningDistrict[]> {
    return this.zoningDistricts;
  }

  async checkCompliance(
    zoningCode: string,
    projectDetails: {
      height?: number;
      lotSize?: number;
      density?: number;
      setbacks?: {
        front?: number;
        rear?: number;
        side?: number;
      };
    }
  ): Promise<{
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const district = await this.getZoningDistrict(zoningCode);
    if (!district) {
      return {
        compliant: false,
        issues: [`Unknown zoning district: ${zoningCode}`],
        recommendations: ['Verify zoning district code']
      };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check height
    if (projectDetails.height && projectDetails.height > district.restrictions.maxHeight) {
      issues.push(`Building height (${projectDetails.height}ft) exceeds maximum allowed (${district.restrictions.maxHeight}ft)`);
      recommendations.push(`Reduce building height to ${district.restrictions.maxHeight}ft or less`);
    }

    // Check lot size
    if (projectDetails.lotSize && projectDetails.lotSize < district.restrictions.minLotSize) {
      issues.push(`Lot size (${projectDetails.lotSize}sqft) is below minimum required (${district.restrictions.minLotSize}sqft)`);
      recommendations.push(`Lot size must be at least ${district.restrictions.minLotSize}sqft`);
    }

    // Check density
    if (projectDetails.density && district.restrictions.maxDensity > 0 && 
        projectDetails.density > district.restrictions.maxDensity) {
      issues.push(`Density (${projectDetails.density} units/acre) exceeds maximum allowed (${district.restrictions.maxDensity} units/acre)`);
      recommendations.push(`Reduce density to ${district.restrictions.maxDensity} units/acre or less`);
    }

    // Check setbacks
    if (projectDetails.setbacks) {
      if (projectDetails.setbacks.front && projectDetails.setbacks.front < district.restrictions.setbacks.front) {
        issues.push(`Front setback (${projectDetails.setbacks.front}ft) is less than required (${district.restrictions.setbacks.front}ft)`);
        recommendations.push(`Increase front setback to at least ${district.restrictions.setbacks.front}ft`);
      }
      if (projectDetails.setbacks.rear && projectDetails.setbacks.rear < district.restrictions.setbacks.rear) {
        issues.push(`Rear setback (${projectDetails.setbacks.rear}ft) is less than required (${district.restrictions.setbacks.rear}ft)`);
        recommendations.push(`Increase rear setback to at least ${district.restrictions.setbacks.rear}ft`);
      }
      if (projectDetails.setbacks.side && projectDetails.setbacks.side < district.restrictions.setbacks.side) {
        issues.push(`Side setback (${projectDetails.setbacks.side}ft) is less than required (${district.restrictions.setbacks.side}ft)`);
        recommendations.push(`Increase side setback to at least ${district.restrictions.setbacks.side}ft`);
      }
    }

    return {
      compliant: issues.length === 0,
      issues,
      recommendations
    };
  }

  async getRequirements(zoningCode: string): Promise<{
    district: ZoningDistrict;
    requirements: {
      critical: string[];
      important: string[];
      recommended: string[];
    };
  } | null> {
    const district = await this.getZoningDistrict(zoningCode);
    if (!district) return null;

    return {
      district,
      requirements: {
        critical: [
          'Property address and legal description',
          'Current zoning district',
          'Proposed use and building type',
          'Lot size and dimensions',
          'Building height',
          'Setback measurements'
        ],
        important: [
          'Parking requirements',
          'Landscaping plan',
          'Utility connections',
          'Access and circulation'
        ],
        recommended: [
          'Architectural drawings',
          'Site plan',
          'Environmental considerations',
          'Traffic impact analysis'
        ]
      }
    };
  }
}

export const zoningService = new ZoningService(); 
-- Oregon Planning Database Schema for CiviAI Enhanced
-- This schema supports Oregon land planning and development requirements

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Oregon Jurisdictions Table
CREATE TABLE IF NOT EXISTS oregon_jurisdictions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('city', 'county', 'special_district')),
  population INTEGER,
  planning_department_contact VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Oregon Planning Goals Table (Oregon's 19 Statewide Planning Goals)
CREATE TABLE IF NOT EXISTS oregon_planning_goals (
  id SERIAL PRIMARY KEY,
  goal_number INTEGER UNIQUE NOT NULL CHECK (goal_number BETWEEN 1 AND 19),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  keywords TEXT[],
  last_updated DATE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'amended')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Oregon Applications Table
CREATE TABLE IF NOT EXISTS oregon_applications (
  id SERIAL PRIMARY KEY,
  application_number VARCHAR(50) UNIQUE NOT NULL,
  applicant_name VARCHAR(255) NOT NULL,
  project_type VARCHAR(100) NOT NULL,
  jurisdiction_id INTEGER REFERENCES oregon_jurisdictions(id),
  jurisdiction_name VARCHAR(255), -- Denormalized for performance
  submission_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'denied', 'withdrawn')),
  compliance_score DECIMAL(5,2) CHECK (compliance_score >= 0 AND compliance_score <= 100),
  missing_items TEXT[],
  ai_analysis_result JSONB,
  documents TEXT[], -- Array of document file paths
  reviewer_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Goal Compliance Table
CREATE TABLE IF NOT EXISTS goal_compliance (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES oregon_applications(id) ON DELETE CASCADE,
  goal_number INTEGER REFERENCES oregon_planning_goals(goal_number),
  compliance_status VARCHAR(50) CHECK (compliance_status IN ('compliant', 'non-compliant', 'needs-review', 'not-applicable')),
  compliance_notes TEXT,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  reviewer_id INTEGER,
  review_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Regulatory Updates Table
CREATE TABLE IF NOT EXISTS regulatory_updates (
  id SERIAL PRIMARY KEY,
  source VARCHAR(100) NOT NULL,
  update_type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  effective_date DATE,
  impact_level VARCHAR(20) CHECK (impact_level IN ('High', 'Medium', 'Low')),
  affected_jurisdictions INTEGER[],
  url TEXT,
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Oregon Notifications Table
CREATE TABLE IF NOT EXISTS oregon_notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('regulatory_update', 'deadline_reminder', 'compliance_alert', 'application_update')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  affected_users TEXT[],
  action_required BOOLEAN DEFAULT FALSE,
  deadline TIMESTAMP,
  read_by TEXT[], -- Array of user IDs who have read this notification
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Document Storage Table
CREATE TABLE IF NOT EXISTS oregon_documents (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  metadata JSONB,
  uploaded_by INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_oregon_applications_jurisdiction ON oregon_applications(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_oregon_applications_status ON oregon_applications(status);
CREATE INDEX IF NOT EXISTS idx_oregon_applications_submission_date ON oregon_applications(submission_date);
CREATE INDEX IF NOT EXISTS idx_goal_compliance_application ON goal_compliance(application_id);
CREATE INDEX IF NOT EXISTS idx_goal_compliance_goal ON goal_compliance(goal_number);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_effective_date ON regulatory_updates(effective_date);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_type ON regulatory_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_oregon_notifications_type ON oregon_notifications(type);
CREATE INDEX IF NOT EXISTS idx_oregon_notifications_priority ON oregon_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_oregon_notifications_created_at ON oregon_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_oregon_documents_category ON oregon_documents(category);
CREATE INDEX IF NOT EXISTS idx_oregon_documents_uploaded_at ON oregon_documents(uploaded_at);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_oregon_applications_fts ON oregon_applications USING gin(to_tsvector('english', applicant_name || ' ' || project_type || ' ' || COALESCE(reviewer_notes, '')));
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_fts ON regulatory_updates USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Insert default Oregon Planning Goals
INSERT INTO oregon_planning_goals (goal_number, title, description, keywords) VALUES
(1, 'Agricultural Lands', 'To preserve and maintain agricultural lands for farm use, consistent with existing and future needs for agricultural products, forest and open space and with the state''s agricultural land use policy expressed in ORS 215.243 and 215.700.', ARRAY['agricultural', 'farmland', 'agriculture', 'farming', 'farm use']),
(2, 'Open Spaces, Scenic and Historic Areas, and Natural Resources', 'To preserve and maintain open spaces, scenic and historic areas and natural resources for present and future generations.', ARRAY['open space', 'scenic', 'historic', 'natural resources', 'preservation']),
(3, 'Agricultural Lands', 'To preserve and maintain agricultural lands for farm use, consistent with existing and future needs for agricultural products, forest and open space and with the state''s agricultural land use policy expressed in ORS 215.243 and 215.700.', ARRAY['agricultural', 'farmland', 'agriculture', 'farming']),
(4, 'Forest Lands', 'To conserve forest lands by maintaining the forest land base and to protect the state''s forest economy by making possible economically efficient forest practices that assure the continuous growing and harvesting of forest tree species as the leading use on forest land consistent with sound management of soil, air, water, and fish and wildlife resources and to provide for recreational opportunities and agriculture.', ARRAY['forest', 'forestry', 'timber', 'woodland', 'forest practices']),
(5, 'Natural Resources, Scenic and Historic Areas, and Open Spaces', 'To protect natural resources and conserve scenic and historic areas and open spaces.', ARRAY['natural resources', 'scenic', 'historic', 'open space', 'conservation']),
(6, 'Air, Water and Land Resources Quality', 'To maintain and improve the quality of the air, water and land resources of the state.', ARRAY['air quality', 'water quality', 'land quality', 'environmental', 'pollution']),
(7, 'Areas Subject to Natural Disasters and Hazards', 'To protect life and property from natural disasters and hazards.', ARRAY['natural disasters', 'hazards', 'flood', 'earthquake', 'wildfire', 'landslide']),
(8, 'Recreational Needs', 'To satisfy the recreational needs of citizens of the state and visitors and, where appropriate, to provide for the siting of necessary recreational facilities including destination resorts.', ARRAY['recreational', 'parks', 'trails', 'outdoor recreation', 'destination resorts']),
(9, 'Economic Development', 'To provide adequate opportunities throughout the state for a variety of economic activities vital to the health, welfare, and prosperity of Oregon''s citizens.', ARRAY['economic development', 'business', 'employment', 'industry', 'commerce']),
(10, 'Housing', 'To provide for the housing needs of citizens of the state.', ARRAY['housing', 'residential', 'affordable housing', 'housing needs', 'dwellings']),
(11, 'Public Facilities and Services', 'To plan and develop a timely, orderly and efficient arrangement of public facilities and services to serve as a framework for urban and rural development.', ARRAY['public facilities', 'services', 'infrastructure', 'utilities', 'public works']),
(12, 'Transportation', 'To provide and encourage a safe, convenient and economic transportation system.', ARRAY['transportation', 'roads', 'transit', 'traffic', 'highways', 'public transit']),
(13, 'Energy Conservation', 'To conserve energy.', ARRAY['energy conservation', 'energy efficiency', 'renewable energy', 'sustainability']),
(14, 'Urbanization', 'To provide for an orderly and efficient transition from rural to urban land use.', ARRAY['urbanization', 'urban growth', 'development', 'growth management', 'land use transition']),
(15, 'Willamette River Greenway', 'To protect, maintain and enhance the quality of the Willamette River Greenway and to ensure its use for the benefit of present and future generations.', ARRAY['Willamette River', 'greenway', 'river corridor', 'waterfront']),
(16, 'Estuarine Resources', 'To recognize and protect the unique environmental, economic and social values of each estuary and associated wetlands; to protect, maintain, where appropriate develop and, where appropriate, restore the long-term environmental, economic and social values, diversity and benefits of Oregon''s estuaries.', ARRAY['estuarine', 'estuary', 'coastal', 'marine', 'wetlands']),
(17, 'Coastal Shorelands', 'To conserve, protect, where appropriate develop and where appropriate restore the resources of the coastal shorelands for the benefit and enjoyment of the public and to ensure that new developments are compatible with the characteristics of the coastal shorelands.', ARRAY['coastal shorelands', 'coastal zone', 'shoreline', 'coastal development']),
(18, 'Beaches and Dunes', 'To conserve, protect, where appropriate develop and where appropriate restore the resources of the beaches and dunes for the benefit and enjoyment of the public and to ensure that new developments are compatible with the characteristics of the beaches and dunes.', ARRAY['beaches', 'dunes', 'coastal', 'sand', 'beach access']),
(19, 'Ocean Resources', 'To conserve the long-term values, benefits and natural resources of the nearshore ocean and the continental shelf. To ensure that the uses of the ocean resources are coordinated to obtain the maximum benefit for the people of this state.', ARRAY['ocean resources', 'marine', 'fisheries', 'coastal', 'nearshore', 'continental shelf'])
ON CONFLICT (goal_number) DO NOTHING;

-- Insert some sample jurisdictions
INSERT INTO oregon_jurisdictions (name, type, population, planning_department_contact, email, phone) VALUES
('Portland', 'city', 652503, 'Portland Bureau of Planning and Sustainability', 'planning@portlandoregon.gov', '503-823-7700'),
('Salem', 'city', 175535, 'Salem Planning Division', 'planning@cityofsalem.net', '503-588-6178'),
('Eugene', 'city', 168916, 'Eugene Planning and Development', 'planning@eugene-or.gov', '541-682-5477'),
('Multnomah County', 'county', 812855, 'Multnomah County Land Use Planning', 'landuse@multco.us', '503-988-3043'),
('Lane County', 'county', 382971, 'Lane County Land Management', 'landmanagement@lanecountyor.gov', '541-682-3573'),
('Marion County', 'county', 345920, 'Marion County Planning', 'planning@co.marion.or.us', '503-588-5038')
ON CONFLICT (id) DO NOTHING;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_oregon_jurisdictions_updated_at BEFORE UPDATE ON oregon_jurisdictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_oregon_planning_goals_updated_at BEFORE UPDATE ON oregon_planning_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_oregon_applications_updated_at BEFORE UPDATE ON oregon_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goal_compliance_updated_at BEFORE UPDATE ON goal_compliance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_regulatory_updates_updated_at BEFORE UPDATE ON regulatory_updates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_oregon_notifications_updated_at BEFORE UPDATE ON oregon_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW oregon_applications_summary AS
SELECT 
  oa.id,
  oa.application_number,
  oa.applicant_name,
  oa.project_type,
  oa.jurisdiction_name,
  oa.submission_date,
  oa.status,
  oa.compliance_score,
  COUNT(gc.id) as goal_compliance_count,
  COUNT(CASE WHEN gc.compliance_status = 'compliant' THEN 1 END) as compliant_goals,
  COUNT(CASE WHEN gc.compliance_status = 'non-compliant' THEN 1 END) as non_compliant_goals
FROM oregon_applications oa
LEFT JOIN goal_compliance gc ON oa.id = gc.application_id
GROUP BY oa.id, oa.application_number, oa.applicant_name, oa.project_type, oa.jurisdiction_name, oa.submission_date, oa.status, oa.compliance_score;

CREATE OR REPLACE VIEW recent_regulatory_updates AS
SELECT 
  id,
  source,
  update_type,
  title,
  description,
  effective_date,
  impact_level,
  created_at
FROM regulatory_updates
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO civiai_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO civiai_user; 
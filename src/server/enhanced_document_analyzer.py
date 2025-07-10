#!/usr/bin/env python3
"""
Enhanced Document Analyzer for CiviAI
Identifies missing information in planning and zoning documents
Compatible with Replit environment constraints
"""

import os
import sys
import json
import logging
import re
from typing import Dict, List, Any, Optional, Set, Tuple
from pathlib import Path
import tempfile
from dataclasses import dataclass, asdict
from enum import Enum

# Core document processing
try:
    import PyPDF2
    from docx import Document as DocxDocument
    import pandas as pd
    import numpy as np
    from PIL import Image
    import pytesseract
except ImportError as e:
    print(f"Error importing required packages: {e}")
    print("Please install required packages with: pip install PyPDF2 python-docx pandas numpy pillow pytesseract")
    sys.exit(1)

# NLP processing (using lightweight alternatives to complex models)
try:
    import nltk
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    import spacy
    # Download required NLTK data if not present
    try:
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        nltk.download('punkt')
    try:
        nltk.data.find('corpora/stopwords')
    except LookupError:
        nltk.download('stopwords')
except ImportError as e:
    print(f"Warning: NLP packages not available: {e}")
    print("Some advanced features may not work. Install with: pip install nltk scikit-learn spacy")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentType(Enum):
    """Document types for planning and zoning"""
    ZONING_APPLICATION = "zoning_application"
    BUILDING_PERMIT = "building_permit"
    SITE_PLAN = "site_plan"
    ENVIRONMENTAL_IMPACT = "environmental_impact"
    VARIANCE_REQUEST = "variance_request"
    SUBDIVISION_PLAN = "subdivision_plan"
    CONDITIONAL_USE = "conditional_use"
    UNKNOWN = "unknown"

class RequirementCategory(Enum):
    """Categories of required information"""
    PROPERTY_INFO = "property_information"
    APPLICANT_INFO = "applicant_information"
    PROJECT_DETAILS = "project_details"
    ZONING_COMPLIANCE = "zoning_compliance"
    ENVIRONMENTAL = "environmental_considerations"
    INFRASTRUCTURE = "infrastructure_requirements"
    FINANCIAL = "financial_information"
    LEGAL = "legal_documentation"

@dataclass
class MissingRequirement:
    """Represents a missing piece of required information"""
    category: RequirementCategory
    field_name: str
    description: str
    importance: str  # "critical", "important", "recommended"
    suggested_source: str
    example_value: Optional[str] = None

@dataclass
class DocumentAnalysisResult:
    """Complete analysis result including missing information"""
    document_type: DocumentType
    extracted_text: str
    found_information: Dict[str, Any]
    missing_requirements: List[MissingRequirement]
    compliance_score: float
    confidence_score: float
    recommendations: List[str]
    next_steps: List[str]

class PlanningDocumentRequirements:
    """Defines required information for different document types"""
    
    @staticmethod
    def get_requirements(doc_type: DocumentType) -> Dict[RequirementCategory, List[Dict[str, Any]]]:
        """Get required fields for a document type"""
        
        base_requirements = {
            RequirementCategory.PROPERTY_INFO: [
                {"field": "property_address", "description": "Complete property address", "importance": "critical"},
                {"field": "parcel_number", "description": "Tax assessor parcel number", "importance": "critical"},
                {"field": "lot_size", "description": "Total lot size in square feet or acres", "importance": "critical"},
                {"field": "current_zoning", "description": "Current zoning designation", "importance": "critical"},
                {"field": "property_owner", "description": "Legal property owner name", "importance": "important"},
            ],
            RequirementCategory.APPLICANT_INFO: [
                {"field": "applicant_name", "description": "Full name of applicant", "importance": "critical"},
                {"field": "applicant_address", "description": "Applicant mailing address", "importance": "important"},
                {"field": "applicant_phone", "description": "Contact phone number", "importance": "important"},
                {"field": "applicant_email", "description": "Email address", "importance": "recommended"},
                {"field": "agent_info", "description": "Authorized agent information if applicable", "importance": "recommended"},
            ]
        }
        
        if doc_type == DocumentType.ZONING_APPLICATION:
            base_requirements.update({
                RequirementCategory.PROJECT_DETAILS: [
                    {"field": "proposed_use", "description": "Detailed description of proposed use", "importance": "critical"},
                    {"field": "building_height", "description": "Maximum building height", "importance": "critical"},
                    {"field": "building_footprint", "description": "Building footprint area", "importance": "critical"},
                    {"field": "setbacks", "description": "Front, rear, and side setbacks", "importance": "critical"},
                    {"field": "parking_spaces", "description": "Number of parking spaces provided", "importance": "important"},
                    {"field": "landscaping_plan", "description": "Landscaping and green space plan", "importance": "important"},
                ],
                RequirementCategory.ZONING_COMPLIANCE: [
                    {"field": "density_calculation", "description": "Dwelling units per acre calculation", "importance": "critical"},
                    {"field": "floor_area_ratio", "description": "Floor area ratio compliance", "importance": "important"},
                    {"field": "open_space_ratio", "description": "Required open space percentage", "importance": "important"},
                ]
            })
        
        elif doc_type == DocumentType.BUILDING_PERMIT:
            base_requirements.update({
                RequirementCategory.PROJECT_DETAILS: [
                    {"field": "construction_type", "description": "Type of construction (new, addition, renovation)", "importance": "critical"},
                    {"field": "building_value", "description": "Estimated construction value", "importance": "critical"},
                    {"field": "square_footage", "description": "Total square footage", "importance": "critical"},
                    {"field": "number_of_stories", "description": "Number of stories", "importance": "important"},
                    {"field": "occupancy_type", "description": "Building occupancy classification", "importance": "critical"},
                ],
                RequirementCategory.INFRASTRUCTURE: [
                    {"field": "water_connection", "description": "Water service connection details", "importance": "critical"},
                    {"field": "sewer_connection", "description": "Sewer service connection details", "importance": "critical"},
                    {"field": "electrical_service", "description": "Electrical service requirements", "importance": "important"},
                ]
            })
        
        return base_requirements

class EnhancedDocumentAnalyzer:
    """Enhanced document analyzer that identifies missing information"""
    
    def __init__(self):
        self.nlp = None
        self.tfidf_vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
        self._load_nlp_model()
        
        # Pattern matching for common fields
        self.field_patterns = {
            'property_address': [
                r'\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Circle|Cir|Court|Ct)\b',
                r'(?:Property|Site|Location)(?:\s+Address)?:\s*([^\n]+)',
                r'Address:\s*([^\n]+)'
            ],
            'parcel_number': [
                r'(?:Parcel|Tax|Assessor)(?:\s+(?:Number|ID|#))?:\s*([A-Z0-9\-]+)',
                r'APN:\s*([A-Z0-9\-]+)',
                r'\b\d{2,3}-\d{2,3}-\d{2,3}\b'
            ],
            'lot_size': [
                r'(?:Lot|Site)\s+Size:\s*([\d,]+\.?\d*)\s*(?:sq\.?\s*ft\.?|square\s+feet|acres?)',
                r'([\d,]+\.?\d*)\s*(?:sq\.?\s*ft\.?|square\s+feet|acres?)',
                r'Area:\s*([\d,]+\.?\d*)\s*(?:sq\.?\s*ft\.?|square\s+feet|acres?)'
            ],
            'current_zoning': [
                r'(?:Current\s+)?Zoning:\s*([A-Z0-9\-]+)',
                r'Zone:\s*([A-Z0-9\-]+)',
                r'Zoned\s+([A-Z0-9\-]+)'
            ],
            'applicant_name': [
                r'Applicant:\s*([A-Za-z\s,\.]+)',
                r'Name:\s*([A-Za-z\s,\.]+)',
                r'Applied\s+by:\s*([A-Za-z\s,\.]+)'
            ],
            'proposed_use': [
                r'Proposed\s+Use:\s*([^\n]+)',
                r'Project\s+Description:\s*([^\n]+)',
                r'Use:\s*([^\n]+)'
            ],
            'building_height': [
                r'(?:Building\s+)?Height:\s*([\d\.]+)\s*(?:feet|ft\.?|\')',
                r'([\d\.]+)\s*(?:feet|ft\.?|\')\s*(?:high|height)',
                r'Maximum\s+Height:\s*([\d\.]+)\s*(?:feet|ft\.?|\')'
            ]
        }
    
    def _load_nlp_model(self):
        """Load spaCy model if available"""
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.warning("spaCy model not found. Some features may be limited.")
            self.nlp = None
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            return ""
    
    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = DocxDocument(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {e}")
            return ""
    
    def classify_document_type(self, text: str) -> DocumentType:
        """Classify the document type based on content"""
        text_lower = text.lower()
        
        # Keywords for different document types
        type_keywords = {
            DocumentType.ZONING_APPLICATION: ['zoning', 'rezone', 'zone change', 'zoning application'],
            DocumentType.BUILDING_PERMIT: ['building permit', 'construction permit', 'building application'],
            DocumentType.SITE_PLAN: ['site plan', 'site development', 'development plan'],
            DocumentType.ENVIRONMENTAL_IMPACT: ['environmental impact', 'environmental assessment', 'eir', 'eis'],
            DocumentType.VARIANCE_REQUEST: ['variance', 'variance request', 'zoning variance'],
            DocumentType.SUBDIVISION_PLAN: ['subdivision', 'subdivision plan', 'plat'],
            DocumentType.CONDITIONAL_USE: ['conditional use', 'special use', 'cup']
        }
        
        scores = {}
        for doc_type, keywords in type_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            if score > 0:
                scores[doc_type] = score
        
        if scores:
            return max(scores, key=scores.get)
        return DocumentType.UNKNOWN
    
    def extract_information_with_patterns(self, text: str) -> Dict[str, Any]:
        """Extract information using regex patterns"""
        extracted = {}
        
        for field_name, patterns in self.field_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    extracted[field_name] = match.group(1).strip() if match.groups() else match.group(0).strip()
                    break
        
        return extracted
    
    def extract_information_with_nlp(self, text: str) -> Dict[str, Any]:
        """Extract information using NLP techniques"""
        if not self.nlp:
            return {}
        
        doc = self.nlp(text)
        extracted = {}
        
        # Extract named entities
        entities = {}
        for ent in doc.ents:
            if ent.label_ not in entities:
                entities[ent.label_] = []
            entities[ent.label_].append(ent.text)
        
        # Map entities to our fields
        if 'GPE' in entities:  # Geopolitical entities (cities, states)
            extracted['location_entities'] = entities['GPE']
        
        if 'PERSON' in entities:
            extracted['person_entities'] = entities['PERSON']
        
        if 'ORG' in entities:
            extracted['organization_entities'] = entities['ORG']
        
        if 'MONEY' in entities:
            extracted['financial_entities'] = entities['MONEY']
        
        return extracted
    
    def identify_missing_requirements(self, doc_type: DocumentType, found_info: Dict[str, Any]) -> List[MissingRequirement]:
        """Identify missing required information"""
        requirements = PlanningDocumentRequirements.get_requirements(doc_type)
        missing = []
        
        for category, fields in requirements.items():
            for field_info in fields:
                field_name = field_info['field']
                
                # Check if this field was found in the document
                if field_name not in found_info or not found_info[field_name]:
                    missing_req = MissingRequirement(
                        category=category,
                        field_name=field_name,
                        description=field_info['description'],
                        importance=field_info['importance'],
                        suggested_source=self._get_suggested_source(field_name),
                        example_value=self._get_example_value(field_name)
                    )
                    missing.append(missing_req)
        
        return missing
    
    def _get_suggested_source(self, field_name: str) -> str:
        """Get suggested source for missing information"""
        source_map = {
            'property_address': 'Property deed or tax records',
            'parcel_number': 'County assessor records',
            'lot_size': 'Survey or property deed',
            'current_zoning': 'Municipal zoning map',
            'applicant_name': 'Application form',
            'applicant_address': 'Application form',
            'applicant_phone': 'Application form',
            'applicant_email': 'Application form',
            'proposed_use': 'Project description document',
            'building_height': 'Architectural plans',
            'building_footprint': 'Site plan or architectural drawings',
            'setbacks': 'Site plan with measurements',
            'parking_spaces': 'Site plan or parking analysis',
            'construction_type': 'Building plans and specifications',
            'building_value': 'Construction cost estimate',
            'square_footage': 'Architectural plans'
        }
        return source_map.get(field_name, 'Additional documentation required')
    
    def _get_example_value(self, field_name: str) -> str:
        """Get example value for missing field"""
        examples = {
            'property_address': '123 Main Street, Shady Cove, OR 97520',
            'parcel_number': '37-1W-25-1000',
            'lot_size': '0.25 acres (10,890 sq ft)',
            'current_zoning': 'R-1 (Single Family Residential)',
            'applicant_name': 'John Smith',
            'applicant_phone': '(541) 555-0123',
            'applicant_email': 'john.smith@email.com',
            'proposed_use': 'Single-family residence with detached garage',
            'building_height': '28 feet',
            'building_footprint': '2,400 square feet',
            'setbacks': 'Front: 25ft, Rear: 20ft, Side: 10ft',
            'parking_spaces': '2 covered spaces in garage'
        }
        return examples.get(field_name, 'See documentation requirements')
    
    def calculate_compliance_score(self, doc_type: DocumentType, found_info: Dict[str, Any], missing_reqs: List[MissingRequirement]) -> float:
        """Calculate compliance score based on found vs missing information"""
        requirements = PlanningDocumentRequirements.get_requirements(doc_type)
        total_fields = sum(len(fields) for fields in requirements.values())
        
        if total_fields == 0:
            return 100.0
        
        # Weight by importance
        importance_weights = {'critical': 3, 'important': 2, 'recommended': 1}
        total_weight = 0
        missing_weight = 0
        
        for category, fields in requirements.items():
            for field_info in fields:
                weight = importance_weights.get(field_info['importance'], 1)
                total_weight += weight
                
                if field_info['field'] not in found_info or not found_info[field_info['field']]:
                    missing_weight += weight
        
        if total_weight == 0:
            return 100.0
        
        compliance_score = ((total_weight - missing_weight) / total_weight) * 100
        return max(0.0, min(100.0, compliance_score))
    
    def generate_recommendations(self, missing_reqs: List[MissingRequirement]) -> List[str]:
        """Generate recommendations based on missing requirements"""
        recommendations = []
        
        critical_missing = [req for req in missing_reqs if req.importance == 'critical']
        important_missing = [req for req in missing_reqs if req.importance == 'important']
        
        if critical_missing:
            recommendations.append(f"URGENT: {len(critical_missing)} critical requirements are missing. Application cannot proceed without these.")
            for req in critical_missing[:3]:  # Show top 3
                recommendations.append(f"• Provide {req.description} (Source: {req.suggested_source})")
        
        if important_missing:
            recommendations.append(f"IMPORTANT: {len(important_missing)} important requirements need attention.")
            for req in important_missing[:2]:  # Show top 2
                recommendations.append(f"• Include {req.description}")
        
        if not critical_missing and not important_missing:
            recommendations.append("Document appears complete for basic requirements.")
            recommendations.append("Review with planning staff for final approval.")
        
        return recommendations
    
    def generate_next_steps(self, doc_type: DocumentType, missing_reqs: List[MissingRequirement]) -> List[str]:
        """Generate next steps for the applicant"""
        next_steps = []
        
        critical_missing = [req for req in missing_reqs if req.importance == 'critical']
        
        if critical_missing:
            next_steps.append("1. Gather missing critical information before submitting application")
            next_steps.append("2. Contact planning department for pre-application consultation")
            next_steps.append("3. Prepare additional documentation as identified")
        else:
            next_steps.append("1. Review application for completeness")
            next_steps.append("2. Submit application to planning department")
            next_steps.append("3. Schedule follow-up meeting if needed")
        
        # Add document-specific steps
        if doc_type == DocumentType.ZONING_APPLICATION:
            next_steps.append("4. Prepare for public hearing if required")
        elif doc_type == DocumentType.BUILDING_PERMIT:
            next_steps.append("4. Schedule building inspection once approved")
        
        return next_steps
    
    def analyze_document(self, file_path: str) -> DocumentAnalysisResult:
        """Perform complete document analysis"""
        logger.info(f"Analyzing document: {file_path}")
        
        # Extract text based on file type
        file_ext = Path(file_path).suffix.lower()
        if file_ext == '.pdf':
            text = self.extract_text_from_pdf(file_path)
        elif file_ext in ['.docx', '.doc']:
            text = self.extract_text_from_docx(file_path)
        else:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
        
        if not text.strip():
            logger.warning("No text extracted from document")
            return DocumentAnalysisResult(
                document_type=DocumentType.UNKNOWN,
                extracted_text="",
                found_information={},
                missing_requirements=[],
                compliance_score=0.0,
                confidence_score=0.0,
                recommendations=["Unable to extract text from document"],
                next_steps=["Verify document format and try again"]
            )
        
        # Classify document type
        doc_type = self.classify_document_type(text)
        logger.info(f"Classified as: {doc_type}")
        
        # Extract information using multiple methods
        pattern_info = self.extract_information_with_patterns(text)
        nlp_info = self.extract_information_with_nlp(text)
        
        # Combine extracted information
        found_info = {**pattern_info, **nlp_info}
        
        # Identify missing requirements
        missing_reqs = self.identify_missing_requirements(doc_type, found_info)
        
        # Calculate scores
        compliance_score = self.calculate_compliance_score(doc_type, found_info, missing_reqs)
        confidence_score = min(100.0, len(found_info) * 10)  # Simple confidence metric
        
        # Generate recommendations and next steps
        recommendations = self.generate_recommendations(missing_reqs)
        next_steps = self.generate_next_steps(doc_type, missing_reqs)
        
        return DocumentAnalysisResult(
            document_type=doc_type,
            extracted_text=text[:1000] + "..." if len(text) > 1000 else text,
            found_information=found_info,
            missing_requirements=missing_reqs,
            compliance_score=compliance_score,
            confidence_score=confidence_score,
            recommendations=recommendations,
            next_steps=next_steps
        )

def main():
    """Main function for command-line usage"""
    if len(sys.argv) != 2:
        print("Usage: python enhanced_document_analyzer.py <file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found")
        sys.exit(1)
    
    analyzer = EnhancedDocumentAnalyzer()
    result = analyzer.analyze_document(file_path)
    
    # Convert to JSON for output
    output = {
        'document_type': result.document_type.value,
        'found_information': result.found_information,
        'missing_requirements': [asdict(req) for req in result.missing_requirements],
        'compliance_score': result.compliance_score,
        'confidence_score': result.confidence_score,
        'recommendations': result.recommendations,
        'next_steps': result.next_steps,
        'extracted_text_preview': result.extracted_text
    }
    
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()


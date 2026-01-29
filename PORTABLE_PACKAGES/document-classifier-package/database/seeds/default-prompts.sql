-- Seed Data: Default Classification Prompt
-- Description: Inserts default document classification prompt
-- Date: 2025-12-24

-- Insert default classification prompt
INSERT INTO prompts (
  name,
  description,
  content,
  is_active,
  is_default,
  category,
  created_by
) VALUES (
  'Document Classification Prompt',
  'Default prompt for AI-powered document classification',
  'You are a document classification expert. Analyze the following text extracted from page {{page_number}} of a document and classify it.

DOCUMENT TYPES:
{{document_types}}

EXTRACTED TEXT:
{{extracted_text}}

Respond in JSON format:
{{response_format}}',
  true,
  true,
  'document_classifier',
  1
) ON CONFLICT DO NOTHING;

-- Insert prompt variables
INSERT INTO prompt_variables (
  prompt_id,
  variable_name,
  display_name,
  description,
  is_required,
  is_flow_variable,
  variable_type
) VALUES
  (
    (SELECT id FROM prompts WHERE category = 'document_classifier' AND is_default = true LIMIT 1),
    'page_number',
    'Page Number',
    'Current page number being classified',
    true,
    true,
    'number'
  ),
  (
    (SELECT id FROM prompts WHERE category = 'document_classifier' AND is_default = true LIMIT 1),
    'extracted_text',
    'Extracted Text',
    'Text extracted from the document page',
    true,
    true,
    'text'
  ),
  (
    (SELECT id FROM prompts WHERE category = 'document_classifier' AND is_default = true LIMIT 1),
    'document_types',
    'Document Types',
    'List of supported document types with descriptions',
    true,
    false,
    'text'
  ),
  (
    (SELECT id FROM prompts WHERE category = 'document_classifier' AND is_default = true LIMIT 1),
    'response_format',
    'Response Format',
    'Expected JSON response format structure',
    true,
    false,
    'text'
  )
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Default classification prompt seeded successfully';
END $$;



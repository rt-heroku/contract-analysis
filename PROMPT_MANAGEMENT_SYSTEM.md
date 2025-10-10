# Prompt Management System - Complete Documentation

## Overview

The Prompt Management System allows users to create, manage, and execute AI prompts with dynamic variables for document processing. Prompts are stored in Markdown format and can include placeholders for variable data that gets filled from the processing context.

## ✅ COMPLETED FEATURES

### 1. Database Schema

#### Prompt Table
```sql
CREATE TABLE prompts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,  -- Markdown content with {{variables}}
  is_active BOOLEAN DEFAULT TRUE,
  category VARCHAR(100),
  created_by INT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### PromptVariable Table
```sql
CREATE TABLE prompt_variables (
  id SERIAL PRIMARY KEY,
  prompt_id INT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  variable_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT FALSE,
  default_value TEXT,
  variable_type VARCHAR(50) DEFAULT 'text'
);
```

### 2. Backend API Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/prompts` | GET | List all prompts (with search, category, active filters) | Yes |
| `/api/prompts/:id` | GET | Get single prompt with variables | Yes |
| `/api/prompts` | POST | Create new prompt | Yes |
| `/api/prompts/:id` | PUT | Update prompt and variables | Yes |
| `/api/prompts/:id` | DELETE | Delete prompt | Yes |
| `/api/prompts/categories` | GET | Get unique categories | Yes |
| `/api/prompts/:id/execute` | POST | Execute prompt with variable values | Yes |

### 3. Frontend Features

#### Prompts Management Page (`/prompts`)

**Features:**
- ✅ Full CRUD operations for prompts
- ✅ Markdown editor with live preview (@uiw/react-md-editor)
- ✅ Auto-detection of variables from `{{variable_name}}` syntax
- ✅ Variable configuration (display name, type, required, description)
- ✅ Search and filter prompts
- ✅ Activate/deactivate prompts
- ✅ Category management
- ✅ Beautiful card-based layout

**Variable Types:**
- `text` - Simple text input
- `file` - File reference (pdf_file, xls_file)
- `number` - Numeric input
- `json` - JSON data (e.g., idp.response)

#### Example Prompt

```markdown
# Contract Analysis for {{username}}

## Job ID: {{job_id}}

Analyze the following contract document and data file:

**Contract:** {{pdf_file}}
**Data:** {{xls_file}}

### IDP Results:
{{idp.response}}

### Instructions:
1. Compare the contract terms with the actual data
2. Identify discrepancies
3. Provide compliance score
4. Generate recommendations
```

Variables detected:
- `username` (auto-filled from user session)
- `job_id` (auto-filled from upload)
- `pdf_file` (auto-filled from contract upload)
- `xls_file` (auto-filled from data upload)
- `idp.response` (auto-filled from document processing)

## 🚧 REMAINING IMPLEMENTATION

### Task 1: Update Processing Page

**Location:** `frontend/src/pages/Processing.tsx`

**Requirements:**
1. Add prompt selector section:
   ```tsx
   <Card title="AI Prompt (Optional)">
     <div className="space-y-4">
       {/* Search/Select Prompt */}
       <Autocomplete
         options={prompts}
         value={selectedPrompt}
         onChange={handlePromptSelect}
         placeholder="Search prompts..."
       />
       
       {/* Variable Inputs */}
       {selectedPrompt && (
         <div className="space-y-3">
           {selectedPrompt.variables.map(variable => (
             <div key={variable.id}>
               <label>
                 {variable.displayName}
                 {variable.isRequired && <span className="text-red-500">*</span>}
               </label>
               <Input
                 value={variableValues[variable.variableName]}
                 onChange={(e) => handleVariableChange(variable.variableName, e.target.value)}
                 placeholder={variable.description}
                 disabled={isAutoFilled(variable.variableName)}
               />
             </div>
           ))}
         </div>
       )}
     </div>
   </Card>
   ```

2. Auto-fill context variables:
   ```typescript
   const autoFillVariables = (prompt: Prompt) => {
     const values: Record<string, string> = {};
     
     prompt.variables.forEach(variable => {
       switch (variable.variableName) {
         case 'username':
           values[variable.variableName] = user?.email || '';
           break;
         case 'job_id':
           values[variable.variableName] = jobId;
           break;
         case 'pdf_file':
           values[variable.variableName] = contractFile?.name || '';
           break;
         case 'xls_file':
           values[variable.variableName] = dataFile?.name || '';
           break;
         // Add more auto-fill logic
       }
     });
     
     return values;
   };
   ```

3. Update `handleProcess()` to include prompt:
   ```typescript
   if (selectedPrompt) {
     // Execute prompt with variables
     const promptResponse = await api.post(`/prompts/${selectedPrompt.id}/execute`, {
       variables: variableValues,
       jobId,
     });
     
     // Send processed prompt to MuleSoft
     await api.post('/processing/execute-with-prompt', {
       jobId,
       promptId: selectedPrompt.id,
       processedContent: promptResponse.data.processedContent,
     });
   }
   ```

### Task 2: Backend Prompt Processing Endpoint

**Location:** `backend/src/routes/processing.routes.ts` (new)

```typescript
router.post('/execute-with-prompt', authenticate, async (req, res) => {
  const { jobId, promptId, processedContent } = req.body;
  
  // Send to MuleSoft with prompt
  const result = await muleSoftService.executePrompt(jobId, processedContent);
  
  // Store result in database
  await prisma.promptExecution.create({
    data: {
      jobId,
      promptId,
      processedContent,
      llmResponse: result.llmResponse,
      status: result.status,
    },
  });
  
  res.json({ result });
});
```

### Task 3: MuleSoft Service Update

**Location:** `backend/src/services/muleSoft.service.ts`

Add new method:

```typescript
/**
 * Execute prompt with MuleSoft LLM
 */
async executePrompt(jobId: string, promptContent: string): Promise<any> {
  const muleSoftConfig = await getMuleSoftConfig();
  const endpoint = '/execute-prompt'; // New MuleSoft endpoint
  
  const response = await axios.post(
    `${muleSoftConfig.baseUrl}${endpoint}?job=${jobId}`,
    {
      prompt: promptContent,
      jobId,
    },
    {
      timeout: muleSoftConfig.timeout,
      headers: { 'Content-Type': 'application/json' },
    }
  );
  
  return response.data;
}
```

### Task 4: Additional Database Table (Optional)

For storing prompt execution history:

```sql
CREATE TABLE prompt_executions (
  id SERIAL PRIMARY KEY,
  job_id VARCHAR(100) NOT NULL,
  prompt_id INT REFERENCES prompts(id),
  processed_content TEXT NOT NULL,
  llm_response TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  executed_at TIMESTAMP DEFAULT NOW()
);
```

## Usage Workflow

### 1. Create a Prompt

1. Navigate to `/prompts`
2. Click "Create New Prompt"
3. Enter name, description, category
4. Write markdown content with `{{variables}}`
5. System auto-detects variables
6. Configure each variable:
   - Display name
   - Type (text, file, number, json)
   - Required/Optional
   - Description
7. Save prompt

### 2. Use Prompt in Processing

1. Navigate to `/processing`
2. Upload contract and data files
3. (Optional) Select a prompt from dropdown
4. Fill in any required variables (system auto-fills most)
5. Click "Process Documents"
6. System:
   - Fills variables from context
   - Executes prompt
   - Sends to MuleSoft
   - MuleSoft sends to LLM
   - Returns result

### 3. View Results

- Results stored in analysis record
- Includes both standard processing and LLM response
- LLM response displayed in Analysis Details page

## MuleSoft Integration Points

### Expected Request to MuleSoft

```http
POST http://localhost:8081/execute-prompt?job={jobId}
Content-Type: application/json

{
  "prompt": "# Contract Analysis...\n\nAnalyze the following...",
  "jobId": "uuid-here",
  "variables": {
    "username": "admin@demo.com",
    "job_id": "uuid-here",
    "pdf_file": "contract.pdf",
    "xls_file": "data.xlsx",
    "idp.response": "{...}"
  }
}
```

### Expected Response from MuleSoft

```json
{
  "status": "SUCCESS",
  "llmResponse": {
    "analysis": "Based on the contract analysis...",
    "markdown": "# Analysis Results\n\n...",
    "complianceScore": "85%",
    "recommendations": [...]
  },
  "processingTime": 12500
}
```

## Auto-Filled Variables

The system automatically fills these variables from context:

| Variable | Source | Example |
|----------|--------|---------|
| `username` | User session | "admin@demo.com" |
| `job_id` | Upload session | "uuid-12345" |
| `pdf_file` | Contract upload | "contract.pdf" |
| `xls_file` | Data upload | "data.xlsx" |
| `idp.response` | Document processing | JSON object |

Users can also add custom variables that must be manually entered.

## Example Prompts

### 1. Contract Compliance Check

```markdown
# Contract Compliance Analysis

Job: {{job_id}}
Analyst: {{username}}

## Documents
- Contract: {{pdf_file}}
- Data File: {{xls_file}}

## Task
Review the contract terms and compare with actual data:

{{idp.response}}

Provide:
1. Compliance score (0-100%)
2. List of violations
3. Recommendations
```

### 2. Anomaly Detection

```markdown
# Data Anomaly Detection

Analyze {{xls_file}} for anomalies.

Reference contract: {{pdf_file}}
Expected patterns: {{expected_patterns}}

Flag:
- Unusual quantities
- Price discrepancies
- Missing items
```

### 3. Summary Generation

```markdown
# Executive Summary

Create a business summary for {{client_name}}.

Files analyzed:
- {{pdf_file}}
- {{xls_file}}

Focus on:
1. Key findings
2. Risk assessment
3. Action items
```

## Frontend Integration Example

```typescript
// In Processing.tsx
const [prompts, setPrompts] = useState<Prompt[]>([]);
const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
const [variableValues, setVariableValues] = useState<Record<string, string>>({});

// Fetch prompts
useEffect(() => {
  const fetchPrompts = async () => {
    const response = await api.get('/prompts?active=true');
    setPrompts(response.data.prompts);
  };
  fetchPrompts();
}, []);

// Handle prompt selection
const handlePromptSelect = (prompt: Prompt) => {
  setSelectedPrompt(prompt);
  
  // Auto-fill variables
  const autoFilled = {
    username: user?.email || '',
    job_id: jobId,
    pdf_file: contractFile?.name || '',
    xls_file: dataFile?.name || '',
  };
  
  setVariableValues(autoFilled);
};

// Include prompt in processing
const handleProcess = async () => {
  // ... existing file upload logic ...
  
  if (selectedPrompt) {
    const promptResponse = await api.post(`/prompts/${selectedPrompt.id}/execute`, {
      variables: variableValues,
      jobId,
    });
    
    await api.post('/processing/execute-with-prompt', {
      jobId,
      promptId: selectedPrompt.id,
      processedContent: promptResponse.data.processedContent,
    });
  }
};
```

## Security Considerations

- All prompt endpoints require authentication
- Prompts are user-scoped (createdBy field)
- Variable values are validated before execution
- Sensitive data (API keys) should not be in prompts
- MuleSoft should sanitize prompt content before sending to LLM

## Future Enhancements

1. **Prompt Templates**: Pre-built prompts for common tasks
2. **Version Control**: Track prompt changes over time
3. **Sharing**: Allow users to share prompts
4. **Prompt Analytics**: Track usage and success rates
5. **LLM Selection**: Choose different LLMs per prompt
6. **Variable Validation**: Custom validation rules for variables
7. **Prompt Chaining**: Link multiple prompts together

## Testing

### Test Prompt Creation

1. Go to `/prompts`
2. Create prompt with these variables:
   - `{{username}}`
   - `{{job_id}}`
   - `{{pdf_file}}`
3. Verify auto-detection works
4. Save and verify database entry

### Test Processing Integration

1. Upload files
2. Select prompt
3. Verify variables are auto-filled
4. Process documents
5. Check that prompt is sent to MuleSoft

## API Documentation

See individual endpoint documentation in:
- `backend/src/controllers/prompt.controller.ts`
- `backend/src/routes/prompt.routes.ts`

## Database Migrations

Schema changes already applied via `prisma db push`.

To regenerate Prisma client:
```bash
npm run prisma:generate --prefix backend
```

## Next Steps

1. ✅ Schema created
2. ✅ API endpoints implemented
3. ✅ Frontend Prompts page complete
4. ⏳ Integrate into Processing page
5. ⏳ Add MuleSoft prompt endpoint
6. ⏳ Test end-to-end workflow

---

**Status**: Core infrastructure complete, integration pending.
**Ready for**: Processing page integration and MuleSoft endpoint addition.


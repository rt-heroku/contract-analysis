# Step Builder - Quick Start Guide

Get started with the Step Builder in 5 minutes!

## Prerequisites

- Backend and frontend running
- Database connected
- User logged in with `workflow.create` permission

## Setup (One-Time)

### 1. Run Migration

```bash
cd backend
npm run migrations
```

This creates the workflow tables and adds permissions.

### 2. Restart Backend

```bash
npm run dev
```

### 3. Access Workflows Page

Navigate to: `http://localhost:3000/workflows`

## Create Your First Workflow

### Step 1: Create Workflow

1. Click on "Workflows" in the menu
2. The page opens with "New Workflow" as the default name
3. Click the name to edit it (e.g., "Contract Processing")
4. Click **Save** button

### Step 2: Add Steps

**Drag steps from the left sidebar to the canvas:**

1. **File Upload** - Drag to canvas
   - Configure: Accept PDF files, max 10MB
   - Output variable: `uploaded_file`
   - Click "Add Step"

2. **IDP Process** - Drag below first step
   - Configure: Document type = "contract"
   - Input source: `previous_step`
   - Output variable: `idp_result`
   - Click "Add Step"

3. **Review** - Drag below second step
   - Configure: Review type = "manual"
   - Instructions: "Please review the extracted data"
   - Input source: `previous_step`
   - Output variable: `review_result`
   - Click "Add Step"

4. **Store Data** - Drag below third step
   - Configure: Storage type = "database"
   - Table name: `analysis_records`
   - Input source: `previous_step`
   - Click "Add Step"

### Step 3: Save Workflow

Click **Save** button in the top toolbar.

### Step 4: Run Workflow

1. Click **Run Workflow** button
2. Execution modal opens showing progress
3. Step 1 (File Upload) pauses - upload a PDF file
4. Step 2 (IDP Process) runs automatically
5. Step 3 (Review) pauses - review and approve
6. Step 4 (Store) runs automatically
7. Workflow completes!

## Example Workflows

### Simple Document Upload

```
1. File Upload (PDF)
   ↓
2. Store Data (database)
```

### IDP with Manual Review

```
1. File Upload (PDF)
   ↓
2. IDP Process (extract data)
   ↓
3. Review (manual approval)
   ↓
4. Store Data (database)
```

### API Integration

```
1. File Upload (PDF)
   ↓
2. IDP Process (extract)
   ↓
3. API Call (send to external system)
   ↓
4. Store Data (save response)
```

### Full Contract Processing

```
1. File Upload (PDF contract)
   ↓
2. IDP Process (extract contract terms)
   ↓
3. Review (verify extraction)
   ↓
4. Data Analysis (analyze terms)
   ↓
5. API Call (notify stakeholders)
   ↓
6. Store Data (save results)
```

## Tips

### Drag and Drop
- Drag steps from library to canvas
- Drag steps within canvas to reorder
- Use ↑↓ buttons for fine-tuning order

### Configuration
- Click ✎ (edit) icon to reconfigure a step
- Set meaningful output variable names
- Use `previous_step` for sequential data flow
- Use `step_N_output` to reference specific steps

### Execution
- Modal shows real-time progress
- Green ✓ = completed
- Blue ⟳ = running
- Orange ⏸ = waiting for you
- Red ✗ = failed

### User Input
- When step pauses, input form appears in modal
- Enter data and click "Continue Workflow"
- Execution resumes from next step

### Context Variables
- Each step's output is stored in context
- Access via: `step_1_output`, `step_2_output`, etc.
- Or use custom names: `uploaded_file`, `idp_result`
- Nested access: `step_2_output.extractedData`

## Common Patterns

### File → Process → Store
```
File Upload → IDP Process → Store Data
```

### File → Process → Review → Store
```
File Upload → IDP Process → Review → Store Data
```

### File → Process → Analyze → Store
```
File Upload → IDP Process → Data Analysis → Store Data
```

### File → API → Store
```
File Upload → API Call → Store Data
```

## Troubleshooting

**Q: Can't see Workflows menu?**  
A: Run migration and restart backend. Check user has `workflow.view` permission.

**Q: Steps not saving?**  
A: Save workflow first, then add steps.

**Q: Execution stuck?**  
A: Check execution modal for user input form. Provide input and click Continue.

**Q: Data not passing between steps?**  
A: Verify output variable names match input source references.

**Q: Permission denied?**  
A: Check user has required workflow permissions (create, edit, execute).

## Next Steps

- Explore all 6 step types
- Create workflow templates
- Build complex multi-step processes
- Integrate with existing systems
- Share workflows with team

## Need Help?

- See full documentation: `docs/STEP_BUILDER_IMPLEMENTATION.md`
- Check plan file: `.cursor/plans/step_builder_system_9bcb5fe8.plan.md`
- Review activity logs for execution errors

---

**Happy workflow building! 🎉**






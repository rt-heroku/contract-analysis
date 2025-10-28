# Enhanced User Action Creator - Complete Guide

## Overview

The Action Creator has been significantly enhanced to provide a professional-grade interface for creating user-defined REST API actions with full HTTP configuration capabilities, connector integration, and intelligent schema generation.

## 🎯 Key Features

### 1. **Connector Integration**

When creating a REST API action, you can now:

- **Select from existing connectors**: Inherit base URL, authentication, and default headers
- **Quick connector creation**: Use the **+ New** button to navigate directly to connector creation
- **Standalone actions**: Optionally create actions without connectors for simple one-off calls

**Benefits:**
- Centralized configuration management
- Actions automatically use connector's auth credentials
- Easy updates: Change connector config affects all actions using it

---

### 2. **Smart Endpoint Detection**

The system intelligently detects whether you're providing a full URL or a relative endpoint:

#### Full URL (Complete Path)
```
https://api.example.com/users
http://internal-api.company.com/v1/data
```
✓ **Full URL detected** - Used as-is, connector base URL ignored

#### Relative Endpoint (Path Only)
```
/api/users
/v1/data/process
```
✓ **Endpoint path detected** - Appended to connector's base URL

**Visual Feedback:**
- Real-time detection hints displayed below the field
- Warning if format is invalid (doesn't start with protocol or `/`)

---

### 3. **Complete HTTP Configuration**

#### A. HTTP Methods
Select from all standard HTTP methods:
- `GET` - Retrieve data
- `POST` - Create new resources
- `PUT` - Update/replace resources
- `PATCH` - Partial updates
- `DELETE` - Remove resources
- `HEAD` - Retrieve headers only
- `OPTIONS` - Check available methods

#### B. Path Parameters
Define dynamic URL segments:
```
Endpoint: /users/{{userId}}/orders/{{orderId}}

Path Parameters:
  userId: {{input.userId}}
  orderId: {{input.orderId}}
```

**At runtime:** `/users/123/orders/456`

#### C. Query Parameters
Add URL query strings:
```
Query Parameters:
  search: {{input.searchTerm}}
  limit: 100
  sort: asc
```

**Result:** `?search=john&limit=100&sort=asc`

#### D. Content-Type Header
Select request body format:
- `application/json` (default)
- `application/xml`
- `application/x-www-form-urlencoded`
- `multipart/form-data`
- `text/plain`
- `text/html`

#### E. Accept Header
Define expected response format:
- `application/json` (default)
- `application/xml`
- `text/plain`
- `text/html`
- `*/*` (any format)

#### F. Custom Headers
Add any additional headers:
```
X-API-Version: v2
X-Request-ID: {{input.requestId}}
User-Agent: MyApp/1.0
```

---

### 4. **Request Body Templates**

Define how input data is transformed into the HTTP request body:

```json
{
  "user": {
    "name": "{{input.name}}",
    "email": "{{input.email}}",
    "metadata": {{input.metadata}}
  },
  "timestamp": "{{context.timestamp}}"
}
```

**Variable Interpolation:**
- `{{input.fieldName}}` - Access input data
- `{{context.variable}}` - Access execution context
- `{{config.setting}}` - Access configuration

**Leave Empty:** To send the entire input object as-is

---

### 5. **Input & Output Metadata**

#### Input Metadata
Define expected input structure using JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "number", "minimum": 0 }
  },
  "required": ["name", "email"]
}
```

**Purpose:**
- Validates input data at runtime
- Enables mapping from previous actions in workflows
- Provides autocomplete in process designer

---

#### Output Metadata (Enhanced)

**Two Tabs for Easy Configuration:**

##### Tab 1: Definition
Manually edit the JSON Schema for output structure:

```json
{
  "type": "object",
  "properties": {
    "userId": { "type": "string" },
    "token": { "type": "string" },
    "expiresAt": { "type": "string", "format": "date-time" }
  }
}
```

##### Tab 2: Example
Paste a sample response and auto-generate the schema:

**Example JSON:**
```json
{
  "userId": "12345",
  "name": "John Doe",
  "email": "john@example.com",
  "roles": ["user", "admin"],
  "settings": {
    "theme": "dark",
    "notifications": true
  }
}
```

**Click "Generate Schema from Example"** → Automatically creates:

```json
{
  "type": "object",
  "properties": {
    "userId": { "type": "string" },
    "name": { "type": "string" },
    "email": { "type": "string" },
    "roles": { "type": "array", "items": { "type": "string" } },
    "settings": {
      "type": "object",
      "properties": {
        "theme": { "type": "string" },
        "notifications": { "type": "boolean" }
      }
    }
  }
}
```

---

## 📝 Complete Example: Create User Action

### Scenario
Create a user account via external API with full validation and mapping.

### Configuration

**Basic Information:**
- **Action Name:** `create_user_account`
- **Display Name:** `Create User Account`
- **Description:** `Creates a new user account in the external system`
- **Category:** `API`
- **Color:** `#4F46E5` (Indigo)

**Execution Configuration:**
- **Executor Type:** `REST API Call`
- **Connector:** `External Auth API` (select from dropdown)
- **Method:** `POST`
- **Endpoint:** `/api/v2/users`

**Path Parameters:** *(none for this example)*

**Query Parameters:**
```
notify: true
sendWelcomeEmail: {{input.sendEmail}}
```

**Content-Type:** `application/json`
**Accept:** `application/json`

**Custom Headers:**
```
X-API-Version: 2.0
X-Client-ID: {{config.clientId}}
```

**Request Body:**
```json
{
  "user": {
    "firstName": "{{input.firstName}}",
    "lastName": "{{input.lastName}}",
    "email": "{{input.email}}",
    "role": "{{input.role}}",
    "department": "{{input.department}}"
  },
  "metadata": {
    "source": "process_automation",
    "createdBy": "{{context.userId}}",
    "timestamp": "{{context.timestamp}}"
  }
}
```

**Input Metadata:**
```json
{
  "type": "object",
  "properties": {
    "firstName": { "type": "string", "minLength": 1 },
    "lastName": { "type": "string", "minLength": 1 },
    "email": { "type": "string", "format": "email" },
    "role": { "type": "string", "enum": ["user", "admin", "viewer"] },
    "department": { "type": "string" },
    "sendEmail": { "type": "boolean", "default": true }
  },
  "required": ["firstName", "lastName", "email", "role"]
}
```

**Output Example (pasted in Example tab):**
```json
{
  "success": true,
  "userId": "usr_12345",
  "accountId": "acc_67890",
  "status": "active",
  "createdAt": "2025-10-28T10:30:00Z",
  "activationLink": "https://app.example.com/activate/abc123"
}
```

**Generated Output Schema (from example):**
```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "userId": { "type": "string" },
    "accountId": { "type": "string" },
    "status": { "type": "string" },
    "createdAt": { "type": "string" },
    "activationLink": { "type": "string" }
  }
}
```

---

## 🚀 Usage in Processes

Once created, your action appears in the **Actions** page under **User Actions**.

### In Process Designer:
1. Drag the action onto the canvas
2. Connect it to other actions
3. **Input Mapping:** Map outputs from previous actions to this action's inputs
4. **Output Mapping:** Use this action's outputs in subsequent actions

**Example Flow:**
```
[Get Form Data] → [Create User Account] → [Send Notification]
                      ↓
                  userId, accountId
```

---

## 🔒 Security Best Practices

### 1. **Use Connectors for Credentials**
- Store API keys, tokens, and passwords in connectors
- Never hardcode credentials in action configuration
- Connectors handle authentication automatically

### 2. **Validate All Inputs**
- Define strict input schemas with validation rules
- Use `required` fields to prevent missing data
- Use `enum` for limited value sets

### 3. **Sanitize Dynamic Values**
- Be careful with user-provided data in templates
- Avoid passing raw input to sensitive operations
- Use allowlists for dynamic values

### 4. **Limit Permissions**
- Only grant necessary permissions to users
- Use role-based access control
- Audit action usage via Activity Logs

---

## 🛠️ Troubleshooting

### Issue: "Endpoint not found"
**Solution:** 
- Check if endpoint starts with `/` for relative paths
- Or use full URL with protocol (`https://`)
- Verify connector has valid base URL

### Issue: "Invalid JSON in response"
**Solution:**
- Check `Accept` header matches API response format
- Try `Accept: */*` for non-JSON APIs
- Review API documentation for correct format

### Issue: "Authentication failed"
**Solution:**
- Verify connector credentials are correct
- Test connector connection in Connectors page
- Check if API requires specific headers

### Issue: "Cannot generate schema from example"
**Solution:**
- Ensure example is valid JSON (no trailing commas)
- Check for proper quote usage
- Use JSON validator if needed

---

## 📚 Reference

### Variable Interpolation Syntax

| Syntax | Description | Example |
|--------|-------------|---------|
| `{{input.field}}` | Access input data | `{{input.userId}}` |
| `{{context.field}}` | Access execution context | `{{context.timestamp}}` |
| `{{config.field}}` | Access configuration | `{{config.apiKey}}` |
| `{{variable}}` | Raw variable | `{{userId}}` |

### JSON Schema Types

| Type | Description | Example Value |
|------|-------------|---------------|
| `string` | Text | `"hello"` |
| `number` | Numeric | `42`, `3.14` |
| `integer` | Whole number | `42` |
| `boolean` | True/False | `true` |
| `array` | List | `[1, 2, 3]` |
| `object` | Nested structure | `{"key": "value"}` |
| `null` | No value | `null` |

### String Formats

| Format | Description | Example |
|--------|-------------|---------|
| `date-time` | ISO 8601 timestamp | `2025-10-28T10:30:00Z` |
| `date` | Date only | `2025-10-28` |
| `time` | Time only | `10:30:00` |
| `email` | Email address | `user@example.com` |
| `uri` | URL | `https://example.com` |
| `uuid` | UUID | `123e4567-e89b-12d3-a456-426614174000` |

---

## 💡 Tips & Tricks

### 1. **Start with an Example**
Always paste a real API response in the Example tab first. It's faster and more accurate than writing schema manually.

### 2. **Test Connectors First**
Before creating actions, test your connector in the Connectors page. This ensures authentication works.

### 3. **Use Descriptive Names**
- Action name: `create_user_account` (system identifier)
- Display name: `Create User Account` (human-readable)

### 4. **Document Your Actions**
Use the description field to explain:
- What the action does
- Required input format
- Expected output
- Any prerequisites

### 5. **Reuse Actions**
Create generic, reusable actions (e.g., "Make API Call") instead of hyper-specific ones for maximum flexibility.

### 6. **Version Your APIs**
Include API version in custom headers:
```
X-API-Version: 2.0
```

### 7. **Handle Errors Gracefully**
Define output schemas that include error fields:
```json
{
  "success": { "type": "boolean" },
  "error": { "type": "string" },
  "errorCode": { "type": "string" }
}
```

---

## 🔄 Migration from Old Actions

If you have existing simple actions:

1. **Create Connector**: Extract base URL and auth to a connector
2. **Update Action**: Associate action with connector
3. **Simplify Endpoint**: Change full URL to relative path
4. **Add Metadata**: Define input/output schemas for validation
5. **Test**: Run action in a test process

---

## 🎉 Summary

The enhanced Action Creator provides:

✅ **Professional-grade REST API configuration**  
✅ **Connector integration for centralized management**  
✅ **Smart endpoint detection with visual feedback**  
✅ **Complete HTTP configuration (headers, params, body)**  
✅ **Automatic schema generation from examples**  
✅ **Input/output metadata for action mapping**  
✅ **Better UX with inline help and validation**

**Result:** Create production-ready, reusable actions in minutes!

---

## 📞 Need Help?

- Check the **Actions** page for examples
- Test connectors in **Connectors** page
- View execution logs in **Executions** page
- Contact your admin for permission issues

---

*Last Updated: October 28, 2025*  
*Version: 2.1*


# UX Writing & Microcopy Guidelines

This document provides comprehensive guidelines for standardizing user-facing messages, form field context, and tooltips throughout the SokoClick admin dashboard.

## Message Pattern Standard

All user-facing messages must follow this pattern:

```
[What happened] because [Why]. To fix, [How].
```

### Examples:

**Instead of:** "RPC failed: Network error"  
**Use:** "Unable to connect to server because of network issues. To fix, check your internet connection and try again."

**Instead of:** "Invalid input"  
**Use:** "Unable to save form because some fields contain errors. To fix, correct the highlighted fields and try again."

**Instead of:** "Operation timed out"  
**Use:** "Request took too long to complete because the server is busy. To fix, try again in a few moments."

## Error Message Guidelines

1. **Be specific about what happened**
   - Specify exactly which action failed (upload, save, connection)
   - Name the specific item that was affected (product, slot, image)

2. **Explain why in user terms**
   - Translate technical reasons into user-understandable language
   - Focus on what's relevant to the user, not system details

3. **Provide clear next steps**
   - Tell users exactly what they can do to resolve the issue
   - If no user action can help, explain what will happen next

4. **Be empathetic but concise**
   - Acknowledge the problem without being dramatic
   - Keep messages brief but informative

## Success Message Guidelines

1. **Confirm what was accomplished**
   - Clearly state what was successfully completed
   - Include specifics (item name, ID) when relevant

2. **Explain any follow-up actions**
   - If there are next steps, clearly explain them
   - If no action is needed, provide confirmation

3. **Be positive and reinforcing**
   - Use positive language that reinforces the user's action
   - Avoid technical jargon even in success messages

## Technical Jargon Translation Guide

| Technical Term | User-Friendly Alternative |
|----------------|---------------------------|
| RPC failed | Unable to connect to server |
| 404 error | Item not found |
| 403 error | You don't have permission |
| Authentication error | Sign-in required |
| Database connection error | System temporarily unavailable |
| Validation failed | Information needs correction |
| API rate limit | Too many requests at once |
| Timeout | Request took too long |
| CORS error | Security restriction |
| Parsing error | System couldn't read the information |

## Form Field Context Guidelines

Every form field should include:

1. **Clear Label**: What information is needed
2. **Helper Text**: Why this information is needed or how it will be used
3. **Format Guidance**: Expected format when applicable
4. **Error Messages**: Following the standard pattern

### Example Form Field Contexts:

**Product Name (English)**
- Label: "Product Name (English)"
- Helper Text: "This is how your product will appear to English-speaking customers"
- Format: "Keep it concise and descriptive, 5-60 characters"

**Price**
- Label: "Price"
- Helper Text: "Set the price customers will pay, excluding delivery fees"
- Format: "Numbers only, without currency symbol"

**WhatsApp Number**
- Label: "WhatsApp Contact Number"
- Helper Text: "Customers will contact you on this number for inquiries"
- Format: "Include country code, e.g., +237 123456789"

## Tooltip Guidelines

Tooltips should be used for:

1. **Complex Controls**: Explaining what advanced features do
2. **Icon-Only Buttons**: Providing text labels for icon buttons
3. **Contextual Help**: Offering additional information without cluttering the interface

Tooltips should NOT be used for:

1. Essential information required to use the product
2. Critical warnings or errors
3. As a substitute for clear labels

### Tooltip Examples:

**Slot Grid Maintenance Toggle**
- Tooltip: "Toggle maintenance mode for this slot. In maintenance mode, the slot won't be visible to customers."

**Batch Action Button**
- Tooltip: "Perform the same action on multiple slots at once. Select slots first, then choose an action."

**Analytics Time Period Selector**
- Tooltip: "Choose the time period for the displayed data. This affects all charts and metrics on the page."

## Voice and Tone

- **Voice**: Helpful, knowledgeable, and supportive
- **Active Voice**: Use active voice for clarity ("We couldn't find your file" vs "Your file could not be found")
- **Direct Address**: Speak directly to the user using "you" and "your"
- **Politeness**: Be professional but conversational
- **Consistency**: Maintain consistent terminology across the interface

## Localization Considerations

- Ensure all microcopy supports both English and French
- Account for text expansion in French (typically 15-30% longer)
- Use neutral language that translates well
- Avoid idioms, cultural references, or region-specific terminology 
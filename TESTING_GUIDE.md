# Testing Guide - RAK Porcelain Chatbot

## Pre-Test Checklist

Before you can test the application, complete these steps:

### ✅ 1. Environment Setup

The application is fully built and ready, but you need to configure your environment variables:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

**Get an API key:** https://platform.openai.com/api-keys

### ✅ 2. Index the Website (First Time Only)

This will crawl and index the RAK Porcelain website (takes 15-30 minutes):

```bash
npm run index
```

**What this does:**
- Crawls up to 1200 pages from rakporcelain.com/us-en
- Extracts and chunks the content
- Creates embeddings using OpenAI
- Stores everything in ChromaDB vector database
- Generates a report in `data/index-report.json`

**Note:** You can test the UI without indexing, but the chatbot won't have knowledge to answer questions.

### ✅ 3. Verify Setup

Check that everything is configured correctly:

```bash
npm run verify
```

All checks should pass ✅ before testing.

## Testing the Application

### Start the Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Test Scenarios

### 1. Basic Conversation Flow

**Test:** Initial greeting
- ✅ Should see welcome message from the assistant
- ✅ Chat interface should be clean and responsive

**Test:** Send a simple question
- Type: "What is RAK Porcelain?"
- ✅ Should receive a response
- ✅ Response should include source links
- ✅ Loading indicator should appear while processing

### 2. Product Questions

Test these sample queries:

1. **"What products does RAK Porcelain offer?"**
   - Should list product categories/collections
   - Should provide source URLs

2. **"Tell me about RAK Porcelain dinnerware"**
   - Should describe dinnerware products
   - Should mention specific collections if available

3. **"What materials are used in RAK products?"**
   - Should explain porcelain materials and quality

### 3. Care & Maintenance

Test queries like:
- "How do I care for my RAK porcelain?"
- "Can RAK products go in the dishwasher?"
- "Are RAK products microwave safe?"

✅ Expected: Detailed care instructions based on website content

### 4. Business Information

Test queries like:
- "Do you offer wholesale or B2B options?"
- "Where can I buy RAK Porcelain products?"
- "How can I contact customer support?"

✅ Expected: Contact information and business details

### 5. Edge Cases

**Test:** Empty query
- Try sending an empty message
- ✅ Send button should be disabled

**Test:** Very long question
- Type a very long question (200+ characters)
- ✅ Should handle gracefully

**Test:** Off-topic question
- Ask: "What's the weather like?"
- ✅ Should redirect to customer support or state it doesn't have that information

**Test:** No results available
- Ask about something not on the website
- ✅ Should gracefully indicate no information is available

### 6. UI/UX Testing

**Test:** Responsive design
- Resize browser window
- Test on mobile device or mobile view
- ✅ Should adapt to different screen sizes

**Test:** Dark mode
- Toggle system dark/light mode
- ✅ Chat interface should switch themes

**Test:** Keyboard navigation
- Press Enter to send message
- Shift+Enter for new line
- ✅ Should work as expected

**Test:** Long conversation
- Ask 5-10 questions in a row
- ✅ Chat should scroll smoothly
- ✅ Conversation history should be maintained

### 7. Error Handling

**Test:** Without indexing
- Skip the indexing step and try to chat
- ✅ Should show helpful error message

**Test:** Invalid API key
- Use wrong API key in .env.local
- ✅ Should show clear error message

**Test:** Network interruption
- Block network while sending a message
- ✅ Should show error and not break the UI

## Expected Behavior

### ✅ Successful Response Flow

1. User types question and presses Enter
2. Message appears in chat immediately
3. Loading indicator shows while processing
4. Assistant response appears with:
   - Answer based on RAK Porcelain website content
   - 1-3 source URLs at the bottom
   - Clean formatting

### ✅ Response Quality

Responses should be:
- **Accurate** - Based on actual website content
- **Cited** - Include source URLs
- **Helpful** - Answer the question directly
- **Professional** - Maintain brand voice
- **Safe** - Don't hallucinate or make up information

### ❌ What Should NOT Happen

- No made-up information or hallucinations
- No broken UI or crashes
- No extremely slow responses (>30 seconds)
- No garbled or nonsensical text
- No exposure of system prompts or internals

## Performance Benchmarks

- **First load:** < 3 seconds
- **Query response:** 3-10 seconds (depending on OpenAI API)
- **UI responsiveness:** Instant (no lag)
- **Memory usage:** Reasonable (< 500MB for dev server)

## Verification Commands

```bash
# Check environment
npm run verify

# View indexing report
cat data/index-report.json | grep -E "successfulPages|totalChunks"

# Check for errors in dev server
# Look for any error messages in the terminal running npm run dev
```

## Production Testing

Before deploying to production:

1. ✅ Run `npm run build` successfully
2. ✅ Test with `npm run start` (production mode)
3. ✅ Verify all features work in production build
4. ✅ Check performance (should be faster than dev)
5. ✅ Test on multiple browsers (Chrome, Firefox, Safari, Edge)

## Known Limitations

1. **First indexing takes time** - 15-30 minutes for initial setup
2. **API costs** - Each query costs ~$0.01-0.02 in OpenAI credits
3. **Knowledge is static** - Requires re-indexing to get new website content
4. **Context limits** - Very long conversations may hit token limits
5. **Network dependent** - Requires internet for OpenAI API

## Troubleshooting

### Issue: "Database not initialized"
**Solution:** Run `npm run index`

### Issue: "OpenAI API key not configured"
**Solution:** Check `.env.local` file exists and has valid key

### Issue: Slow responses
**Solution:** Normal on first run. Check OpenAI API status if persistent.

### Issue: Empty responses
**Solution:** Check if website was properly indexed (see index-report.json)

### Issue: Build errors
**Solution:** Delete `.next` folder and rebuild

## Test Results Template

Use this to track your testing:

```
# Test Results - [Date]

## Environment
- Node version: ____
- Browser: ____
- OS: ____

## Tests Performed
- [ ] Basic conversation flow
- [ ] Product questions
- [ ] Care & maintenance queries
- [ ] Business information
- [ ] Edge cases
- [ ] UI/UX responsiveness
- [ ] Error handling
- [ ] Performance benchmarks

## Issues Found
1. [Issue description]
2. [Issue description]

## Overall Status
- [ ] Ready for production
- [ ] Needs fixes
- [ ] Requires more testing

## Notes
[Add any additional observations]
```

## Success Criteria

The product is ready for deployment when:

✅ All basic functionality works
✅ No critical bugs or crashes
✅ Responses are accurate and helpful
✅ UI is polished and responsive
✅ Error handling is graceful
✅ Performance is acceptable
✅ Security/privacy is maintained

---

**Ready to test?** Start with the Pre-Test Checklist above! 🚀


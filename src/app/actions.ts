'use server'

export async function categorizeIssueWithAI(imageUrl: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('Gemini API Key missing')

    // Since we only have imageUrl, we need to download it or pass the URL if Gemini supports it.
    // The simplest way for Gemini REST API with an image URL is to fetch it, convert to base64, then send.
    const imageResp = await fetch(imageUrl)
    if (!imageResp.ok) throw new Error('Failed to fetch image')
    
    const arrayBuffer = await imageResp.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Analyze this image of a civic issue. Categorize it strictly as one of: 'pothole', 'water_leakage', 'streetlight', 'waste_management', 'infrastructure', or 'other'. Also assign a severity strictly from 'low', 'medium', 'high', 'critical'. Provide a brief 1-2 sentence description. Return JSON strictly in this format: {\"category\": \"...\", \"severity\": \"...\", \"description\": \"...\"}" },
            {
              inline_data: {
                mime_type: imageResp.headers.get('content-type') || 'image/jpeg',
                data: base64
              }
            }
          ]
        }],
        generationConfig: {
          response_mime_type: "application/json",
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API Error: ${errorText}`)
    }

    const data = await response.json()
    const text = data.candidates[0].content.parts[0].text
    
    try {
      return { success: true, data: JSON.parse(text) }
    } catch (e) {
      console.error('Failed to parse Gemini output:', text)
      return { success: false, error: 'Failed to parse Gemini output.' }
    }

  } catch (error: any) {
    console.error('AI Categorization Error:', error)
    return { success: false, error: error.message || 'Unknown server error.' }
  }
}

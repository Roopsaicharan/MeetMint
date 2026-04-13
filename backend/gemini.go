package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
)

// ── Structs that match the JSON Gemini returns ────────────────────────────

type GeminiRequest struct {
	Contents []GeminiContent `json:"contents"`
}

type GeminiContent struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiPart struct {
	Text string `json:"text"`
}

type GeminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

// ── The result your app will use ─────────────────────────────────────────

type MeetingAnalysis struct {
	Summary string   `json:"summary"`
	Tasks   []AITask `json:"tasks"`
}

type AITask struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Owner       string  `json:"owner"`
	DueDate     *string `json:"due_date"`
}

// ── Main function: send transcript → get back summary + tasks ─────────────

func AnalyzeTranscriptWithGemini(transcript string) (MeetingAnalysis, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return MeetingAnalysis{}, fmt.Errorf("GEMINI_API_KEY is not set in environment")
	}

	// Safety check for prefix logging
	keyPrefix := "EMPTY"
	if len(apiKey) >= 5 {
		keyPrefix = apiKey[:5]
	}

	// ── Build the prompt ──────────────────────────────────────────────────
	prompt := fmt.Sprintf(`You are a professional meeting assistant AI. 
You will be given a raw meeting transcript. 
Your job is to do THREE things:

1. Write a clear 3-5 sentence summary of the meeting.
2. Extract every action item or task that was assigned or discussed.
3. For each task, identify WHO was assigned to it based on names 
   mentioned in the transcript.

You MUST return ONLY a valid JSON object. 
No extra text, no markdown, no explanation — ONLY the JSON.

Use this EXACT structure:
{
  "summary": "string - the meeting summary here",
  "tasks": [
    {
      "title": "short task name",
      "description": "more detail about the task",
      "owner": "full name of person assigned, or 'Unassigned' if unclear",
      "due_date": "YYYY-MM-DD if a date was mentioned, or null if not mentioned"
    }
  ]
}

Rules:
- If no tasks are found, return an empty array for tasks []
- If a person's name is mentioned near a task, assign it to them
- due_date must be null if no date was mentioned, never guess a date
- owner must be exactly as the name appears in the transcript
- summary must be in plain English, no bullet points
- IMPORTANT: Preserve the EXACT spelling of names, technical terms, and project titles as they appear in the transcript. Do not "fix" or change names.

TRANSCRIPT:
%s`, transcript)

	// ── Build the HTTP request body ───────────────────────────────────────
	reqBody := GeminiRequest{
		Contents: []GeminiContent{
			{Parts: []GeminiPart{{Text: prompt}}},
		},
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return MeetingAnalysis{}, fmt.Errorf("failed to marshal request: %w", err)
	}

	// ── Call Gemini API ───────────────────────────────────────────────────
	log.Printf("Calling Gemini API with model gemini-3-flash-preview... (Key prefix: %s)", keyPrefix)
	url := fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=%s",
		apiKey,
	)

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(bodyBytes))
	if err != nil {
		log.Printf("❌ Gemini API call error: %v", err)
		return MeetingAnalysis{}, fmt.Errorf("gemini API call failed: %w", err)
	}
	defer resp.Body.Close()

	// ── Read the response ─────────────────────────────────────────────────
	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("❌ Failed to read Gemini response: %v", err)
		return MeetingAnalysis{}, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		log.Printf("❌ Gemini API returned error status %d: %s", resp.StatusCode, string(respBytes))
		return MeetingAnalysis{}, fmt.Errorf("gemini API status %d", resp.StatusCode)
	}

	var geminiResp GeminiResponse
	if err := json.Unmarshal(respBytes, &geminiResp); err != nil {
		log.Printf("❌ Failed to parse Gemini JSON: %v", err)
		return MeetingAnalysis{}, fmt.Errorf("failed to parse gemini response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 {
		return MeetingAnalysis{}, fmt.Errorf("gemini returned no candidates")
	}

	// ── Extract the text from the response ────────────────────────────────
	rawText := geminiResp.Candidates[0].Content.Parts[0].Text

	// Clean up in case Gemini wraps it in markdown code fences or adds noise
	rawText = cleanJSONResponse(rawText)

	// ── Parse the JSON that Gemini returned ──────────────────────────────
	var analysis MeetingAnalysis
	if err := json.Unmarshal([]byte(rawText), &analysis); err != nil {
		log.Printf("❌ Raw text from Gemini: %s", rawText)
		return MeetingAnalysis{}, fmt.Errorf("failed to parse AI json output: %w", err)
	}

	return analysis, nil
}

func AskGemini(question string, transcript string) (string, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("GEMINI_API_KEY is not set in environment")
	}

	currentDate := time.Now().Format("2006-01-02")
	prompt := fmt.Sprintf(`You are MeetMint AI, a precise meeting assistant. Use the meeting transcript to answer the user's question.
1. Answer strictly based on the transcript's facts.
2. DO NOT correct or change the spelling of names, titles, or technical terms from the transcript.
3. If not in the notes, say you don't know based on these notes.
Today's Date: %s

TRANSCRIPT:
%s

USER QUESTION:
%s`, currentDate, transcript, question)

	reqBody := GeminiRequest{
		Contents: []GeminiContent{
			{Parts: []GeminiPart{{Text: prompt}}},
		},
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=%s", apiKey)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("gemini error: %s", string(respBytes))
	}

	var geminiResp GeminiResponse
	if err := json.Unmarshal(respBytes, &geminiResp); err != nil {
		return "", err
	}

	if len(geminiResp.Candidates) > 0 && len(geminiResp.Candidates[0].Content.Parts) > 0 {
		return geminiResp.Candidates[0].Content.Parts[0].Text, nil
	}

	return "I couldn't generate an answer.", nil
}

// Helper to strip markdown and noise from JSON responses
func cleanJSONResponse(raw string) string {
	raw = strings.TrimSpace(raw)
	// Remove markdown fences
	re := regexp.MustCompile("(?s)```(?:json)?\n?(.*?)\n?```")
	match := re.FindStringSubmatch(raw)
	if len(match) > 1 {
		return strings.TrimSpace(match[1])
	}
	return strings.TrimSpace(raw)
}

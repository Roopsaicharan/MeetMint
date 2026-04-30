package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"strings"
	"time"
)

// -- Step 1: Chunking Transcript --
func ChunkTranscript(text string) []string {
	words := strings.Fields(text)
	chunkSize := 250 // Words per chunk
	overlap := 50
	var chunks []string

	for i := 0; i < len(words); i += (chunkSize - overlap) {
		end := i + chunkSize
		if end > len(words) {
			end = len(words)
		}
		chunk := strings.Join(words[i:end], " ")
		chunks = append(chunks, chunk)
		if end == len(words) {
			break
		}
	}
	return chunks
}

// -- Step 2: Generate Gemini Embeddings (FREE!) --
type GeminiEmbedRequest struct {
	Model   string `json:"model"`
	Content struct {
		Parts []struct {
			Text string `json:"text"`
		} `json:"parts"`
	} `json:"content"`
}

type GeminiEmbedResponse struct {
	Embedding struct {
		Values []float32 `json:"values"`
	} `json:"embedding"`
}

func GetGeminiEmbedding(text string) ([]float32, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	url := "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent"

	reqBody := GeminiEmbedRequest{}
	reqBody.Model = "models/text-embedding-004"
	reqBody.Content.Parts = []struct {
		Text string `json:"text"`
	}{
		{Text: text},
	}
	jsonData, _ := json.Marshal(reqBody)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", apiKey)

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Gemini Embed API failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Gemini error (status %d): %s", resp.StatusCode, string(body))
	}

	var res GeminiEmbedResponse
	json.NewDecoder(resp.Body).Decode(&res)
	return res.Embedding.Values, nil
}

// -- Step 3: Similarity Engine (Cosine Similarity) --
func CosineSimilarity(a, b []float32) float32 {
	if len(a) != len(b) { return 0 }
	var dotProduct, normA, normB float64
	for i := 0; i < len(a); i++ {
		dotProduct += float64(a[i] * b[i])
		normA += float64(a[i] * a[i])
		normB += float64(b[i] * b[i])
	}
	if normA == 0 || normB == 0 { return 0 }
	return float32(dotProduct / (math.Sqrt(normA) * math.Sqrt(normB)))
}

// -- Step 4: Call Gemini For Answers --
func CallGeminiRAG(prompt string) (string, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	url := "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

	reqBody := map[string]interface{}{
		"contents": []interface{}{
			map[string]interface{}{
				"parts": []interface{}{
					map[string]interface{}{
						"text": prompt,
					},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"temperature": 0.2,
		},
	}
	jsonData, _ := json.Marshal(reqBody)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", apiKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("Gemini AI failed: %w", err)
	}
	defer resp.Body.Close()

	var res struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		fmt.Printf("❌ Gemini decode error: %v\n", err)
		return "", err
	}

	if len(res.Candidates) > 0 && len(res.Candidates[0].Content.Parts) > 0 {
		return res.Candidates[0].Content.Parts[0].Text, nil
	}
	
	fmt.Printf("❌ Gemini returned no answer. Full response struct: %+v\n", res)
	return "No answer generated.", nil
}

// ProcessRAG chunks, embeds and stores transcript chunks
func ProcessRAG(meetingID, transcript string) error {
	chunks := ChunkTranscript(transcript)
	for _, content := range chunks {
		embedding, err := GetGeminiEmbedding(content)
		if err != nil {
			fmt.Printf("⚠️ Warning: Chunk embedding skipped: %v\n", err)
			continue
		}
		
		embeddingJSON, _ := json.Marshal(embedding)
		_, err = InsertRAGChunk(meetingID, content, string(embeddingJSON))
		if err != nil {
			fmt.Printf("❌ DB Error storing chunk: %v\n", err)
		}
	}
	return nil
}

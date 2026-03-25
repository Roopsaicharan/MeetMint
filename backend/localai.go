package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
)

// TranscribeLocally sends the MP4 video to your local Python AI Server
func TranscribeLocally(videoFile io.Reader, filename string) (string, error) {
	// The Python Flask server is listening on port 5001
	url := "http://localhost:5001/transcribe"

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Attach the video to the request payload just like the original request
	part, err := writer.CreateFormFile("video", filename)
	if err != nil {
		return "", fmt.Errorf("could not create form file: %v", err)
	}

	_, err = io.Copy(part, videoFile)
	if err != nil {
		return "", fmt.Errorf("could not copy video file: %v", err)
	}

	writer.Close()

	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed connection to Local ML Server. Make sure 'python local_ai_server.py' is running! Error: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("local server failed with status %d: %s", resp.StatusCode, string(respBytes))
	}

	var jsonResult map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&jsonResult); err != nil {
		return "", fmt.Errorf("failed to parse AI server response")
	}

	if notes, ok := jsonResult["notes"].(string); ok {
		return notes, nil
	}
	
	if errMsg, ok := jsonResult["error"].(string); ok {
		return "", fmt.Errorf("AI reported error: %s", errMsg)
	}

	return "", fmt.Errorf("could not retrieve notes string from AI server")
}

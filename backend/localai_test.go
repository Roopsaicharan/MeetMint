package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestTranscribeLocally_Success(t *testing.T) {
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("Expected POST, got %s", r.Method)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"notes": "Mocked transcription result",
		})
	}))
	defer mockServer.Close()

	respBody := `{"notes": "This is a real test"}`
	var jsonResult map[string]interface{}
	err := json.Unmarshal([]byte(respBody), &jsonResult)
	if err != nil {
		t.Fatalf("Could not unmarshal test JSON: %v", err)
	}

	if notes, ok := jsonResult["notes"].(string); ok {
		if notes != "This is a real test" {
			t.Errorf("Expected 'This is a real test', got %q", notes)
		}
	} else {
		t.Error("Expected 'notes' string in JSON mapping")
	}
}

func TestTranscribeLocally_AIError(t *testing.T) {
	respBody := `{"error": "AI failure message"}`
	var jsonResult map[string]interface{}
	json.Unmarshal([]byte(respBody), &jsonResult)

	if errMsg, ok := jsonResult["error"].(string); ok {
		if errMsg != "AI failure message" {
			t.Errorf("Expected AI error message, got %q", errMsg)
		}
	} else {
		t.Error("Expected error from AI server")
	}
}

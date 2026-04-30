	package main

import (
	"encoding/json"
	"log"
	"net/http"
)

func RegisterJobEndpoints(mux *http.ServeMux) {
	// Project Status Endpoint — returns real-time progress for processing screen
	mux.HandleFunc("/api/projects/status", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		projectID := r.URL.Query().Get("project_id")
		if projectID == "" || len(projectID) != 36 {
			http.Error(w, "Invalid project ID", http.StatusBadRequest)
			return
		}

		job, err := GetProcessingJob(projectID)
		if err != nil {
			log.Printf("Status: job not found for %s", projectID)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"status":   "error",
				"message":  "Processing job not found",
				"progress": 0,
			})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(job)
	})
}

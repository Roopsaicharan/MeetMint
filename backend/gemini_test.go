package main

import (
	"testing"
)

// ─────────────────────────────────────────────────────────────────────────────
// cleanJSONResponse Tests
// ─────────────────────────────────────────────────────────────────────────────

func TestCleanJSONResponse_PlainJSON(t *testing.T) {
	input := `{"summary":"hello","tasks":[]}`
	result := cleanJSONResponse(input)
	if result != input {
		t.Errorf("cleanJSONResponse (plain): expected %q, got %q", input, result)
	}
}

func TestCleanJSONResponse_MarkdownFences(t *testing.T) {
	input := "```json\n{\"summary\":\"hello\",\"tasks\":[]}\n```"
	expected := `{"summary":"hello","tasks":[]}`
	result := cleanJSONResponse(input)
	if result != expected {
		t.Errorf("cleanJSONResponse (markdown): expected %q, got %q", expected, result)
	}
}

func TestCleanJSONResponse_MarkdownFencesNoLang(t *testing.T) {
	input := "```\n{\"summary\":\"test\"}\n```"
	expected := `{"summary":"test"}`
	result := cleanJSONResponse(input)
	if result != expected {
		t.Errorf("cleanJSONResponse (no lang): expected %q, got %q", expected, result)
	}
}

func TestCleanJSONResponse_WithWhitespace(t *testing.T) {
	input := "   {\"summary\":\"test\"}   "
	expected := `{"summary":"test"}`
	result := cleanJSONResponse(input)
	if result != expected {
		t.Errorf("cleanJSONResponse (whitespace): expected %q, got %q", expected, result)
	}
}

func TestCleanJSONResponse_EmptyString(t *testing.T) {
	result := cleanJSONResponse("")
	if result != "" {
		t.Errorf("cleanJSONResponse (empty): expected empty, got %q", result)
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// MeetingAnalysis Struct Tests (JSON Parsing)
// ─────────────────────────────────────────────────────────────────────────────

func TestMeetingAnalysis_EmptyTasks(t *testing.T) {
	analysis := MeetingAnalysis{
		Summary: "Project discussed",
		Tasks:   []AITask{},
	}
	if analysis.Summary != "Project discussed" {
		t.Errorf("MeetingAnalysis: expected summary 'Project discussed', got %q", analysis.Summary)
	}
	if len(analysis.Tasks) != 0 {
		t.Errorf("MeetingAnalysis: expected 0 tasks, got %d", len(analysis.Tasks))
	}
}

func TestMeetingAnalysis_WithTasks(t *testing.T) {
	dueDate := "2026-04-15"
	analysis := MeetingAnalysis{
		Summary: "Sprint review completed",
		Tasks: []AITask{
			{Title: "Fix login bug", Description: "Auth flow broken", Owner: "Alice", DueDate: &dueDate},
			{Title: "Update docs", Description: "README update", Owner: "Bob", DueDate: nil},
		},
	}
	if len(analysis.Tasks) != 2 {
		t.Errorf("MeetingAnalysis: expected 2 tasks, got %d", len(analysis.Tasks))
	}
	if analysis.Tasks[0].Owner != "Alice" {
		t.Errorf("MeetingAnalysis: expected owner 'Alice', got %q", analysis.Tasks[0].Owner)
	}
	if analysis.Tasks[1].DueDate != nil {
		t.Error("MeetingAnalysis: expected nil DueDate for Bob's task")
	}
}

func TestAITask_NilDueDate(t *testing.T) {
	task := AITask{Title: "Test", Owner: "Unassigned", DueDate: nil}
	if task.DueDate != nil {
		t.Error("AITask: expected nil due date")
	}
}

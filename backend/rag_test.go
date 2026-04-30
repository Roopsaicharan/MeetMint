package main

import (
	"testing"
)

// ─────────────────────────────────────────────────────────────────────────────
// ChunkTranscript Tests
// ─────────────────────────────────────────────────────────────────────────────

func TestChunkTranscript_ShortText(t *testing.T) {
	text := "Hello world this is a short meeting"
	chunks := ChunkTranscript(text)
	if len(chunks) != 1 {
		t.Errorf("ChunkTranscript (short): expected 1 chunk, got %d", len(chunks))
	}
	if chunks[0] != text {
		t.Errorf("ChunkTranscript (short): expected original text, got %q", chunks[0])
	}
}

func TestChunkTranscript_EmptyText(t *testing.T) {
	chunks := ChunkTranscript("")
	if len(chunks) != 0 {
		t.Errorf("ChunkTranscript (empty): expected 0 chunks, got %d", len(chunks))
	}
}

func TestChunkTranscript_LongText_ProducesMultipleChunks(t *testing.T) {
	// Create a 600-word text (should produce multiple chunks with chunkSize=250, overlap=50)
	words := ""
	for i := 0; i < 600; i++ {
		words += "word "
	}
	chunks := ChunkTranscript(words)
	if len(chunks) < 2 {
		t.Errorf("ChunkTranscript (long): expected multiple chunks, got %d", len(chunks))
	}
}

func TestChunkTranscript_ExactChunkSize(t *testing.T) {
	// Create exactly 250 words
	words := ""
	for i := 0; i < 250; i++ {
		words += "test "
	}
	chunks := ChunkTranscript(words)
	if len(chunks) != 1 {
		t.Errorf("ChunkTranscript (exact 250): expected 1 chunk, got %d", len(chunks))
	}
}

func TestChunkTranscript_OverlapExists(t *testing.T) {
	// 300 words should produce 2 chunks with overlap
	words := ""
	for i := 0; i < 300; i++ {
		words += "overlap "
	}
	chunks := ChunkTranscript(words)
	if len(chunks) < 2 {
		t.Errorf("ChunkTranscript (overlap): expected >= 2 chunks, got %d", len(chunks))
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// CosineSimilarity Tests
// ─────────────────────────────────────────────────────────────────────────────

func TestCosineSimilarity_IdenticalVectors(t *testing.T) {
	a := []float32{1.0, 2.0, 3.0}
	b := []float32{1.0, 2.0, 3.0}
	score := CosineSimilarity(a, b)
	if score < 0.999 {
		t.Errorf("CosineSimilarity (identical): expected ~1.0, got %f", score)
	}
}

func TestCosineSimilarity_OrthogonalVectors(t *testing.T) {
	a := []float32{1.0, 0.0, 0.0}
	b := []float32{0.0, 1.0, 0.0}
	score := CosineSimilarity(a, b)
	if score > 0.001 || score < -0.001 {
		t.Errorf("CosineSimilarity (orthogonal): expected ~0.0, got %f", score)
	}
}

func TestCosineSimilarity_OppositeVectors(t *testing.T) {
	a := []float32{1.0, 2.0, 3.0}
	b := []float32{-1.0, -2.0, -3.0}
	score := CosineSimilarity(a, b)
	if score > -0.999 {
		t.Errorf("CosineSimilarity (opposite): expected ~-1.0, got %f", score)
	}
}

func TestCosineSimilarity_DifferentLengths(t *testing.T) {
	a := []float32{1.0, 2.0}
	b := []float32{1.0, 2.0, 3.0}
	score := CosineSimilarity(a, b)
	if score != 0 {
		t.Errorf("CosineSimilarity (different lengths): expected 0, got %f", score)
	}
}

func TestCosineSimilarity_ZeroVector(t *testing.T) {
	a := []float32{0.0, 0.0, 0.0}
	b := []float32{1.0, 2.0, 3.0}
	score := CosineSimilarity(a, b)
	if score != 0 {
		t.Errorf("CosineSimilarity (zero vector): expected 0, got %f", score)
	}
}

func TestCosineSimilarity_EmptyVectors(t *testing.T) {
	a := []float32{}
	b := []float32{}
	score := CosineSimilarity(a, b)
	if score != 0 {
		t.Errorf("CosineSimilarity (empty): expected 0, got %f", score)
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// RAG Chunk DB Integration Tests
// ─────────────────────────────────────────────────────────────────────────────

func TestInsertRAGChunk_AndRetrieveByMeeting(t *testing.T) {
	resetDB()
	pid, _ := InsertProject("RAG Integration", nil, "")
	mid, _ := InsertMeeting(&pid, "full transcript", "summary")

	_, err := InsertRAGChunk(mid, "chunk A content", "[0.1, 0.2, 0.3]")
	if err != nil {
		t.Fatalf("InsertRAGChunk: %v", err)
	}
	_, err = InsertRAGChunk(mid, "chunk B content", "[0.4, 0.5, 0.6]")
	if err != nil {
		t.Fatalf("InsertRAGChunk second: %v", err)
	}

	chunks, err := GetRAGChunksByMeeting(mid)
	if err != nil {
		t.Fatalf("GetRAGChunksByMeeting: %v", err)
	}
	if len(chunks) != 2 {
		t.Errorf("Expected 2 chunks, got %d", len(chunks))
	}
}

func TestGetRAGChunksByProject(t *testing.T) {
	resetDB()
	pid, _ := InsertProject("RAG Proj", nil, "")
	m1, _ := InsertMeeting(&pid, "t1", "s1")
	m2, _ := InsertMeeting(&pid, "t2", "s2")
	InsertRAGChunk(m1, "chunk from m1", "[0.1]")
	InsertRAGChunk(m2, "chunk from m2", "[0.2]")

	chunks, err := GetRAGChunksByProject(pid)
	if err != nil {
		t.Fatalf("GetRAGChunksByProject: %v", err)
	}
	if len(chunks) != 2 {
		t.Errorf("Expected 2 chunks across 2 meetings, got %d", len(chunks))
	}
}

func TestGetRAGChunksByProject_Empty(t *testing.T) {
	resetDB()
	pid, _ := InsertProject("Empty RAG Proj", nil, "")
	chunks, err := GetRAGChunksByProject(pid)
	if err != nil {
		t.Fatalf("GetRAGChunksByProject (empty): %v", err)
	}
	if len(chunks) != 0 {
		t.Errorf("Expected 0 chunks, got %d", len(chunks))
	}
}

func TestGetRAGChunksByMeeting_Empty(t *testing.T) {
	resetDB()
	pid, _ := InsertProject("P", nil, "")
	mid, _ := InsertMeeting(&pid, "t", "s")
	chunks, err := GetRAGChunksByMeeting(mid)
	if err != nil {
		t.Fatalf("GetRAGChunksByMeeting (empty): %v", err)
	}
	if len(chunks) != 0 {
		t.Errorf("Expected 0 chunks, got %d", len(chunks))
	}
}

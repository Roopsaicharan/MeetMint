const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("MeetMint Backend is running");
});

// Mock GenAI Summary Endpoint
app.post("/api/summary", (req, res) => {
  res.json({
    summary: "The MeetMint team finalized the Sprint 1 requirements and successfully implemented the Glassmorphism theme across the dashboard.",
    decisions: [
      "Frontend will use Glassmorphism for all new modules",
      "Backend Go server to handle dynamic status updates"
    ],
    action_items: [
      {
        title: "Implement Glass UI components",
        owner: "Jayanth",
        due: "Friday"
      },
      {
        title: "Refactor Dashboard for horizontal layout",
        owner: "Ashmitha",
        due: "Saturday"
      },
      {
        title: "Setup Go API for task tracking",
        owner: "ROOP",
        due: "Thursday"
      },
      {
        title: "Integrate CORS and RAG logic",
        owner: "NARASIMHA",
        due: "Friday"
      }
    ]
  });
});

// Mock RAG Endpoint
app.post("/api/ask", (req, res) => {
  res.json({
    answer: "The frontend UI task was assigned to Jayanth and Ashmitha.",
    citation: "Meeting Notes - line 2"
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

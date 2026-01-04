import express from "express";
import cors from "cors";
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const port = process.env.PORT || 8080;
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/health", (_req, res) => {
	res.json({ status: "ok" });
});

app.post("/generate", async (req, res) => {
	try {
		const { quiz, imageBase64 } = req.body;
		const quizText = typeof quiz === "string" ? quiz.trim() : "";
		const image = typeof imageBase64 === "string" ? imageBase64 : "";

		if (!quizText && !image) {
			return res
				.status(400)
				.json({
					error: "INVALID_INPUT",
					message: "Provide either quiz text or imageBase64.",
				});
		}

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'SERVER_CONFIG',
        details: 'GEMINI_API_KEY is missing on the server.'
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const candidateModels = [modelName, 'gemini-2.0-flash', 'gemini-1.5-flash'];

		const systemInstruction =
			"You generate exactly 6 MCQs as a JSON array. Each item has: id (number), question (string), options (array of 4 distinct strings), correctAnswer (string present in options). Respond with only the JSON array.";

		// Gemini v1beta requires structured parts; wrap text as { text: ... }
		let promptParts = [{ text: systemInstruction }];

		if (image) {
			// Support both data URLs and raw base64 strings
			const hasDataUrl = image.startsWith("data:");
			const mimeType = hasDataUrl
				? image.substring(image.indexOf(":") + 1, image.indexOf(";"))
				: "image/png";
			const base64Data = hasDataUrl
				? image.substring(image.indexOf(",") + 1)
				: image;
			promptParts.push({
				inlineData: {
					mimeType,
					data: base64Data,
				},
			});
			promptParts.push({ text: quizText || "Generate flashcards based on this image." });
		} else {
			promptParts.push({ text: `Topic or Prompt: ${quizText}` });
		}

    let result;
    let lastError;
    for (const candidate of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: candidate });
		result = await model.generateContent({
			contents: [{ role: "user", parts: promptParts }],
		});
        break; // success
      } catch (err) {
        lastError = err;
        // Try next candidate model
      }
    }
    if (!result) {
      throw new Error(`All model attempts failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }

		const response = result.response;
		let responseText = response.text();

		console.log("Raw AI Response:", responseText);

		const jsonMatch = responseText.match(/\[[\s\S]*\]/);
		if (!jsonMatch) {
			throw new Error("No valid JSON found in the AI response.");
		}

		responseText = jsonMatch[0];

		let mcqData;
		try {
			mcqData = JSON.parse(responseText);
			if (!Array.isArray(mcqData)) {
				throw new Error("Parsed JSON is not an array");
			}
		} catch (jsonError) {
			console.error("Error parsing JSON:", jsonError);
			throw new Error("Malformed JSON response from AI.");
		}

		const validateAndFixMCQ = (mcq, index) => {
			const options = Array.isArray(mcq.options) ? mcq.options.slice(0, 4) : [];
			const filledOptions =
				options.length >= 4
					? options
					: ["Option A", "Option B", "Option C", "Option D"];
			const answer =
				typeof mcq.correctAnswer === "string"
					? mcq.correctAnswer
					: filledOptions[0];
			return {
				id: typeof mcq.id === "number" ? mcq.id : index + 1,
				question:
					typeof mcq.question === "string"
						? mcq.question
						: `Question ${index + 1}`,
				options: filledOptions,
				correctAnswer: answer,
			};
		};

		mcqData = mcqData.slice(0, 6).map(validateAndFixMCQ);

		while (mcqData.length < 6) {
			mcqData.push({
				id: mcqData.length + 1,
				question: `Placeholder question ${mcqData.length + 1}`,
				options: ["Option A", "Option B", "Option C", "Option D"],
				correctAnswer: "Option A",
			});
		}

		res.json(mcqData);
	} catch (error) {
		console.error("Request Handling Error:", error.message);
		res.status(500).json({
			error: "An error occurred while processing your request.",
			details: error.message,
		});
	}
});

// Start server only when this module is executed directly (not when imported by tests)
if (import.meta.url === `file://${process.argv[1]}`) {
	app.listen(port, () => {
		console.log(`Server is running on port ${port}`);
	});
}

export default app;

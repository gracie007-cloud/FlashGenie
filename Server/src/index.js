// FlashGenie Server - AI-Powered Flashcard Generator
import express from "express";
import cors from "cors";
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const port = process.env.PORT || 8080;
const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/health", (_req, res) => {
	res.json({ status: "ok" });
});

app.get("/version", (_req, res) => {
	res.json({
		version: "2.0.0",
		model: modelName,
		features: ["text-to-flashcards", "image-to-flashcards"],
	});
});

app.post("/generate", async (req, res) => {
	try {
		const { quiz, imageBase64 } = req.body;
		const quizText = typeof quiz === "string" ? quiz.trim() : "";
		const image = typeof imageBase64 === "string" ? imageBase64 : "";

		if (!quizText && !image) {
			return res.status(400).json({
				error: "INVALID_INPUT",
				message: "Provide either quiz text or imageBase64.",
			});
		}

		if (!process.env.GEMINI_API_KEY) {
			return res.status(500).json({
				error: "SERVER_CONFIG",
				details: "GEMINI_API_KEY is missing on the server.",
			});
		}

		const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
		const model = genAI.getGenerativeModel({ model: modelName });

		const systemInstruction =
			"You generate exactly 6 flashcards as a JSON array. Each flashcard has: id (number), question (string), answer (string). The question goes on the front of the card and the answer goes on the back. Respond with only the JSON array, no additional text.";

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
			promptParts.push({
				text: quizText || "Generate flashcards based on this image. Create question-answer pairs that help users learn the key concepts.",
			});
		} else {
			promptParts.push({ text: `Topic or Prompt: ${quizText}\n\nGenerate flashcards with questions on the front and answers on the back.` });
		}

		const result = await model.generateContent({
			contents: [{ role: "user", parts: promptParts }],
		});

		const response = result.response;
		let responseText = response.text();

		console.log("Raw AI Response:", responseText);

		const jsonMatch = responseText.match(/\[[\s\S]*\]/);
		if (!jsonMatch) {
			throw new Error("No valid JSON found in the AI response.");
		}

		responseText = jsonMatch[0];

		let flashcardData;
		try {
			flashcardData = JSON.parse(responseText);
			if (!Array.isArray(flashcardData)) {
				throw new Error("Parsed JSON is not an array");
			}
		} catch (jsonError) {
			console.error("Error parsing JSON:", jsonError);
			throw new Error("Malformed JSON response from AI.");
		}

		const validateAndFixFlashcard = (card, index) => {
			return {
				id: typeof card.id === "number" ? card.id : index + 1,
				question:
					typeof card.question === "string" && card.question.trim()
						? card.question.trim()
						: `Question ${index + 1}`,
				answer:
					typeof card.answer === "string" && card.answer.trim()
						? card.answer.trim()
						: `Answer ${index + 1}`,
			};
		};

		flashcardData = flashcardData.slice(0, 6).map(validateAndFixFlashcard);

		while (flashcardData.length < 6) {
			flashcardData.push({
				id: flashcardData.length + 1,
				question: `Question ${flashcardData.length + 1}`,
				answer: `Answer ${flashcardData.length + 1}`,
			});
		}

		res.json(flashcardData);
	} catch (error) {
		console.error("Request Handling Error:", error.message);
		res.status(500).json({
			error: "An error occurred while processing your request.",
			details: error.message,
		});
	}
});

// Start server only when this module is executed directly (not when imported by tests)
if (process.env.NODE_ENV !== "test") {
	app.listen(port, () => {
		console.log(`Server is running on port ${port}`);
	});
}

export default app;

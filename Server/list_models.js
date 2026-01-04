import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
	if (!process.env.GEMINI_API_KEY) {
		console.error("No API KEY");
		return;
	}
	// The SDK doesn't have a direct listModels method on the client instance in some versions,
	// but looking at docs, it might be on the model manager or require direct fetch.
	// Actually, checking standard usage patterns:

	try {
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
		);
		if (!response.ok) {
			console.error(
				"Error fetching models:",
				response.status,
				await response.text()
			);
			return;
		}
		const data = await response.json();
		console.log("Available Models:");
		// Filter for those that support generateContent
		const valid = data.models.filter((m) =>
			m.supportedGenerationMethods.includes("generateContent")
		);
		valid.forEach((m) => console.log(m.name));
	} catch (err) {
		console.error(err);
	}
}

listModels();

import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function simpleTest() {
	console.log("Testing API key with gemini-2.0-flash-exp...\n");

	if (!process.env.GEMINI_API_KEY) {
		console.error("❌ No API KEY found in .env");
		return;
	}

	console.log("✓ API key found");

	try {
		const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
		const model = genAI.getGenerativeModel({
			model: "models/gemini-2.0-flash-exp",
		});

		console.log("✓ Model initialized");
		console.log("Sending test request...\n");

		const result = await model.generateContent({
			contents: [
				{
					role: "user",
					parts: [{ text: "Say 'Hello, FlashGenie!' in one sentence." }],
				},
			],
		});

		const response = result.response;
		const text = response.text();

		console.log("✅ SUCCESS!");
		console.log("Response:", text);
		console.log(
			"\n🎉 Your API key is working perfectly with gemini-2.0-flash-exp!"
		);
	} catch (err) {
		console.log("❌ FAILED");
		console.log("Error:", err.message);

		if (err.message.includes("retry")) {
			console.log("\n⏳ This is a rate limit. Wait a minute and try again.");
		} else if (err.message.includes("API key")) {
			console.log("\n🔑 Check your API key in the .env file");
		}
	}
}

simpleTest();

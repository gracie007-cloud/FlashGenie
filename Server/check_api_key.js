import "dotenv/config";

async function checkApiKey() {
	console.log("Checking API configuration...\n");

	if (!process.env.GEMINI_API_KEY) {
		console.error("❌ No GEMINI_API_KEY in .env file");
		return;
	}

	const key = process.env.GEMINI_API_KEY;
	console.log(`✓ API Key found (length: ${key.length} characters)`);
	console.log(`  First 10 chars: ${key.substring(0, 10)}...`);
	console.log(`  Last 4 chars: ...${key.substring(key.length - 4)}`);

	// Check if it starts with the expected prefix
	if (key.startsWith("AIza")) {
		console.log("✓ API key format looks correct (starts with 'AIza')");
	} else {
		console.log(
			"⚠️  Warning: API key doesn't start with 'AIza' - this might not be a valid Gemini API key"
		);
	}

	console.log("\n📝 To test the API key:");
	console.log("   Wait ~60 seconds for rate limits to clear");
	console.log("   Then run: node simple_test.js");
}

checkApiKey();

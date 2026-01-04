async function test() {
	try {
		const response = await fetch("http://localhost:8080/version");

		if (!response.ok) {
			console.error("Status:", response.status);
			return;
		}

		const data = await response.json();
		console.log("Server Version Info:", JSON.stringify(data, null, 2));
	} catch (error) {
		console.error("Error:", error);
	}
}

test();

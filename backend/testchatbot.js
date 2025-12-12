const fetch = require("node-fetch");

async function testChat(message) {
  
  const res = await fetch("http://localhost:4000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });

  const data = await res.json();
  console.log("Chatbot reply:", data.reply);
}

// Test message
testChat("I ate 1 plate of chicken rice (protein: 32g, carbs: 78g, fat: 12g, calories: 650) and 1 cup of milk tea (protein: 2g, carbs: 30g, fat: 3g, calories: 150) for lunch.");
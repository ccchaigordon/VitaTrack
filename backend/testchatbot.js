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
testChat("Hi, how are you?");
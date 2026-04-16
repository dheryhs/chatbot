const payload = {
  event: "message",
  session: "wp_cmnrt43pb0000g4howbd66bdu_ottentiq",
  payload: {
    from: "628123456789@c.us",
    fromMe: false,
    body: "halo tes chatbot gemini"
  }
};

fetch("http://localhost:3000/api/webhook/waha", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
})
.then(r => r.json().then(data => ({status: r.status, data})))
.then(console.log)
.catch(console.error);

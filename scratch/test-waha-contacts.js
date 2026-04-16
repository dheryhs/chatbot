// using node global fetch

async function run() {
  const apiKey = "he83hYY1AVDY75ksva8KGtoKGRe3t6CF";
  const baseUrl = "https://waha-hhsjinfnlm3c.anakit.sumopod.my.id";
  const sessionName = "wp_cmnrt43pb0000g4howbd66bdu_ottentiq";

  try {
    const res = await fetch(`${baseUrl}/api/contacts/all?session=${sessionName}&limit=1000&sortBy=id&sortOrder=asc`, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': apiKey
      }
    });
    
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
  } catch (e) {
    console.error(e);
  }
}
run();

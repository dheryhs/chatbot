/**
 * Processes a raw message template by replacing variables and parsing spintext.
 * Example: "Halo {name}, {Apa kabar|Halo|Hai}" -> "Halo Jonathan, Apa kabar"
 */
export function processMessage(rawText: string, contact: any): string {
  if (!rawText) return "";
  
  let processed = rawText;

  // Replace {name} with contact name or fallback "Kak"
  processed = processed.replace(/{name}/g, contact.name || "Kak");

  // Format array mapping for {{index}} (0-based) based on standard contact fields
  // Assuming matching UI display: 0=phone, 1=name, 2=jid, 3=email, 4=source, 5=note, 6=productLabel
  const contactArr = [
    contact.phoneNumber || "",
    contact.name || "Kak",
    contact.jid || "",
    contact.email || "",
    contact.source || "",
    contact.note || "",
    contact.productLabel || ""
  ];

  processed = processed.replace(/\{\{(\d+)\}\}/g, (match, idx) => {
    const i = parseInt(idx, 10);
    return i >= 0 && i < contactArr.length ? contactArr[i] : match;
  });
  
  // Optional: Add more variables like {date} or {time}
  const now = new Date();
  processed = processed.replace(/{date}/g, now.toLocaleDateString("id-ID"));
  processed = processed.replace(/{time}/g, now.toLocaleTimeString("id-ID"));

  // 2. Spintext Parser
  // Matches {Option1|Option2|Option3}
  processed = processed.replace(/\{([^{}]+)\}/g, (match, options) => {
    // Check if it contains '|' to identify it as spintext
    if (options.includes('|')) {
      const choices = options.split('|');
      const randomIdx = Math.floor(Math.random() * choices.length);
      return choices[randomIdx].trim();
    }
    // If no '|', it might be a variable we didn't match above, keep as is or return empty if desired.
    // For now we keep it to avoid stripping variables developer might want to handle elsewhere.
    return match;
  });

  return processed;
}

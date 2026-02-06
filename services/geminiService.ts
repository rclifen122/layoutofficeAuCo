import { GoogleGenAI, Type } from "@google/genai";
import { Employee, Seat, Assignment } from "../types";

// Initialize Gemini Client
// Assumption: process.env.API_KEY is available as per instructions.
// Remove top-level client initialization to prevent crash on load if key is missing
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSmartSeating = async (
  employees: Employee[],
  seats: Seat[],
  currentAssignments: Assignment[]
): Promise<Assignment[]> => {

  const unassignedEmployees = employees.filter(
    e => !currentAssignments.find(a => a.employeeId === e.id)
  );

  const availableSeats = seats.filter(
    s => !currentAssignments.find(a => a.seatId === s.id)
  );

  if (unassignedEmployees.length === 0 || availableSeats.length === 0) {
    return [];
  }

  // We only send a subset to avoid token limits if the list is huge, 
  // but 47 is fine for Pro models.
  const promptData = {
    employees: unassignedEmployees.map(e => ({ id: e.id, role: e.role, name: e.name })),
    seats: availableSeats.map(s => ({ id: s.id, roomId: s.roomId })),
    rules: `
      1. Group employees with the same role (e.g., Developers, Designers) near each other in the same room if possible.
      2. Fill 'room-12' first if it has space, then 'room-35'.
      3. Managers should be distributed or placed in corners (simulated).
      4. Provide a JSON list of pairings.
    `
  };

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Assign these employees to the available seats based on the rules. \nData: ${JSON.stringify(promptData)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            assignments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  employeeId: { type: Type.STRING },
                  seatId: { type: Type.STRING }
                },
                required: ["employeeId", "seatId"]
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) return [];

    const parsed = JSON.parse(resultText);
    return parsed.assignments || [];

  } catch (error) {
    console.error("Gemini assignment failed:", error);
    // Fallback: Return empty or could implement a simple random fill here
    return [];
  }
};
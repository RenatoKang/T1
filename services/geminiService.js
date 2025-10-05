
import { GoogleGenAI, Type } from "@google/genai";

if (!process.env.API_KEY) {
  // In a real app, you would handle this more gracefully.
  // For this context, we assume the API_KEY is provided.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const bracketSchema = {
    type: Type.OBJECT,
    properties: {
        matches: {
            type: Type.ARRAY,
            description: "An array of first-round matches.",
            items: {
                type: Type.OBJECT,
                properties: {
                    player1: { type: Type.STRING, description: "Name of the first participant. Can be 'BYE'. For doubles, it MUST be the full team string like 'Player A / Player B'." },
                    player2: { type: Type.STRING, description: "Name of the second participant. Can be null. For doubles, it MUST be the full team string like 'Player C / Player D'." }
                },
                required: ["player1", "player2"]
            }
        }
    },
    required: ["matches"]
};


export const generateBracket = async (participants) => {
    const participantList = participants.join(', ');

    const prompt = `
        Create a single-elimination tournament bracket for the following participants: ${participantList}.
        The list should be randomized.
        Some participants are doubles teams, formatted as "Player A / Player B". You MUST treat these as a single entity and return the full string. Do not split them or pick one name.
        If there is an odd number of participants, one must receive a bye and automatically advance. This should be represented as a match where player1 is the participant's name and player2 is null.
        Return the list of matches for the first round.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: bracketSchema,
            },
        });
        
        const jsonResponse = JSON.parse(response.text);

        if (!jsonResponse.matches || !Array.isArray(jsonResponse.matches)) {
            throw new Error("Invalid response format from Gemini API");
        }
        
        return jsonResponse.matches.map((match) => {
            if (match.player2 === null || match.player1.toUpperCase() === 'BYE' || match.player2.toUpperCase() === 'BYE') {
                const byePlayer = match.player2 === null ? match.player1 : (match.player1.toUpperCase() === 'BYE' ? match.player2 : match.player1);
                return { player1: byePlayer, player2: null };
            }
            return { player1: match.player1, player2: match.player2 };
        });

    } catch (error) {
        console.error("Error generating bracket with Gemini:", error);
        return fallbackPairing(participants);
    }
};

const fallbackPairing = (participants) => {
    console.log("Using fallback pairing mechanism.");
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const matches = [];
    for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
            matches.push({ player1: shuffled[i], player2: shuffled[i + 1] });
        } else {
            matches.push({ player1: shuffled[i], player2: null }); // Bye
        }
    }
    return matches;
};

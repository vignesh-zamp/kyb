
const API_URL = import.meta.env.VITE_API_URL;

export const chatWithKnowledgeBase = async (userMessage, knowledgeBaseContent, conversationHistory = []) => {
    try {
        const response = await fetch(`${API_URL}/chat/knowledge-base`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userMessage,
                knowledgeBaseContent,
                conversationHistory
            })
        });

        if (!response.ok) {
            throw new Error("Failed to get response from knowledge base chat");
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};
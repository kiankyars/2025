import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// Load saved key/model from localStorage
document.getElementById('api-key').value = localStorage.getItem('gemini_key') || '';
document.getElementById('model-name').value = localStorage.getItem('gemini_model') || 'gemini-1.5-pro';

window.runForecast = async () => {
    const key = document.getElementById('api-key').value;
    const modelName = document.getElementById('model-name').value;
    const content = document.getElementById('journal-input').value;
    const btn = document.getElementById('btn-run');
    const outputDiv = document.getElementById('output');

    if (!key || !content) {
        alert("Please provide both an API key and journal entries.");
        return;
    }

    // Save settings
    localStorage.setItem('gemini_key', key);
    localStorage.setItem('gemini_model', modelName);

    btn.disabled = true;
    btn.innerText = "Analyzing Patterns...";
    outputDiv.innerHTML = "Thinking...";

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: modelName });

        const systemPrompt = `You are a Behavioral Analyst. Analyze the following journal entries for patterns. Plot a 'Gold Timeline' (best case) and a 'Shadow Timeline' (worst case) for the next 12 months with 6 plot points each. Include Happiness scores (1-10) and a 'Movie Poster' prompt at the end. Output in Markdown. Journal data: \n\n ${content}`;

        const result = await model.generateContentStream(systemPrompt);
        
        let fullText = "";
        outputDiv.innerHTML = ""; // Clear "Thinking"

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullText += chunkText;
            // Real-time markdown rendering
            outputDiv.innerHTML = marked.parse(fullText);
        }

    } catch (err) {
        outputDiv.innerHTML = `<p class="text-red-500 font-bold">Error: ${err.message}</p>`;
    } finally {
        btn.disabled = false;
        btn.innerText = "Generate Future Timelines";
    }
};

window.clearData = () => {
    if(confirm("Wipe all journal entries and keys?")) {
        localStorage.clear();
        document.getElementById('journal-input').value = "";
        document.getElementById('api-key').value = "";
        document.getElementById('output').innerHTML = "Data cleared.";
    }
}
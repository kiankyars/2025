import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// Load saved key/model from localStorage
document.getElementById('api-key').value = localStorage.getItem('gemini_key') || '';
// File Reader Logic
document.getElementById('file-selector').addEventListener('change', function(e) {
    for (let index = 0; index < e.target.files.length; index++) {
        const file = e.target.files[index];
        if (!file) continue;
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('journal-input').value += e.target.result;
        };
        reader.readAsText(file);
    }
});
let fullText = "";
    
window.runForecast = async () => {
    fullText = "";
    const key = document.getElementById('api-key').value;
    const modelName = document.getElementById('model-name').value;
    const content = document.getElementById('journal-input').value;
    const btn = document.getElementById('btn-run');
    const outputDiv = document.getElementById('output');
    const includePosters = document.getElementById('poster-toggle').checked;
    
    const posterInstruction = includePosters 
        ? "\n4. Provide two detailed image generation prompts (one for each timeline) that visually represent the user's future self." : "";

    if (!content) {
        alert("Please provide journal entries.");
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
        const systemPrompt =
        `You are a Behavioral Analyst and Narrative Forecaster. I will provide a series of journal entries.
        Your Task:
        1. Analyze the text for: 'Engines' (habits/thoughts that drive progress) and 'Anchors' (recurring self-sabotage or anxieties).
        2. Project a Gold Timeline: A 12-month 'Best Case' movie where the user leverages their Engines.
        3. Project a Shadow Timeline: A 12-month 'Cautionary Tale' where the user succumbs to their Anchors.
        Requirements:
        1. Provide exactly 6 Plot Points for each timeline.
        2. Each point must include: a Title, a Month (e.g., Month 3), a brief narrative description, and a Happiness Score (1−10).
        3. Output in clean Markdown format.${posterInstruction}
        Journal data: \n\n ${content}`;
        console.log(systemPrompt)
    
        const result = await model.generateContentStream(systemPrompt);
        
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

window.downloadReport = () => {
    if (!fullText) {
        alert("Nothing to export.");
        return;
    }
    const blob = new Blob([fullText], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'timeline.md';
    a.click();
};
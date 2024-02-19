document.addEventListener('DOMContentLoaded', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.url) return;

    document.getElementById('title').value = tab.title || '';
    document.getElementById('title').focus();
	
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: getMetaDetails,
    }, (injectionResults) => {
        for (const frameResult of injectionResults) {
            document.getElementById('description').value = frameResult.result.description || '';
            const categories = frameResult.result.keywords ? frameResult.result.keywords.split(',') : [];
            document.getElementById('category').value = categories[0] || '';
        }
    });

    document.getElementById('title').focus();

	document.getElementById('btnManager').addEventListener('click', function() {
		chrome.tabs.create({url: "manager.html"});
	});  
});

function getMetaDetails() {
    const description = document.querySelector('meta[name="description"]')?.content;
    const keywords = document.querySelector('meta[name="keywords"]')?.content;
    return { description, keywords };
}

const saveOptions = async () => {
    const watsonApiKey = document.getElementById('watsonApiKey').value;
    const watsonServiceUrl = document.getElementById('watsonServiceUrl').value;
    const syncEnabled = document.getElementById('syncEnabled').checked;

    await chrome.storage.local.set({ watsonApiKey, watsonServiceUrl, syncEnabled });
  
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => status.textContent = '', 750);
};

const restoreOptions = async () => {
    const { watsonApiKey = '', watsonServiceUrl = '', syncEnabled = false } = await chrome.storage.local.get(['watsonApiKey', 'watsonServiceUrl', 'syncEnabled']);
	
    document.getElementById('watsonApiKey').value = watsonApiKey;
    document.getElementById('watsonServiceUrl').value = watsonServiceUrl;
    document.getElementById('syncEnabled').checked = syncEnabled;
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveOptions').addEventListener('click', saveOptions);

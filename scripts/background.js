// Placeholder for future background script functionality
chrome.action.onClicked.addListener(() => {
	chrome.tabs.create({ url: chrome.runtime.getURL('manager.html') });
});

chrome.commands.onCommand.addListener((command) => {
	console.log(`Command: ${command}`);
});

chrome.contextMenus.onClicked.addListener(genericOnClick);

function genericOnClick(info) {
  switch (info.menuItemId) {
    case 'openManagerPage':
		openManagerPage();
		break;
    default:
      console.log('Standard context menu item clicked.');
  }
}

chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create({
		id: "openManagerPage",
		title: "Link Librarian Bookmark Manager",
	});	
});

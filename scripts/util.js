function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    // Convert the potentially negative integer to a positive hexadecimal string
    // Using >>> 0 converts the signed int to an unsigned int, ensuring positive values
    return (hash >>> 0).toString(16);
  }

  function watsonAnalyze( url ) {
	const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
	const { IamAuthenticator } = require('ibm-watson/auth');
	
	const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
	  version: '2021-08-01',
	  authenticator: new IamAuthenticator({
		apikey: 'your-watson-api-key',
	  }),
	  serviceUrl: 'https://api.us-south.natural-language-understanding.watson.cloud.ibm.com',
	});
	
	const analyzeParams = {
	  'url': url,
	  'features': {
		'categories': {},
		'concepts': {},
		'keywords': {}
	  }
	};
	
	naturalLanguageUnderstanding.analyze(analyzeParams)
	  .then(analysisResults => {
		console.log(JSON.stringify(analysisResults, null, 2));
	  })
	  .catch(err => {
		console.log('error:', err);
	  });  
  }

  async function checkThumbnailExists(bookmarkUrl) {
	const fileHash = simpleHash(bookmarkUrl);
	const result = await chrome.storage.local.get(`thumbnail_${fileHash}`);
	return !!result[`thumbnail_${fileHash}`];
  }
  
  async function processBookmarksInBatches(bookmarks, batchSize = 5, delay = 2000) {
	let processedCount = 0;
  
	for (let i = 0; i < bookmarks.length; i++) {
		const thumbnailExists = await checkThumbnailExists(bookmarks[i].url);
		if (!thumbnailExists) {
			await refreshThumbnail(bookmarks[i].url);
			processedCount++;
  
			console.log(`Processed ${processedCount} of ${bookmarks.length} bookmarks needing thumbnails.`);
  
			if (processedCount < bookmarks.length) {
				await new Promise(resolve => setTimeout(resolve, delay));
			}
		}
	}
  }
  
  function getBookmarkDetails(bookmarkId) {
	return new Promise((resolve, reject) => {
	  chrome.bookmarks.get([bookmarkId], function(bookmarkArray) {
		if (chrome.runtime.lastError) {
		  reject(new Error(chrome.runtime.lastError.message));
		} else {
		  const bookmark = bookmarkArray[0];
		  resolve(bookmark); // Correctly resolve the promise with the bookmark details
		}
	  });
	});
  }
  
  async function getThumbnail(bookmarkUrl, forceRefresh) {
	const fileHash = simpleHash(bookmarkUrl);
	const result = await chrome.storage.local.get(`thumbnail_${fileHash}`);
	if (result[`thumbnail_${fileHash}`]) {
		return result[`thumbnail_${fileHash}`];
	} else if (forceRefresh) {
		return await refreshThumbnail(bookmarkUrl);
	} else {
	  return '';
	}
  }
  
  async function refreshThumbnail(bookmarkUrl) {
	const imageUrl = await capturePageImage(bookmarkUrl); // Ensure this returns a promise.
	const fileHash = simpleHash(bookmarkUrl);
  
	await chrome.storage.local.set({[`thumbnail_${fileHash}`]: imageUrl});
	console.log(`Thumbnail updated for ${bookmarkUrl}: ${imageUrl}`);
  
	displayBookmarkThumbnail(imageUrl, bookmarkUrl);
  
	return imageUrl;
  }
  
  async function capturePageImage(bookmarkUrl) {
	// First, find or create a tab that navigates to the bookmarkUrl
	let tabId = await findOrCreateTab(bookmarkUrl);
  
	// Wait for the tab to fully load
	await waitForTabLoad(tabId);
  
	// Capture the tab
	let imageUrl = await captureTab(tabId);
  
	// Optionally, close the tab if it was created just for capturing the image
	chrome.tabs.remove(tabId);
  
	return imageUrl;
  }
  
  async function findOrCreateTab(bookmarkUrl) {
	return new Promise((resolve, reject) => {
		chrome.tabs.query({url: bookmarkUrl}, (tabs) => {
			if (tabs.length > 0) {
				resolve(tabs[0].id); // Use the first tab found with the URL
			} else {
				chrome.tabs.create({url: bookmarkUrl, active: true}, (tab) => {
					resolve(tab.id); // Return the ID of the new tab
				});
			}
		});
	});
  }
  
  async function waitForTabLoad(tabId) {
	return new Promise((resolve, reject) => {
		chrome.tabs.onUpdated.addListener(function listener(tabIdUpdated, changeInfo) {
			if (tabIdUpdated === tabId && changeInfo.status === 'complete') {
				chrome.tabs.onUpdated.removeListener(listener);
				resolve();
			}
		});
	});
  }
  
  async function captureTab(tabId) {
	try {
		// First, ensure the tab is active
		const tab = await chrome.tabs.get(tabId);
		await chrome.tabs.update(tabId, {active: true});
		
		const dataUrl = await new Promise((resolve, reject) => {
			// Use tab.windowId to capture the tab's window
			chrome.tabs.captureVisibleTab(tab.windowId, {format: 'png'}, (dataUrl) => {
				if (chrome.runtime.lastError) {
					reject(new Error(chrome.runtime.lastError.message));
				} else {
					resolve(dataUrl);
				}
			});
		});
  
		const resizedDataUrl = await resizeImage(dataUrl, 320, 180);
		return resizedDataUrl;
	} catch (error) {
		console.error('Error capturing or resizing tab image:', error);
		throw error; // Rethrow or handle as needed
	}
  }
  
  function resizeImage(dataUrl, width = 320, height = 180) {
	return new Promise((resolve, reject) => {
		let img = new Image();
		img.onload = function() {
			let canvas = document.createElement('canvas');
			let ctx = canvas.getContext('2d');
			canvas.width = width;
			canvas.height = height;
			ctx.drawImage(img, 0, 0, width, height);
			resolve(canvas.toDataURL('image/webp'));
		};
		img.onerror = reject;
		img.src = dataUrl;
	});
  }
  
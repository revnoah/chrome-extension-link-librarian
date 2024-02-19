const bookmarksContainer = document.getElementById('bookmarksContainer');

let bookmarksArray = []; // Holds bookmarks in memory
let bookmarksSelectArray = [];
let isSortingEnabled = false;

// Load bookmarks from Chrome's bookmarks API
const loadBookmarks = () => {
  chrome.bookmarks.getTree().then(bookmarkTreeNodes => {
    bookmarkTreeNodes.forEach(node => {
      processNode(node);
    });
  });
};

// Recursively process each node in the bookmark tree
const processNode = (node) => {
  if (node.url) {
    // This node is a bookmark
    const bookmark = { id: node.id, title: node.title, url: node.url };
    bookmarksArray.push(bookmark);
    const card = createBookmarkCard(bookmark);
    bookmarksContainer.appendChild(card);
  } else if (node.children) {
    // This node is a folder, recurse into its children
    node.children.forEach(child => processNode(child));
  }
};

document.addEventListener('keydown', (e) => {
  const focusedElement = document.activeElement;
  if (focusedElement.classList.contains('bookmarkCard')) {
      switch (e.key.toUpperCase()) {
          case 'W':
              // Open link
              const url = focusedElement.getAttribute('data-url');
              if (url) {
                  window.open(url, '_blank');
              }
              break;
          case 'S':
              // Refresh thumbnail screenshot
              const bookmarkUrl = focusedElement.getAttribute('data-url');
              refreshThumbnail(bookmarkUrl); // Assuming refreshThumbnail takes the bookmark URL as an argument
              break;
          case 'D':
              // Mark for deletion
              markForDeletion(focusedElement); // This function should handle marking the bookmark for deletion
              break;
          case 'E':
              // Open edit panel
              openEditPanel(focusedElement); // This function should bring up an edit panel for the focused bookmark
              break;
          case 'ARROWUP':
              focusBookmark(focusedElement, 'up');
              e.preventDefault();
              break;
          case 'ARROWDOWN':
              focusBookmark(focusedElement, 'down');
              e.preventDefault();
              break;
          case 'ARROWLEFT':
              focusBookmark(focusedElement, 'left');
              break;
          case 'ARROWRIGHT':
              focusBookmark(focusedElement, 'right');
              break;
          }
    }
});

function focusBookmark(focusedElement, direction) {
  const bookmarks = Array.from(document.querySelectorAll('.bookmarkCard'));
  const focusedIndex = bookmarks.indexOf(focusedElement);

  console.log(direction);

  if (direction === 'left' || direction === 'right') {
    const increment = direction === 'left' ? -1 : 1;
    const newIndex = focusedIndex + increment;
    if (newIndex >= 0 && newIndex < bookmarks.length) {
      bookmarks[newIndex].focus();
    }
  } else if (direction === 'up' || direction === 'down') {
    // For a grid layout, you'll need to determine the number of columns
    const columns = determineColumns(bookmarks);
    const increment = direction === 'up' ? -columns : columns;
    const newIndex = focusedIndex + increment;
    if (newIndex >= 0 && newIndex < bookmarks.length) {
      bookmarks[newIndex].focus();
    }
  }
}

function determineColumns(bookmarks) {
  // Naive approach: find the number of bookmarks in the first 'row' by comparing top offset
  let firstRowTop = bookmarks[0].offsetTop;
  let columns = 1;
  for (let i = 1; i < bookmarks.length; i++) {
    if (bookmarks[i].offsetTop === firstRowTop) {
      columns++;
    } else {
      break; // We've reached the next row
    }
  }
  return columns;
}

document.addEventListener('keydown', (e) => {
  if (isSortingEnabled) {
      const focusedElement = document.activeElement;

      console.log(e.key);

      switch (e.key) {
      }
  }
});




// Create a bookmark card
const createBookmarkCard = (bookmark) => {
  const hashValue = simpleHash(bookmark.url);
  const cardId = `card-${hashValue}`;

  const card = document.createElement('div');
  card.className = 'bookmarkCard';
  card.dataset.bookmarkId = bookmark.id;
  card.setAttribute('tabindex', '0'); // Make it focusable
  card.id = cardId;
  card.setAttribute('data-id', cardId);
  card.setAttribute('data-url', bookmark.url);
  
  const title = document.createElement('h3');
  title.textContent = bookmark.title;
  card.appendChild(title);

  card.addEventListener('mouseenter', () => card.focus());
  card.addEventListener('focus', () => handleBookmarkSelection(bookmark));

  getThumbnail(bookmark.url, false).then(thumbnailUrl => {
    // Assuming bookmark.thumbnailUrl is the property where the thumbnail URL is stored
    const thumbnailId = `img-${hashValue}`;
    const thumbnail = document.createElement('img');
    thumbnail.id = thumbnailId;
    thumbnail.src = thumbnailUrl || 'images/thumbnail.png';
    thumbnail.alt = `Thumbnail for ${bookmark.title}`;
    thumbnail.className = 'bookmarkThumbnail';
    
    card.appendChild(thumbnail);

    const url = document.createElement('p');
    url.textContent = bookmark.url;
    card.appendChild(url);


    getVisitDetails(bookmark.url).then(visits => {
      // Use visit details to modify the card
      // This part will execute asynchronously after the visit details are fetched
      const numVisits = visits ? visits.length : 0;
      const dateAdded = visits.length ? convertChromeDate(visits[0].visitTime) : 'none';
      const formattedDate = formatDateSimple(dateAdded);
      const visitText = document.createElement('p');
      visitText.textContent = `${numVisits} visits since ${formattedDate}`;
  
      // console.log(visits);
      // console.log(`${numVisits} visits, last ${formattedDate}`);
  
      card.appendChild(visitText);
  
    }).catch(error => {
        console.error("Error fetching visit details: ", error);
    });

    const cardActions = document.createElement('div');
    cardActions.className = 'bookmarkActions';
    
    // Delete action
    const cardActionDelete = document.createElement('span');
    // cardActionDelete.href = '#';
    cardActionDelete.innerHTML = '🗑️ D'; // Using an emoji as a placeholder
    cardActionDelete.title = 'Delete';
    cardActionDelete.addEventListener('click', (e) => {
        e.preventDefault();
        // TODO: Implement delete functionality
        console.log('Delete action clicked');
    });
    cardActions.appendChild(cardActionDelete);

    // Edit action
    const cardActionEdit = document.createElement('span');
    // cardActionEdit.href = '#';
    cardActionEdit.innerHTML = '✏️ E'; // Emoji as placeholder
    cardActionEdit.title = 'Edit';
    cardActionEdit.addEventListener('click', (e) => {
        e.preventDefault();
        // TODO: Implement edit functionality
        console.log('Edit action clicked');
    });
    cardActions.appendChild(cardActionEdit);

    // Thumbnail update action
    const cardActionThumbnail = document.createElement('span');
    // cardActionThumbnail.href = '#';
    cardActionThumbnail.innerHTML = '🖼️ S'; // Emoji as placeholder
    cardActionThumbnail.title = 'Update Thumbnail';
    cardActionThumbnail.addEventListener('click', (e) => {
        e.preventDefault();
        // TODO: Implement thumbnail update functionality
        console.log('Thumbnail action clicked');
        refreshThumbnail(bookmark.url);
    });
    cardActions.appendChild(cardActionThumbnail);

    // Open bookmark action
    const cardActionOpen = document.createElement('span');
    // cardActionOpen.href = bookmark.url; // Assuming bookmark.url is the URL of the bookmark
    // cardActionOpen.target = '_blank';
    cardActionOpen.innerHTML = '🔗 W'; // Emoji as placeholder
    cardActionOpen.title = 'Open';
    cardActions.appendChild(cardActionOpen);

    // Append the actions div to the card
    card.appendChild(cardActions);
    
  }).catch(error => {
    console.error('Error getting thumbnail from localstorage:', error);
  });

  return card;
};

function shouldExcludeUrl(url) {
  // Regular expression to match URLs that are IP addresses or end with a port number
  const excludePattern = /^(http:\/\/)?((\d{1,3}\.){3}\d{1,3}|[a-zA-Z0-9.-]+)(:\d+)(\/.*)?$/;
  return excludePattern.test(url);
}

function updateHttpBookmarks(bookmarkNodes) {
  for (let node of bookmarkNodes) {
      if (node.children) {
          // Recurse into folder's children
          updateHttpBookmarks(node.children);
      } else if (node.url && node.url.startsWith('http://') && !shouldExcludeUrl(node.url)) {
          // It's an HTTP bookmark not matching the exclusion criteria; update it
          const httpsUrl = node.url.replace('http://', 'https://');
          chrome.bookmarks.update(node.id, {url: httpsUrl}, updatedNode => {
              console.log(`Updated: ${node.url} to ${updatedNode.url}`);
          });
      }
  }
}

// Handle bookmark selection
const handleBookmarkSelection = (bookmark) => {
  //console.log(`Bookmark selected: ${bookmark.title}`);
  // Update the sidebar with bookmark details
  updateSidebar(bookmark);
};

function enableSortingMode(focusedElement) {
  isSortingEnabled = true;
  // Provide visual feedback or instructions for sorting mode here
}

function markForDeletion(focusedElement) {
  const bookmarkId = focusedElement.dataset.bookmarkId;
  const bookmarkIndex = bookmarksSelectArray.indexOf(bookmarkId);
  const btnDeleteSelectedBookmarks = document.getElementById('deleteSelectedBookmarks');

  if (bookmarkIndex > -1) {
    focusedElement.style.opacity = '1';
    bookmarksSelectArray.slice(bookmarkIndex);
  } else {
    focusedElement.style.opacity = '0.35';
    bookmarksSelectArray.push(bookmarkId);
  }

  if (bookmarksSelectArray.length > 0) {
    btnDeleteSelectedBookmarks.removeAttribute('disabled');
  } else {
    btnDeleteSelectedBookmarks.attribute('disabled', 'disabled');
  }
}

function moveBookmark(bookmarkId, direction) {
  const index = bookmarksArray.findIndex(bookmark => bookmark.id === bookmarkId);
  if (index === -1) return; // Bookmark not found

  if (direction === 'up' && index > 0) {
    // Move bookmark up in the array
      [bookmarksArray[index], bookmarksArray[index - 1]] = [bookmarksArray[index - 1], bookmarksArray[index]];
  } else if (direction === 'down' && index < bookmarksArray.length - 1) {
      // Move bookmark down in the array
      [bookmarksArray[index], bookmarksArray[index + 1]] = [bookmarksArray[index + 1], bookmarksArray[index]];
  } else if (direction === 'left' && index > 0) {
      // Move bookmark left in the array (similar to moving up)
      [bookmarksArray[index], bookmarksArray[index - 1]] = [bookmarksArray[index - 1], bookmarksArray[index]];
  } else if (direction === 'right' && index < bookmarksArray.length - 1) {
      // Move bookmark right in the array (similar to moving down)
      [bookmarksArray[index], bookmarksArray[index + 1]] = [bookmarksArray[index + 1], bookmarksArray[index]];
  }

  // Update the UI to reflect the new order
  displayBookmarks(bookmarksArray); // Re-implement as needed to update your UI
}

async function displayBookmarkThumbnail(imageUrl, bookmarkUrl) {
  const hashValue = simpleHash(bookmarkUrl);
  const thumbnailId = `img-${hashValue}`;
  const bookmarkImg = document.getElementById(thumbnailId);
  bookmarkImg.src = imageUrl;
}

function convertChromeDate(chromeDate) {
  return new Date(chromeDate);
}

function formatDate(dateString) {
  if (dateString === null || dateString === undefined) {
    return 'none';
  }

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { // You can change "en-US" to your preferred locale
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

function formatDateSimple(dateString) {
  if (dateString === null) {
    return 'none';
  }

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { // You can change "en-US" to your preferred locale
      year: 'numeric', month: 'short', day: 'numeric'
  });
}

function getVisitDetails(url) {
  return new Promise((resolve, reject) => {
    chrome.history.getVisits({ url: url }, visits => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else {
        resolve(visits);
      }
    });
  });
}

document.getElementById('updateMissingThumbnails').addEventListener('click', function() {
  console.log(bookmarksArray);

  processBookmarksInBatches(bookmarksArray, 10, 2000)
  .then(() => console.log("All batches processed"))
  .catch(error => console.error("Error processing batches", error));    
});

document.getElementById('cleanupBookmarks').addEventListener('click', function() {
  deleteDuplicateBookmarks();
  //removeDeadLinks();
});

document.getElementById('deleteSelectedBookmarks').addEventListener('click', function() {
  if (bookmarksSelectArray.length === 0) {
    return;
  }

  const confirmDelete = confirm(`Do you want to delete these ${bookmarksSelectArray.length} bookmarks?`);
  if (!confirmDelete) {
    return;
  }

  deleteBookmarks(bookmarksSelectArray);

  bookmarksSelectArray = [];
  this.disabled = true;
});

function deleteBookmarks(bookmarkIds) {
  bookmarkIds.forEach(bookmarkId => {
    chrome.bookmarks.remove(bookmarkId.toString(), () => {
      const bookmarkElement = document.querySelector(`[data-bookmark-id='${bookmarkId}']`);
      if (bookmarkElement) {
        bookmarkElement.remove();
      }
    });
  });
}

function updateSidebar(bookmark) {
  const sidebar = document.getElementById('sidebar');
  const dateAdded = convertChromeDate(bookmark.dateAdded);
  const formattedDate = formatDate(dateAdded);
  const bookmarkHash = simpleHash(bookmark.url);

  getVisitDetails(bookmark.url).then(visits => {
    const bookmarkVisits = visits.length;
    const lastVisitTime = visits[0]?.visitTime;
    
    getThumbnail(bookmark.url, false).then(thumbnailUrl => {

      // Construct the sidebar content with title, URL, and formatted date added
      let sidebarContent = `
        <div id="bookmark-${bookmarkHash}" class="bookmark-details" data-id="${bookmarkHash}">
          <img src="${thumbnailUrl}" alt="" />
          <h2>${bookmark.title}</h2>
          <p><a href="${bookmark.url}" target="_blank">${bookmark.url}</a></p>
          <p>Date Added: ${formattedDate}</p>
          <p>Visits: ${bookmarkVisits}</p>
          <p>Last Visit: ${formatDate(lastVisitTime)}</p>
          <button type="button" id="refreshThumbnailBtn">Refresh Thumbnail</button>
        </aside>
        `;

      // Additional information from Watson or other analyses can be appended here
      sidebar.innerHTML = sidebarContent;

      document.getElementById('refreshThumbnailBtn').addEventListener('click', function() {
        const thumbnailImg = refreshThumbnail(bookmark.url);
        // displayBookmarkThumbnail(thumbnailImg, bookmark.url);
      });
    }).catch(error => {
      console.error('Error getting bookmark thumbnail:', error);
    });

  }).catch(error => {
    console.error('Error getting visit details:', error);
  });
}

function openEditPanel(focusedElement) {
  const bookmarkId = focusedElement.dataset.bookmarkId;
  // Assume you have a function to fetch bookmark details based on bookmarkId
  const bookmarkDetails = fetchBookmarkDetails(bookmarkId);
  // Populate the sidebar with an edit form for the selected bookmark
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
  <h3>Edit Bookmark</h3>
  <form id="editBookmarkForm">
      <input type="text" name="title" value="${bookmarkDetails.title}" placeholder="Title" />
      <textarea name="description">${bookmarkDetails.description}</textarea>
      <input type="text" name="category" value="${bookmarkDetails.category}" placeholder="Category" />
      <button type="button" id="refreshMetaDataBtn">Refresh Meta Data</button>
      <button type="button" id="refreshThumbnailBtn">Refresh Thumbnail</button>
      <button type="submit">Save Changes</button>
  </form>
  `;

  // After adding the form to the DOM, attach event listeners to the buttons
  document.getElementById('refreshMetaDataBtn').addEventListener('click', function() {
    refreshMetaData(bookmarkId);
  });

  // Attach event listener for form submission to save changes
  document.getElementById('editBookmarkForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission
    saveBookmarkChanges(bookmarkId);
  });
}

function fetchBookmarkDetails(bookmarkId) {
  // Placeholder: Fetch bookmark details from storage
  return { title: '', description: '', category: '' }; // Example return
}

function saveBookmarkChanges(event) {
  event.preventDefault();
  // Implement saving logic here
  // chrome.bookmarks.update(bookmarkId, { title: "Updated Title", url: "https://updatedexample.com" });

  console.log('TODO: Bookmark changes saved');
}

function refreshMetaData(bookmarkId) {
  // Implement logic to refresh and save meta data for the bookmark
}


  /*
  document.getElementById('exportBookmarks').addEventListener('click', function() {
      // Provide options for export format or implement separate buttons/actions for each format
      exportBookmarks('csv'); // or 'txt'
  });
  */

  function deleteDuplicateBookmarks() {
    let seenUrls = {};
    chrome.bookmarks.getTree().then(bookmarkTreeNodes => {
      bookmarkTreeNodes.forEach(node => {
        processDuplicateNode(node);
      });
    });

    console.log(seenUrls);
  }
  
  // Recursively process each node in the bookmark tree
  const processDuplicateNode = (node) => {
    if (node.url) {

      if (seenUrls[bookmark.url]) {
        //chrome.bookmarks.remove(bookmark.id, () => console.log(`Deleted duplicate bookmark: ${bookmark.url}`));
        console.log('duplicate: ', node.url);
      } else {
        seenUrls[node.url] = true;
      }
  } else if (node.children) {
      // This node is a folder, recurse into its children
      node.children.forEach(child => processNode(child));
    }
  };

  function removeDeadLinks() {

    alert('remove dead links');

    chrome.bookmarks.search({}, function(bookmarks) {
      bookmarks.forEach(bookmark => {
        if (bookmark.url) {
          fetch(bookmark.url, { method: 'HEAD' })
            .then(response => {
              if (response.status === 404) {

                console.log('dead link: ' + bookmark.url);
                /*
                chrome.bookmarks.remove(bookmark.id, () => {
                  console.log(`Removed bookmark with 404 error: ${bookmark.url}`);
                });
                */
              }
            }).catch(error => {
              console.log(`Error checking bookmark: ${bookmark.url}`, error);
            });
        }
      });
    });    
  }

  function exportBookmarks(format) {
      // Adjust this function to handle exporting in both TXT and CSV formats
      if (format === 'csv') {
          // Export to CSV
      } else if (format === 'txt') {
          // Export to TXT
      }
  }

  function importTXT(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const bookmarks = e.target.result.split('\n').map(line => {
            // Assuming each line is a URL or a simple structure you define
            return { url: line.trim(), title: '', thumbnail: '' }; // Simplified structure
        });
        saveImportedBookmarks(bookmarks);
    };
    reader.readAsText(file);
  }

  function importCSV(file) {
      const reader = new FileReader();
      reader.onload = function(e) {
          const bookmarks = e.target.result.split('\n').map(line => {
              const [title, url] = line.split(','); // Assuming a simple CSV structure: title,url
              return { title: title.trim(), url: url.trim(), thumbnail: '' };
          });
          saveImportedBookmarks(bookmarks);
      };
      reader.readAsText(file);
  }

  function saveImportedBookmarks(bookmarks) {
      // Logic to save imported bookmarks, possibly using chrome.storage.local
  }

  function exportBookmarks(format) {
    chrome.storage.local.get(null, (items) => {
        let dataStr = '';
        if (format === 'csv') {
            dataStr = Object.values(items).map(b => `"${b.title}","${b.url}"`).join('\n');
        } else if (format === 'txt') {
            dataStr = Object.values(items).map(b => b.url).join('\n');
        }

        const blob = new Blob([dataStr], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const downloadEl = document.createElement('a');
        downloadEl.href = url;
        downloadEl.download = `bookmarks_export.${format}`;
        document.body.appendChild(downloadEl);
        downloadEl.click();
        document.body.removeChild(downloadEl);
    });
  }

document.addEventListener('DOMContentLoaded', loadBookmarks);

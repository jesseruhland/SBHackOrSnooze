"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  //console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  return $(`
      <li id="${story.storyId}">
        <i class="fa-solid fa-heart favorite-heart"></i>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

async function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();

  //****************Written by JR */
  //if user is logged in, check for favorites and stories posted by that user
  if (currentUser) {
    //loop through all stories and add favorite class if matched
    await getAndSetFavs(storyList);
    //loop through all stories and add remove button if matched
    await getAndSetOwnStories(storyList);
  }
}
//
//
//
//
// USER SUBMISSIONS //****************Written by JR */
// function and event listener for a new story by user submission at the submit form
async function userSubmission() {
  const title = $("#story-title").val();
  const author = $("#story-author").val();
  const url = $("#story-url").val();
  const newStory = { title, author, url };

  $("#story-title").val("");
  $("#story-author").val("");
  $("#story-url").val("");

  let storyResult = await storyList.addOrEditStory(
    currentUser,
    newStory,
    "POST",
    ""
  );

  storyList = await StoryList.getStories();
  putStoriesOnPage();
}

//****************Written by JR */
$("#story-button").on("click", function (event) {
  event.preventDefault();
  userSubmission();
  $storySubmitForm.hide();
});

//****************Written by JR */
//add 'remove' functionality to the remove-button class
$("body").on("click", ".remove-button", async function (event) {
  const storyIdtoRemove = this.closest("li").id;

  await storyList.removeStory(currentUser, storyIdtoRemove);

  storyList = await StoryList.getStories();
  putStoriesOnPage();
});
//
//
//
//
//EDIT STORY  //****************Written by JR */

// function and event listener to edit story by user submission at the edit form
async function editUserSubmission() {
  const title = $("#edit-story-title").val();
  const author = $("#edit-story-author").val();
  const url = $("#edit-story-url").val();
  const storyId = $("#edit-story-id").val();
  const editedStory = { title, author, url };

  $("#edit-story-title").val("");
  $("#edit-story-author").val("");
  $("#edit-story-url").val("");
  $("#edit-story-id").val("");

  let storyResult = await storyList.addOrEditStory(
    currentUser,
    editedStory,
    "PATCH",
    storyId
  );

  storyList = await StoryList.getStories();
  putStoriesOnPage();
}

//****************Written by JR */
$("#edit-story-button").on("click", function (event) {
  event.preventDefault();
  editUserSubmission();
  $editStoryForm.hide();
});

//****************Written by JR */
//add 'edit' functionality to the edit-button class
$("body").on("click", ".edit-button", async function (event) {
  const storyIdtoEdit = this.closest("li").id;
  const storyDetailsFromAPI = await storyList.getStoryById(storyIdtoEdit);

  hidePageComponents();
  $editStoryForm.show();

  $("#edit-story-title").val(storyDetailsFromAPI.title);
  $("#edit-story-author").val(storyDetailsFromAPI.author);
  $("#edit-story-url").val(storyDetailsFromAPI.url);
  $("#edit-story-id").val(storyIdtoEdit);
});
//
//
//
//
//FAVORITES  //****************Written by JR */

//gets list of favorite stories from server, generates their HTML, and puts on page
async function putFavoritesOnPage() {
  console.debug("putFavoritesOnPage");

  $allStoriesList.empty();

  const favoriteArray = await currentUser.getUserSavedStories(
    currentUser,
    "favorites"
  );
  const favoriteStories = [];

  for (let favorite of favoriteArray) {
    const favoriteStory = new Story(favorite);
    favoriteStories.unshift(favoriteStory);
  }

  //check if any favorites have been saved - if not -> post message to page, if so -> retrieve, display
  if (favoriteStories.length === 0) {
    const noFavoritesMessage = document.createElement("p");
    noFavoritesMessage.innerText =
      "You haven't saved any stories to your favorites.";
    noFavoritesMessage.setAttribute("id", "no-favorites-message");
    noFavoritesMessage.style.paddingLeft = "10px";
    $(".stories-container").append(noFavoritesMessage);
    //add event listener to remove on any navigation
    $("nav").on("click", function () {
      $("#no-favorites-message").remove();
    });
  } else {
    //add favorites stories in array to object to mimic storyList
    let favoriteStoriesList = { stories: favoriteStories };

    // loop through all favorite stories and generate HTML for them
    for (let story of favoriteStories) {
      const $story = generateStoryMarkup(story);
      $allStoriesList.append($story);
    }
    $allStoriesList.show();

    //if user is logged in, check for favorites and stories posted by that user
    if (currentUser) {
      //loop through all stories and add favorite class if matched
      await getAndSetFavs(favoriteStoriesList);
      //loop through all stories and add remove button if matched
      await getAndSetOwnStories(favoriteStoriesList);
    }
  }
}

//get user favorites from API, check current selection agains saved favorites
async function checkForFavorite(favoriteStoryId) {
  const favoriteArray = await currentUser.getUserSavedStories(
    currentUser,
    "favorites"
  );
  let favoriteExists = false;
  for (let story of favoriteArray) {
    if (favoriteStoryId === story.storyId) {
      favoriteExists = true;
      break;
    }
  }
  return favoriteExists;
}

//if already favorite, remove from API
//if not already a favorite, add to API
async function addOrRemoveFavoriteAtAPI(favoriteExists, favoriteStoryId) {
  if (favoriteExists === true) {
    await currentUser.postOrDeleteFavorite(
      currentUser,
      favoriteStoryId,
      "DELETE"
    );
  } else if (favoriteExists === false) {
    await currentUser.postOrDeleteFavorite(
      currentUser,
      favoriteStoryId,
      "POST"
    );
  }
}

//click handler for favorite hearts
async function favoriteHeartClick() {
  if (currentUser) {
    this.classList.toggle("favorite");
    const favoriteStoryId = this.closest("li").id;

    const favoriteExists = await checkForFavorite(favoriteStoryId);

    await addOrRemoveFavoriteAtAPI(favoriteExists, favoriteStoryId);
  } else if (!currentUser) {
    alert("You must be logged in to save favorite stories.");
  }
}

//add event handler to all favorite hearts on the page
$("body").on("click", ".favorite-heart", favoriteHeartClick);

//loop through all stories and add favorite class if matched
async function getAndSetFavs(storyList) {
  const favoriteArray = await currentUser.getUserSavedStories(
    currentUser,
    "favorites"
  );
  for (let story of storyList.stories) {
    for (let favorite of favoriteArray) {
      if (story.storyId === favorite.storyId) {
        $(`li#${story.storyId}`).find("i").addClass("favorite");
      }
    }
  }
}
//
//
//
//
//OWN STORIES/USER SUBMISSIONS  //****************Written by JR */

//gets list of favorite stories from server, generates their HTML, and puts on page
async function putMyStoriesOnPage() {
  console.debug("putMyStoriesOnPage");

  $allStoriesList.empty();

  const myStoriesArray = await currentUser.getUserSavedStories(
    currentUser,
    "stories"
  );
  const myStories = [];

  for (let myStory of myStoriesArray) {
    const mine = new Story(myStory);
    myStories.unshift(mine);
  }

  //check if any user submissions have been saved - if not -> post message to page, if so -> retrieve, display
  if (myStories.length === 0) {
    const noStoriesMessage = document.createElement("p");
    noStoriesMessage.innerText = "You haven't submitted any stories yet.";
    noStoriesMessage.setAttribute("id", "no-stories-message");
    noStoriesMessage.style.paddingLeft = "10px";
    $(".stories-container").append(noStoriesMessage);
    //add event listener to remove on any navigation
    $("nav").on("click", function () {
      $("#no-stories-message").remove();
    });
  } else {
    //add user submission stories in array to object to mimic storyList
    let myStoriesList = { stories: myStories };

    // loop through all user submission stories and generate HTML for them
    for (let story of myStories) {
      const $story = generateStoryMarkup(story);
      $allStoriesList.append($story);
    }
    $allStoriesList.show();

    //if user is logged in, check for favorites and stories posted by that user
    if (currentUser) {
      //loop through all stories and add favorite class if matched
      await getAndSetFavs(myStoriesList);
      //loop through all stories and add remove button if matched
      await getAndSetOwnStories(myStoriesList);
    }
  }
}

//loop through all stories and add remove & edit button if matched
async function getAndSetOwnStories(storyList) {
  const ownStoriesArray = await currentUser.getUserSavedStories(
    currentUser,
    "stories"
  );
  for (let story of storyList.stories) {
    for (let ownStory of ownStoriesArray) {
      if (story.storyId === ownStory.storyId) {
        $(`li#${story.storyId}`).append(
          '<small class="remove-button"><a>remove</a></small>',
          '<small class="edit-button">  <a>edit</a></small>'
        );
      }
    }
  }
}

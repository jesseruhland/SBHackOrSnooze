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
  // console.debug("generateStoryMarkup", story);

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

  //if user is logged in, check for favorites and stories posted by that user
  if (currentUser) {
    //loop through all stories and add favorite class if matched
    await getAndSetFavs(storyList);
    //loop through all stories and add remove button if matched
    await getAndSetOwnStories(storyList);
  }
}

async function putFavoritesOnPage() {
  console.debug("putFavoriteOnPage");

  $allStoriesList.empty();

  const favoriteArray = await currentUser.getUserFavorites(currentUser);
  const favoriteStories = [];

  for (let favorite of favoriteArray) {
    const favoriteStory = await new Story(favorite);
    favoriteStories.unshift(favoriteStory);
  }

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

// function and event listener for a new story by user submission at the submit form
async function userSubmission() {
  const title = $("#story-title").val();
  const author = $("#story-author").val();
  const url = $("#story-url").val();
  const newStory = { title, author, url };

  $("#story-title").val("");
  $("#story-author").val("");
  $("#story-url").val("");

  let storyResult = await storyList.addStory(currentUser, newStory);

  storyList = await StoryList.getStories();
  putStoriesOnPage();
}

$("#story-button").on("click", function (event) {
  event.preventDefault();
  userSubmission();
  $storySubmitForm.hide();
});

//add 'remove' functionality to the remove-button class
$("body").on("click", ".remove-button", async function (event) {
  const storyIdtoRemove = this.closest("li").id;

  await storyList.removeStory(currentUser, storyIdtoRemove);

  storyList = await StoryList.getStories();
  putStoriesOnPage();
});

//favorites
$("body").on("click", ".favorite-heart", async function (event) {
  this.classList.toggle("favorite");
  const favoriteStoryId = this.closest("li").id;

  const favoriteArray = await currentUser.getUserFavorites(currentUser);

  let favoriteExists = false;
  for (let story of favoriteArray) {
    if (favoriteStoryId === story.storyId) {
      favoriteExists = true;
      break;
    }
  }

  if (favoriteExists === true) {
    await currentUser.removeFavorite(currentUser, favoriteStoryId);
  } else if (favoriteExists === false) {
    await currentUser.newFavorite(currentUser, favoriteStoryId);
  }

  //await checkForRememberedUser();
});

async function getAndSetFavs(storyList) {
  const favoriteArray = await currentUser.getUserFavorites(currentUser);
  for (let story of storyList.stories) {
    for (let favorite of favoriteArray) {
      if (story.storyId === favorite.storyId) {
        $(`li#${story.storyId}`).find("i").addClass("favorite");
      }
    }
  }
}

async function getAndSetOwnStories(storyList) {
  const ownStoriesArray = await currentUser.getOwnStories(currentUser);
  for (let story of storyList.stories) {
    for (let ownStory of ownStoriesArray) {
      if (story.storyId === ownStory.storyId) {
        $(`li#${story.storyId}`).append(
          '<small class="remove-button"><a>remove this story</a></small>'
        );
      }
    }
  }
}
